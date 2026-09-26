import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { NotFoundError, ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { checkIdempotency, saveIdempotencyResponse } from '../lib/idempotency.js';
import { escrowService } from '../services/escrow.js';
import { formatOrderResponse } from '../services/orders.js';

const createOrderSchema = z.object({
  listingId: z.string().optional(),
  productId: z.string().optional(),
  shippingAddress: z.union([z.string(), z.record(z.any())]).optional().default('1042 Congress Ave, Austin, TX 78701'),
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
    if (!request.user) {
      throw new UnauthorizedError('Authentication required to create an order');
    }

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

    const buyerId = request.user.id;
    const shippingAddressStr =
      typeof body.shippingAddress === 'object' && body.shippingAddress !== null
        ? Object.values(body.shippingAddress).filter(Boolean).join(', ')
        : (body.shippingAddress as string);

    const result = await escrowService.createOrder({
      buyerId,
      listingId,
      shippingAddress: shippingAddressStr,
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
    if (!request.user) {
      throw new UnauthorizedError('Authentication required to view active orders');
    }

    const userId = request.user.id;
    const isAdmin = request.user.role === 'admin';

    const where: any = {
      status: { in: ['PAYMENT_PENDING', 'HELD_IN_ESCROW', 'IN_TRANSIT', 'DELIVERED', 'ESCROW_FROZEN'] },
    };

    if (!isAdmin) {
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
    if (!request.user) {
      throw new UnauthorizedError('Authentication required to view past orders');
    }

    const userId = request.user.id;
    const isAdmin = request.user.role === 'admin';

    const where: any = {
      status: { in: ['FUNDS_RELEASED', 'REFUNDED', 'CANCELLED'] },
    };

    if (!isAdmin) {
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
    if (!request.user) {
      throw new UnauthorizedError('Authentication required to view order details');
    }

    const { id } = request.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
    });

    if (!order) throw new NotFoundError('Order', id);

    // IDOR Defense: Only buyer, seller, arbitrator, or admin can access order details
    const userId = request.user.id;
    const isAuthorized =
      request.user.role === 'admin' ||
      request.user.role === 'arbitrator' ||
      order.buyerId === userId ||
      order.sellerId === userId;

    if (!isAuthorized) {
      throw new ForbiddenError('You are not authorized to view this order.');
    }

    return formatOrderResponse(order);
  });

  // POST /orders/:id/confirm-payment
  fastify.post('/orders/:id/confirm-payment', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const caller = { id: request.user.id, role: request.user.role };
    const updated = await escrowService.confirmPayment(request.params.id, caller);
    if (idKey) await saveIdempotencyResponse(idKey, updated);
    return updated;
  });

  // POST /orders/:id/dispute and POST /escrow/:orderId/dispute (Frontend alias)
  const handleDispute = async (request: FastifyRequest<{ Params: { id?: string; orderId?: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const orderId = request.params.id || request.params.orderId;
    if (!orderId) throw new NotFoundError('Order ID missing');

    const body = disputeSchema.parse(request.body || {});
    const evidenceUrls = body.evidenceUrls || body.evidenceImages || [];

    const caller = { id: request.user.id, role: request.user.role };
    const result = await escrowService.fileDispute(
      {
        orderId,
        reason: body.reason,
        description: body.description,
        evidenceUrls,
      },
      caller
    );

    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  };

  fastify.post('/orders/:id/dispute', handleDispute);
  fastify.post('/escrow/:orderId/dispute', handleDispute);

  // POST /orders/:id/release-early and POST /escrow/:orderId/release (Frontend alias)
  const handleRelease = async (request: FastifyRequest<{ Params: { id?: string; orderId?: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const orderId = request.params.id || request.params.orderId;
    if (!orderId) throw new NotFoundError('Order ID missing');

    const caller = { id: request.user.id, role: request.user.role };
    const result = await escrowService.releaseEarly(orderId, caller);
    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  };

  fastify.post('/orders/:id/release-early', handleRelease);
  fastify.post('/escrow/:orderId/release', handleRelease);

  // POST /orders/:id/seller-respond
  fastify.post('/orders/:id/seller-respond', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const body = sellerRespondSchema.parse(request.body || {});
    const caller = { id: request.user.id, role: request.user.role };
    const result = await escrowService.sellerRespondToDispute(request.params.id, body.evidenceUrls, caller);
    if (idKey) await saveIdempotencyResponse(idKey, result);
    return result;
  });

  // GET /escrow/:orderId/weight-audit
  fastify.get('/escrow/:orderId/weight-audit', async (request: FastifyRequest<{ Params: { orderId: string } }>) => {
    return escrowService.getWeightAudit(request.params.orderId);
  });
}
