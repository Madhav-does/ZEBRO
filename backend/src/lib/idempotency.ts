import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from './db.js';
import { logger } from './logger.js';

const TTL_HOURS = 24;

export async function checkIdempotency(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
  if (!idempotencyKey) return false;

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (new Date() < existing.expiresAt) {
        logger.info({ key: idempotencyKey }, '[Idempotency] Cache hit: returning stored response');
        const parsed = JSON.parse(existing.response);
        reply.status(200).send(parsed);
        return true;
      } else {
        // Expired, delete
        await prisma.idempotencyKey.delete({ where: { key: idempotencyKey } });
      }
    }
  } catch (err) {
    logger.error({ err, key: idempotencyKey }, '[Idempotency] Failed checking idempotency key');
  }

  return false;
}

export async function saveIdempotencyResponse(key: string, data: unknown): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000);
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        response: JSON.stringify(data),
        expiresAt,
      },
      update: {
        response: JSON.stringify(data),
        expiresAt,
      },
    });
    logger.info({ key }, '[Idempotency] Cached response for 24 hours');
  } catch (err) {
    logger.error({ err, key }, '[Idempotency] Failed saving idempotency response');
  }
}
