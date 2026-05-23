import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getNearbyDrivers,
  toggleAvailability,
  updateLocation,
  getRideRequests,
  acceptRide,
  updateRideStatus,
  getDriverStats,
} from '../controllers/driver.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Driver management and ride operations
 */

router.get(
  '/nearby',
  authenticate,
  [
    query('lat').isFloat({ min: -90, max: 90 }),
    query('lng').isFloat({ min: -180, max: 180 }),
    query('radius').optional().isFloat({ min: 0.5, max: 50 }),
  ],
  validate,
  getNearbyDrivers
);

router.patch(
  '/availability',
  authenticate,
  authorize('driver'),
  [
    body('isAvailable').isBoolean(),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
  ],
  validate,
  toggleAvailability
);

router.patch(
  '/location',
  authenticate,
  authorize('driver'),
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
  ],
  validate,
  updateLocation
);

router.get('/ride-requests', authenticate, authorize('driver'), getRideRequests);

router.get('/stats', authenticate, authorize('driver'), getDriverStats);

router.patch('/accept/:rideId', authenticate, authorize('driver'), acceptRide);

router.patch(
  '/status/:rideId',
  authenticate,
  authorize('driver'),
  [body('status').isIn(['arriving', 'ongoing', 'completed'])],
  validate,
  updateRideStatus
);

export default router;
