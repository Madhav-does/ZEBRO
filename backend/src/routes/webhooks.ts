import crypto from 'crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { transition } from '../fsm/engine.js';
import { weightAudit } from '../services/weightAudit.js';
import { formatOrderResponse } from '../services/orders.js';

const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_2026';
const EASYPOST_SECRET = process.env.EASYPOST_WEBHOOK_SECRET || 'ep_whsec_test_secret_2026';

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

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string): boolean {
  try {
    // Stripe format: t=1492774577,v1=5257a869e7ece...
    if (sigHeader.includes('t=') && sigHeader.includes('v1=')) {
      const items = sigHeader.split(',').reduce((acc: Record<string, string>, item) => {
        const [k, v] = item.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const timestamp = items.t;
      const signature = items.v1;
      if (!timestamp || !signature) return false;

      const signedPayload = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
      return safeCompare(signature, expected);
    }

    // Direct HMAC format (for straightforward webhook test suites)
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeCompare(sigHeader, expected);
  } catch {
    return false;
  }
}

function verifyEasyPostSignature(rawBody: string, sigHeader: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return safeCompare(sigHeader, expected);
  } catch {
    return false;
  }
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // POST /webhooks/stripe
  fastify.post('/webhooks/stripe', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info({ headers: request.headers }, '[Webhook] Stripe event received');

    const sigHeader = (request.headers['stripe-signature'] || request.headers['x-stripe-signature']) as string | undefined;
    if (!sigHeader) {
      throw new UnauthorizedError('Missing required Stripe webhook signature header (stripe-signature)');
    }

    const rawBody = request.rawBody || JSON.stringify(request.body);
    if (!verifyStripeSignature(rawBody, sigHeader, STRIPE_SECRET)) {
      logger.warn('[Webhook] Stripe signature verification failed');
      throw new UnauthorizedError('Invalid Stripe webhook signature');
    }

    const parsed = stripeWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Malformed Stripe webhook payload', parsed.error.flatten());
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
        const updated = await transition(
          order.id,
          'PAYMENT_SUCCEEDED',
          { stripePaymentIntentId: piId },
          { id: 'webhook_stripe', role: 'carrier' }
        );
        return reply.status(200).send({ received: true, orderId: order.id, status: updated.status });
      }
    }

    return reply.status(200).send({ received: true, handled: false });
  });

  // POST /webhooks/easypost
  fastify.post('/webhooks/easypost', async (request: FastifyRequest, reply: FastifyReply) => {
    logger.info({ headers: request.headers }, '[Webhook] EasyPost telemetry received');

    const sigHeader = (request.headers['x-easypost-signature'] || request.headers['easypost-signature']) as string | undefined;
    if (!sigHeader) {
      throw new UnauthorizedError('Missing required EasyPost webhook signature header (x-easypost-signature)');
    }

    const rawBody = request.rawBody || JSON.stringify(request.body);
    if (!verifyEasyPostSignature(rawBody, sigHeader, EASYPOST_SECRET)) {
      logger.warn('[Webhook] EasyPost signature verification failed');
      throw new UnauthorizedError('Invalid EasyPost webhook signature');
    }

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
        const updated = await transition(
          order.id,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: scannedWeight,
            deltaG: audit.deltaG,
            toleranceG: audit.toleranceG,
          },
          { id: 'webhook_easypost', role: 'carrier' }
        );
        return reply.status(200).send({
          received: true,
          auditResult: 'MATCH',
          order: formatOrderResponse(updated as any),
        });
      } else {
        const updated = await transition(
          order.id,
          'WEIGHT_SCAN_ANOMALY',
          {
            scannedWeightG: scannedWeight,
            deltaG: audit.deltaG,
            toleranceG: audit.toleranceG,
          },
          { id: 'webhook_easypost', role: 'carrier' }
        );
        return reply.status(200).send({
          received: true,
          auditResult: 'ANOMALY',
          order: formatOrderResponse(updated as any),
        });
      }
    }

    if (body.status === 'delivered') {
      const updated = await transition(
        order.id,
        'DELIVERED',
        {
          carrier: 'USPS',
          deliveredAt: new Date().toISOString(),
        },
        { id: 'webhook_easypost', role: 'carrier' }
      );
      return reply.status(200).send({
        received: true,
        status: 'DELIVERED',
        order: formatOrderResponse(updated as any),
      });
    }

    return reply.status(200).send({ received: true });
  });
}
