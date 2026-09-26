import { Seller, Product, Order, WeightAudit, DisputePayload, Dispute } from '@/types';

/**
 * TrustLink API Surface
 * 
 * BACKEND-READY SPECIFICATION:
 * All frontend interactions communicate exclusively through this interface.
 * Real backend endpoints are mapped below for seamless phase 2 migration.
 */
export interface ApiClient {
  /**
   * GET /api/v1/sellers/:idOrHandle
   * Fetches public seller profile, trust telemetry, and fraud risk score factors.
   */
  getSeller(idOrHandle: string): Promise<Seller>;

  /**
   * GET /api/v1/products/:id
   * Fetches product specifications, declared weight, and image carousel.
   */
  getProduct(id: string): Promise<Product>;

  /**
   * GET /api/v1/orders/:id
   * Fetches real-time escrow order state, chain-of-custody ledger, and inspection clock.
   */
  getOrder(id: string): Promise<Order>;

  /**
   * POST /api/v1/orders/checkout
   * Initiates guest checkout, locks funds in deterministic escrow vault address.
   */
  createOrder(payload: {
    productId: string;
    shippingAddress: string;
    paymentMethod: string;
  }): Promise<Order>;

  /**
   * POST /api/v1/escrow/:orderId/release
   * Buyer approves early settlement or inspection expires; releases funds from vault to seller.
   */
  releaseEscrow(orderId: string): Promise<{
    success: boolean;
    txHash: string;
    releasedAt: string;
  }>;

  /**
   * POST /api/v1/escrow/:orderId/dispute
   * Freezes neutral escrow vault, logs photographic evidence, triggers arbitration SLA.
   */
  fileDispute(payload: DisputePayload): Promise<Dispute>;

  /**
   * GET /api/v1/escrow/:orderId/weight-audit
   * Real-time scale scan webhook data received from postal carrier counter.
   */
  getWeightAudit(orderId: string): Promise<WeightAudit>;

  /* =========================================================================
   * PHASE 2: INSTAGRAM-EMBEDDED MARKETPLACE SHELL ENDPOINTS
   * ========================================================================= */

  /**
   * GET /api/v1/listings?category=&q=
   * Fetches marketplace product listings with category filtering and keyword search.
   */
  getListings(category?: string, query?: string): Promise<import('@/types').Listing[]>;

  /**
   * GET /api/v1/marketplace/recently-protected
   * Fetches live ticker feed of purchases settled through TrustLink escrow.
   */
  getRecentlyProtected(): Promise<import('@/types').RecentlyProtectedItem[]>;

  /**
   * GET /api/v1/marketplace/fraud-stats
   * Aggregated platform defense metrics: disputes frozen, audits passed, volume protected.
   */
  getPlatformFraudStats(): Promise<import('@/types').PlatformFraudStats>;

  /**
   * GET /api/v1/storefronts/:sellerId
   * Public IG-style storefront profile, seller trust badges, and active catalog.
   */
  getStorefront(sellerId: string): Promise<import('@/types').Storefront>;

  /**
   * GET /api/v1/sellers/:sellerId/payouts
   * Payout ledger, escrowed balances, and released transactions.
   */
  getPayouts(sellerId: string): Promise<import('@/types').Payout>;

  /**
   * GET /api/v1/sellers/:sellerId/analytics
   * Store views, conversion, escrow pass rates, and sparkline trends.
   */
  getSellerAnalytics(sellerId: string): Promise<import('@/types').SellerAnalytics>;

  /**
   * GET /api/v1/inbox/threads
   * Buyer/seller/support conversation threads with status chips.
   */
  getThreads(): Promise<import('@/types').Thread[]>;

  /**
   * POST /api/v1/listings
   * Creates a new escrow-protected product listing with declared parcel weight.
   */
  createListing(payload: Partial<import('@/types').Listing>): Promise<import('@/types').Listing>;

  /**
   * GET /api/v1/orders/active
   * Retrieves active orders currently in escrow.
   */
  getActiveOrders(): Promise<Order[]>;

  /**
   * GET /api/v1/orders/past
   * Retrieves settled, refunded, or historical orders.
   */
  getPastOrders(): Promise<Order[]>;

  /**
   * POST /api/v1/demo/scenario
   * Simulates full-stack escrow state transitions for hackathon evaluation.
   */
  triggerDemoScenario(scenario: import('@/types').DemoScenario, orderId?: string): Promise<any>;
}
