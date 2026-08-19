import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

class RedisClient {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        family: 0, // Enable both IPv4 and IPv6 for cloud environments
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('connect', () => {
        logger.info('🔄 Connecting to Redis...');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('✅ Redis ready');
      });

      RedisClient.instance.on('error', (err) => {
        logger.error('❌ Redis connection failed: ' + err.message);
      });

      RedisClient.instance.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
      });
    }

    return RedisClient.instance;
  }
}

export const redisClient = RedisClient.getInstance();

// ---- Redis cache helpers ----
export const CACHE_KEYS = {
  nearbyDrivers: (lat: number, lng: number) =>
    `drivers:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}`,
  fareEstimate: (origin: string, dest: string, vehicleType: string) =>
    `fare:${origin}:${dest}:${vehicleType}`,
  rideHistory: (userId: string, page: number) =>
    `history:${userId}:page:${page}`,
  userSession: (token: string) => `session:${token}`,
  activeRide: (userId: string) => `active-ride:${userId}`,
  surgeMultiplier: (zone: string) => `surge:${zone}`,
  driverStatus: (driverId: string) => `driver-status:${driverId}`,
};

export const CACHE_TTL = {
  nearbyDrivers: 30,          // 30 seconds
  fareEstimate: 300,          // 5 minutes
  rideHistory: 600,           // 10 minutes
  userSession: 86400,         // 24 hours
  activeRide: 3600,           // 1 hour
  surgeMultiplier: 60,        // 1 minute
  driverStatus: 60,           // 1 minute
};

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    logger.warn(`Cache get failed for key ${key}:`, err);
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn(`Cache set failed for key ${key}:`, err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    logger.warn(`Cache invalidation failed for pattern ${pattern}:`, err);
  }
}
