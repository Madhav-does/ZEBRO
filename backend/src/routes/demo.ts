import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { transition } from '../fsm/engine.js';
import { escrowService } from '../services/escrow.js';
import { formatOrderResponse } from '../services/orders.js';
import { logger } from '../lib/logger.js';

const scenarioSchema = z.object({
  scenario: z.enum(['perfect_delivery', 'weight_mismatch', 'dispute_filed']),
  orderId: z.string().optional(),
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function demoRoutes(fastify: FastifyInstance) {
  // POST /demo/scenario
  fastify.post('/demo/scenario', async (request: FastifyRequest) => {
    const { scenario, orderId: targetOrderId } = scenarioSchema.parse(request.body || {});

    let orderId = targetOrderId;

    // If no orderId supplied or not found, create a fresh demo order
    if (!orderId) {
      const listing = await prisma.listing.findFirst({
        where: { declaredWeightG: { gte: 1000 } },
      }) || await prisma.listing.findFirst();

      if (!listing) {
        throw new Error('No listings found in database. Please run npm run seed first.');
      }

      const created = await escrowService.createOrder({
        listingId: listing.id,
        paymentMethod: 'Apple Pay (Tokenized)',
      });
      orderId = created.orderId;
    }

    logger.info({ orderId, scenario }, '[Demo] Driving scenario execution');

    // Step 1: Ensure order has payment secured
    let current = await prisma.order.findUnique({ where: { id: orderId } });
    if (current?.status === 'PAYMENT_PENDING') {
      await transition(orderId, 'PAYMENT_SUCCEEDED', {
        method: 'Apple Pay (Tokenized)',
        authorizedAt: new Date().toISOString(),
      });
      await delay(300);
      current = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (scenario === 'perfect_delivery') {
      // Step 2: Postal Scale Intake Match (e.g. 1250g for 1200g declared)
      if (current?.status === 'HELD_IN_ESCROW') {
        const declared = current.declaredWeightG;
        const matchedWeight = declared + Math.round(declared * 0.04); // +4%
        await transition(orderId, 'WEIGHT_SCAN_MATCH', {
          scannedWeightG: matchedWeight,
          carrierStation: 'Portland Station #97201 — Postal Scale #4',
        });
        await delay(300);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      // Step 3: Out for delivery -> Delivered
      if (current?.status === 'IN_TRANSIT') {
        await transition(orderId, 'DELIVERED', {
          deliveredAt: new Date().toISOString(),
          location: 'Austin, TX (Doorstep Delivery Confirmed)',
        });
      }
    } else if (scenario === 'weight_mismatch') {
      // Step 2: Postal Scale Tare Deficit Anomaly (e.g. 400g vs 1200g declared)
      if (current?.status === 'HELD_IN_ESCROW') {
        await transition(orderId, 'WEIGHT_SCAN_ANOMALY', {
          scannedWeightG: 400,
          carrierStation: 'Portland Station #97201 — Postal Scale #4',
          alert: 'EMPTY BOX DEFICIT: Weight is -66.7% below seller manifest',
        });
      }
    } else if (scenario === 'dispute_filed') {
      // Step 2 & 3: Advance to DELIVERED if needed
      if (current?.status === 'HELD_IN_ESCROW') {
        await transition(orderId, 'WEIGHT_SCAN_MATCH', {
          scannedWeightG: current.declaredWeightG,
        });
        await delay(200);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }
      if (current?.status === 'IN_TRANSIT') {
        await transition(orderId, 'DELIVERED', {
          deliveredAt: new Date().toISOString(),
        });
        await delay(200);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      // Step 4: Open Dispute
      if (current?.status === 'DELIVERED') {
        await transition(orderId, 'DISPUTE_OPENED', {
          reason: 'empty_box',
          description: 'Package arrived with torn seal and missing contents inside.',
          evidenceUrls: [
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80',
          ],
        });
      }
    }

    const finalOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
    });

    return {
      success: true,
      scenario,
      order: formatOrderResponse(finalOrder as any),
    };
  });

  // GET /demo/orders
  fastify.get('/demo/orders', async () => {
    const orders = await prisma.order.findMany({
      include: {
        seller: true,
        buyer: true,
        listing: true,
        events: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: orders.length,
      orders: orders.map((o) => formatOrderResponse(o)),
    };
  });
}
