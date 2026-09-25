import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { logger } from './lib/logger.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { AppError } from './lib/errors.js';
import { timers } from './fsm/timers.js';
import { transition } from './fsm/engine.js';

// Route imports
import { listingRoutes } from './routes/listings.js';
import { orderRoutes } from './routes/orders.js';
import { sellerRoutes } from './routes/sellers.js';
import { threadRoutes } from './routes/threads.js';
import { analyticsRoutes } from './routes/analytics.js';
import { webhookRoutes } from './routes/webhooks.js';
import { demoRoutes } from './routes/demo.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use custom pino instance
  });

  // 1. CORS Setup
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CORS_ORIGIN || '',
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-User-Id'],
    credentials: true,
  });

  // 2. Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    logger.error(
      { err: error, url: request.url, method: request.method },
      '[Server] Request Error'
    );

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'ValidationError',
        message: 'Request payload validation failed',
        details: error.flatten(),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
      });
    }

    // Default 500
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return reply.status(500).send({
      error: 'InternalServerError',
      message,
    });
  });

  // 3. Health Check
  const healthHandler = async () => ({
    status: 'ok',
    service: 'trustlink-escrow-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // 4. Register Route Modules
  const registerRoutes = async (instance: any) => {
    await instance.register(listingRoutes);
    await instance.register(orderRoutes);
    await instance.register(sellerRoutes);
    await instance.register(threadRoutes);
    await instance.register(analyticsRoutes);
    await instance.register(webhookRoutes);
    await instance.register(demoRoutes);
  };

  // Register under /api/v1 (recommended spec)
  await app.register(registerRoutes, { prefix: '/api/v1' });

  // Also register at root as alias so /orders, /listings work with or without /api/v1 prefix
  await app.register(registerRoutes);

  return app;
}

async function start() {
  try {
    await connectDb();
    const app = await buildApp();

    // Start background inspection clock poller
    timers.startPoller(async (orderId, action) => {
      if (action === 'RELEASE_ESCROW') {
        try {
          await transition(orderId, 'INSPECTION_EXPIRED', {
            source: 'timer_poller',
            expiredAt: new Date().toISOString(),
          });
          logger.info({ orderId }, '[Timer] Auto-released escrow after inspection window elapsed');
        } catch (err) {
          logger.error({ err, orderId }, '[Timer] Failed to auto-release order');
        }
      }
    }, 2000); // 2s check interval for demo snappiness

    await app.listen({ port: PORT, host: HOST });
    logger.info(`🚀 TrustLink Escrow Backend listening on http://${HOST}:${PORT}`);
    logger.info(`🛡️ API endpoints active on http://${HOST}:${PORT}/api/v1/`);
  } catch (err) {
    logger.error({ err }, '[Server] Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  timers.stopPoller();
  await disconnectDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  timers.stopPoller();
  await disconnectDb();
  process.exit(0);
});

start();
