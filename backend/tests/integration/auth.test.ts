import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// We'll test the auth logic with a lightweight test server
let mongod: MongoMemoryServer;
let app: express.Express;

// Mock redis before importing anything that uses it
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  return jest.fn(() => mockRedis);
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

  // Build a minimal test app
  const { default: authRoutes } = await import('../../src/routes/auth.routes');
  const { errorHandler } = await import('../../src/middleware/errorHandler');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
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

describe('Auth API', () => {
  const testUser = {
    name: 'Test Rider',
    email: 'rider@test.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'rider',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new rider', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined(); // password hidden
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(409);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 422 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: '123' });
      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, role: 'superuser' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile with valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(testUser);
      const { token } = registerRes.body.data;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });
  });
});
