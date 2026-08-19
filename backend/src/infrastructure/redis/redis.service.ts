import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../../utils/logger';

class RedisService {
  private static instance: RedisService;
  private client: Redis;
  private isConnected: boolean = false;
  private inMemoryFallback: Map<string, { value: string; expiresAt?: number }> = new Map();

  private constructor() {
    this.client = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 100, 2000);
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.warn(`⚠️ Redis error: ${err.message}. Operating with fallback strategy.`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    this.client.on('end', () => {
      this.isConnected = false;
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err: any) {
      logger.warn(`⚠️ Failed to connect Redis on startup: ${err.message}. Using fallback in-memory store.`);
    }
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected) {
      try {
        return await this.client.get(key);
      } catch {
        // Fallback
      }
    }
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK' | void> {
    if (this.isConnected) {
      try {
        await this.client.setex(key, seconds, value);
        return 'OK';
      } catch {
        // Fallback
      }
    }
    this.inMemoryFallback.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
  }

  public async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    let count = 0;
    if (this.isConnected) {
      try {
        count = await this.client.del(...keys);
      } catch {
        // Fallback
      }
    }
    for (const key of keys) {
      if (this.inMemoryFallback.delete(key)) count++;
    }
    return count;
  }

  public async delPattern(pattern: string): Promise<number> {
    if (this.isConnected) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          return await this.client.del(...keys);
        }
      } catch {
        // Fallback
      }
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let deleted = 0;
    for (const key of this.inMemoryFallback.keys()) {
      if (regex.test(key)) {
        this.inMemoryFallback.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  public async quit(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
    }
  }

  public getRawClient(): Redis {
    return this.client;
  }
}

export const redisService = RedisService.getInstance();
