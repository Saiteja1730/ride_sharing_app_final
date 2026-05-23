import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 500, // generous for local/demo
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health' || process.env.NODE_ENV === 'test',
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // raised from 10 → 100 for demo/local
  message: { success: false, error: 'Too many auth attempts. Please wait 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

export const rideRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // raised from 5 → 30 for demo
  message: { success: false, error: 'Too many ride requests. Please slow down.' },
  skip: () => process.env.NODE_ENV === 'test',
});
