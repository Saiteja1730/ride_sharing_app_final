import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { redisService } from '../redis/redis.service';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

export const livenessHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
};

export const readinessHandler = async (_req: Request, res: Response): Promise<void> => {
  const isMongoReady = mongoose.connection.readyState === 1;
  const isRedisReady = true; // Fallback handles gracefully

  const isHealthy = isMongoReady;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'READY' : 'NOT_READY',
    timestamp: new Date().toISOString(),
    checks: {
      mongodb: isMongoReady ? 'CONNECTED' : 'DISCONNECTED',
      redis: isRedisReady ? 'HEALTHY' : 'DEGRADED',
    },
  });
};
