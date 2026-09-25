import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/db.js';
import { logger } from './lib/logger.js';
import { transition } from './fsm/engine.js';
import { timers } from './fsm/timers.js';

export async function seed() {
  logger.info('[Seed] Seeding database with demo marketplace users, listings, and orders...');

  // Clean existing data
  await prisma.pendingTimer.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.escrowEvent.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});

  // 1. Create Sellers
  const urbanCeramics = await prisma.user.create({
    data: {
      email: 'maya@urbanceramics.studio',
      handle: 'urban_ceramics',
      role: 'seller',
      kycVerified: true,
      trustTier: 2,
      cleanOrderCount: 48,
      disputeCount: 0,
      stripeAccountId: 'acct_mock_urban_ceramics',
    },
  });

  const clayStudio = await prisma.user.create({
    data: {
      email: 'hello@claystudio.art',
      handle: 'clay_studio',
      role: 'seller',
      kycVerified: false,
      trustTier: 1,
      cleanOrderCount: 4,
      disputeCount: 1,
      stripeAccountId: 'acct_mock_clay_studio',
    },
  });

  const modernMinimal = await prisma.user.create({
    data: {
      email: 'curator@modernminimal.design',
      handle: 'modern_minimal',
      role: 'seller',
      kycVerified: true,
      trustTier: 3,
      cleanOrderCount: 84,
      disputeCount: 0,
      stripeAccountId: 'acct_mock_modern_minimal',
    },
  });

  // 2. Create Buyers
  const buyerAlex = await prisma.user.create({
    data: {
      email: 'alex.k@gmail.com',
      handle: 'alex_k',
      role: 'buyer',
      kycVerified: true,
      trustTier: 1,
    },
  });

  const buyerSarah = await prisma.user.create({
    data: {
      email: 'sarah.m@gmail.com',
      handle: 'sarah_m',
      role: 'buyer',
      kycVerified: true,
      trustTier: 1,
    },
  });

  // 3. Create 6 Listings (one MUST be 1.2kg matte white vase at $85.00)
  const listVase = await prisma.listing.create({
    data: {
      id: 'prod_ceramic_vase_01',
      sellerId: urbanCeramics.id,
      title: 'Handcrafted Ceramic Vase — Matte White',
      description: 'Wheel-thrown stoneware with raw mineral glaze. Fired to cone 10 reduction in our Portland studio. Non-porous, waterproof organic base.',
      priceCents: 8500, // $85.00
      declaredWeightG: 1200, // 1.20 kg
      category: 'Ceramics',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
      ]),
      status: 'active',
    },
  });

  const listJacket = await prisma.listing.create({
    data: {
      id: 'list_jacket_02',
      sellerId: modernMinimal.id,
      title: 'Washed Canvas Workwear Chore Jacket',
      description: '14oz Japanese duck canvas with brass hardware. Triple-needle stitched chore coat tailored in Los Angeles.',
      priceCents: 16500, // $165.00
      declaredWeightG: 950, // 0.95 kg
      category: 'Apparel',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      ]),
      status: 'active',
    },
  });

  const listPrint = await prisma.listing.create({
    data: {
      id: 'list_print_03',
      sellerId: clayStudio.id,
      title: 'Brutalist Concrete 04 — Limited Risograph',
      description: 'Three-color soy ink risograph capturing structural geometry in West Berlin. Edition of 50 on 280gsm Fabriano cotton paper.',
      priceCents: 4200, // $42.00
      declaredWeightG: 350, // 0.35 kg
      category: 'Prints',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      ]),
      status: 'active',
    },
  });

  const listRing = await prisma.listing.create({
    data: {
      id: 'list_ring_04',
      sellerId: modernMinimal.id,
      title: 'Hand-Carved Sterling Silver Signet Ring',
      description: 'Solid 925 silver with lost-wax raw texture. Sculpted individually by hand in Brooklyn with satin patina finish.',
      priceCents: 13000, // $130.00
      declaredWeightG: 150, // 0.15 kg
      category: 'Jewelry',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      ]),
      status: 'active',
    },
  });

  const listValet = await prisma.listing.create({
    data: {
      id: 'list_home_05',
      sellerId: urbanCeramics.id,
      title: 'Japanese Hinoki Wood Catchall Valet',
      description: 'Milled from single timber offcuts in Nagano. Beveled perimeter tray designed for EDC essentials, keys, and fountain pens.',
      priceCents: 6800, // $68.00
      declaredWeightG: 550, // 0.55 kg
      category: 'Home',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
      ]),
      status: 'active',
    },
  });

  const listDripper = await prisma.listing.create({
    data: {
      id: 'list_dripper_06',
      sellerId: urbanCeramics.id,
      title: 'Handmade Ceramic Pour-Over Dripper',
      description: 'Matte-glazed reduction stoneware designed for Kalita 185 filters. Handcrafted in Portland, OR.',
      priceCents: 4800, // $48.00
      declaredWeightG: 420, // 0.42 kg
      category: 'Ceramics',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  // 4. Create 4 Orders:
  // Order 1: in HELD_IN_ESCROW (freshly paid)
  const order1 = await prisma.order.create({
    data: {
      id: 'ord_mock_held',
      buyerId: buyerAlex.id,
      sellerId: urbanCeramics.id,
      listingId: listDripper.id,
      status: 'PAYMENT_PENDING',
      totalCents: 5400, // $54.00
      platformFeeCents: 162,
      transferGroup: 'order_held_escrow_01',
      declaredWeightG: 420,
      carrier: 'USPS',
    },
  });
  await transition(order1.id, 'PAYMENT_SUCCEEDED', { method: 'Apple Pay' });

  // Order 2: in IN_TRANSIT (weight matched, awaiting delivery)
  const order2 = await prisma.order.create({
    data: {
      id: 'ord_mock_transit',
      buyerId: buyerSarah.id,
      sellerId: modernMinimal.id,
      listingId: listJacket.id,
      status: 'PAYMENT_PENDING',
      totalCents: 17500,
      platformFeeCents: 525,
      transferGroup: 'order_in_transit_02',
      declaredWeightG: 950,
      carrier: 'USPS',
    },
  });
  await transition(order2.id, 'PAYMENT_SUCCEEDED');
  await transition(order2.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 960 });

  // Order 3: in DELIVERED (inspection clock ticking) - match frontend ID ord_tl_8829104!
  const order3 = await prisma.order.create({
    data: {
      id: 'ord_tl_8829104',
      buyerId: buyerAlex.id,
      sellerId: urbanCeramics.id,
      listingId: listVase.id,
      status: 'PAYMENT_PENDING',
      totalCents: 8500,
      platformFeeCents: 255,
      transferGroup: 'order_delivered_tl_8829104',
      declaredWeightG: 1200,
      carrier: 'USPS',
    },
  });
  await transition(order3.id, 'PAYMENT_SUCCEEDED');
  await transition(order3.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 1250 });
  await transition(order3.id, 'DELIVERED', { deliveredAt: new Date().toISOString() });

  // Order 4: in ESCROW_FROZEN with Dispute
  const order4 = await prisma.order.create({
    data: {
      id: 'ord_mock_frozen',
      buyerId: buyerSarah.id,
      sellerId: clayStudio.id,
      listingId: listPrint.id,
      status: 'PAYMENT_PENDING',
      totalCents: 4800,
      platformFeeCents: 144,
      transferGroup: 'order_frozen_dispute_04',
      declaredWeightG: 350,
      carrier: 'USPS',
    },
  });
  await transition(order4.id, 'PAYMENT_SUCCEEDED');
  await transition(order4.id, 'WEIGHT_SCAN_ANOMALY', { scannedWeightG: 25 });
  await transition(order4.id, 'DISPUTE_OPENED', {
    reason: 'empty_box',
    description: 'Empty envelope delivered. Certified hub scale intake reported 25g vs 350g declared.',
    evidenceUrls: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80'],
  });

  logger.info('[Seed] Database successfully seeded with 3 sellers, 2 buyers, 6 listings, and 4 test orders in distinct FSM states!');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    logger.error({ err: e }, '[Seed] Seeding failed');
    process.exit(1);
  });
