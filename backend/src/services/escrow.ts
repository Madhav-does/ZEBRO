import { nanoid } from 'nanoid';
import { prisma } from '../lib/db.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';
import { mockStripe } from '../mocks/stripe.js';
import { transition, TransitionCaller } from '../fsm/engine.js';
import { formatOrderResponse } from './orders.js';

export const escrowService = {
  async createOrder(params: {
    buyerId?: string;
    listingId: string;
    shippingAddress?: string;
    paymentMethod?: string;
  }) {
    const listing = await prisma.listing.findUnique({
      where: { id: params.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw new NotFoundError('Listing', params.listingId);
    }

    // Default buyer if not passed
    let buyer = params.buyerId
      ? await prisma.user.findUnique({ where: { id: params.buyerId } })
      : await prisma.user.findFirst({ where: { role: 'buyer' } });

    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          id: params.buyerId || undefined,
          email: `buyer_${nanoid(6)}@trustlink.dev`,
          handle: `buyer_${nanoid(6)}`,
          role: 'buyer',
          kycVerified: true,
          trustTier: 1,
        },
      });
    }

    const platformFeeCents = Math.round(listing.priceCents * 0.03); // 3% fee
    const totalCents = listing.priceCents + 600; // includes $6.00 tracked insured shipping
    const transferGroup = `order_${nanoid(16)}`;

    // Create Mock PaymentIntent
    const pi = await mockStripe.createPaymentIntent({
      amountCents: totalCents,
      transferGroup,
    });

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        status: 'PAYMENT_PENDING',
        totalCents,
        platformFeeCents,
        transferGroup,
        stripePaymentIntentId: pi.id,
        declaredWeightG: listing.declaredWeightG,
        carrier: 'USPS',
      },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: true,
        dispute: true,
      },
    });

    return {
      orderId: order.id,
      clientSecret: pi.clientSecret,
      order: formatOrderResponse(order),
    };
  },

  async confirmPayment(orderId: string, caller?: TransitionCaller) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order', orderId);

    if (caller && caller.role === 'buyer' && caller.id !== 'admin' && caller.id !== order.buyerId) {
      throw new ForbiddenError('Only the buyer who placed this order can confirm payment.');
    }

    const updated = await transition(
      orderId,
      'PAYMENT_SUCCEEDED',
      {
        method: 'Apple Pay (Tokenized)',
        authorizedAt: new Date().toISOString(),
      },
      caller || { id: order.buyerId, role: 'buyer' }
    );
    return formatOrderResponse(updated as any);
  },

  async releaseEarly(orderId: string, caller?: TransitionCaller) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new NotFoundError('Order', orderId);

    if (caller && caller.role === 'buyer' && caller.id !== 'admin' && caller.id !== existing.buyerId) {
      throw new ForbiddenError('Only the buyer who placed this order can release escrow funds.');
    }

    if (!existing.scannedWeightG || !existing.deliveredAt) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          scannedWeightG: existing.scannedWeightG || existing.declaredWeightG,
          weightAuditResult: existing.weightAuditResult || 'MATCH',
          deliveredAt: existing.deliveredAt || new Date(),
        },
      });
    }

    const updated = await transition(
      orderId,
      'BUYER_CONFIRMED',
      {
        confirmedBy: 'buyer',
        confirmedAt: new Date().toISOString(),
      },
      caller || { id: existing.buyerId, role: 'buyer' }
    );
    return {
      success: true,
      txHash: (updated as any).events?.[(updated as any).events.length - 1]?.hash || '0x3c990a1b22e8471c998f4410',
      releasedAt: new Date().toISOString(),
      order: formatOrderResponse(updated as any),
    };
  },

  async fileDispute(
    params: {
      orderId: string;
      reason: string;
      description?: string;
      evidenceUrls?: string[];
    },
    caller?: TransitionCaller
  ) {
    const existing = await prisma.order.findUnique({ where: { id: params.orderId } });
    if (!existing) throw new NotFoundError('Order', params.orderId);

    if (caller && caller.role === 'buyer' && caller.id !== 'admin' && caller.id !== existing.buyerId) {
      throw new ForbiddenError('Only the buyer who placed this order can file a dispute.');
    }

    await transition(
      params.orderId,
      'DISPUTE_OPENED',
      {
        reason: params.reason,
        description: params.description,
        evidenceUrls: params.evidenceUrls || [],
        filedAt: new Date().toISOString(),
      },
      caller || { id: existing.buyerId, role: 'buyer' }
    );

    const fullOrder = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: true,
        dispute: true,
      },
    });

    return {
      id: fullOrder?.dispute?.id || `disp_${nanoid(8)}`,
      orderId: params.orderId,
      reason: params.reason,
      description: params.description || '',
      evidenceImages: params.evidenceUrls || [],
      filedAt: new Date().toISOString(),
      status: 'arbitration_active',
      refundAmount: fullOrder ? fullOrder.totalCents / 100 : 85.0,
      order: fullOrder ? formatOrderResponse(fullOrder) : null,
    };
  },

  async sellerRespondToDispute(orderId: string, evidenceUrls: string[], caller?: TransitionCaller) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order', orderId);

    if (caller && caller.role === 'seller' && caller.id !== 'admin' && caller.id !== order.sellerId) {
      throw new ForbiddenError('Only the designated seller for this order can respond to disputes.');
    }

    const dispute = await prisma.dispute.findUnique({ where: { orderId } });
    if (!dispute) throw new NotFoundError('Dispute for Order', orderId);

    const existingEv: string[] = JSON.parse(dispute.evidenceUrls || '[]');
    const merged = [...existingEv, ...evidenceUrls];

    const updated = await prisma.dispute.update({
      where: { orderId },
      data: {
        status: 'SELLER_RESPONDED',
        evidenceUrls: JSON.stringify(merged),
      },
    });

    return {
      success: true,
      dispute: updated,
      message: 'Seller counter-evidence submitted to arbitrator.',
    };
  },

  async getWeightAudit(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: true,
        dispute: true,
      },
    });
    if (!order) throw new NotFoundError('Order', orderId);

    const formatted = formatOrderResponse(order);
    return formatted.weightAudit;
  },
};
