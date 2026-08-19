import { Request, Response, NextFunction } from 'express';
import { redisService } from '../infrastructure/redis/redis.service';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

const fallbackCounts = new Map<string, { count: number; reset: number }>();

export const redisRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.user?.userId || req.ip || 'anonymous';
      const key = `ratelimit:${options.keyPrefix || 'global'}:${identifier}`;

      const client = redisService.getRawClient();

      if (client.status === 'ready') {
        const current = await client.incr(key);
        if (current === 1) {
          await client.expire(key, options.windowSeconds);
        }
        const ttl = await client.ttl(key);
        _res.setHeader('X-RateLimit-Limit', options.maxRequests);
        _res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));
        _res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);

        if (current > options.maxRequests) {
          throw new RateLimitError(`Rate limit exceeded. Try again in ${ttl} seconds.`);
        }
        return next();
      } else {
        const now = Date.now();
        const record = fallbackCounts.get(key);
        if (!record || now > record.reset) {
          fallbackCounts.set(key, { count: 1, reset: now + options.windowSeconds * 1000 });
          _res.setHeader('X-RateLimit-Limit', options.maxRequests);
          _res.setHeader('X-RateLimit-Remaining', options.maxRequests - 1);
          _res.setHeader('X-RateLimit-Reset', now + options.windowSeconds * 1000);
          return next();
        }
        record.count += 1;
        _res.setHeader('X-RateLimit-Limit', options.maxRequests);
        _res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - record.count));
        _res.setHeader('X-RateLimit-Reset', record.reset);
        if (record.count > options.maxRequests) {
          throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.reset - now) / 1000)} seconds.`);
        }
        return next();
      }
    } catch (err) {
      if (err instanceof RateLimitError) return next(err);
      next(err);
    }
  };
};


export const globalRateLimiter = redisRateLimiter({ windowSeconds: 60, maxRequests: 1000, keyPrefix: 'global' });
export const authRateLimiter = redisRateLimiter({ windowSeconds: 60, maxRequests: 1000, keyPrefix: 'auth' });
export const rideRateLimiter = redisRateLimiter({ windowSeconds: 60, maxRequests: 1000, keyPrefix: 'ride' });

