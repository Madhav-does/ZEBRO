export interface SellerTrustInput {
  kycVerified: boolean;
  cleanOrderCount: number;
  disputeCount: number;
  accountAgeDays: number;
}

export interface SellerTrustResult {
  tier: 1 | 2 | 3;
  reasons: string[];
}

/**
 * Deterministic Seller Trust Tier Calculation
 * No ML/probabilistic heuristics - completely auditable and explainable.
 */
export function computeTrustTier(seller: {
  kycVerified: boolean;
  cleanOrderCount: number;
  disputeCount: number;
  accountAgeDays: number;
}): SellerTrustResult {
  const totalOrders = seller.cleanOrderCount + seller.disputeCount;
  const disputeRate = totalOrders > 0 ? (seller.disputeCount / totalOrders) * 100 : 0;
  const reasons: string[] = [];

  if (seller.kycVerified) {
    reasons.push('Government ID & Biometric Liveness KYC Verified');
  } else {
    reasons.push('Identity verification pending');
  }

  if (seller.disputeCount === 0) {
    reasons.push(`0 Chargebacks or Unresolved Disputes Across ${seller.cleanOrderCount} Orders`);
  } else {
    reasons.push(`${seller.disputeCount} dispute(s) recorded (${disputeRate.toFixed(1)}% dispute rate)`);
  }

  reasons.push(`Account age: ${seller.accountAgeDays} days`);

  // Tier 3 Evaluation
  if (
    seller.kycVerified &&
    seller.cleanOrderCount >= 50 &&
    seller.disputeCount === 0 &&
    disputeRate < 2 &&
    seller.accountAgeDays >= 30
  ) {
    reasons.unshift('Tier 3: Elite Verified Merchant — Instant Escrow Payout Authorized');
    return { tier: 3, reasons };
  }

  // Tier 2 Evaluation
  if (seller.kycVerified && seller.cleanOrderCount >= 20 && disputeRate < 5) {
    reasons.unshift('Tier 2: Established Seller — Standard 48h Inspection Window');
    return { tier: 2, reasons };
  }

  // Tier 1 Default
  reasons.unshift('Tier 1: Emerging Seller — Strict Escrow & Tare Auditing Enforced');
  return { tier: 1, reasons };
}
