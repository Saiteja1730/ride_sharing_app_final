import { Request, Response, NextFunction } from 'express';
import { redisService } from '../infrastructure/redis/redis.service';
import { ConflictError } from '../utils/errors';

export const enforceIdempotency = (options: { ttlSeconds?: number } = {}) => {
  const ttl = options.ttlSeconds || 86400; // 24 hours default

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next(); // Proceed normally if no key provided
    }

    req.idempotencyKey = idempotencyKey;
    const userId = req.user?.userId || 'anonymous';
    const cacheKey = `idempotency:${userId}:${idempotencyKey}`;

    const client = redisService.getRawClient();
    if (client.status !== 'ready') {
      return next();
    }

    // Try to atomically set to PROCESSING
    const processingState = JSON.stringify({ status: 'PROCESSING' });
    const setNxResult = await client.set(cacheKey, processingState, 'EX', 60, 'NX');

    if (setNxResult !== 'OK') {
      // It already exists, let's get it
      const cachedResponse = await client.get(cacheKey);
      if (cachedResponse) {
        const parsed = JSON.parse(cachedResponse);
        if (parsed.status === 'PROCESSING') {
          return next(new ConflictError('A concurrent request with this Idempotency-Key is currently processing.'));
        }
        res.setHeader('X-Cache-Lookup', 'IDEMPOTENT');
        res.status(parsed.statusCode).json(parsed.body);
        return;
      }
    }

    // Intercept res.json to cache final response
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        client.setex(
          cacheKey,
          ttl,
          JSON.stringify({ statusCode: res.statusCode, body })
        ).catch(() => {});
      } else {
        client.del(cacheKey).catch(() => {});
      }
      return originalJson(body);
    }) as any;

    next();
  };
};
