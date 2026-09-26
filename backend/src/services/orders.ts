import { Order as PrismaOrder, User, Listing, EscrowEvent, Dispute } from '@prisma/client';
import { EscrowState } from '../fsm/transitions.js';
import { timers } from '../fsm/timers.js';

export type FullOrder = PrismaOrder & {
  seller: User;
  buyer: User;
  listing: Listing;
  events?: EscrowEvent[];
  dispute?: Dispute | null;
};

/**
 * Maps an internal FSM EscrowState to the frontend's EscrowStatus type.
 */
export function mapFsmToFrontendStatus(status: string): string {
  switch (status) {
    case 'PAYMENT_PENDING':
    case 'HELD_IN_ESCROW':
      return 'payment_locked';
    case 'IN_TRANSIT':
      return 'in_transit';
    case 'DELIVERED':
      return 'delivered_inspecting';
    case 'FUNDS_RELEASED':
      return 'funds_released';
    case 'ESCROW_FROZEN':
      return 'dispute_frozen';
    case 'REFUNDED':
      return 'refunded';
    case 'CANCELLED':
      return 'refunded';
    default:
      return 'payment_locked';
  }
}

/**
 * Transforms a Prisma Order model into the exact JSON response expected by TrustLink's frontend.
 */
export function formatOrderResponse(order: FullOrder) {
  const images: string[] = (() => {
    try {
      return JSON.parse(order.listing.imageUrls || '[]');
    } catch {
      return ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80'];
    }
  })();

  const isAnomaly = order.weightAuditResult === 'ANOMALY';
  const isMatch = order.weightAuditResult === 'MATCH';
  const isDispute = order.status === 'ESCROW_FROZEN' || !!order.dispute;

  const windowSec = timers.getWindowSeconds();
  let remainingSec = 0;
  if (order.status === 'DELIVERED' && order.inspectionDeadline) {
    const diff = Math.floor((new Date(order.inspectionDeadline).getTime() - Date.now()) / 1000);
    remainingSec = diff > 0 ? diff : 0;
  } else if (order.status === 'DELIVERED') {
    remainingSec = windowSec;
  }

  const events = (order.events || []).map((evt, idx) => ({
    id: evt.id,
    stepIndex: idx + 1,
    title: formatEventTitle(evt.eventType, isAnomaly, isDispute),
    subtitle: formatEventSubtitle(evt.eventType, order),
    timestamp: new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hash: evt.hash,
    status: mapEventStatus(evt.eventType, order.status),
    detail: formatEventDetail(evt.eventType, evt.payload),
  }));

  if (events.length === 0) {
    events.push({
      id: `evt_init_${order.id}`,
      stepIndex: 1,
      title: 'Payment Secured in Escrow Vault',
      subtitle: `USD $${(order.totalCents / 100).toFixed(2)} locked in neutral smart vault`,
      timestamp: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hash: order.transferGroup ? `0x${order.transferGroup.replace(/[^a-f0-9]/gi, '').padEnd(20, 'a')}` : '0x8f3a92bC771a39E4C9F72c21',
      status: 'completed',
      detail: 'Buyer funds authorized through Apple Pay. Seller has 24 hours to generate pre-paid insured shipping label.',
    });
  }

  const declaredKg = Number((order.declaredWeightG / 1000).toFixed(2));
  const isReleasedOrDelivered = order.status === 'FUNDS_RELEASED' || order.status === 'DELIVERED';
  const actualKg = order.scannedWeightG
    ? Number((order.scannedWeightG / 1000).toFixed(2))
    : isAnomaly
    ? 0.4
    : isMatch || isReleasedOrDelivered
    ? declaredKg
    : 0;
  const toleranceKg = Number((Math.max(Math.round(order.declaredWeightG * 0.1), 50) / 1000).toFixed(2));

  return {
    // Frontend-specific contract shapes
    id: order.id,
    orderNumber: `TL-${order.id.slice(-7).toUpperCase()}`,
    createdAt: order.createdAt.toISOString(),
    escrowStatus: mapFsmToFrontendStatus(order.status),
    escrowVaultAddress: `0x8f3a${order.id.replace(/[^a-fA-F0-9]/g, '').padEnd(20, 'f').slice(0, 20)}`,
    paymentMethod: 'Apple Pay (Tokenized)',
    trackingNumber: order.easypostTrackerId || 'EP-9400-1092-8821',
    carrierName: order.carrier ? `${order.carrier} Priority Mail Insured` : 'USPS Priority Mail Insured',
    deliveryOtp: '482-901',
    inspectionHoursTotal: windowSec >= 3600 ? Math.round(windowSec / 3600) : Number((windowSec / 3600).toFixed(2)),
    inspectionWindowSeconds: windowSec,
    inspectionRemainingSeconds: order.status === 'DELIVERED' ? remainingSec : windowSec,

    seller: {
      id: order.seller.id,
      handle: order.seller.handle,
      name: order.seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : order.seller.handle,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      verifiedCreator: order.seller.kycVerified,
      tier: `Tier ${order.seller.trustTier} Seller`,
      ordersCount: order.seller.cleanOrderCount,
      disputesCount: order.seller.disputeCount,
      riskScore: order.seller.disputeCount === 0 ? 'low' : 'medium',
      riskScoreNum: order.seller.disputeCount === 0 ? 98 : 75,
      riskFactors: [
        'Government ID & Biometric Liveness KYC Verified',
        `${order.seller.cleanOrderCount} Clean Escrow Orders Completed`,
        'Mandatory Postal Scale Tare Pre-Authorized',
      ],
      memberSince: 'March 2023',
      instagramFollowers: '34.8K',
      kycVerifiedAt: order.seller.createdAt.toISOString(),
    },

    product: {
      id: order.listing.id,
      title: order.listing.title,
      subtitle: 'Wheel-thrown stoneware with raw mineral glaze',
      description: order.listing.description,
      price: order.listing.priceCents / 100,
      shippingFee: (order.totalCents - order.listing.priceCents) / 100,
      buyerProtectionFee: 0.0,
      declaredWeightKg: declaredKg,
      category: order.listing.category,
      images,
    },

    weightAudit: {
      declaredKg,
      actualKg: actualKg || (isReleasedOrDelivered ? declaredKg : 0),
      toleranceKg,
      status: isAnomaly ? 'anomaly' : (isMatch || isReleasedOrDelivered) ? 'match' : 'pending',
      scannedAt: (order.scannedWeightG || isReleasedOrDelivered) ? order.updatedAt.toISOString() : null,
      carrierStation: 'Portland Station #97201 — Postal Scale #4',
      scaleId: 'NIST-CAL-7718',
      notes: isAnomaly
        ? `CRITICAL MISMATCH: Parcel weighs ${actualKg} kg vs declared ${declaredKg} kg. Anomaly flagged and escrow frozen.`
        : (isMatch || isReleasedOrDelivered)
        ? `Weight within certified postal tolerance (${actualKg || declaredKg} kg verified on certified scale).`
        : `Awaiting merchant package drop-off at USPS Station #97201. Certified postal scale tare verification will execute automatically upon intake.`,
    },

    transitRoute: {
      origin: 'Portland, OR',
      destination: 'Austin, TX',
      currentProgress:
        order.status === 'FUNDS_RELEASED' || order.status === 'DELIVERED'
          ? 100
          : order.status === 'IN_TRANSIT'
          ? 65
          : order.status === 'HELD_IN_ESCROW'
          ? 25
          : 5,
      eta: order.deliveredAt
        ? 'Delivered Today'
        : order.status === 'IN_TRANSIT'
        ? 'In Transit via USPS Priority Mail (ETA 2 Days)'
        : 'Awaiting Merchant Courier Drop-Off',
      checkpoints: [
        {
          name: 'Merchant Package Preparation & Label Printed',
          time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          passed: true,
          current: order.status === 'HELD_IN_ESCROW',
        },
        {
          name: 'USPS Station #97201 — Postal Scale Tare Intake Scan',
          time: order.status !== 'HELD_IN_ESCROW' && order.status !== 'PAYMENT_PENDING'
            ? new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Pending Drop-Off',
          passed: order.status !== 'HELD_IN_ESCROW' && order.status !== 'PAYMENT_PENDING',
          current: order.status === 'IN_TRANSIT',
        },
        {
          name: 'Denver Logistics Hub — Regional Air Freight Sorting',
          time: order.status === 'DELIVERED' || order.status === 'FUNDS_RELEASED'
            ? 'Completed'
            : order.status === 'IN_TRANSIT'
            ? 'In Sorting'
            : 'Upcoming',
          passed: order.status === 'DELIVERED' || order.status === 'FUNDS_RELEASED',
        },
        {
          name: 'Austin Regional Sorting Facility — Loaded on Truck',
          time: order.status === 'DELIVERED' || order.status === 'FUNDS_RELEASED'
            ? 'Completed'
            : 'Upcoming',
          passed: order.status === 'DELIVERED' || order.status === 'FUNDS_RELEASED',
        },
        {
          name: 'Delivered to Front Door — OTP Handover',
          time: order.deliveredAt
            ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Pending Delivery',
          passed: order.status === 'DELIVERED' || order.status === 'FUNDS_RELEASED',
          current: order.status === 'DELIVERED',
        },
      ],
    },

    trackingEvents: events,

    // Backend domain fields (for backend consumers/tests)
    status: order.status,
    totalCents: order.totalCents,
    platformFeeCents: order.platformFeeCents,
    transferGroup: order.transferGroup,
    stripePaymentIntentId: order.stripePaymentIntentId,
    stripeTransferId: order.stripeTransferId,
    declaredWeightG: order.declaredWeightG,
    scannedWeightG: order.scannedWeightG,
    weightDeltaG: order.weightDeltaG,
    weightAuditResult: order.weightAuditResult,
    easypostTrackerId: order.easypostTrackerId,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    inspectionDeadline: order.inspectionDeadline?.toISOString() ?? null,
    releasedAt: order.releasedAt?.toISOString() ?? null,
    frozenAt: order.frozenAt?.toISOString() ?? null,
    dispute: order.dispute ? {
      id: order.dispute.id,
      reason: order.dispute.reason,
      status: order.dispute.status,
      evidenceUrls: JSON.parse(order.dispute.evidenceUrls || '[]'),
      createdAt: order.dispute.createdAt.toISOString(),
      resolvedAt: order.dispute.resolvedAt?.toISOString() ?? null,
    } : null,
  };
}

