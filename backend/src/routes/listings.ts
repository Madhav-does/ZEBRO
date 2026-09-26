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

const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text cannot be empty'),
  author: z.string().optional().default('verified_collector'),
});

export async function listingRoutes(fastify: FastifyInstance) {
  // GET /listings (and /api/v1/listings)
  fastify.get('/listings', async (request: FastifyRequest<{
    Querystring: { category?: string; q?: string; tier?: string; verifiedOnly?: string; limit?: string; page?: string; offset?: string; shuffle?: string };
  }>) => {
    const { category, q, tier, verifiedOnly, limit, page, offset, shuffle } = request.query;

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

    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = offset
      ? parseInt(offset, 10)
      : page && take
      ? (parseInt(page, 10) - 1) * take
      : undefined;

    const items = await prisma.listing.findMany({
      where,
      include: {
        seller: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    let results = items.map((l) => formatListing(l));
    if (shuffle === 'true') {
      results = [...results].sort(() => Math.random() - 0.5);
    }
    return results;
  });

  // GET /listings/:id and GET /products/:id (Frontend alias)
  const handleGetListingById = async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const item = await prisma.listing.findUnique({
      where: { id: request.params.id },
      include: {
        seller: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!item) throw new NotFoundError('Listing', request.params.id);
    return formatListing(item);
  };

  fastify.get('/listings/:id', handleGetListingById);
  fastify.get('/products/:id', handleGetListingById);

  // GET /listings/:id/comments and /products/:id/comments
  const handleGetComments = async (request: FastifyRequest<{ Params: { id: string } }>) => {
    const listingId = request.params.id;
    let comments = await prisma.comment.findMany({
      where: { listingId },
      orderBy: { createdAt: 'asc' },
    });

    // If no comments exist yet, seed initial discussion
    if (comments.length === 0) {
      const defaultComments = [
        {
          listingId,
          author: 'alex_curator',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&q=80',
          text: 'Is the declared shipping tare weight verified by carrier scale?',
        },
        {
          listingId,
          author: 'sarah_design',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&q=80',
          text: 'Stunning craftsmanship! Sent you a DM for escrow terms.',
        },
      ];

      for (const dc of defaultComments) {
        await prisma.comment.create({ data: dc });
      }

      comments = await prisma.comment.findMany({
        where: { listingId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return comments.map((c) => ({
      id: c.id,
      author: c.author,
      authorAvatar: c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&q=80',
      text: c.text,
      createdAt: c.createdAt.toISOString(),
    }));
  };

  fastify.get('/listings/:id/comments', handleGetComments);
  fastify.get('/products/:id/comments', handleGetComments);

  // POST /listings/:id/comments and /products/:id/comments
  const handleCreateComment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const listingId = request.params.id;
    const body = createCommentSchema.parse(request.body || {});

    // Verify listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundError('Listing', listingId);

    const comment = await prisma.comment.create({
      data: {
        listingId,
        author: body.author || 'verified_buyer',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80',
        text: body.text.trim(),
      },
    });

    return reply.status(201).send({
      id: comment.id,
      author: comment.author,
      authorAvatar: comment.authorAvatar,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    });
  };

  fastify.post('/listings/:id/comments', handleCreateComment);
  fastify.post('/products/:id/comments', handleCreateComment);

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
    buyerProtectionFee: 0.0,
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
    comments: (l.comments || []).map((c: any) => ({
      id: c.id,
      author: c.author,
      authorAvatar: c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&q=80',
      text: c.text,
      createdAt: c.createdAt.toISOString ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
    })),
    commentsCount: l.comments ? l.comments.length : 0,
    createdAt: l.createdAt.toISOString(),
    tags: [l.category.toLowerCase(), 'escrowprotected', 'verified'],
  };
}
