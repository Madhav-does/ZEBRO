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
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listWatch = await prisma.listing.create({
    data: {
      id: 'list_watch_07',
      sellerId: modernMinimal.id,
      title: '1974 Vintage Chronograph Watch — Panda Dial',
      description: 'Mechanical manual-wind movement, 38mm stainless steel case, domed acrylic crystal with original leather racing strap. Fully serviced.',
      priceCents: 24000, // $240.00
      declaredWeightG: 180, // 0.18 kg
      category: 'Watches',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listKeyboard = await prisma.listing.create({
    data: {
      id: 'list_keyboard_08',
      sellerId: clayStudio.id,
      title: 'Custom 65% Anodized Aluminum Keyboard',
      description: 'Gasket-mounted mechanical keyboard with brass weight, lubed Gateron Oil King linear switches, and PBT dye-sub keycaps. Heavy solid base.',
      priceCents: 28500, // $285.00
      declaredWeightG: 1450, // 1.45 kg
      category: 'Tech',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listBag = await prisma.listing.create({
    data: {
      id: 'list_bag_09',
      sellerId: modernMinimal.id,
      title: 'Italian Vegetable-Tanned Leather Crossbody',
      description: 'Full-grain Tuscan saddle leather, solid brass buckle hardware, and unlined raw interior. Will develop a rich patina with use.',
      priceCents: 19500, // $195.00
      declaredWeightG: 620, // 0.62 kg
      category: 'Leather Goods',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listSneaker = await prisma.listing.create({
    data: {
      id: 'list_sneaker_10',
      sellerId: urbanCeramics.id,
      title: 'Limited Retro High-Top Court Sneakers',
      description: 'Deadstock vintage cream leather with aged rubber soles. Numbered box edition, pristine collector condition with extra waxed laces.',
      priceCents: 22000, // $220.00
      declaredWeightG: 1100, // 1.10 kg
      category: 'Apparel',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listLamp = await prisma.listing.create({
    data: {
      id: 'list_lamp_11',
      sellerId: clayStudio.id,
      title: 'Mid-Century Walnut & Opal Glass Desk Lamp',
      description: 'Turned solid American walnut stem with handblown frosted glass sphere diffuser. Warm ambient brass touch-dimmer switch.',
      priceCents: 14500, // $145.00
      declaredWeightG: 1850, // 1.85 kg
      category: 'Home',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listKnife = await prisma.listing.create({
    data: {
      id: 'list_knife_12',
      sellerId: modernMinimal.id,
      title: 'Hand-Forged Damascus Steel Santoku Knife',
      description: '67-layer VG-10 folded Damascus core with octagonal stabilized burl wood handle. Razor-sharp 15-degree double bevel.',
      priceCents: 17500, // $175.00
      declaredWeightG: 260, // 0.26 kg
      category: 'Home',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listCamera = await prisma.listing.create({
    data: {
      id: 'list_camera_13',
      sellerId: clayStudio.id,
      title: 'Vintage 35mm Rangefinder Film Camera',
      description: 'Fully restored mechanical rangefinder with coated 40mm f/1.7 lens. Tested shutter speeds, clean viewfinder, and leather wrist strap.',
      priceCents: 31000, // $310.00
      declaredWeightG: 580, // 0.58 kg
      category: 'Tech',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listBlanket = await prisma.listing.create({
    data: {
      id: 'list_blanket_14',
      sellerId: urbanCeramics.id,
      title: 'Nordic Bouclé Merino Wool Throw Blanket',
      description: 'Spun from 100% fine Scandinavian merino wool. Textured waffle bouclé weave with fringe detailing. Ultra-soft and non-scratchy.',
      priceCents: 11500, // $115.00
      declaredWeightG: 920, // 0.92 kg
      category: 'Home',
      imageUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
      ]),
      status: 'active',
    },
  });

  const listMug = await prisma.listing.create({
    data: {
      id: 'list_mug_15',
      sellerId: urbanCeramics.id,
      title: 'Speckled Sand Ceramic Mug & Saucer Set',
      description: 'Pair of wheel-thrown 10oz cappuccino mugs with matching glazed saucers. Exposed clay grog rim with food-safe satin glaze.',
      priceCents: 3800, // $38.00
      declaredWeightG: 410, // 0.41 kg
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
