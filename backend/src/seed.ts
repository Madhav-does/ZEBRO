import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/db.js';
import { logger } from './lib/logger.js';
import { transition } from './fsm/engine.js';
import { timers } from './fsm/timers.js';

export async function seed() {
  logger.info('[Seed] Seeding database with diverse marketplace catalog, users, and orders...');

  // Clean existing data
  await prisma.pendingTimer.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.escrowEvent.deleteMany({});
  await prisma.comment.deleteMany({});
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

  const atelierNordic = await prisma.user.create({
    data: {
      email: 'craft@ateliernordic.com',
      handle: 'atelier_nordic',
      role: 'seller',
      kycVerified: true,
      trustTier: 3,
      cleanOrderCount: 62,
      disputeCount: 0,
      stripeAccountId: 'acct_mock_atelier_nordic',
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

  // 3. Define 36 completely unique, high-resolution lifestyle products with distinct photos
  const catalog = [
    // CERAMICS
    {
      id: 'prod_ceramic_vase_01',
      sellerId: urbanCeramics.id,
      title: 'Handcrafted Ceramic Vase — Matte White',
      description: 'Wheel-thrown stoneware with raw mineral glaze. Fired to cone 10 reduction in our Portland studio. Non-porous, waterproof organic base.',
      priceCents: 8500,
      declaredWeightG: 1200,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'list_dripper_06',
      sellerId: urbanCeramics.id,
      title: 'Handmade Ceramic Pour-Over Dripper',
      description: 'Matte-glazed reduction stoneware designed for Kalita 185 filters. Handcrafted in Portland, OR.',
      priceCents: 4800,
      declaredWeightG: 420,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_mug_15',
      sellerId: urbanCeramics.id,
      title: 'Speckled Sand Ceramic Mug & Saucer Set',
      description: 'Pair of wheel-thrown 10oz cappuccino mugs with matching glazed saucers. Exposed clay grog rim with food-safe satin glaze.',
      priceCents: 3800,
      declaredWeightG: 410,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_matcha_bowl',
      sellerId: clayStudio.id,
      title: 'Hand-Carved Black Raku Chawan Matcha Bowl',
      description: 'Traditional Kyoto-style raku ware with organic lip carving and crackled charcoal glaze. Retains heat perfectly.',
      priceCents: 7200,
      declaredWeightG: 380,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_terracotta_planter',
      sellerId: modernMinimal.id,
      title: 'Ribbed Terracotta Architectural Planter',
      description: 'Heavy architectural terracotta with drainage tray and textured vertical fluting. Suitable for specimen plants and bonsai.',
      priceCents: 6400,
      declaredWeightG: 1850,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_ceramic_sculpture',
      sellerId: clayStudio.id,
      title: 'Brutalist Stoneware Totem Sculpture',
      description: 'Hand-built abstract totem finished with iron oxide wash and unglazed volcanic stoneware texture. One-of-a-kind gallery piece.',
      priceCents: 18500,
      declaredWeightG: 2400,
      category: 'Ceramics',
      imageUrls: [
        'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // APPAREL
    {
      id: 'list_jacket_02',
      sellerId: modernMinimal.id,
      title: 'Washed Canvas Workwear Chore Jacket',
      description: '14oz Japanese duck canvas with brass hardware. Triple-needle stitched chore coat tailored in Los Angeles.',
      priceCents: 16500,
      declaredWeightG: 950,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'list_sneaker_10',
      sellerId: urbanCeramics.id,
      title: 'Limited Retro High-Top Court Sneakers',
      description: 'Deadstock vintage cream leather with aged rubber soles. Numbered box edition, pristine collector condition with extra waxed laces.',
      priceCents: 22000,
      declaredWeightG: 1100,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_wool_sweater',
      sellerId: atelierNordic.id,
      title: 'Chunky Ribbed Fisherman Merino Sweater',
      description: 'Knit from 100% undyed British Shetland wool. Heavyweight gauge with raglan sleeves and reinforced collar.',
      priceCents: 14500,
      declaredWeightG: 780,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_linen_shirt',
      sellerId: modernMinimal.id,
      title: 'Japanese Raw Indigo Dyed Linen Overshirt',
      description: 'Heavy French flax linen dyed with natural fermented indigo in Tokushima. Mother-of-pearl buttons.',
      priceCents: 11500,
      declaredWeightG: 450,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_leather_boots',
      sellerId: atelierNordic.id,
      title: 'Goodyear Welted Horween Service Boots',
      description: 'Handcrafted in Spain using Chromexcel leather from Chicago. Vibram commando lug sole with brass speedhooks.',
      priceCents: 32000,
      declaredWeightG: 1650,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_technical_anorak',
      sellerId: modernMinimal.id,
      title: 'Ripstop 3-Layer Waterproof Field Anorak',
      description: 'Breathable taped seam shell with storm hood and magnetic quick-access chest pouch. Tested in alpine downpours.',
      priceCents: 19800,
      declaredWeightG: 620,
      category: 'Apparel',
      imageUrls: [
        'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // WATCHES
    {
      id: 'list_watch_07',
      sellerId: modernMinimal.id,
      title: '1974 Vintage Chronograph Watch — Panda Dial',
      description: 'Mechanical manual-wind movement, 38mm stainless steel case, domed acrylic crystal with original leather racing strap. Fully serviced.',
      priceCents: 24000,
      declaredWeightG: 180,
      category: 'Watches',
      imageUrls: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_diver_watch',
      sellerId: modernMinimal.id,
      title: 'Automatic 300m Titanium Ocean Diver',
      description: 'Grade 2 titanium case with matte ceramic bezel insert, sapphire crystal, and Swiss automatic movement. Helium release valve.',
      priceCents: 38000,
      declaredWeightG: 220,
      category: 'Watches',
      imageUrls: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_bauhaus_watch',
      sellerId: atelierNordic.id,
      title: 'Minimalist Sapphire Bauhaus Dress Watch',
      description: 'Ultra-thin 6.8mm case with clean typography dial, heat-blued hands, and Milanese mesh steel strap.',
      priceCents: 16500,
      declaredWeightG: 140,
      category: 'Watches',
      imageUrls: [
        'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_bronze_field_watch',
      sellerId: clayStudio.id,
      title: 'Aged Patina Mechanical Bronze Field Watch',
      description: 'CuSn8 marine bronze case that develops individual character over time. Super-LumiNova markers with vegetable-tanned NATO strap.',
      priceCents: 21000,
      declaredWeightG: 190,
      category: 'Watches',
      imageUrls: [
        'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // TECH & AUDIO
    {
      id: 'list_keyboard_08',
      sellerId: clayStudio.id,
      title: 'Custom 65% Anodized Aluminum Keyboard',
      description: 'Gasket-mounted mechanical keyboard with brass weight, lubed Gateron Oil King linear switches, and PBT dye-sub keycaps. Heavy solid base.',
      priceCents: 28500,
      declaredWeightG: 1450,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_camera_13',
      sellerId: clayStudio.id,
      title: 'Vintage 35mm Rangefinder Film Camera',
      description: 'Fully restored mechanical rangefinder with coated 40mm f/1.7 lens. Tested shutter speeds, clean viewfinder, and leather wrist strap.',
      priceCents: 31000,
      declaredWeightG: 580,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_headphones',
      sellerId: modernMinimal.id,
      title: 'Open-Back Walnut Audiophile Planar Headphones',
      description: 'Solid CNC-machined walnut earcups with 97mm planar magnetic transducers. Oxygen-free copper braided cable and velour earpads.',
      priceCents: 34500,
      declaredWeightG: 480,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_analog_synth',
      sellerId: clayStudio.id,
      title: 'Desktop Semi-Modular Analog Synthesizer',
      description: 'Pure discrete analog signal path with voltage-controlled ladder filter, dual oscillators, and patch bay interface.',
      priceCents: 42000,
      declaredWeightG: 2100,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_speaker',
      sellerId: atelierNordic.id,
      title: 'Acoustic Birch Bookshelf Studio Monitor',
      description: 'Layered Baltic birch ply enclosure with silk dome tweeter and 5.25-inch paper pulp woofer. Natural warm tonal balance.',
      priceCents: 26000,
      declaredWeightG: 3200,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_lens',
      sellerId: clayStudio.id,
      title: '50mm f/1.2 Manual Focus Cinema Prime Lens',
      description: 'All-metal barrel with de-clicked aperture ring and buttery 270-degree focus throw. Ultra-sharp with creamy circular bokeh.',
      priceCents: 38000,
      declaredWeightG: 720,
      category: 'Tech',
      imageUrls: [
        'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // LEATHER GOODS
    {
      id: 'list_bag_09',
      sellerId: modernMinimal.id,
      title: 'Italian Vegetable-Tanned Leather Crossbody',
      description: 'Full-grain Tuscan saddle leather, solid brass buckle hardware, and unlined raw interior. Will develop a rich patina with use.',
      priceCents: 19500,
      declaredWeightG: 620,
      category: 'Leather Goods',
      imageUrls: [
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_briefcase',
      sellerId: atelierNordic.id,
      title: 'English Bridle Leather Artisan Briefcase',
      description: 'Constructed by a master saddler in London using 10oz wax-finished bridle leather. Fits 16-inch laptops with copper rivets.',
      priceCents: 45000,
      declaredWeightG: 1750,
      category: 'Leather Goods',
      imageUrls: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_wallet',
      sellerId: modernMinimal.id,
      title: 'Hand-Stitched Horween Chromexcel Bifold',
      description: 'Beeswax-burnished edges, saddle-stitched by hand with waxed polycord thread. Holds 8 cards and flat bills.',
      priceCents: 7500,
      declaredWeightG: 120,
      category: 'Leather Goods',
      imageUrls: [
        'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_weekend_duffle',
      sellerId: atelierNordic.id,
      title: 'Heavy Waxed Canvas & Saddle Leather Duffle',
      description: '24oz paraffin-waxed cotton duck with 8oz bridle leather handles and solid cast-brass YKK double zipper.',
      priceCents: 24500,
      declaredWeightG: 1950,
      category: 'Leather Goods',
      imageUrls: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // HOME & DECOR
    {
      id: 'list_home_05',
      sellerId: urbanCeramics.id,
      title: 'Japanese Hinoki Wood Catchall Valet',
      description: 'Milled from single timber offcuts in Nagano. Beveled perimeter tray designed for EDC essentials, keys, and fountain pens.',
      priceCents: 6800,
      declaredWeightG: 550,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'list_lamp_11',
      sellerId: clayStudio.id,
      title: 'Mid-Century Walnut & Opal Glass Desk Lamp',
      description: 'Turned solid American walnut stem with handblown frosted glass sphere diffuser. Warm ambient brass touch-dimmer switch.',
      priceCents: 14500,
      declaredWeightG: 1850,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_knife_12',
      sellerId: modernMinimal.id,
      title: 'Hand-Forged Damascus Steel Santoku Knife',
      description: '67-layer VG-10 folded Damascus core with octagonal stabilized burl wood handle. Razor-sharp 15-degree double bevel.',
      priceCents: 17500,
      declaredWeightG: 260,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_blanket_14',
      sellerId: urbanCeramics.id,
      title: 'Nordic Bouclé Merino Wool Throw Blanket',
      description: 'Spun from 100% fine Scandinavian merino wool. Textured waffle bouclé weave with fringe detailing. Ultra-soft and non-scratchy.',
      priceCents: 11500,
      declaredWeightG: 920,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_travertine_bookends',
      sellerId: atelierNordic.id,
      title: 'Sculpted Raw Travertine Stone Bookends',
      description: 'Quarried in Tivoli, Italy. Hand-honed architectural arches showcasing natural porous voids and layered mineral striations.',
      priceCents: 9800,
      declaredWeightG: 3100,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'list_brass_incense',
      sellerId: clayStudio.id,
      title: 'Solid Milled Hexagonal Brass Incense Burner',
      description: 'Machined from a single block of solid unlacquered cartridge brass. Catches ash cleanly and will oxidize to a deep golden patina.',
      priceCents: 5200,
      declaredWeightG: 440,
      category: 'Home',
      imageUrls: [
        'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&auto=format&fit=crop&q=80',
      ],
    },

    // PRINTS & JEWELRY
    {
      id: 'list_print_03',
      sellerId: clayStudio.id,
      title: 'Brutalist Concrete 04 — Limited Risograph',
      description: 'Three-color soy ink risograph capturing structural geometry in West Berlin. Edition of 50 on 280gsm Fabriano cotton paper.',
      priceCents: 4200,
      declaredWeightG: 350,
      category: 'Prints',
      imageUrls: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'list_ring_04',
      sellerId: modernMinimal.id,
      title: 'Hand-Carved Sterling Silver Signet Ring',
      description: 'Solid 925 silver with lost-wax raw texture. Sculpted individually by hand in Brooklyn with satin patina finish.',
      priceCents: 13000,
      declaredWeightG: 150,
      category: 'Jewelry',
      imageUrls: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      id: 'list_gold_cuff',
      sellerId: atelierNordic.id,
      title: 'Forged 14k Gold Hammered Minimalist Cuff',
      description: 'Tapered solid brass base plated in thick 14-karat gold vermeil. Hand-faceted surface catches light with subtle glimmer.',
      priceCents: 15500,
      declaredWeightG: 80,
      category: 'Jewelry',
      imageUrls: [
        'https://images.unsplash.com/photo-1611591475879-114421681282?w=800&auto=format&fit=crop&q=80',
      ],
    },
  ];

  const createdListings = [];
  for (const item of catalog) {
    const l = await prisma.listing.create({
      data: {
        id: item.id,
        sellerId: item.sellerId,
        title: item.title,
        description: item.description,
        priceCents: item.priceCents,
        declaredWeightG: item.declaredWeightG,
        category: item.category,
        imageUrls: JSON.stringify(item.imageUrls),
        status: 'active',
      },
    });
    createdListings.push(l);

    // Seed default comments for the listing
    await prisma.comment.create({
      data: {
        listingId: l.id,
        author: 'collector_elena',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&q=80',
        text: 'Is the declared parcel tare verified by carrier postal scale?',
      },
    });
    await prisma.comment.create({
      data: {
        listingId: l.id,
        author: 'studio_supporter',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&q=80',
        text: 'The texture on this is incredible! Escrow protection made checkout so easy.',
      },
    });
  }

  // 4. Create 4 Test Orders:
  // Order 1: in HELD_IN_ESCROW (freshly paid)
  const order1 = await prisma.order.create({
    data: {
      id: 'ord_mock_held',
      buyerId: buyerAlex.id,
      sellerId: urbanCeramics.id,
      listingId: 'list_dripper_06',
      status: 'PAYMENT_PENDING',
      totalCents: 5400,
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
      listingId: 'list_jacket_02',
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
      listingId: 'prod_ceramic_vase_01',
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
      listingId: 'list_print_03',
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

  // 5. Create 4 Historical Settled Past Orders (FUNDS_RELEASED)
  const pastOrder1 = await prisma.order.create({
    data: {
      id: 'ord_past_duffle_01',
      buyerId: buyerAlex.id,
      sellerId: atelierNordic.id,
      listingId: 'list_weekend_duffle',
      status: 'PAYMENT_PENDING',
      totalCents: 24500,
      platformFeeCents: 735,
      transferGroup: 'order_past_duffle_01',
      declaredWeightG: 1950,
      carrier: 'USPS',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
  });
  await transition(pastOrder1.id, 'PAYMENT_SUCCEEDED');
  await transition(pastOrder1.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 1980 });
  await transition(pastOrder1.id, 'DELIVERED', { deliveredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() });
  await transition(pastOrder1.id, 'BUYER_CONFIRMED');

  const pastOrder2 = await prisma.order.create({
    data: {
      id: 'ord_past_watch_02',
      buyerId: buyerSarah.id,
      sellerId: modernMinimal.id,
      listingId: 'list_watch_07',
      status: 'PAYMENT_PENDING',
      totalCents: 21000,
      platformFeeCents: 630,
      transferGroup: 'order_past_watch_02',
      declaredWeightG: 180,
      carrier: 'USPS',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
  });
  await transition(pastOrder2.id, 'PAYMENT_SUCCEEDED');
  await transition(pastOrder2.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 185 });
  await transition(pastOrder2.id, 'DELIVERED', { deliveredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() });
  await transition(pastOrder2.id, 'BUYER_CONFIRMED');

  const pastOrder3 = await prisma.order.create({
    data: {
      id: 'ord_past_ring_03',
      buyerId: buyerAlex.id,
      sellerId: clayStudio.id,
      listingId: 'list_ring_04',
      status: 'PAYMENT_PENDING',
      totalCents: 13000,
      platformFeeCents: 390,
      transferGroup: 'order_past_ring_03',
      declaredWeightG: 150,
      carrier: 'USPS',
      createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000),
    },
  });
  await transition(pastOrder3.id, 'PAYMENT_SUCCEEDED');
  await transition(pastOrder3.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 155 });
  await transition(pastOrder3.id, 'DELIVERED', { deliveredAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString() });
  await transition(pastOrder3.id, 'BUYER_CONFIRMED');

  const pastOrder4 = await prisma.order.create({
    data: {
      id: 'ord_past_valet_04',
      buyerId: buyerSarah.id,
      sellerId: urbanCeramics.id,
      listingId: 'list_home_05',
      status: 'PAYMENT_PENDING',
      totalCents: 6800,
      platformFeeCents: 204,
      transferGroup: 'order_past_valet_04',
      declaredWeightG: 550,
      carrier: 'USPS',
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
    },
  });
  await transition(pastOrder4.id, 'PAYMENT_SUCCEEDED');
  await transition(pastOrder4.id, 'WEIGHT_SCAN_MATCH', { scannedWeightG: 560 });
  await transition(pastOrder4.id, 'DELIVERED', { deliveredAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() });
  await transition(pastOrder4.id, 'BUYER_CONFIRMED');

  logger.info(`[Seed] Database successfully seeded with 4 sellers, 2 buyers, ${catalog.length} unique listings, 4 active orders, and 4 settled past orders!`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    logger.error({ err: e }, '[Seed] Seeding failed');
    process.exit(1);
  });
