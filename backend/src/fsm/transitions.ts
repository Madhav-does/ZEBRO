export type EscrowState =
  | 'PAYMENT_PENDING'
  | 'HELD_IN_ESCROW'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FUNDS_RELEASED'
  | 'ESCROW_FROZEN'
  | 'REFUNDED'
  | 'CANCELLED';

export type EscrowEventType =
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'WEIGHT_SCAN_MATCH'
  | 'WEIGHT_SCAN_ANOMALY'
  | 'DELIVERED'
  | 'INSPECTION_EXPIRED'
  | 'BUYER_CONFIRMED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED_REFUND'
  | 'DISPUTE_RESOLVED_RELEASE'
  | 'SELLER_NEVER_SHIPPED';

export type FsmRole = 'buyer' | 'seller' | 'carrier' | 'arbitrator' | 'timer' | 'admin';

export interface TransitionRule {
  from: EscrowState | '*';
  event: EscrowEventType;
  to: EscrowState;
  description: string;
  allowedRoles: FsmRole[];
}

/**
 * Strict Allow-List Transition Table with Role-Based Access Control (RBAC)
 * Any state transition not defined in this table will throw an InvalidTransitionError.
 * Any unauthorized caller role attempting a transition will throw a ForbiddenError.
 */
export const TRANSITIONS: TransitionRule[] = [
  {
    from: 'PAYMENT_PENDING',
    event: 'PAYMENT_SUCCEEDED',
    to: 'HELD_IN_ESCROW',
    description: 'Payment succeeded, funds locked in smart vault',
    allowedRoles: ['buyer', 'carrier', 'admin'],
  },
  {
    from: 'PAYMENT_PENDING',
    event: 'PAYMENT_FAILED',
    to: 'CANCELLED',
    description: 'Payment failed, order cancelled',
    allowedRoles: ['buyer', 'carrier', 'admin'],
  },
  {
    from: 'HELD_IN_ESCROW',
    event: 'WEIGHT_SCAN_MATCH',
    to: 'IN_TRANSIT',
    description: 'Carrier counter postal scale matched declared manifest',
    allowedRoles: ['carrier', 'admin'],
  },
  {
    from: 'HELD_IN_ESCROW',
    event: 'WEIGHT_SCAN_ANOMALY',
    to: 'ESCROW_FROZEN',
    description: 'Intake weight deficit flagged, vault automatically frozen',
    allowedRoles: ['carrier', 'admin'],
  },
  {
    from: 'HELD_IN_ESCROW',
    event: 'BUYER_CONFIRMED',
    to: 'FUNDS_RELEASED',
    description: 'Buyer approved early release directly, funds disbursed to seller',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'IN_TRANSIT',
    event: 'BUYER_CONFIRMED',
    to: 'FUNDS_RELEASED',
    description: 'Buyer approved early release in transit, funds disbursed to seller',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'IN_TRANSIT',
    event: 'DELIVERED',
    to: 'DELIVERED',
    description: 'Package delivered to doorstep, 48h inspection clock started',
    allowedRoles: ['carrier', 'admin'],
  },
  {
    from: 'DELIVERED',
    event: 'INSPECTION_EXPIRED',
    to: 'FUNDS_RELEASED',
    description: 'Inspection period elapsed with 0 disputes, funds disbursed to seller',
    allowedRoles: ['timer', 'admin'],
  },
  {
    from: 'DELIVERED',
    event: 'BUYER_CONFIRMED',
    to: 'FUNDS_RELEASED',
    description: 'Buyer approved early release, funds disbursed to seller',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'DELIVERED',
    event: 'DISPUTE_OPENED',
    to: 'ESCROW_FROZEN',
    description: 'Buyer filed dispute, clock halted and vault frozen',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'IN_TRANSIT',
    event: 'DISPUTE_OPENED',
    to: 'ESCROW_FROZEN',
    description: 'Dispute filed in transit, vault frozen',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'ESCROW_FROZEN',
    event: 'DISPUTE_OPENED',
    to: 'ESCROW_FROZEN',
    description: 'Formal dispute and evidence attached to already frozen escrow',
    allowedRoles: ['buyer', 'admin'],
  },
  {
    from: 'ESCROW_FROZEN',
    event: 'DISPUTE_RESOLVED_REFUND',
    to: 'REFUNDED',
    description: 'Arbitrator awarded full refund to buyer',
    allowedRoles: ['arbitrator', 'admin'],
  },
  {
    from: 'ESCROW_FROZEN',
    event: 'DISPUTE_RESOLVED_RELEASE',
    to: 'FUNDS_RELEASED',
    description: 'Arbitrator confirmed seller compliance, funds released',
    allowedRoles: ['arbitrator', 'admin'],
  },
  {
    from: '*',
    event: 'SELLER_NEVER_SHIPPED',
    to: 'REFUNDED',
    description: 'Seller exceeded shipping SLA deadline, funds auto-refunded to buyer',
    allowedRoles: ['timer', 'buyer', 'admin'],
  },
];

export function findTransitionRule(currentState: EscrowState, event: EscrowEventType): TransitionRule | null {
  const match = TRANSITIONS.find(
    (t) => (t.from === currentState || t.from === '*') && t.event === event
  );
  return match ?? null;
}

export function findNextState(currentState: EscrowState, event: EscrowEventType): EscrowState | null {
  const rule = findTransitionRule(currentState, event);
  return rule ? rule.to : null;
}
