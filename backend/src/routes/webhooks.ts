import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { transition } from '../fsm/engine.js';
import { weightAudit } from '../services/weightAudit.js';
import { formatOrderResponse } from '../services/orders.js';

const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string(),
      transfer_group: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }).passthrough(),
  }),
});

const easypostWebhookSchema = z.object({
  trackerId: z.string(),
  status: z.enum(['intake_scan', 'delivered', 'in_transit']),
  scannedWeightG: z.number().optional(),
});

export async function webhookRoutes(fastify: FastifyInstance) {
  // POST /webhooks/stripe
  fastify.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info({ body: request.body }, '[Webhook] Stripe event received');
    const parsed = stripeWebhookSchema.safeParse(request.body);

    if (!parsed.success) {
      // Fallback for simple demo bodies: { type: 'payment_intent.succeeded', orderId: '...' }
      const anyBody = request.body as any;
      if (anyBody?.orderId) {
        const order = await transition(anyBody.orderId, 'PAYMENT_SUCCEEDED', {
          stripePaymentIntentId: anyBody.paymentIntentId || 'pi_mock_direct',
        });
        return reply.status(200).send({ received: true, order: formatOrderResponse(order as any) });
      }
      return reply.status(400).send({ error: 'Malformed Stripe webhook payload' });
    }

    const { type, data } = parsed.data;

    if (type === 'payment_intent.succeeded') {
      const piId = data.object.id;
      const transferGroup = data.object.transfer_group;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ stripePaymentIntentId: piId }, { transferGroup: transferGroup || '' }],
        },
      });

      if (order) {
        const updated = await transition(order.id, 'PAYMENT_SUCCEEDED', {
          stripePaymentIntentId: piId,
        });
        return reply.status(200).send({ received: true, orderId: order.id, status: updated.status });
      }
    }

    return reply.status(200).send({ received: true, handled: false });
  });

  // POST /webhooks/easypost
  fastify.post('/webhooks/easypost', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info({ body: request.body }, '[Webhook] EasyPost telemetry received');
    const body = easypostWebhookSchema.parse(request.body);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ easypostTrackerId: body.trackerId }, { id: body.trackerId }],
      },
    });

    if (!order) {
      throw new NotFoundError('Order matching tracker', body.trackerId);
    }

    if (body.status === 'intake_scan') {
      const scannedWeight = body.scannedWeightG ?? order.declaredWeightG;
      const audit = weightAudit(order.declaredWeightG, scannedWeight);

      if (audit.match) {
        const updated = await transition(order.id, 'WEIGHT_SCAN_MATCH', {
          scannedWeightG: scannedWeight,
          deltaG: audit.deltaG,
          toleranceG: audit.toleranceG,
        });
        return reply.status(200).send({
          received: true,
          auditResult: 'MATCH',
          order: formatOrderResponse(updated as any),
        });
      } else {
        const updated = await transition(order.id, 'WEIGHT_SCAN_ANOMALY', {
          scannedWeightG: scannedWeight,
          deltaG: audit.deltaG,
          toleranceG: audit.toleranceG,
        });
        return reply.status(200).send({
          received: true,
          auditResult: 'ANOMALY',
          order: formatOrderResponse(updated as any),
        });
      }
    }

    if (body.status === 'delivered') {
      const updated = await transition(order.id, 'DELIVERED', {
        carrier: 'USPS',
        deliveredAt: new Date().toISOString(),
      });
      return reply.status(200).send({
        received: true,
        status: 'DELIVERED',
        order: formatOrderResponse(updated as any),
      });
    }

    return reply.status(200).send({ received: true });
  });
}
