# TrustLink Backend (Phase 3) 🛡️
> **Institutional Escrow & Hardware Postal Scale Anti-Fraud State Machine**  
> *Fastify + Prisma (SQLite) + FSM Allow-List Engine + Mock Telemetry (Stripe / EasyPost / KYC)*

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & populate demo data
npx prisma db push && npm run seed

# 3. Boot backend service on port 4000
npm run dev
```

The service will boot on `http://localhost:4000` with API routes mounted under `/api/v1/` and live CORS enabled for `http://localhost:5173`.

---

## 🔌 How to Wire the Frontend (Zero Refactoring)

The frontend's decoupled architecture allows an immediate switch to this real backend by toggling a single configuration file:

1. Open `src/api/index.ts` in the frontend:
```typescript
export const ENV = {
  USE_MOCK_API: false, // <-- Change from true to false!
  API_BASE_URL: 'http://localhost:4000/api/v1',
};
```
2. Or create a `.env` in the frontend root:
```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:4000/api/v1
```
3. Restart frontend dev server (`npm run dev`). Every query, mutation, order creation, tare audit, and dispute will hit this Fastify backend seamlessly!

---

## 🏛️ What's Real vs. What's Mocked

| Layer | Implementation | Status |
| :--- | :--- | :--- |
| **Escrow State Machine (FSM)** | Strict transition allow-list with typed errors | **100% Real** |
| **Chain-of-Custody Ledger** | Append-only SHA-256 tamper-evident hash chaining | **100% Real** |
| **Database** | SQLite via Prisma ORM with relational integrity | **100% Real** |
| **Idempotency** | DB-persisted `Idempotency-Key` headers with 24h TTL | **100% Real** |
| **Inspection Timers** | DB-backed `PendingTimer` with background poller loop | **100% Real** |
| **Weight Audit Algorithm** | Pure mathematical tare delta calculation (10% or 50g) | **100% Real** |
| **Seller Trust Scoring** | Deterministic explainable rules engine | **100% Real** |
| **Stripe Payments** | In-memory tokenized charge, transfer, & refund generator | *Mocked* (realistic 200–500ms latency) |
| **EasyPost Carrier** | Postal counter scale scanner & tracking milestones | *Mocked* (NIST scale simulations) |
| **Identity Verification** | Biometric KYC liveness verification check | *Mocked* |

---

## 🔄 FSM State Transition Diagram

```
                 [Order Created]
                        │
                        ▼
                PAYMENT_PENDING
                  │         │
[PAYMENT_FAILED]  │         │  [PAYMENT_SUCCEEDED]
                  ▼         ▼
              CANCELLED  HELD_IN_ESCROW (Smart Vault Locked)
                            │               │
      [WEIGHT_SCAN_ANOMALY] │               │ [WEIGHT_SCAN_MATCH]
                            ▼               ▼
                      ESCROW_FROZEN     IN_TRANSIT (Carrier Telemetry)
                        ▲     │             │
        [DISPUTE_OPENED]│     │             │ [DELIVERED]
                        │     ▼             ▼
                        └── DELIVERED (48h Inspection Window)
                              │
     [INSPECTION_EXPIRED] /   │
     [BUYER_CONFIRMED]        │
                              ▼
                        FUNDS_RELEASED (Disbursed to Seller)
```

### Transition Table (Strict Allow-List)

| Current State | Event | Target State | Side Effect |
| :--- | :--- | :--- | :--- |
| `PAYMENT_PENDING` | `PAYMENT_SUCCEEDED` | `HELD_IN_ESCROW` | Creates EasyPost mock tracker, generates vault address |
| `PAYMENT_PENDING` | `PAYMENT_FAILED` | `CANCELLED` | Logs cancellation event |
| `HELD_IN_ESCROW` | `WEIGHT_SCAN_MATCH` | `IN_TRANSIT` | Records postal tare match, verifies package mass |
| `HELD_IN_ESCROW` | `WEIGHT_SCAN_ANOMALY`| `ESCROW_FROZEN` | Auto-freezes vault due to empty box deficit (<50g) |
| `IN_TRANSIT` | `DELIVERED` | `DELIVERED` | Schedules 48h (or 30s demo) inspection timer |
| `DELIVERED` | `INSPECTION_EXPIRED` | `FUNDS_RELEASED` | Disburses Stripe transfer, increments seller clean count |
| `DELIVERED` | `BUYER_CONFIRMED` | `FUNDS_RELEASED` | Cancels timer, disburses Stripe transfer |
| `DELIVERED` | `DISPUTE_OPENED` | `ESCROW_FROZEN` | Cancels timer, creates Dispute record, freezes vault |
| `ESCROW_FROZEN` | `DISPUTE_RESOLVED_REFUND` | `REFUNDED` | Issues Stripe refund back to buyer |
| `ESCROW_FROZEN` | `DISPUTE_RESOLVED_RELEASE`| `FUNDS_RELEASED` | Disburses Stripe transfer to seller |
| `*` | `SELLER_NEVER_SHIPPED` | `REFUNDED` | SLA auto-refund |

