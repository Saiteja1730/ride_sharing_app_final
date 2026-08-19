import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let app: express.Express;

jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    status: 'ready',
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(10),
    eval: jest.fn().mockResolvedValue(1),
  };
  const mockFn = jest.fn(() => mockRedis);
  (mockFn as any).Redis = mockFn;
  return mockFn;
});

jest.mock('../../src/config', () => ({
  config: {
    nodeEnv: 'test',
    port: 4001,
    isProduction: false,
    mongodb: { uri: 'mongodb://localhost:27017/test' },
    redis: { url: 'redis://localhost:6379' },
    jwt: { secret: 'test-secret', expiresIn: '7d' },
    fare: {
      economy: 2.5, premium: 5.0, suv: 6.0, xl: 7.0,
      pricePerKm: 1.2, pricePerMin: 0.25, surgeThreshold: 0.7, maxSurgeMultiplier: 3.0,
    },
    cors: { frontendUrl: 'http://localhost:3000' },
    rateLimit: { windowMs: 900000, max: 100 },
    logging: { level: 'silent' },
  },
}));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const { default: authRoutes } = await import('../../src/routes/auth.routes');
  const { default: rideRoutes } = await import('../../src/routes/ride.routes');
  const { errorHandler } = await import('../../src/middleware/errorHandler');
  const cookieParser = require('cookie-parser');

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/rides', rideRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Sprint 1 Hardening Tests', () => {
  describe('Mass Assignment Protection', () => {
    it('should NOT allow registering as admin via role payload', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Evil User',
        email: 'evil@test.com',
        password: 'password123',
        phone: '+123',
        role: 'admin',
      });
      // The validator will catch 'admin' and return 422 because role must be 'rider' or 'driver'
      expect(res.status).toBe(422);
      expect(res.body.errors[0].msg).toBe('Role must be rider or driver');
    });
  });

  describe('Tenant Isolation', () => {
    // Tests for ensuring tenant ID comes from user session, not body
    it('should default tenantId appropriately for new users', async () => {
       const res = await request(app).post('/api/auth/register').send({
         name: 'Tenant User',
         email: 'tenant@test.com',
         password: 'password123',
         phone: '+123',
         role: 'rider'
       });
       expect(res.status).toBe(201);
       expect(res.body.data.user.tenantId).toBe('default-tenant');
    });
  });

  describe('Authentication - Refresh Rotation', () => {
    it('should reject refresh if no cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });
});
