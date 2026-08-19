import request from 'supertest';
import express from 'express';
import { enforceIdempotency } from '../../src/middleware/idempotency';
import { redisRateLimiter } from '../../src/middleware/rateLimiter';
import { distributedLockService } from '../../src/infrastructure/redis/lock.service';
import { redisService } from '../../src/infrastructure/redis/redis.service';

const mockStore = new Map<string, string>();
let incrStore = new Map<string, number>();

const mockRedisClient = {
  status: 'ready',
  set: jest.fn(async (key, val, ex, ttl, nx) => {
    if (nx && mockStore.has(key)) return null;
    mockStore.set(key, val);
    return 'OK';
  }),
  get: jest.fn(async (key) => mockStore.get(key) || null),
  setex: jest.fn(async (key, ttl, val) => {
    mockStore.set(key, val);
    return 'OK';
  }),
  del: jest.fn(async (key) => mockStore.delete(key)),
  eval: jest.fn(async (script, numKeys, key, val) => {
    if (mockStore.get(key) === val) {
      mockStore.delete(key);
      return 1;
    }
    return 0;
  }),
  incr: jest.fn(async (key) => {
    const v = (incrStore.get(key) || 0) + 1;
    incrStore.set(key, v);
    return v;
  }),
  expire: jest.fn(),
  ttl: jest.fn(async () => 10),
};
jest.spyOn(redisService, 'getRawClient').mockReturnValue(mockRedisClient as any);

const app = express();
app.use(express.json());

let counter = 0;
app.post('/test-idempotency', enforceIdempotency({ ttlSeconds: 10 }), (_req, res) => {
  counter += 1;
  res.status(201).json({ success: true, count: counter });
});

let rateLimitCounter = 0;
app.get('/test-ratelimit', redisRateLimiter({ windowSeconds: 60, maxRequests: 2, keyPrefix: 'test' }), (_req, res) => {
  rateLimitCounter += 1;
  res.status(200).json({ success: true, count: rateLimitCounter });
});

describe('Hardened Middleware & Distributed System Verification', () => {
  beforeEach(() => {
    counter = 0;
    rateLimitCounter = 0;
  });

  describe('Idempotency Middleware', () => {
    beforeEach(() => {
      mockStore.clear();
      incrStore.clear();
    });
    it('executes operation only once for same Idempotency-Key across 10 concurrent requests', async () => {
      const requests = Array.from({ length: 10 }).map(() =>
        request(app)
          .post('/test-idempotency')
          .set('Idempotency-Key', 'test-key-100')
          .send({ amount: 50 })
      );

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(201);
        expect(res.body.count).toBe(1);
      });
      expect(counter).toBe(1);
    });
  });

  describe('Rate Limiter Middleware', () => {
    it('allows requests within threshold and blocks excess requests with 429', async () => {
      const res1 = await request(app).get('/test-ratelimit');
      const res2 = await request(app).get('/test-ratelimit');
      const res3 = await request(app).get('/test-ratelimit');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(429);
    });
  });

  describe('Distributed Lock Service', () => {
    it('grants lock to first caller and rejects concurrent caller', async () => {
      const lockKey = 'test:resource:123';
      const lock1 = await distributedLockService.acquireLock(lockKey, 5000);
      const lock2 = await distributedLockService.acquireLock(lockKey, 5000);

      expect(lock1).not.toBeNull();
      expect(lock2).toBeNull();

      if (lock1) {
        const released = await distributedLockService.releaseLock(lockKey, lock1);
        expect(released).toBe(true);
      }
    });
  });
});
