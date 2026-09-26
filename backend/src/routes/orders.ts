import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { NotFoundError } from '../lib/errors.js';
import { checkIdempotency, saveIdempotencyResponse } from '../lib/idempotency.js';
import { escrowService } from '../services/escrow.js';
import { formatOrderResponse } from '../services/orders.js';

const createOrderSchema = z.object({
  listingId: z.string().optional(),
  productId: z.string().optional(),
  shippingAddress: z.string().optional().default('1042 Congress Ave, Austin, TX 78701'),
  paymentMethod: z.string().optional().default('Apple Pay (Tokenized)'),
});

const disputeSchema = z.object({
  reason: z.string().default('empty_box'),
  description: z.string().optional(),
  evidenceUrls: z.array(z.string()).optional(),
  evidenceImages: z.array(z.string()).optional(),
});

const sellerRespondSchema = z.object({
  evidenceUrls: z.array(z.string()).default([]),
});

export async function orderRoutes(fastify: FastifyInstance) {
  // POST /orders and POST /orders/checkout (Frontend alias)
  const handleCreateOrder = async (request: FastifyRequest, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const body = createOrderSchema.parse(request.body || {});
    const targetListingId = body.listingId || body.productId;

    let listingId = targetListingId;
    if (!listingId) {
      // Pick first active listing
      const first = await prisma.listing.findFirst({ where: { status: 'active' } });
      listingId = first ? first.id : undefined;
    }

    if (!listingId) {
      throw new NotFoundError('No active listing found to place an order.');
    }

    const buyerId = request.headers['x-user-id'] as string | undefined;
    const result = await escrowService.createOrder({
      buyerId,
      listingId,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
    });

    const response = {
      ...result.order,
      orderId: result.orderId,
      clientSecret: result.clientSecret,
    };

    if (idKey) await saveIdempotencyResponse(idKey, response);
    return reply.status(201).send(response);
  };

  fastify.post('/orders', handleCreateOrder);
  fastify.post('/orders/checkout', handleCreateOrder);

  // GET /orders/active
  fastify.get('/orders/active', async (request: FastifyRequest) => {
    const userId = request.headers['x-user-id'] as string | undefined;
    const where: any = {
      status: { in: ['PAYMENT_PENDING', 'HELD_IN_ESCROW', 'IN_TRANSIT', 'DELIVERED', 'ESCROW_FROZEN'] },
    };
    if (userId) {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => formatOrderResponse(o));
  });

  // GET /orders/past
  fastify.get('/orders/past', async (request: FastifyRequest) => {
    const userId = request.headers['x-user-id'] as string | undefined;
    const where: any = {
      status: { in: ['FUNDS_RELEASED', 'REFUNDED', 'CANCELLED'] },
    };
    if (userId) {
      where.OR = [{ buyerId: userId }, { sellerId: userId }];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => formatOrderResponse(o));
  });

  // GET /orders/:id
  fastify.get('/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const { id } = request.params;
    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
    });

    // Fallback: If demo queries "ord_tl_8829104", match first seeded order
    if (!order && id === 'ord_tl_8829104') {
      order = await prisma.order.findFirst({
        include: {
          seller: true,
          buyer: true,
          listing: true,
          events: { orderBy: { createdAt: 'asc' } },
          dispute: true,
        },
      });
    }

    if (!order) throw new NotFoundError('Order', id);
    return formatOrderResponse(order);
  });

  // POST /orders/:id/confirm-payment
  fastify.post('/orders/:id/confirm-payment', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const updated = await escrowService.confirmPayment(request.params.id);
    if (idKey) await saveIdempotencyResponse(idKey, updated);
    return updated;
  });

  // POST /orders/:id/dispute and POST /escrow/:orderId/dispute (Frontend alias)
  const handleDispute = async (request: FastifyRequest<{ Params: { id?: string; orderId?: string } }>, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const orderId = request.params.id || request.params.orderId;
    if (!orderId) throw new NotFoundError('Order ID missing');

    const body = disputeSchema.parse(request.body || {});
    const evidenceUrls = body.evidenceUrls || body.evidenceImages || [];

    const result = await escrowService.fileDispute({
      orderId,
      reason: body.reason,
      description: body.description,
      evidenceUrls,
    });

    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  };

  fastify.post('/orders/:id/dispute', handleDispute);
  fastify.post('/escrow/:orderId/dispute', handleDispute);

  // POST /orders/:id/release-early and POST /escrow/:orderId/release (Frontend alias)
  const handleRelease = async (request: FastifyRequest<{ Params: { id?: string; orderId?: string } }>, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const orderId = request.params.id || request.params.orderId;
    if (!orderId) throw new NotFoundError('Order ID missing');

    const result = await escrowService.releaseEarly(orderId);
    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  };

  fastify.post('/orders/:id/release-early', handleRelease);
  fastify.post('/escrow/:orderId/release', handleRelease);

  // POST /orders/:id/seller-respond
  fastify.post('/orders/:id/seller-respond', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const body = sellerRespondSchema.parse(request.body || {});
    const result = await escrowService.sellerRespondToDispute(request.params.id, body.evidenceUrls);
    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  });

  // GET /escrow/:orderId/weight-audit
  fastify.get('/escrow/:orderId/weight-audit', async (request: FastifyRequest<{ Params: { orderId: string } }>) => {
    return escrowService.getWeightAudit(request.params.orderId);
  });

  // DELETE /orders — Clear all orders and reset escrow state
  fastify.delete('/orders', async (_request: FastifyRequest, reply: FastifyReply) => {
    await prisma.pendingTimer.deleteMany({});
    await prisma.dispute.deleteMany({});
    await prisma.escrowEvent.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.idempotencyKey.deleteMany({});
    return reply.send({ success: true, message: 'All orders and escrow states successfully cleared' });
  });
}
