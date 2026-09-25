import { test, expect } from 'vitest';

const BASE = 'http://localhost:4000/api/v1';

test('E2E: Listings catalog endpoint', async () => {
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
  // 1. Create order
  const createRes = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  });
  expect(confirmRes.status).toBe(200);
  const confirmed = await confirmRes.json();
  expect(confirmed.status).toBe('HELD_IN_ESCROW');
  expect(confirmed.trackingNumber).toBeDefined();

  // 3. Webhook EasyPost Intake Scan Match -> IN_TRANSIT
  const intakeRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackerId: confirmed.id,
      status: 'intake_scan',
      scannedWeightG: confirmed.declaredWeightG,
    }),
  });
  expect(intakeRes.status).toBe(200);
  const intakeData = await intakeRes.json();
  expect(intakeData.auditResult).toBe('MATCH');
  expect(intakeData.order.status).toBe('IN_TRANSIT');

  // 4. Webhook EasyPost Delivery -> DELIVERED
  const deliveryRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackerId: confirmed.id,
      status: 'delivered',
    }),
  });
  expect(deliveryRes.status).toBe(200);
  const deliveryData = await deliveryRes.json();
  expect(deliveryData.status).toBe('DELIVERED');
  expect(deliveryData.order.inspectionRemainingSeconds).toBeGreaterThan(0);

  // 5. Early Release
  const releaseRes = await fetch(`${BASE}/orders/${confirmed.id}/release-early`, {
    method: 'POST',
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const created = await createRes.json();
  await fetch(`${BASE}/orders/${created.orderId}/confirm-payment`, { method: 'POST' });

  // 2. Scan with 25g (anomaly for 1200g item)
  const intakeRes = await fetch(`${BASE}/webhooks/easypost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackerId: created.orderId,
      status: 'intake_scan',
      scannedWeightG: 25,
    }),
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'weight_mismatch' }),
  });
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.scenario).toBe('weight_mismatch');
  expect(data.order.status).toBe('ESCROW_FROZEN');
});

test('E2E: Seller Dashboard & Storefront', async () => {
  const dashRes = await fetch(`${BASE}/sellers/me/dashboard`);
  expect(dashRes.status).toBe(200);
  const dash = await dashRes.json();
  expect(dash.trustTier).toBe(3);

  const sfRes = await fetch(`${BASE}/storefronts/urban_ceramics`);
  expect(sfRes.status).toBe(200);
  const sf = await sfRes.json();
  expect(sf.seller.handle).toBe('urban_ceramics');
  expect(Array.isArray(sf.listings)).toBe(true);
});

test('E2E: Idempotency-Key caching works', async () => {
  const key = `idem_${Date.now()}`;
  const res1 = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({}),
  });
  const data1 = await res1.json();

  const res2 = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({}),
  });
  const data2 = await res2.json();

  expect(data1.orderId).toBe(data2.orderId);
  expect(data1.transferGroup).toBe(data2.transferGroup);
});
