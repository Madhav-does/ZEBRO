import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatic Vercel / serverless environment preparation:
if (!process.env.DATABASE_URL) {
  if (process.env.TURSO_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TURSO_DATABASE_URL;
  } else if (process.env.VERCEL) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } else {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

// When running on Vercel with local SQLite fallback, ensure /tmp/dev.db exists
if (!process.env.TURSO_DATABASE_URL && process.env.DATABASE_URL.includes('/tmp/')) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.resolve(process.cwd(), 'prisma', 'seed.db'),
        path.resolve(process.cwd(), 'seed.db'),
        path.resolve(__dirname, '..', '..', 'prisma', 'seed.db'),
        path.resolve(__dirname, '..', 'prisma', 'seed.db'),
        path.resolve(__dirname, 'prisma', 'seed.db'),
      ];
      let copied = false;
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          fs.copyFileSync(p, tmpDbPath);
          logger.info({ from: p, to: tmpDbPath }, '[Prisma] Seed database initialized in /tmp');
          copied = true;
          break;
        }
      }
      if (!copied) {
        logger.warn('[Prisma] seed.db not found; /tmp/dev.db will be created empty');
      }
    }
  } catch (err) {
    logger.error({ err }, '[Prisma] Error initializing /tmp SQLite database');
  }
}

let prismaInstance: PrismaClient;

if (process.env.TURSO_DATABASE_URL) {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  logger.info({ url }, '[Prisma] Initializing Prisma with LibSQL/Turso driver adapter');
  const adapter = new PrismaLibSql({
    url,
    authToken,
  });
  prismaInstance = new PrismaClient({
    adapter: adapter as any,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });
} else {
  prismaInstance = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });
}

export const prisma = prismaInstance;

(prisma as any).$on('error', (e: any) => {
  logger.error({ err: e }, '[Prisma Error]');
});

export async function connectDb() {
  await prisma.$connect();
  logger.info(
    process.env.TURSO_DATABASE_URL
      ? '[Prisma] Connected to LibSQL/Turso database'
      : '[Prisma] Connected to SQLite database'
  );
}

export async function disconnectDb() {
  await prisma.$disconnect();
  logger.info('[Prisma] Disconnected from database');
}
