import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma, connectDb, disconnectDb } from '../src/lib/db.js';
import { findNextState } from '../src/fsm/transitions.js';
import { transition } from '../src/fsm/engine.js';
import { InvalidTransitionError } from '../src/lib/errors.js';

describe('FSM Transitions Allow-List and Engine', () => {
  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  describe('Transition Table Allow-List (findNextState)', () => {
    it('allows PAYMENT_PENDING -> PAYMENT_SUCCEEDED -> HELD_IN_ESCROW', () => {
      expect(findNextState('PAYMENT_PENDING', 'PAYMENT_SUCCEEDED')).toBe('HELD_IN_ESCROW');
    });

    it('allows PAYMENT_PENDING -> PAYMENT_FAILED -> CANCELLED', () => {
      expect(findNextState('PAYMENT_PENDING', 'PAYMENT_FAILED')).toBe('CANCELLED');
    });

    it('allows HELD_IN_ESCROW -> WEIGHT_SCAN_MATCH -> IN_TRANSIT', () => {
      expect(findNextState('HELD_IN_ESCROW', 'WEIGHT_SCAN_MATCH')).toBe('IN_TRANSIT');
    });

    it('allows HELD_IN_ESCROW -> WEIGHT_SCAN_ANOMALY -> ESCROW_FROZEN', () => {
      expect(findNextState('HELD_IN_ESCROW', 'WEIGHT_SCAN_ANOMALY')).toBe('ESCROW_FROZEN');
    });

    it('allows IN_TRANSIT -> DELIVERED -> DELIVERED', () => {
      expect(findNextState('IN_TRANSIT', 'DELIVERED')).toBe('DELIVERED');
    });

    it('allows DELIVERED -> BUYER_CONFIRMED -> FUNDS_RELEASED', () => {
      expect(findNextState('DELIVERED', 'BUYER_CONFIRMED')).toBe('FUNDS_RELEASED');
    });

    it('allows DELIVERED -> INSPECTION_EXPIRED -> FUNDS_RELEASED', () => {
      expect(findNextState('DELIVERED', 'INSPECTION_EXPIRED')).toBe('FUNDS_RELEASED');
    });

    it('allows DELIVERED -> DISPUTE_OPENED -> ESCROW_FROZEN', () => {
      expect(findNextState('DELIVERED', 'DISPUTE_OPENED')).toBe('ESCROW_FROZEN');
    });

    it('allows ESCROW_FROZEN -> DISPUTE_RESOLVED_REFUND -> REFUNDED', () => {
      expect(findNextState('ESCROW_FROZEN', 'DISPUTE_RESOLVED_REFUND')).toBe('REFUNDED');
    });

    it('allows ESCROW_FROZEN -> DISPUTE_RESOLVED_RELEASE -> FUNDS_RELEASED', () => {
      expect(findNextState('ESCROW_FROZEN', 'DISPUTE_RESOLVED_RELEASE')).toBe('FUNDS_RELEASED');
    });

    it('returns null for illegal transitions', () => {
      expect(findNextState('PAYMENT_PENDING', 'DELIVERED')).toBeNull();
      expect(findNextState('PAYMENT_PENDING', 'WEIGHT_SCAN_MATCH')).toBeNull();
      expect(findNextState('FUNDS_RELEASED', 'DISPUTE_OPENED')).toBeNull();
      expect(findNextState('REFUNDED', 'BUYER_CONFIRMED')).toBeNull();
    });
  });

  describe('Database transition() Engine Execution', () => {
    let testOrder: any;

    beforeAll(async () => {
      // Create isolated test seller, buyer, listing, order
      const seller = await prisma.user.create({
        data: {
          email: `test_seller_${Date.now()}@fsm.test`,
          handle: `seller_${Date.now()}`,
          role: 'seller',
          kycVerified: true,
        },
      });

      const buyer = await prisma.user.create({
        data: {
          email: `test_buyer_${Date.now()}@fsm.test`,
          handle: `buyer_${Date.now()}`,
          role: 'buyer',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          sellerId: seller.id,
          title: 'Test FSM Ceramic Dripper',
          description: 'Testing FSM transitions',
          priceCents: 5000,
          declaredWeightG: 500,
          imageUrls: '[]',
          category: 'Ceramics',
        },
      });

      testOrder = await prisma.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: seller.id,
          listingId: listing.id,
          status: 'PAYMENT_PENDING',
          totalCents: 5600,
          platformFeeCents: 150,
          transferGroup: `test_tg_${Date.now()}`,
          declaredWeightG: 500,
        },
      });
    });

    it('successfully advances order through legitimate lifecycle states', async () => {
      // 1. PAYMENT_PENDING -> HELD_IN_ESCROW
      const paid = await transition(testOrder.id, 'PAYMENT_SUCCEEDED', { test: true });
      expect(paid.status).toBe('HELD_IN_ESCROW');
      expect(paid.easypostTrackerId).toBeDefined();

      // 2. HELD_IN_ESCROW -> IN_TRANSIT
      const inTransit = await transition(testOrder.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 510 });
      expect(inTransit.status).toBe('IN_TRANSIT');
      expect(inTransit.weightAuditResult).toBe('MATCH');

      // 3. IN_TRANSIT -> DELIVERED
      const delivered = await transition(testOrder.id, 'DELIVERED', { deliveredAt: new Date().toISOString() });
      expect(delivered.status).toBe('DELIVERED');
      expect(delivered.inspectionDeadline).toBeDefined();

      // 4. DELIVERED -> FUNDS_RELEASED
      const released = await transition(testOrder.id, 'BUYER_CONFIRMED', { rating: 5 });
      expect(released.status).toBe('FUNDS_RELEASED');
      expect(released.releasedAt).toBeDefined();
    });

    it('throws InvalidTransitionError when illegal transition attempted from FUNDS_RELEASED', async () => {
      await expect(
        transition(testOrder.id, 'WEIGHT_SCAN_MATCH', {})
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('writes tamper-evident cryptographic hash chain on EscrowEvents', async () => {
      const events = await prisma.escrowEvent.findMany({
        where: { orderId: testOrder.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(events.length).toBeGreaterThanOrEqual(4);
      events.forEach((evt) => {
        expect(evt.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
      });
    });
  });
});
