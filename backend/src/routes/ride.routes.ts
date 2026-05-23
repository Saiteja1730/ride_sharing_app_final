import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  estimateFare,
  bookRide,
  getActiveRide,
  getRideHistory,
  cancelRide,
  rateRide,
  searchRides,
} from '../controllers/ride.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rideRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rides
 *   description: Ride booking and management
 */

router.post(
  '/estimate',
  authenticate,
  [
    body('pickupLat').isFloat({ min: -90, max: 90 }),
    body('pickupLng').isFloat({ min: -180, max: 180 }),
    body('dropoffLat').isFloat({ min: -90, max: 90 }),
    body('dropoffLng').isFloat({ min: -180, max: 180 }),
  ],
  validate,
  estimateFare
);

router.post(
  '/',
  authenticate,
  authorize('rider'),
  rideRateLimiter,
  [
    body('pickupLocation.address').notEmpty(),
    body('pickupLocation.coordinates.lat').isFloat(),
    body('pickupLocation.coordinates.lng').isFloat(),
    body('dropoffLocation.address').notEmpty(),
    body('dropoffLocation.coordinates.lat').isFloat(),
    body('dropoffLocation.coordinates.lng').isFloat(),
    body('vehicleType').isIn(['economy', 'premium', 'suv', 'xl', 'bike', 'auto', 'mini', 'sedan']),
    body('fareEstimate.total').isFloat({ min: 0 }),
  ],
  validate,
  bookRide
);

router.get('/active', authenticate, getActiveRide);

router.get(
  '/history',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  getRideHistory
);

router.get('/search', authenticate, searchRides);

router.patch(
  '/:id/cancel',
  authenticate,
  [body('reason').optional().trim()],
  validate,
  cancelRide
);

router.post(
  '/:id/rate',
  authenticate,
  [
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  rateRide
);

export default router;
