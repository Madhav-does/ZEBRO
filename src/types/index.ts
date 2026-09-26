export type EscrowStatus = 
  | 'payment_locked'
  | 'intake_audit'
  | 'in_transit'
  | 'delivered_inspecting'
  | 'funds_released'
  | 'dispute_frozen'
  | 'refunded';

export interface Seller {
  id: string;
  handle: string;
  name: string;
  avatarUrl: string;
  verifiedCreator: boolean;
  tier: string;
  ordersCount: number;
  disputesCount: number;
  riskScore: 'low' | 'medium' | 'high';
  riskScoreNum: number;
  riskFactors: string[];
  memberSince: string;
  instagramFollowers: string;
  kycVerifiedAt: string;
  storeName?: string;
  isIdentityVerified?: boolean;
  trustTier?: number | string;
  location?: string;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  shippingFee: number;
  buyerProtectionFee: number; // $0.00
  images: string[];
  category: string;
  declaredWeightKg: number;
}

export interface WeightAudit {
  declaredKg: number;
  actualKg: number;
  toleranceKg: number;
  status: 'match' | 'anomaly' | 'pending';
  scannedAt: string | null;
  carrierStation: string;
  scaleId: string;
  notes?: string;
  deliveryWeightKg?: number;
  deliveryStatus?: 'match' | 'anomaly' | 'pending';
  deliveryStation?: string;
  deliveryScaleId?: string;
  tamperDetected?: boolean;
  tamperLocation?: string;
}

export interface TrackingCheckpoint {
  name: string;
  time: string;
  passed: boolean;
  current?: boolean;
}

export interface TransitRoute {
  origin: string;
  destination: string;
  currentProgress: number; // 0 - 100
  eta: string;
  checkpoints: TrackingCheckpoint[];
}

export interface TrackingEvent {
  id: string;
  stepIndex: number;
  title: string;
  subtitle: string;
  timestamp: string;
  hash: string;
  status: 'completed' | 'active' | 'upcoming' | 'anomaly' | 'frozen';
  detail?: string;
  location?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  seller: Seller;
  product: Product;
  escrowStatus: EscrowStatus;
  escrowVaultAddress: string;
  paymentMethod: string;
  trackingEvents: TrackingEvent[];
  weightAudit: WeightAudit;
  inspectionHoursTotal: number;
  inspectionWindowSeconds?: number;
  inspectionRemainingSeconds: number;
  deliveryOtp: string;
  carrierName: string;
  trackingNumber: string;
  transitRoute: TransitRoute;
  dispute?: Dispute;
}

export type DisputeReason = 
  | 'fake_item' 
  | 'broken' 
  | 'wrong_item' 
  | 'empty_box' 
  | 'other';

export interface DisputePayload {
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidenceImages: string[];
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidenceImages: string[];
  filedAt: string;
  status: 'under_review' | 'arbitration_active' | 'resolved' | 'refunded';
  refundAmount: number;
}

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'ja';

export type DemoScenario = 
  | 'merchant_dropoff'
  | 'out_for_delivery'
  | 'perfect_delivery' 
  | 'weight_mismatch' 
  | 'transit_tampering'
  | 'dispute_filed'
  | 'release_funds';

export interface CheckoutFormValues {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  email: string;
}

/* =========================================================================
 * PHASE 2: INSTAGRAM-EMBEDDED MARKETPLACE SHELL DOMAIN MODELS
 * ========================================================================= */

export type ShellTab = 'home' | 'explore' | 'orders' | 'inbox' | 'profile';
export type UserRole = 'buyer' | 'seller';

export type ListingCategory =
  | 'All'
  | 'Ceramics'
  | 'Apparel'
  | 'Prints'
  | 'Jewelry'
  | 'Home'
  | 'Vintage'
  | 'Watches'
  | 'Tech'
  | 'Leather Goods';

export interface ListingComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  shippingFee: number;
  images: string[];
  category: ListingCategory;
  seller: Seller;
  declaredWeightKg: number;
  likesCount: number;
  isEscrowGuaranteed: boolean;
  createdAt: string;
  tags: string[];
  comments?: ListingComment[];
  commentsCount?: number;
}

export interface RecentlyProtectedItem {
  id: string;
  buyerHandle: string;
  buyerAvatar: string;
  sellerHandle: string;
  sellerAvatar: string;
  amount: number;
  itemTitle: string;
  itemImage: string;
  timestamp: string;
  receiptId: string;
  verifiedWeightKg: number;
  txHash: string;
}

export interface PlatformFraudStats {
  disputesFrozenToday: number;
  weightAuditsPassed: number;
  totalProtectedVolume: number;
  activeInspections: number;
  avgPassRate: number;
}

export interface Storefront {
  seller: Seller;
  bio: string;
  instagramUrl: string;
  rating: number;
  reviewsCount: number;
  activeListingsCount: number;
  listings: Listing[];
}

export interface PayoutTransaction {
  id: string;
  orderNumber: string;
  itemTitle: string;
  amount: number;
  escrowStatus: EscrowStatus;
  date: string;
  payoutStatus: 'available' | 'in_escrow' | 'released' | 'frozen';
}

export interface Payout {
  availableBalance: number;
  inEscrowBalance: number;
  releasedThisMonth: number;
  currency: string;
  transactions: PayoutTransaction[];
}

export interface SellerAnalytics {
  views: number;
  conversionRate: number;
  escrowSuccessRate: number;
  avgReleaseTimeHours: number;
  sparkline: number[];
}

export interface Thread {
  id: string;
  participant: {
    name: string;
    handle: string;
    avatarUrl: string;
    role: 'buyer' | 'seller' | 'support';
  };
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  stateChip: 'Open' | 'Resolved' | 'Escalated';
  orderId?: string;
}

