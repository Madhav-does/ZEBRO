import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt, JwtPayload } from './jwt.js';
import { UnauthorizedError } from './errors.js';
import { prisma } from './db.js';

export interface AuthUser {
  id: string;
  role: 'buyer' | 'seller' | 'carrier' | 'arbitrator' | 'timer' | 'admin';
  handle?: string;
  email?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    rawBody?: string;
  }
}

const API_SECRET = process.env.API_SECRET || 'zebro_api_secret_default_2026';

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const url = request.url.split('?')[0];

  // 1. Unconditionally Public Endpoints
  const publicExactRoutes = [
    '/',
    '/api/v1',
    '/health',
    '/api/v1/health',
    '/auth/token',
    '/api/v1/auth/token',
  ];

  if (publicExactRoutes.includes(url)) {
    return;
  }

  // 2. Webhooks have dedicated HMAC signature validation
  if (url.startsWith('/webhooks') || url.startsWith('/api/v1/webhooks')) {
    return;
  }

  // 3. Public Read-Only Marketplace Endpoints
  // Browsing catalog, viewing listing details, comments, and public seller profiles
  const isPublicCatalogRead =
    request.method === 'GET' &&
    (
      url === '/listings' ||
      url === '/api/v1/listings' ||
      url.startsWith('/listings/') ||
      url.startsWith('/api/v1/listings/') ||
      url.startsWith('/products/') ||
      url.startsWith('/api/v1/products/') ||
      url.startsWith('/marketplace/') ||
      url.startsWith('/api/v1/marketplace/') ||
      (url.startsWith('/sellers/') && !url.includes('/me')) ||
      (url.startsWith('/api/v1/sellers/') && !url.includes('/me')) ||
      url.startsWith('/storefronts/') ||
      url.startsWith('/api/v1/storefronts/')
    );

  // 4. Extract Token from Authorization Header or x-api-key
  let token: string | undefined;
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  const apiKeyHeader = request.headers['x-api-key'] as string | undefined;
  if (!token && apiKeyHeader) {
    token = apiKeyHeader.trim();
  }

  // If public catalog read and no token provided, allow anonymous access
  if (isPublicCatalogRead && !token) {
    return;
  }

  if (!token) {
    throw new UnauthorizedError('Missing authentication token. Please provide Authorization: Bearer <token>.');
  }

  // 5. Check if token matches API_SECRET (Admin / System Service Token)
  if (safeCompare(token, API_SECRET)) {
    request.user = {
      id: 'system_admin',
      role: 'admin',
      handle: 'admin',
      email: 'admin@zebro.local',
    };
    return;
  }

  // 6. Verify Signed JWT
  const payload = verifyJwt(token);
  if (!payload || !payload.userId || !payload.role) {
    throw new UnauthorizedError('Invalid or expired authentication token.');
  }

  // Attach verified user
  request.user = {
    id: payload.userId,
    role: payload.role,
    handle: payload.handle,
  };
}