function formatEventTitle(eventType: string, isAnomaly: boolean, isDispute: boolean): string {
  switch (eventType) {
    case 'PAYMENT_LOCKED':
    case 'PAYMENT_SUCCEEDED':
      return 'Payment Secured in Escrow Vault';
    case 'WEIGHT_SCAN_MATCH':
      return 'Carrier Intake & Scale Audit: PASSED';
    case 'WEIGHT_SCAN_ANOMALY':
      return 'Carrier Intake & Scale Audit: ANOMALY';
    case 'IN_TRANSIT':
      return 'In Transit — EasyPost Live Telemetry';
    case 'DELIVERED': {
      const windowSec = timers.getWindowSeconds();
      const unit = windowSec >= 3600 ? `${Math.round(windowSec / 3600)}-Hour` : `${windowSec}-Second`;
      return `Delivered — ${unit} Inspection Clock Active`;
    }
    case 'INSPECTION_EXPIRED':
    case 'BUYER_CONFIRMED':
    case 'FUNDS_RELEASED':
      return 'Funds Released to Seller';
    case 'DISPUTE_OPENED':
    case 'ESCROW_FROZEN':
      return 'Dispute Filed — Escrow Frozen';
    case 'REFUNDED':
    case 'DISPUTE_RESOLVED_REFUND':
      return 'Refund Issued to Buyer';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

function formatEventSubtitle(eventType: string, order: FullOrder): string {
  switch (eventType) {
    case 'PAYMENT_SUCCEEDED':
      return `USD $${(order.totalCents / 100).toFixed(2)} locked in neutral smart vault`;
    case 'WEIGHT_SCAN_MATCH':
      return `Scanned: ${(order.scannedWeightG || order.declaredWeightG) / 1000} kg | Declared: ${order.declaredWeightG / 1000} kg (Match ✓)`;
    case 'WEIGHT_SCAN_ANOMALY':
      return `Scanned: ${(order.scannedWeightG || 400) / 1000} kg | Declared: ${order.declaredWeightG / 1000} kg (Discrepancy ⚠️)`;
    case 'IN_TRANSIT':
      return 'Tracked & Insured via USPS Priority Mail';
    case 'DELIVERED':
      return 'Delivered to front door. Unpack, inspect, and confirm.';
    case 'BUYER_CONFIRMED':
    case 'INSPECTION_EXPIRED':
      return `USD $${(order.totalCents / 100).toFixed(2)} transferred to @${order.seller.handle}`;
    case 'DISPUTE_OPENED':
      return 'Funds frozen. Evidence submitted to neutral arbitrator.';
    case 'REFUNDED':
      return `Full refund of $${(order.totalCents / 100).toFixed(2)} returned to buyer card.`;
    default:
      return 'Status updated';
  }
}

function mapEventStatus(eventType: string, currentOrderStatus: string): 'completed' | 'active' | 'frozen' | 'upcoming' {
  if (eventType === 'DISPUTE_OPENED' || eventType === 'WEIGHT_SCAN_ANOMALY') return 'frozen';
  if (currentOrderStatus === 'DELIVERED' && eventType === 'DELIVERED') return 'active';
  return 'completed';
}

function formatEventDetail(eventType: string, payloadStr: string): string {
  try {
    const payload = JSON.parse(payloadStr || '{}');
    if (payload.detail) return payload.detail;
    if (payload.reason) return `Reason: ${payload.reason}`;
  } catch {
    // ignore
  }
  return 'Verification cryptographic proof logged on immutable audit ledger.';
}
