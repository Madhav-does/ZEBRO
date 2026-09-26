import { test, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import { signJwt } from '../src/lib/jwt.js';

const BASE = 'http://localhost:4000/api/v1';
const EASYPOST_SECRET = process.env.EASYPOST_WEBHOOK_SECRET || 'ep_whsec_test_secret_2026';

let buyerAuth: { Authorization: string };
let sellerAuth: { Authorization: string };
let adminAuth: { Authorization: string };

function signEasyPost(payload: unknown): string {
  const str = JSON.stringify(payload);
  return crypto.createHmac('sha256', EASYPOST_SECRET).update(str).digest('hex');
}

beforeAll(async () => {
  const buyerRes = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: 'alex_k' }),
  });
  const buyerData = await buyerRes.json();
  buyerAuth = { Authorization: `Bearer ${buyerData.token}` };

  const sellerRes = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle: 'urban_ceramics' }),
  });
  const sellerData = await sellerRes.json();
  sellerAuth = { Authorization: `Bearer ${sellerData.token}` };

  adminAuth = { Authorization: `Bearer ${signJwt({ userId: 'admin_test', role: 'admin' })}` };
});

test('E2E: Listings catalog endpoint (Public read)', async () => {
  const res = await fetch(`${BASE}/listings`);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThanOrEqual(6);
  const vase = data.find((l: any) => l.declaredWeightKg === 1.2);
  expect(vase).toBeDefined();
  expect(vase.price).toBe(85);
});

test('E2E: Order creation and payment confirmation', async () => {
  // 1. Create order with buyer auth
  const createRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buyerAuth,
    },
    body: JSON.stringify({ shippingAddress: '100 Main St, Austin, TX' }),
  });
  expect(createRes.status).toBe(201);
  const created = await createRes.json();
  expect(created.orderId).toBeDefined();
  expect(created.clientSecret).toBeDefined();
  expect(created.status).toBe('PAYMENT_PENDING');

  // 2. Confirm payment
  const confirmRes = await fetch(`${BASE}/orders/${created.orderId}/confirm-payment`, {
    method: 'POST',
    headers: {
      ...buyerAuth,
    },
  });
  expect(confirmRes.status).toBe(200);
  const confirmed = await confirmRes.json();
  expect(confirmed.status).toBe('HELD_IN_ESCROW');
  expect(confirmed.trackingNumber).toBeDefined();

  // 3. Webhook EasyPost Intake Scan Match -> IN_TRANSIT with valid HMAC signature
  const intakePayload = {
    trackerId: confirmed.id,
    status: 'intake_scan',
    scannedWeightG: confirmed.declaredWeightG,
  };
  const intakeRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-easypost-signature': signEasyPost(intakePayload),
    },
    body: JSON.stringify(intakePayload),
  });
  expect(intakeRes.status).toBe(200);
  const intakeData = await intakeRes.json();
  expect(intakeData.auditResult).toBe('MATCH');
  expect(intakeData.order.status).toBe('IN_TRANSIT');

  // 4. Webhook EasyPost Delivery -> DELIVERED with valid HMAC signature
  const deliveryPayload = {
    trackerId: confirmed.id,
    status: 'delivered',
  };
  const deliveryRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-easypost-signature': signEasyPost(deliveryPayload),
    },
    body: JSON.stringify(deliveryPayload),
  });
  expect(deliveryRes.status).toBe(200);
  const deliveryData = await deliveryRes.json();
  expect(deliveryData.status).toBe('DELIVERED');
  expect(deliveryData.order.inspectionRemainingSeconds).toBeGreaterThan(0);

  // 5. Early Release
  const releaseRes = await fetch(`${BASE}/orders/${confirmed.id}/release-early`, {
    method: 'POST',
    headers: {
      ...buyerAuth,
    },
  });
  expect(releaseRes.status).toBe(200);
  const releaseData = await releaseRes.json();
  expect(releaseData.success).toBe(true);
  expect(releaseData.order.status).toBe('FUNDS_RELEASED');
});

test('E2E: EasyPost Anomaly triggers ESCROW_FROZEN', async () => {
  // 1. Create order
  const createRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buyerAuth,
    },
    body: JSON.stringify({}),
  });
  const created = await createRes.json();
  const confirmRes = await fetch(`${BASE}/orders/${created.orderId}/confirm-payment`, {
    method: 'POST',
    headers: { ...buyerAuth },
  });
  expect(confirmRes.status).toBe(200);

  // 2. Scan with 25g (anomaly for 1200g item)
  const intakePayload = {
    trackerId: created.orderId,
    status: 'intake_scan',
    scannedWeightG: 25,
  };
  const intakeRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-easypost-signature': signEasyPost(intakePayload),
    },
    body: JSON.stringify(intakePayload),
  });
  expect(intakeRes.status).toBe(200);
  const intakeData = await intakeRes.json();
  expect(intakeData.auditResult).toBe('ANOMALY');
  expect(intakeData.order.status).toBe('ESCROW_FROZEN');
  expect(intakeData.order.weightAudit.status).toBe('anomaly');
});

test('E2E: Demo scenario runner (weight_mismatch)', async () => {
  const res = await fetch(`${BASE}/demo/scenario`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...adminAuth,
    },
    body: JSON.stringify({ scenario: 'weight_mismatch' }),
  });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.scenario).toBe('weight_mismatch');
  expect(data.order.status).toBe('ESCROW_FROZEN');
});

test('E2E: Seller Dashboard & Storefront', async () => {
  const sfRes = await fetch(`${BASE}/storefronts/urban_ceramics`);
  expect(sfRes.status).toBe(200);
  const sf = await sfRes.json();
  expect(sf.seller.handle).toBe('urban_ceramics');
  expect(Array.isArray(sf.listings)).toBe(true);

  const dashRes = await fetch(`${BASE}/sellers/me/dashboard`, {
    headers: { ...sellerAuth },
  });
  expect(dashRes.status).toBe(200);
  const dash = await dashRes.json();
  expect(dash.trustTier).toBeGreaterThanOrEqual(1);
});

test('E2E: Idempotency-Key caching works', async () => {
  const key = `idem_${Date.now()}`;
  const res1 = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
      ...buyerAuth,
    },
    body: JSON.stringify({}),
  });
  const data1 = await res1.json();

  const res2 = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
      ...buyerAuth,
    },
    body: JSON.stringify({}),
  });
  const data2 = await res2.json();

  expect(data1.orderId).toBe(data2.orderId);
  expect(data1.transferGroup).toBe(data2.transferGroup);
});
