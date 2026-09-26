import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { logger } from './lib/logger.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { AppError } from './lib/errors.js';
import { authenticate } from './lib/auth.js';
import { timers } from './fsm/timers.js';
import { transition } from './fsm/engine.js';

// Route imports
import { authRoutes } from './routes/auth.js';
import { listingRoutes } from './routes/listings.js';
import { orderRoutes } from './routes/orders.js';
import { sellerRoutes } from './routes/sellers.js';
import { threadRoutes } from './routes/threads.js';
import { analyticsRoutes } from './routes/analytics.js';
import { webhookRoutes } from './routes/webhooks.js';
import { demoRoutes } from './routes/demo.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
// MED-06: Bind to 127.0.0.1 by default in development to avoid exposing unauthenticated local services to the LAN
const HOST = process.env.HOST || '127.0.0.1';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use custom pino instance
  });

  // 1. Raw Body Content Parser for Webhook HMAC Signature Validation (CRIT-02)
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      const str = body.toString('utf8');
      req.rawBody = str;
      const json = str.trim() ? JSON.parse(str) : {};
      done(null, json);
    } catch (err: any) {
      done(err, undefined);
    }
  });

  // 2. Rate Limiting Protection (INFO-05)
  await app.register(rateLimit, {
    max: 120, // 120 requests per minute per IP
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost'], // Allow local dev testing to run smoothly
    errorResponseBuilder: () => ({
      error: 'TooManyRequests',
      message: 'Rate limit exceeded. Please throttle your requests.',
      statusCode: 429,
    }),
  });

  // 3. CORS Setup
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'capacitor://localhost',
    'ionic://localhost',
    'https://localhost',
    'http://localhost',
    /\.vercel\.app$/,
  ];
  if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) allowedOrigins.push(trimmed);
    });
  }

  await app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Api-Key',
      'X-User-Id',
      'stripe-signature',
      'x-stripe-signature',
      'x-easypost-signature',
      'easypost-signature',
    ],
    credentials: true,
  });

  // 4. Global Authentication PreHandler Hook (CRIT-01, CRIT-03)
  app.addHook('preHandler', authenticate);

  // 5. Global Error Handler
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

  // 6. Health & Root Endpoints
  const healthHandler = async () => ({
    status: 'ok',
    service: 'trustlink-escrow-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // Root landing endpoint to resolve GET / requests cleanly
  app.get('/', async () => ({
    service: 'Zebro TrustLink Escrow API',
    status: 'online',
    version: '1.0.0',
    description: 'Deterministic SQLite FSM Escrow Engine with EasyPost Weight Audit & Live Telemetry',
    endpoints: {
      health: '/api/v1/health',
      listings: '/api/v1/listings',
      orders: '/api/v1/orders',
      activeOrders: '/api/v1/orders/active',
      pastOrders: '/api/v1/orders/past',
      analytics: '/api/v1/marketplace/fraud-stats',
      recentlyProtected: '/api/v1/marketplace/recently-protected',
      threads: '/api/v1/inbox/threads',
    },
    documentation: 'https://github.com/Madhav-does/ZEBRO',
  }));

  // 7. Register Route Modules under /api/v1 (HIGH-01: Bare path duplicate registration removed)
  const registerRoutes = async (instance: any) => {
    await instance.register(authRoutes);
    await instance.register(listingRoutes);
    await instance.register(orderRoutes);
    await instance.register(sellerRoutes);
    await instance.register(threadRoutes);
    await instance.register(analyticsRoutes);
    await instance.register(webhookRoutes);
    await instance.register(demoRoutes);
  };

  await app.register(registerRoutes, { prefix: '/api/v1' });

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
          await transition(
            orderId,
            'INSPECTION_EXPIRED',
            {
              source: 'timer_poller',
              expiredAt: new Date().toISOString(),
            },
            { id: 'system_timer', role: 'timer' }
          );
          logger.info({ orderId }, '[Timer] Auto-released escrow after inspection window elapsed');
        } catch (err) {
          logger.error({ err, orderId }, '[Timer] Failed to auto-release order');
        }
      }
    }, 2000); // 2s check interval for demo snappiness

    await app.listen({ port: PORT, host: HOST });
    logger.info(`🚀 Zebro Escrow Backend listening on http://${HOST}:${PORT}`);
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

// Only start standalone server if not running in a serverless environment (e.g. Vercel)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  start();
}
