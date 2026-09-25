import crypto from 'crypto';
import { prisma } from '../lib/db.js';
import { InvalidTransitionError, NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { EscrowEventType, EscrowState, findNextState } from './transitions.js';
import { timers } from './timers.js';
import { mockStripe } from '../mocks/stripe.js';
import { mockEasyPost } from '../mocks/easypost.js';

export async function transition(
  orderId: string,
  event: EscrowEventType,
  payload: Record<string, unknown> = {}
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seller: true,
      buyer: true,
      listing: true,
      dispute: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  const currentState = order.status as EscrowState;
  const nextState = findNextState(currentState, event);

  if (!nextState) {
    logger.warn({ orderId, currentState, event }, '[FSM] Invalid state transition rejected');
    throw new InvalidTransitionError(currentState, event);
  }

  logger.info(
    { orderId, from: currentState, to: nextState, event },
    '[FSM] Executing state transition'
  );

  // 1. Compute Cryptographic Append-Only Hash
  const lastEvent = await prisma.escrowEvent.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
  const prevHash = lastEvent ? lastEvent.hash : '0'.repeat(64);
  const payloadString = JSON.stringify(payload);
  const hash = crypto
    .createHash('sha256')
    .update(payloadString + prevHash + event + nextState)
    .digest('hex');

  // 2. Prepare Order Update Fields
  const orderUpdate: Record<string, unknown> = {
    status: nextState,
  };

  // 3. Side Effects Execution
  switch (event) {
    case 'PAYMENT_SUCCEEDED': {
      // Create Mock Tracker
      const tracker = await mockEasyPost.createTracker({
        orderId: order.id,
        carrier: 'USPS',
        declaredWeightG: order.declaredWeightG,
      });
      orderUpdate.easypostTrackerId = tracker.trackerId;
      orderUpdate.carrier = 'USPS';
      break;
    }

    case 'WEIGHT_SCAN_MATCH': {
      const scannedWeightG = (payload.scannedWeightG as number) ?? order.declaredWeightG;
      orderUpdate.scannedWeightG = scannedWeightG;
      orderUpdate.weightDeltaG = Math.abs(scannedWeightG - order.declaredWeightG);
      orderUpdate.weightAuditResult = 'MATCH';
      break;
    }

    case 'WEIGHT_SCAN_ANOMALY': {
      const scannedWeightG = (payload.scannedWeightG as number) ?? 25;
      orderUpdate.scannedWeightG = scannedWeightG;
      orderUpdate.weightDeltaG = Math.abs(scannedWeightG - order.declaredWeightG);
      orderUpdate.weightAuditResult = 'ANOMALY';
      orderUpdate.frozenAt = new Date();
      break;
    }

    case 'DELIVERED': {
      const deliveredAt = new Date();
      orderUpdate.deliveredAt = deliveredAt;
      const windowSec = timers.getWindowSeconds();
      orderUpdate.inspectionDeadline = new Date(Date.now() + windowSec * 1000);
      await timers.scheduleInspectionTimer(order.id, windowSec);
      break;
    }

    case 'BUYER_CONFIRMED':
    case 'INSPECTION_EXPIRED': {
      await timers.cancelTimer(order.id);
      orderUpdate.releasedAt = new Date();

      // Trigger Mock Stripe Transfer
      const transfer = await mockStripe.createTransfer({
        accountId: order.seller.stripeAccountId || 'acct_mock_default',
        amountCents: order.totalCents - order.platformFeeCents,
        transferGroup: order.transferGroup,
      });
      orderUpdate.stripeTransferId = transfer.transferId;

      // Increment seller clean order count
      await prisma.user.update({
        where: { id: order.sellerId },
        data: { cleanOrderCount: { increment: 1 } },
      });
      break;
    }

    case 'DISPUTE_OPENED': {
      await timers.cancelTimer(order.id);
      orderUpdate.frozenAt = new Date();

      const reason = (payload.reason as string) || 'empty_box';
      const evidenceUrls = JSON.stringify((payload.evidenceUrls as string[]) || []);

      await prisma.dispute.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          reason,
          evidenceUrls,
          status: 'OPEN',
        },
        update: {
          reason,
          evidenceUrls,
          status: 'OPEN',
        },
      });

      await prisma.user.update({
        where: { id: order.sellerId },
        data: { disputeCount: { increment: 1 } },
      });
      break;
    }

    case 'DISPUTE_RESOLVED_REFUND': {
      if (order.stripePaymentIntentId) {
        await mockStripe.createRefund({
          paymentIntentId: order.stripePaymentIntentId,
          amountCents: order.totalCents,
        });
      }
      if (order.dispute) {
        await prisma.dispute.update({
          where: { orderId: order.id },
          data: { status: 'RESOLVED_REFUND', resolvedAt: new Date() },
        });
      }
      break;
    }

    case 'DISPUTE_RESOLVED_RELEASE': {
      const transfer = await mockStripe.createTransfer({
        accountId: order.seller.stripeAccountId || 'acct_mock_default',
        amountCents: order.totalCents - order.platformFeeCents,
        transferGroup: order.transferGroup,
      });
      orderUpdate.stripeTransferId = transfer.transferId;
      orderUpdate.releasedAt = new Date();

      if (order.dispute) {
        await prisma.dispute.update({
          where: { orderId: order.id },
          data: { status: 'RESOLVED_RELEASE', resolvedAt: new Date() },
        });
      }

      await prisma.user.update({
        where: { id: order.sellerId },
        data: { cleanOrderCount: { increment: 1 } },
      });
      break;
    }

    case 'SELLER_NEVER_SHIPPED': {
      await timers.cancelTimer(order.id);
      if (order.stripePaymentIntentId) {
        await mockStripe.createRefund({
          paymentIntentId: order.stripePaymentIntentId,
          amountCents: order.totalCents,
        });
      }
      break;
    }
  }

  // 4. Atomic Database Write (Event + Order State)
  const [updatedOrder] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: orderUpdate,
      include: {
        seller: true,
        buyer: true,
        listing: true,
        dispute: true,
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.escrowEvent.create({
      data: {
        orderId,
        eventType: event,
        payload: payloadString,
        hash,
      },
    }),
  ]);

  logger.info({ orderId, status: updatedOrder.status, event }, '[FSM] State transition committed');
  return updatedOrder;
}