---

## 📡 API Endpoints Reference

All endpoints accept mutations with optional `Idempotency-Key: <unique-uuid>` and `X-User-Id: <user-id>`.

### 1. Listings
- `GET /api/v1/listings?category=&q=&tier=&verifiedOnly=`
  - Returns marketplace catalog with filtering and search.
- `GET /api/v1/listings/:id`
  - Returns single listing details.
- `POST /api/v1/listings`
  - Body: `{ title, price, declaredWeightKg, category, images, description }`
  - Publishes a new escrow-protected item.

### 2. Orders & Escrow
- `POST /api/v1/orders` (or `POST /api/v1/orders/checkout`)
  - Body: `{ listingId, shippingAddress, paymentMethod }`
  - Creates order in `PAYMENT_PENDING` with mock Stripe clientSecret.
- `GET /api/v1/orders/:id`
  - Returns complete order with ledger events and inspection clock.
- `GET /api/v1/orders/active`
  - Returns active orders in escrow for buyer.
- `GET /api/v1/orders/past`
  - Returns settled or refunded orders.
- `POST /api/v1/orders/:id/confirm-payment`
  - Advances order to `HELD_IN_ESCROW` (simulates successful card/Apple Pay charge).
- `POST /api/v1/orders/:id/release-early` (or `POST /api/v1/escrow/:orderId/release`)
  - Buyer early approval: transitions to `FUNDS_RELEASED`.
- `POST /api/v1/orders/:id/dispute` (or `POST /api/v1/escrow/:orderId/dispute`)
  - Body: `{ reason, description, evidenceUrls }`
  - Freezes vault: transitions to `ESCROW_FROZEN`.
- `POST /api/v1/orders/:id/seller-respond`
  - Body: `{ evidenceUrls: [...] }`
  - Submits seller counter-evidence (e.g. intake scale drop-off receipt).
- `GET /api/v1/escrow/:orderId/weight-audit`
  - Returns raw NIST scale audit data and tolerance boundaries.

### 3. Sellers & Storefronts
- `GET /api/v1/sellers/me/dashboard`
  - Returns available balance, locked in escrow, trust tier, and progress.
- `GET /api/v1/sellers/:idOrHandle`
  - Public profile with verified KYC, trust factors, and dispute history.
- `GET /api/v1/storefronts/:sellerId` (or `/sellers/me/storefront`)
  - Storefront catalog and seller credentials.
- `GET /api/v1/sellers/:sellerId/payouts`
  - Escrow transaction ledger with individual settlement status chips.
- `GET /api/v1/sellers/:sellerId/analytics`
  - Views, conversion rate, escrow success rate, and volume sparkline.

### 4. Webhooks (Simulated Carriers & Gateways)
- `POST /api/v1/webhooks/stripe`
  - Simulates payment intent events.
- `POST /api/v1/webhooks/easypost`
  - Body: `{ trackerId, status: "intake_scan", scannedWeightG: 1250 }`
  - Simulates postal counter scale scans.

### 5. Demo Controller
- `POST /api/v1/demo/scenario`
  - Body: `{ scenario: "perfect_delivery" | "weight_mismatch" | "dispute_filed", orderId? }`
  - Drives mock integrations through the complete scenario with realistic step-by-step delays.
- `GET /api/v1/demo/orders`
  - Overview of all seeded orders in the system.

---

## 🎬 Demo Scenarios Walkthrough

### Scenario 1: Perfect Delivery
```bash
curl -X POST http://localhost:4000/api/v1/demo/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "perfect_delivery"}'
```
1. Payment secured in escrow vault ($85.00).
2. Postal intake scan confirms 1,250g vs 1,200g declared (+4.1% packing variance).
3. Delivered to doorstep: 30-second inspection clock starts.
4. After 30 seconds, timer poller automatically disburses funds to seller.

### Scenario 2: Weight Anomaly (Empty Box Scam Stopped)
```bash
curl -X POST http://localhost:4000/api/v1/demo/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "weight_mismatch"}'
```
1. Seller drops off package at USPS counter.
2. Scale records **400g vs 1,200g declared (-66.7% deficit)**.
3. System automatically halts transit and **freezes the escrow vault**.

---

## 🚢 Production Migration Path

Migrating TrustLink to production requires swapping the in-memory mock adapters for live third-party SDKs: (1) Replace `src/mocks/stripe.ts` with `stripe` npm package using Stripe Connect Custom/Express accounts and Webhook signature verification (`stripe.webhooks.constructEvent`); (2) Replace `src/mocks/easypost.ts` with `@easypost/api` listening for `tracker.updated` webhooks containing certified carrier scale measurements; (3) Replace `src/mocks/kyc.ts` with Persona or Stripe Identity embedded verification; (4) Migrate SQLite to PostgreSQL on AWS RDS or Supabase by updating the `provider = "postgresql"` in `prisma/schema.prisma`; (5) Offload `PendingTimer` to Redis/BullMQ with Celery workers for multi-node horizontally scaled inspection clock triggers under FinCEN/SOC2 regulatory compliance.
