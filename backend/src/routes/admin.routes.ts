import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getPlatformStats,
  listUsers,
  toggleUserStatus,
  getFleetAnalytics,
  listRides,
} from '../controllers/admin.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only platform management
 */

router.use(authenticate, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', listUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/fleet', getFleetAnalytics);
router.get('/rides', listRides);

export default router;
