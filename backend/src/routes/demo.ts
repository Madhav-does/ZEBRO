import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { transition } from '../fsm/engine.js';
import { escrowService } from '../services/escrow.js';
import { formatOrderResponse } from '../services/orders.js';
import { logger } from '../lib/logger.js';

const scenarioSchema = z.object({
  scenario: z.enum([
    'merchant_dropoff',
    'out_for_delivery',
    'perfect_delivery',
    'weight_mismatch',
    'transit_tampering',
    'dispute_filed',
    'release_funds',
  ]),
  orderId: z.string().optional(),
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEMO_CALLER = { id: 'demo_operator', role: 'admin' };

export async function demoRoutes(fastify: FastifyInstance) {
  const handleScenario = async (request: FastifyRequest, reply: FastifyReply) => {
    // HIGH-02: Protect production deployments from demo bypasses unless in demonstration mode
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO === 'false') {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'Demo simulation endpoints are strictly disabled in production environments.',
      });
    }

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
      await transition(
        orderId,
        'PAYMENT_SUCCEEDED',
        {
          method: 'Apple Pay (Tokenized)',
          authorizedAt: new Date().toISOString(),
        },
        DEMO_CALLER
      );
      await delay(200);
      current = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (scenario === 'merchant_dropoff') {
      // Step 2: Merchant delivers parcel to postal clerk -> Scale matches tare weight
      if (current?.status === 'HELD_IN_ESCROW') {
        const declared = current.declaredWeightG;
        const matchedWeight = declared + Math.round(declared * 0.03) + 20; // +3.5%
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: matchedWeight,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'out_for_delivery') {
      // Advance to IN_TRANSIT if held
      if (current?.status === 'HELD_IN_ESCROW') {
        const declared = current.declaredWeightG;
        const matchedWeight = declared + Math.round(declared * 0.03) + 20;
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: matchedWeight,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
          },
          DEMO_CALLER
        );
        await delay(200);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      // Out for delivery -> Delivered to doorstep (Starts 48s inspection countdown)
      if (current?.status === 'IN_TRANSIT') {
        await transition(
          orderId,
          'DELIVERED',
          {
            deliveredAt: new Date().toISOString(),
            location: 'Austin, TX (Doorstep Delivery Confirmed with OTP)',
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'perfect_delivery') {
      // Step 2: Postal Scale Intake Match (e.g. 1240g for 1200g declared)
      if (current?.status === 'HELD_IN_ESCROW') {
        const declared = current.declaredWeightG;
        const matchedWeight = declared + Math.round(declared * 0.03) + 20;
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: matchedWeight,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
          },
          DEMO_CALLER
        );
        await delay(400);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      // Step 3: Out for delivery -> Delivered
      if (current?.status === 'IN_TRANSIT') {
        await transition(
          orderId,
          'DELIVERED',
          {
            deliveredAt: new Date().toISOString(),
            location: 'Austin, TX (Doorstep Delivery Confirmed with OTP)',
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'release_funds') {
      if (current?.status === 'HELD_IN_ESCROW' || current?.status === 'IN_TRANSIT') {
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: current.declaredWeightG,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
          },
          DEMO_CALLER
        );
        await delay(100);
        await transition(
          orderId,
          'DELIVERED',
          {
            deliveredAt: new Date().toISOString(),
          },
          DEMO_CALLER
        );
        await delay(100);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }
      if (current?.status === 'DELIVERED') {
        await transition(
          orderId,
          'BUYER_CONFIRMED',
          {
            confirmedBy: 'buyer',
            confirmedAt: new Date().toISOString(),
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'weight_mismatch') {
      // Step 2: Postal Scale Tare Deficit Anomaly (e.g. 400g vs 1200g declared)
      if (current?.status === 'HELD_IN_ESCROW') {
        await transition(
          orderId,
          'WEIGHT_SCAN_ANOMALY',
          {
            scannedWeightG: 400,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
            alert: 'EMPTY BOX DEFICIT: Weight is -66.7% below seller manifest',
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'transit_tampering') {
      // Scenario B: Passed at origin counter scale, but stolen in transit before/at delivery
      if (current?.status === 'HELD_IN_ESCROW') {
        const declared = current.declaredWeightG;
        const matchedWeight = declared + Math.round(declared * 0.03) + 20;
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: matchedWeight,
            carrierStation: 'Portland Sorting Hub #97201 — Postal Scale #4',
          },
          DEMO_CALLER
        );
        await delay(150);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      if (current?.status === 'IN_TRANSIT' || current?.status === 'DELIVERED') {
        await transition(
          orderId,
          'DISPUTE_OPENED',
          {
            reason: 'transit_tampering',
            description: 'CARRIER IN-TRANSIT TAMPERING: Origin intake scale verified genuine weight (PASS), but destination arrival weight dropped to 0.35kg (-71.8% loss). Package security tape cut and contents stolen while in USPS carrier custody.',
            originWeightG: current.scannedWeightG || current.declaredWeightG,
            deliveryWeightG: 350,
            tamperLocation: 'Between Denver Air Freight Hub and Austin Delivery Terminal',
            evidenceUrls: [
              'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80',
            ],
          },
          DEMO_CALLER
        );
      }
    } else if (scenario === 'dispute_filed') {
      // Advance to DELIVERED if needed
      if (current?.status === 'HELD_IN_ESCROW') {
        await transition(
          orderId,
          'WEIGHT_SCAN_MATCH',
          {
            scannedWeightG: current.declaredWeightG,
          },
          DEMO_CALLER
        );
        await delay(200);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }
      if (current?.status === 'IN_TRANSIT') {
        await transition(
          orderId,
          'DELIVERED',
          {
            deliveredAt: new Date().toISOString(),
          },
          DEMO_CALLER
        );
        await delay(200);
        current = await prisma.order.findUnique({ where: { id: orderId } });
      }

      // Step 4: Open Dispute
      if (current?.status === 'DELIVERED') {
        await transition(
          orderId,
          'DISPUTE_OPENED',
          {
            reason: 'empty_box',
            description: 'Package arrived with torn seal and missing contents inside.',
            evidenceUrls: [
              'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80',
            ],
          },
          DEMO_CALLER
        );
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
  };

  // Support both /demo/scenario and /demo/simulate
  fastify.post('/demo/scenario', handleScenario);
  fastify.post('/demo/simulate', handleScenario);

  // GET /demo/orders
  fastify.get('/demo/orders', async (_request: FastifyRequest, reply: FastifyReply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'Demo endpoints are strictly disabled in production environments.',
      });
    }

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
