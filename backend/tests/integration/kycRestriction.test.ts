import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../src/models/User';

let mongod: MongoMemoryServer;
let app: express.Express;

// Mock redis
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
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
    set: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
  };
  const mockFn = jest.fn(() => mockRedis);
  (mockFn as any).Redis = mockFn;
  return mockFn;
});

jest.mock('../../src/config', () => ({
  config: {
    nodeEnv: 'test',
    port: 4002,
    isProduction: false,
    mongodb: { uri: 'mongodb://localhost:27017/test-kyc' },
    redis: { url: 'redis://localhost:6379' },
    jwt: { secret: 'test-secret-kyc', expiresIn: '7d' },
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
  const { default: driverRoutes } = await import('../../src/routes/driver.routes');
  const { errorHandler } = await import('../../src/middleware/errorHandler');
  const cookieParser = require('cookie-parser');

  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/drivers', driverRoutes);
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

describe('Driver KYC Restriction Integration Tests', () => {
  const testDriver = {
    name: 'Jane Driver',
    email: 'jane@driver.com',
    password: 'password123',
    phone: '9876543210',
    role: 'driver',
    licenseNumber: 'DL-9876543210',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: '2022',
    vehicleColor: 'Silver',
    vehiclePlate: 'KA51HA1234',
    seatingCapacity: '4',
  };

  it('should block pending KYC driver from going online', async () => {
    // 1. Register driver
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testDriver);
    
    expect(regRes.status).toBe(201);
    const { user } = regRes.body.data;
    const cookies = regRes.headers['set-cookie'];
    expect(user.kycStatus).toBe('pending');

    // 2. Attempt to go online
    const patchRes = await request(app)
      .patch('/api/drivers/availability')
      .set('Cookie', cookies)
      .send({ isAvailable: true, lat: 12.9756, lng: 77.6068 });

    expect(patchRes.status).toBe(403);
    expect(patchRes.body.error).toContain('Cannot go online without KYC approval');

    // 3. Confirm driver availability is still false in DB
    const dbDriver = await User.findById(user._id);
    expect(dbDriver?.isAvailable).toBe(false);
  });

  it('should allow approved KYC driver to go online and find them as nearby', async () => {
    // 1. Register driver
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(testDriver);
    
    const { user } = regRes.body.data;
    const cookies = regRes.headers['set-cookie'];

    // 2. Approve driver KYC status in database
    await User.findByIdAndUpdate(user._id, {
      $set: { kycStatus: 'approved', isVerified: true, tenantId: 'default-tenant' }
    });

    // 3. Attempt to go online
    const patchRes = await request(app)
      .patch('/api/drivers/availability')
      .set('Cookie', cookies)
      .send({ isAvailable: true, lat: 12.9756, lng: 77.6068 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.isAvailable).toBe(true);

    // 4. Verify findNearbyDrivers returns this driver
    const nearbyDrivers = await (User as any).findNearbyDrivers(12.9756, 77.6068, 5, 'default-tenant');
    expect(nearbyDrivers.length).toBe(1);
    expect(nearbyDrivers[0]._id.toString()).toBe(user._id);
  });
});
