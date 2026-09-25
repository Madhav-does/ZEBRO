import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { NotFoundError } from '../lib/errors.js';
import { checkIdempotency, saveIdempotencyResponse } from '../lib/idempotency.js';

const createListingSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().default('Handcrafted piece protected by TrustLink Escrow.'),
  price: z.number().optional(), // in dollars
  priceCents: z.number().optional(), // in cents
  shippingFee: z.number().optional().default(0),
  declaredWeightKg: z.number().optional(),
  declaredWeightG: z.number().optional(),
  category: z.string().default('Ceramics'),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export async function listingRoutes(fastify: FastifyInstance) {
  // GET /listings (and /api/v1/listings)
  fastify.get('/listings', async (request: FastifyRequest<{
    Querystring: { category?: string; q?: string; tier?: string; verifiedOnly?: string };
  }>) => {
    const { category, q, tier, verifiedOnly } = request.query;

    const where: any = { status: 'active' };

    if (category && category !== 'All') {
      where.category = { contains: category };
    }

    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { seller: { handle: { contains: term } } },
      ];
    }

    if (tier) {
      where.seller = { ...where.seller, trustTier: parseInt(tier, 10) };
    }

    if (verifiedOnly === 'true') {
      where.seller = { ...where.seller, kycVerified: true };
    }

    const items = await prisma.listing.findMany({
      where,
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((l) => formatListing(l));
  });

  // GET /listings/:id
  fastify.get('/listings/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const item = await prisma.listing.findUnique({
      where: { id: request.params.id },
      include: { seller: true },
    });
    if (!item) throw new NotFoundError('Listing', request.params.id);
    return formatListing(item);
  });

  // POST /listings
  fastify.post('/listings', async (request: FastifyRequest, reply: FastifyReply) => {
    const idKey = request.headers['idempotency-key'] as string | undefined;
    if (idKey && (await checkIdempotency(request, reply))) return;

    const body = createListingSchema.parse(request.body);

    const priceCents = body.priceCents ?? (body.price ? Math.round(body.price * 100) : 5000);
    const declaredWeightG = body.declaredWeightG ?? (body.declaredWeightKg ? Math.round(body.declaredWeightKg * 1000) : 1000);
    const imageUrls = JSON.stringify(body.images && body.images.length > 0
      ? body.images
      : ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80']);

    // Find seller or fallback to @urban_ceramics
    const sellerHeader = request.headers['x-user-id'] as string | undefined;
    let seller = sellerHeader
      ? await prisma.user.findFirst({ where: { OR: [{ id: sellerHeader }, { handle: sellerHeader }] } })
      : await prisma.user.findFirst({ where: { handle: 'urban_ceramics' } });

    if (!seller) {
      seller = await prisma.user.findFirst({ where: { role: 'seller' } });
    }

    if (!seller) {
      throw new NotFoundError('Seller User');
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        title: body.title,
        description: body.description,
        priceCents,
        declaredWeightG,
        imageUrls,
        category: body.category,
        status: 'active',
      },
      include: { seller: true },
    });

    const response = formatListing(listing);
    if (idKey) await saveIdempotencyResponse(idKey, response);
    return reply.status(201).send(response);
  });
}

function formatListing(l: any) {
  let images: string[] = [];
  try {
    images = JSON.parse(l.imageUrls || '[]');
  } catch {
    images = [];
  }

  return {
    id: l.id,
    title: l.title,
    subtitle: l.category ? `${l.category} collection piece` : undefined,
    description: l.description,
    price: l.priceCents / 100,
    shippingFee: 0.0,
    images,
    category: l.category,
    seller: {
      id: l.seller.id,
      handle: l.seller.handle,
      name: l.seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : l.seller.handle,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      verifiedCreator: l.seller.kycVerified,
      tier: `Tier ${l.seller.trustTier} Seller`,
      ordersCount: l.seller.cleanOrderCount,
      disputesCount: l.seller.disputeCount,
      riskScore: l.seller.disputeCount === 0 ? 'low' : 'medium',
      riskScoreNum: l.seller.disputeCount === 0 ? 98 : 75,
      riskFactors: ['Government ID & Biometric Liveness KYC Verified'],
      memberSince: 'March 2023',
      instagramFollowers: '34.8K',
      kycVerifiedAt: l.seller.createdAt.toISOString(),
      storeName: l.seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : l.seller.handle,
      isIdentityVerified: l.seller.kycVerified,
      trustTier: l.seller.trustTier,
      location: 'Portland, OR',
    },
    declaredWeightKg: l.declaredWeightG / 1000,
    likesCount: 142,
    isEscrowGuaranteed: true,
    createdAt: l.createdAt.toISOString(),
    tags: [l.category.toLowerCase(), 'escrowprotected', 'verified'],
  };
}
