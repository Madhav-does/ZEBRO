import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e) => {
  logger.error({ err: e }, '[Prisma Error]');
});

export async function connectDb() {
  await prisma.$connect();
  logger.info('[Prisma] Connected to SQLite database');
}

export async function disconnectDb() {
  await prisma.$disconnect();
  logger.info('[Prisma] Disconnected from SQLite database');
}
