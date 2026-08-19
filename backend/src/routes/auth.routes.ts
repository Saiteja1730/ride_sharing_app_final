import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe, updateProfile, refresh } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';

import { upload } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post(
  '/register',
  authRateLimiter,
  upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'aadhaarImage', maxCount: 1 },
    { name: 'rcImage', maxCount: 1 },
  ]),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('role').isIn(['rider', 'driver']).withMessage('Role must be rider or driver'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', logout);

router.post('/refresh', authRateLimiter, refresh);

router.get('/me', authenticate, getMe);

router.patch(
  '/me',
  authenticate,
  [body('name').optional().trim().notEmpty()],
  validate,
  updateProfile
);

export default router;
