import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import { HttpError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const signToken = (userId: string, role: string, email: string): string =>
  jwt.sign({ userId, role, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;
    let vehicleInfo;
    if (req.body.vehicleInfo) {
      vehicleInfo = typeof req.body.vehicleInfo === 'string' ? JSON.parse(req.body.vehicleInfo) : req.body.vehicleInfo;
    }

    const existing = await User.findOne({ email });
    if (existing) throw new HttpError('Email already in use', 409);

    let documents = undefined;
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      documents = {
        licenseUrl: files.licenseImage?.[0] ? `/uploads/${files.licenseImage[0].filename}` : undefined,
        aadhaarUrl: files.aadhaarImage?.[0] ? `/uploads/${files.aadhaarImage[0].filename}` : undefined,
        rcUrl: files.rcImage?.[0] ? `/uploads/${files.rcImage[0].filename}` : undefined,
      };
    }

    const user = await User.create({ name, email, password, phone, role, vehicleInfo, documents });
    const token = signToken(user.id, user.role, user.email);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      success: true,
      data: { token, user },
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) throw new HttpError('Invalid credentials', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new HttpError('Invalid credentials', 401);

    const token = signToken(user.id, user.role, user.email);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      data: { token, user },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new HttpError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     tags: [Auth]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allowedFields = ['name', 'phone', 'avatar'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) throw new HttpError('User not found', 404);

    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};
