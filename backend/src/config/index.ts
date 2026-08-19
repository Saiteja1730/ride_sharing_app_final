import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';

if (process.env.NODE_ENV === 'production') {
  const missingEnvs: string[] = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('fallback')) missingEnvs.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) missingEnvs.push('MONGODB_URI');
  if (missingEnvs.length > 0) {
    throw new Error(`[CRITICAL] Missing or unsafe production environment variables: ${missingEnvs.join(', ')}`);
  }
}

export const config = {

  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  isProduction: process.env.NODE_ENV === 'production',

  mongodb: {
    uri: isDocker
      ? process.env.MONGODB_URI || 'mongodb://mongodb:27017/rideshare'
      : process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/rideshare',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  fare: {
    economy: parseFloat(process.env.BASE_FARE_ECONOMY || '2.50'),
    premium: parseFloat(process.env.BASE_FARE_PREMIUM || '5.00'),
    suv: parseFloat(process.env.BASE_FARE_SUV || '6.00'),
    xl: parseFloat(process.env.BASE_FARE_XL || '7.00'),
    pricePerKm: parseFloat(process.env.PRICE_PER_KM || '1.20'),
    pricePerMin: parseFloat(process.env.PRICE_PER_MIN || '0.25'),
    surgeThreshold: parseFloat(process.env.SURGE_THRESHOLD || '0.7'),
    maxSurgeMultiplier: parseFloat(process.env.MAX_SURGE_MULTIPLIER || '3.0'),
  },

  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};
