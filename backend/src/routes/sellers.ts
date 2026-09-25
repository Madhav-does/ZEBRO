import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../lib/db.js';
import { NotFoundError } from '../lib/errors.js';
import { computeTrustTier } from '../services/trustScore.js';

export async function sellerRoutes(fastify: FastifyInstance) {
  // Helper to resolve seller
  async function resolveSeller(paramOrHeader?: string) {
    if (paramOrHeader && paramOrHeader !== 'me') {
      const found = await prisma.user.findFirst({
        where: { OR: [{ id: paramOrHeader }, { handle: paramOrHeader }] },
      });
      if (found) return found;
    }
    // Default to primary demo seller @urban_ceramics
    const defaultSeller = await prisma.user.findFirst({
      where: { handle: 'urban_ceramics' },
    });
    if (defaultSeller) return defaultSeller;

    const anySeller = await prisma.user.findFirst({ where: { role: 'seller' } });
    if (!anySeller) throw new NotFoundError('Seller user');
    return anySeller;
  }

  // GET /sellers/me/dashboard
  fastify.get('/sellers/me/dashboard', async (request: FastifyRequest) => {
    const seller = await resolveSeller(request.headers['x-user-id'] as string | undefined);
    return getSellerDashboard(seller);
  });

  // GET /sellers/me/storefront and GET /storefronts/:sellerId (Frontend alias)
  const handleStorefront = async (request: FastifyRequest<{ Params: { sellerId?: string } }>) => {
    const seller = await resolveSeller(request.params.sellerId || (request.headers['x-user-id'] as string));
    const listings = await prisma.listing.findMany({
      where: { sellerId: seller.id, status: 'active' },
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    });

    const trust = computeTrustTier({
      kycVerified: seller.kycVerified,
      cleanOrderCount: seller.cleanOrderCount,
      disputeCount: seller.disputeCount,
      accountAgeDays: Math.floor((Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 3600 * 24)) + 45,
    });

    return {
      seller: {
        id: seller.id,
        handle: seller.handle,
        name: seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : seller.handle,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
        verifiedCreator: seller.kycVerified,
        tier: `Tier ${trust.tier} Seller`,
        ordersCount: seller.cleanOrderCount,
        disputesCount: seller.disputeCount,
        riskScore: seller.disputeCount === 0 ? 'low' : 'medium',
        riskScoreNum: seller.disputeCount === 0 ? 98 : 75,
        riskFactors: trust.reasons,
        memberSince: 'March 2023',
        instagramFollowers: '34.8K',
        kycVerifiedAt: seller.createdAt.toISOString(),
        storeName: seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : seller.handle,
        isIdentityVerified: seller.kycVerified,
        trustTier: trust.tier,
      },
      bio: 'Studio ceramicist firing reduction stoneware in Portland, OR. Every parcel is certified weighed on postal intake scales.',
      instagramUrl: `https://instagram.com/${seller.handle}`,
      rating: 4.98,
      reviewsCount: 46,
      activeListingsCount: listings.length,
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        subtitle: `${l.category} collection piece`,
        description: l.description,
        price: l.priceCents / 100,
        shippingFee: 0.0,
        images: JSON.parse(l.imageUrls || '[]'),
        category: l.category,
        seller: {
          id: seller.id,
          handle: seller.handle,
          name: seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : seller.handle,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
          verifiedCreator: seller.kycVerified,
          tier: `Tier ${trust.tier} Seller`,
        },
        declaredWeightKg: l.declaredWeightG / 1000,
        likesCount: 142,
        isEscrowGuaranteed: true,
        createdAt: l.createdAt.toISOString(),
        tags: [l.category.toLowerCase(), 'escrowprotected'],
      })),
    };
  };

  fastify.get('/sellers/me/storefront', handleStorefront);
  fastify.get('/storefronts/:sellerId', handleStorefront);

  // GET /sellers/me/payouts and GET /sellers/:sellerId/payouts
  const handlePayouts = async (request: FastifyRequest<{ Params: { sellerId?: string } }>) => {
    const seller = await resolveSeller(request.params.sellerId || (request.headers['x-user-id'] as string));
    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let availableCents = 0;
    let inEscrowCents = 0;
    let releasedMonthCents = 0;

    for (const o of orders) {
      const net = o.totalCents - o.platformFeeCents;
      if (o.status === 'FUNDS_RELEASED') {
        availableCents += net;
        releasedMonthCents += net;
      } else if (['HELD_IN_ESCROW', 'IN_TRANSIT', 'DELIVERED', 'ESCROW_FROZEN'].includes(o.status)) {
        inEscrowCents += net;
      }
    }

    // Include realistic base balances for demo if DB is fresh
    const availableBalance = availableCents > 0 ? availableCents / 100 : 2840.0;
    const inEscrowBalance = inEscrowCents > 0 ? inEscrowCents / 100 : 85.0;
    const releasedThisMonth = releasedMonthCents > 0 ? releasedMonthCents / 100 : 4250.0;

    const transactions = orders.map((o) => ({
      id: `tx_${o.id}`,
      orderNumber: `TL-${o.id.slice(-7).toUpperCase()}`,
      itemTitle: o.listing.title,
      amount: o.totalCents / 100,
      escrowStatus: o.status.toLowerCase(),
      payoutStatus: o.status === 'FUNDS_RELEASED' ? 'available' : o.status === 'ESCROW_FROZEN' ? 'frozen' : 'in_escrow',
      date: new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    }));

    return {
      availableBalance,
      inEscrowBalance,
      releasedThisMonth,
      currency: 'USD',
      transactions: transactions.length > 0 ? transactions : [
        {
          id: 'tx_1',
          orderNumber: 'TL-8829104',
          itemTitle: 'Handcrafted Ceramic Vase',
          amount: 85.0,
          escrowStatus: 'delivered_inspecting',
          payoutStatus: 'in_escrow',
          date: 'Today, 11:24 AM',
        },
        {
          id: 'tx_2',
          orderNumber: 'TL-8119022',
          itemTitle: 'Hinoki Wood Catchall Tray',
          amount: 68.0,
          escrowStatus: 'funds_released',
          payoutStatus: 'released',
          date: 'Sep 22, 2026',
        },
      ],
    };
  };

  fastify.get('/sellers/me/payouts', handlePayouts);
  fastify.get('/sellers/:sellerId/payouts', handlePayouts);

  // GET /sellers/me/analytics and GET /sellers/:sellerId/analytics
  const handleAnalytics = async (request: FastifyRequest<{ Params: { sellerId?: string } }>) => {
    return {
      views: 3840,
      conversionRate: 4.8,
      escrowSuccessRate: 99.6,
      avgReleaseTimeHours: 18.4,
      sparkline: [14, 22, 18, 30, 26, 38, 34, 46, 52, 48, 58, 65],
    };
  };

  fastify.get('/sellers/me/analytics', handleAnalytics);
  fastify.get('/sellers/:sellerId/analytics', handleAnalytics);

  // GET /sellers/:idOrHandle (Public profile)
  fastify.get('/sellers/:idOrHandle', async (request: FastifyRequest<{ Params: { idOrHandle: string } }>) => {
    const seller = await resolveSeller(request.params.idOrHandle);
    const trust = computeTrustTier({
      kycVerified: seller.kycVerified,
      cleanOrderCount: seller.cleanOrderCount,
      disputeCount: seller.disputeCount,
      accountAgeDays: Math.floor((Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 3600 * 24)) + 45,
    });

    return {
      id: seller.id,
      handle: seller.handle,
      name: seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : seller.handle,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      verifiedCreator: seller.kycVerified,
      tier: `Tier ${trust.tier} Seller`,
      ordersCount: seller.cleanOrderCount,
      disputesCount: seller.disputeCount,
      riskScore: seller.disputeCount === 0 ? 'low' : 'medium',
      riskScoreNum: seller.disputeCount === 0 ? 98 : 75,
      riskFactors: trust.reasons,
      memberSince: 'March 2023',
      instagramFollowers: '34.8K',
      kycVerifiedAt: seller.createdAt.toISOString(),
      storeName: seller.handle === 'urban_ceramics' ? 'Maya Lin Studios' : seller.handle,
      isIdentityVerified: seller.kycVerified,
      trustTier: trust.tier,
      location: 'Portland, OR',
    };
  });
}

async function getSellerDashboard(seller: any) {
  const trust = computeTrustTier({
    kycVerified: seller.kycVerified,
    cleanOrderCount: seller.cleanOrderCount,
    disputeCount: seller.disputeCount,
    accountAgeDays: Math.floor((Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 3600 * 24)) + 45,
  });

  const progressToNextTier =
    trust.tier === 1
      ? Math.min(Math.round((seller.cleanOrderCount / 20) * 100), 100)
      : trust.tier === 2
      ? Math.min(Math.round((seller.cleanOrderCount / 50) * 100), 100)
      : 100;

  return {
    sellerId: seller.id,
    handle: seller.handle,
    availableBalanceCents: 284000,
    inEscrowCents: 8500,
    releasedThisMonthCents: 425000,
    trustTier: trust.tier,
    trustScore: seller.disputeCount === 0 ? 88 : 70,
    progressToNextTier,
    reasons: trust.reasons,
    cleanOrderCount: seller.cleanOrderCount,
    disputeCount: seller.disputeCount,
  };
}
