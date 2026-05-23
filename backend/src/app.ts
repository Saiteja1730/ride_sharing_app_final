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
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

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
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: config.cors.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(morgan(config.isProduction ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
  app.use(globalRateLimiter);
  app.use('/uploads', express.static('uploads'));
  app.use((req, res, next) => {
    (req as any).io = io;
    next();
  });

  // ─── Health Check ─────────────────────────────────────────
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

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
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(
    '/graphql',
    cors({ origin: config.cors.frontendUrl, credentials: true }),
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
            };
            return { userId: payload.userId, role: payload.role };
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

  // ─── Auto-seed Admin ──────────────────────────────────────
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@rideshare.com',
        password: 'adminpassword',
        phone: '9999999999',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      logger.info('👤 Seeded default admin account: admin@rideshare.com / adminpassword');
    }
  } catch (seedErr) {
    logger.error('Failed to seed admin user:', seedErr);
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
