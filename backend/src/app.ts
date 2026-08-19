import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

import { config } from './config';
import { connectMongoDB } from './config/database';
import { redisClient } from './config/redis';
import { swaggerSpec } from './config/swagger';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { registerSocketHandlers } from './socket/socketHandlers';
import { logger } from './utils/logger';
import { User } from './models/User';
import { requestIdMiddleware, livenessHandler, readinessHandler } from './infrastructure/observability/health.service';
import { metricsCollector, prometheusMetricsHandler } from './infrastructure/observability/metrics.service';


import authRoutes from './routes/auth.routes';
import rideRoutes from './routes/ride.routes';
import driverRoutes from './routes/driver.routes';
import adminRoutes from './routes/admin.routes';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = http.createServer(app);

  // ─── Socket.IO ───────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  registerSocketHandlers(io);

  // ─── Core Middleware ─────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(metricsCollector);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  const allowedOrigins = config.cors.frontendUrl.split(',').map(url => url.trim());
  if (config.isProduction && allowedOrigins.includes('*')) {
    throw new Error('Wildcard CORS is not allowed in production');
  }

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());

  // CSRF Protection via strict custom header check for authenticated mutations
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // CSRF check: request must have expected origin/referer or a custom X-Requested-With header
      // For REST/GraphQL APIs where cookies are sent, X-Requested-With is standard
      const isApiRequest = req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers['x-csrf-token'];
      
      const origin = req.get('origin');
      const referer = req.get('referer');
      let isValidOrigin = false;
      
      if (origin && allowedOrigins.includes(origin)) isValidOrigin = true;
      if (referer && allowedOrigins.some(ao => referer.startsWith(ao))) isValidOrigin = true;

      const isPublicAuthRoute = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].includes(req.path);

      // Allow if valid origin/referer OR standard api header (if no origin/referer sent, e.g., mobile apps)
      if (!isValidOrigin && !isApiRequest && isPublicAuthRoute === false) {
         return res.status(403).json({ success: false, message: 'CSRF token validation failed or missing Origin' });
      }
    }
    next();
  });
  app.use(morgan(config.isProduction ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
  app.use(globalRateLimiter);
  app.use('/uploads', express.static('uploads'));
  app.use((req, res, next) => {
    (req as any).io = io;
    next();
  });

  // ─── Observability & Health Endpoints ─────────────────────
  app.get('/health', livenessHandler);
  app.get('/live', livenessHandler);
  app.get('/ready', readinessHandler);
  app.get('/metrics', prometheusMetricsHandler);


  // ─── REST API Routes ──────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/rides', rideRoutes);
  app.use('/api/drivers', driverRoutes);
  app.use('/api/admin', adminRoutes);

  // ─── Swagger UI ───────────────────────────────────────────
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
      customSiteTitle: 'RideShare API Docs',
    })
  );
  app.get('/api-docs.json', (_, res) => res.json(swaggerSpec));

  // ─── GraphQL (Apollo) ─────────────────────────────────────
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });
  await apolloServer.start();

  app.use(
    '/graphql',
    cors({ origin: true, credentials: true }),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          try {
            const jwt = await import('jsonwebtoken');
            const payload = jwt.default.verify(token, config.jwt.secret) as {
              userId: string;
              role: string;
              tenantId: string;
            };
            return { userId: payload.userId, role: payload.role, tenantId: payload.tenantId };
          } catch {
            return {};
          }
        }
        return {};
      },
    })
  );

  // ─── 404 + Error Handlers ─────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  // ─── Connect Services & Start ─────────────────────────────
  await connectMongoDB();

  // ─── Auto-seed Demo Users ──────────────────────────────────
  try {
    // 1. Admin
    let admin = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin',
        isVerified: true,
        isActive: true,
        tenantId: 'default-tenant',
      });
      await admin.save();
      logger.info('👤 Seeded default admin account: admin@gmail.com / admin123');
    }

    // 2. Demo Rider
    let rider = await User.findOne({ email: 'rider@gmail.com' }).select('+password');
    if (!rider) {
      rider = new User({
        name: 'Priya Rider',
        email: 'rider@gmail.com',
        password: 'rider123',
        phone: '9876543210',
        role: 'rider',
        isVerified: true,
        isActive: true,
        tenantId: 'default-tenant',
      });
      await rider.save();
      logger.info('👤 Seeded demo rider: rider@gmail.com / rider123');
    }

    // 3. Demo Driver
    let driver = await User.findOne({ email: 'driver@gmail.com' }).select('+password');
    if (!driver) {
      driver = new User({
        name: 'Rajesh Driver',
        email: 'driver@gmail.com',
        password: 'driver123',
        phone: '9823456789',
        role: 'driver',
        isVerified: true,
        kycStatus: 'approved',
        isActive: true,
        tenantId: 'default-tenant',
        vehicleInfo: {
          make: 'Maruti Suzuki',
          model: 'Swift Dzire',
          year: 2023,
          color: 'White',
          plateNumber: 'KA-01-AB-1234',
          type: 'sedan',
        },
      });
      await driver.save();
      logger.info('👤 Seeded demo driver: driver@gmail.com / driver123');
    }
  } catch (seedErr) {
    logger.error('Failed to seed demo users:', seedErr);
  }
  try {
    await redisClient.connect();
  } catch (err: any) {
    logger.warn(`⚠️ Redis connection failed: ${err.message}. Caching will use in-memory fallback.`);
    try {
      await redisClient.disconnect();
    } catch {
      // Ignore disconnect error if client was not connected
    }
    const mockStore = new Map<string, string>();
    (redisClient as any).get = async (key: string) => mockStore.get(key) || null;
    (redisClient as any).setex = async (key: string, ttl: number, val: string) => {
      mockStore.set(key, val);
      setTimeout(() => mockStore.delete(key), ttl * 1000);
      return 'OK';
    };
    (redisClient as any).del = async (...keys: string[]) => {
      keys.forEach(k => mockStore.delete(k));
      return keys.length;
    };
    (redisClient as any).keys = async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(mockStore.keys()).filter(k => regex.test(k));
    };
  }

  httpServer.listen(config.port, () => {
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📚 Swagger docs: http://localhost:${config.port}/api-docs`);
    logger.info(`🔷 GraphQL: http://localhost:${config.port}/graphql`);
    logger.info(`🔌 Socket.IO: ws://localhost:${config.port}`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await apolloServer.stop();
      await redisClient.quit();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
