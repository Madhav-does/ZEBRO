import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { prisma, connectDb, disconnectDb } from '../src/lib/db.js';
import { signJwt } from '../src/lib/jwt.js';
import { transition } from '../src/fsm/engine.js';
import { ForbiddenError } from '../src/lib/errors.js';

const BASE = 'http://localhost:4000/api/v1';
const BARE_BASE = 'http://localhost:4000';
const EASYPOST_SECRET = process.env.EASYPOST_WEBHOOK_SECRET || 'ep_whsec_test_secret_2026';
const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_2026';

function signEasyPost(payload: unknown): string {
  const str = JSON.stringify(payload);
  return crypto.createHmac('sha256', EASYPOST_SECRET).update(str).digest('hex');
}

describe('Red Team Security & Authorization Test Suite', () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  describe('CRIT-01: Authentication & Token Verification', () => {
    it('rejects unauthenticated requests to protected endpoints with 401 Unauthorized', async () => {
      const resActive = await fetch(`${BASE}/orders/active`);
      expect(resActive.status).toBe(401);
      const dataActive = await resActive.json();
      expect(dataActive.error).toBe('UnauthorizedError');

      const resCreate = await fetch(`${BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(resCreate.status).toBe(401);

      const resSeller = await fetch(`${BASE}/sellers/me/dashboard`);
      expect(resSeller.status).toBe(401);
    });

    it('rejects forged / invalid signature JWT tokens with 401 Unauthorized', async () => {
      const forgedToken = signJwt(
        { userId: 'fake_user', role: 'admin' },
        'wrong_attacker_secret_123'
      );

      const res = await fetch(`${BASE}/orders/active`, {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      expect(res.status).toBe(401);
    });

    it('allows public catalog browsing without authentication', async () => {
      const res = await fetch(`${BASE}/listings`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('CRIT-02: Webhook HMAC Cryptographic Validation', () => {
    it('rejects EasyPost webhook without signature with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE}/webhooks/easypost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackerId: 'trk_test', status: 'delivered' }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.message).toContain('signature');
    });

    it('rejects EasyPost webhook with tampered HMAC signature with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE}/webhooks/easypost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-easypost-signature': '0000000000000000000000000000000000000000000000000000000000000000',
        },
        body: JSON.stringify({ trackerId: 'trk_test', status: 'delivered' }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects Stripe webhook without signature with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE}/webhooks/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment_intent.succeeded', data: {} }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('CRIT-03: Insecure Direct Object Reference (IDOR) Defense', () => {
    it('prevents Buyer A from reading or modifying Buyer B order', async () => {
      // 1. Create Order as Buyer A
      const buyerAToken = signJwt({ userId: 'buyer_user_A', role: 'buyer', handle: 'buyer_a' });
      const createRes = await fetch(`${BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerAToken}`,
        },
        body: JSON.stringify({ shippingAddress: '123 Alpha St' }),
      });
      expect(createRes.status).toBe(201);
      const orderA = await createRes.json();

      // 2. Buyer B attempts to access Buyer A's order by ID
      const buyerBToken = signJwt({ userId: 'buyer_user_B', role: 'buyer', handle: 'buyer_b' });
      const idorRes = await fetch(`${BASE}/orders/${orderA.orderId}`, {
        headers: { Authorization: `Bearer ${buyerBToken}` },
      });
      expect(idorRes.status).toBe(403);
      const idorData = await idorRes.json();
      expect(idorData.error).toBe('ForbiddenError');

      // 3. Buyer B attempts to release Buyer A's escrow
      const releaseRes = await fetch(`${BASE}/orders/${orderA.orderId}/release-early`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${buyerBToken}` },
      });
      expect(releaseRes.status).toBe(403);
    });
  });

  describe('CRIT-04 & HIGH-01: Removed Endpoints & Surface Reduction', () => {
    it('returns 404 for removed mass data wipe endpoint DELETE /orders', async () => {
      const adminToken = signJwt({ userId: 'admin_test', role: 'admin' });
      const res = await fetch(`${BASE}/orders`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for bare routes without /api/v1 prefix', async () => {
      const adminToken = signJwt({ userId: 'admin_test', role: 'admin' });
      const res = await fetch(`${BARE_BASE}/orders/active`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  describe('HIGH-03: FSM Role-Based Access Control (RBAC)', () => {
    it('prevents buyer from triggering arbitrator actions (DISPUTE_RESOLVED_REFUND)', async () => {
      // Create a test order in SQLite
      const seller = await prisma.user.findFirst({ where: { role: 'seller' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'buyer' } });
      const listing = await prisma.listing.findFirst();

      const testOrder = await prisma.order.create({
        data: {
          buyerId: buyer!.id,
          sellerId: seller!.id,
          listingId: listing!.id,
          status: 'ESCROW_FROZEN',
          totalCents: 5000,
          platformFeeCents: 150,
          transferGroup: `test_fsm_${Date.now()}`,
          declaredWeightG: 500,
        },
      });

      // Buyer attempting to resolve their own dispute for a refund
      await expect(
        transition(
          testOrder.id,
          'DISPUTE_RESOLVED_REFUND',
          {},
          { id: buyer!.id, role: 'buyer' }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('prevents seller from triggering BUYER_CONFIRMED', async () => {
      const seller = await prisma.user.findFirst({ where: { role: 'seller' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'buyer' } });
      const listing = await prisma.listing.findFirst();

      const testOrder = await prisma.order.create({
        data: {
          buyerId: buyer!.id,
          sellerId: seller!.id,
          listingId: listing!.id,
          status: 'DELIVERED',
          totalCents: 5000,
          platformFeeCents: 150,
          transferGroup: `test_seller_bypass_${Date.now()}`,
          declaredWeightG: 500,
        },
      });

      // Seller attempting to approve their own fund payout
      await expect(
        transition(
          testOrder.id,
          'BUYER_CONFIRMED',
          {},
          { id: seller!.id, role: 'seller' }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
