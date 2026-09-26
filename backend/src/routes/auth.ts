import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { signJwt } from '../lib/jwt.js';
import { NotFoundError } from '../lib/errors.js';

const tokenRequestSchema = z.object({
  handle: z.string().optional(),
  role: z.enum(['buyer', 'seller', 'carrier', 'arbitrator', 'admin']).optional(),
  userId: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/token - Obtain a signed JWT for demo/client interaction
  fastify.post('/auth/token', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = tokenRequestSchema.parse(request.body || {});

    let user;
    if (body.userId) {
      user = await prisma.user.findUnique({ where: { id: body.userId } });
    } else if (body.handle) {
      user = await prisma.user.findFirst({ where: { handle: body.handle } });
    } else if (body.role) {
      user = await prisma.user.findFirst({ where: { role: body.role } });
    } else {
      // Default to buyer alex_k
      user = await prisma.user.findFirst({ where: { handle: 'alex_k' } });
    }

    if (!user) {
      // Fallback: If DB is empty, find any user
      user = await prisma.user.findFirst();
    }

    if (!user) {
      throw new NotFoundError('No user available to generate token');
    }

    const token = signJwt({
      userId: user.id,
      role: user.role as any,
      handle: user.handle,
    });

    return reply.status(200).send({
      token,
      user: {
        id: user.id,
        handle: user.handle,
        role: user.role,
        email: user.email,
        kycVerified: user.kycVerified,
        trustTier: user.trustTier,
      },
    });
  });
}
