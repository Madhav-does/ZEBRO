import { ApiClient } from '../client';
import {
  Seller,
  Product,
  Order,
  WeightAudit,
  DisputePayload,
  Dispute,
  Listing,
  RecentlyProtectedItem,
  PlatformFraudStats,
  Storefront,
  Payout,
  SellerAnalytics,
  Thread,
} from '@/types';
import {
  mockSeller,
  mockProduct,
  getMockOrder,
  mockListings,
  mockRecentlyProtected,
  mockPlatformFraudStats,
  mockStorefront,
  mockPayouts,
  mockSellerAnalytics,
  mockThreads,
} from './data';
import { useAppStore } from '@/store/useAppStore';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateNetworkConditions(): Promise<void> {
  const { isOfflineSimulated, isSimulatingSlowNetwork } = useAppStore.getState();

  if (isOfflineSimulated) {
    throw new Error('ERR_INTERNET_DISCONNECTED: Simulated offline connection.');
  }

  const baseLatency = Math.floor(Math.random() * (700 - 350 + 1)) + 350;
  const extraLatency = isSimulatingSlowNetwork ? 1800 : 0;
  await delay(baseLatency + extraLatency);
}

// In-memory runtime state for mutations
let currentOrder: Order | null = null;
let lastScenario = '';

export class MockApiClient implements ApiClient {
  async getSeller(idOrHandle: string): Promise<Seller> {
    await simulateNetworkConditions();
    return { ...mockSeller, handle: idOrHandle || mockSeller.handle };
  }

  async getProduct(_id: string): Promise<Product> {
    await simulateNetworkConditions();
    return { ...mockProduct };
  }

  async getOrder(_id: string): Promise<Order> {
    await simulateNetworkConditions();
    const scenario = useAppStore.getState().demoScenario;

    // Reset or update order if scenario changed or not initialized
    if (!currentOrder || lastScenario !== scenario) {
      currentOrder = getMockOrder(scenario);
      lastScenario = scenario;
    }

    return { ...currentOrder };
  }

  async createOrder(payload: {
    productId: string;
    shippingAddress: string;
    paymentMethod: string;
  }): Promise<Order> {
    await simulateNetworkConditions();
    const scenario = useAppStore.getState().demoScenario;
    const order = getMockOrder(scenario);

    order.paymentMethod = payload.paymentMethod || 'Apple Pay';
    currentOrder = order;
    return { ...currentOrder };
  }

  async releaseEscrow(orderId: string): Promise<{
    success: boolean;
    txHash: string;
    releasedAt: string;
  }> {
    await simulateNetworkConditions();
    const scenario = useAppStore.getState().demoScenario;
    if (!currentOrder) currentOrder = getMockOrder(scenario);

    currentOrder.escrowStatus = 'funds_released';
    currentOrder.inspectionRemainingSeconds = 0;

    // Add completed release event
    const lastEvent = currentOrder.trackingEvents[currentOrder.trackingEvents.length - 1];
    if (lastEvent) {
      lastEvent.status = 'completed';
      lastEvent.title = 'Funds Released to Seller';
      lastEvent.subtitle = 'USD $85.00 transferred to @urban_ceramics';
    }

    return {
      success: true,
      txHash: '0x3c990a1b22e8471c998f4410',
      releasedAt: new Date().toISOString(),
    };
  }

  async fileDispute(payload: DisputePayload): Promise<Dispute> {
    await simulateNetworkConditions();
    const scenario = useAppStore.getState().demoScenario;
    if (!currentOrder) currentOrder = getMockOrder(scenario);

    currentOrder.escrowStatus = 'dispute_frozen';

    const lastEvent = currentOrder.trackingEvents[currentOrder.trackingEvents.length - 1];
    if (lastEvent) {
      lastEvent.status = 'frozen';
      lastEvent.title = 'Dispute Filed — Escrow Frozen';
      lastEvent.subtitle = `Reason: ${payload.reason.replace('_', ' ').toUpperCase()} • In Neutral Review`;
    }

    return {
      id: 'disp_' + Math.random().toString(36).substring(2, 9),
      orderId: payload.orderId,
      reason: payload.reason,
      description: payload.description,
      evidenceImages: payload.evidenceImages,
      filedAt: new Date().toISOString(),
      status: 'arbitration_active',
      refundAmount: 85.00,
    };
  }

  async getWeightAudit(_orderId: string): Promise<WeightAudit> {
    await simulateNetworkConditions();
    const scenario = useAppStore.getState().demoScenario;
    return getMockOrder(scenario).weightAudit;
  }

  /* =========================================================================
   * PHASE 2 MARKETPLACE METHODS
   * ========================================================================= */

  async getListings(category?: string, query?: string): Promise<Listing[]> {
    await simulateNetworkConditions();
    let results = [...currentListings];

    if (category && category !== 'All') {
      results = results.filter(
        (l) => l.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.seller.name.toLowerCase().includes(q) ||
          l.seller.handle.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results;
  }

  async getRecentlyProtected(): Promise<RecentlyProtectedItem[]> {
    await simulateNetworkConditions();
    return [...mockRecentlyProtected];
  }

  async getPlatformFraudStats(): Promise<PlatformFraudStats> {
    await simulateNetworkConditions();
    return { ...mockPlatformFraudStats };
  }

  async getStorefront(_sellerId: string): Promise<Storefront> {
    await simulateNetworkConditions();
    return {
      ...mockStorefront,
      listings: currentListings.filter((l) => l.seller.handle === 'urban_ceramics'),
    };
  }

  async getPayouts(_sellerId: string): Promise<Payout> {
    await simulateNetworkConditions();
    return { ...mockPayouts };
  }

  async getSellerAnalytics(_sellerId: string): Promise<SellerAnalytics> {
    await simulateNetworkConditions();
    return { ...mockSellerAnalytics };
  }

  async getThreads(): Promise<Thread[]> {
    await simulateNetworkConditions();
    return [...mockThreads];
  }

  async createListing(payload: Partial<Listing>): Promise<Listing> {
    await simulateNetworkConditions();
    const newListing: Listing = {
      id: 'list_' + Math.random().toString(36).substring(2, 9),
      title: payload.title || 'Untitled Protected Item',
      subtitle: payload.subtitle || 'Handmade crafted piece',
      description: payload.description || 'Verified authentic item protected by TrustLink Escrow.',
      price: payload.price || 50.0,
      shippingFee: payload.shippingFee ?? 0.0,
      images: payload.images && payload.images.length > 0
        ? payload.images
        : ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80'],
      category: (payload.category as any) || 'Ceramics',
      seller: mockSeller,
      declaredWeightKg: payload.declaredWeightKg || 1.0,
      likesCount: 1,
      isEscrowGuaranteed: true,
      createdAt: new Date().toISOString(),
      tags: payload.tags || ['marketplace', 'escrow'],
    };

    currentListings = [newListing, ...currentListings];
    return newListing;
  }

  async getActiveOrders(): Promise<Order[]> {
    await simulateNetworkConditions();
    return currentOrder ? [currentOrder] : [];
  }

  async getPastOrders(): Promise<Order[]> {
    await simulateNetworkConditions();
    return [];
  }

  async triggerDemoScenario(scenario: import('@/types').DemoScenario, _orderId?: string): Promise<any> {
    currentOrder = getMockOrder(scenario);
    return { scenario, order: currentOrder };
  }

  async getComments(listingId: string): Promise<import('@/types').ListingComment[]> {
    await simulateNetworkConditions();
    return mockCommentsStore[listingId] || [
      {
        id: 'c_mock_1',
        author: 'alex_collector',
        authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&q=80',
        text: 'Is the declared shipping tare weight verified by carrier scale?',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c_mock_2',
        author: 'sarah_design',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&q=80',
        text: 'Stunning craftsmanship! Sent you a DM for escrow terms.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async addComment(listingId: string, text: string, author: string = 'verified_buyer'): Promise<import('@/types').ListingComment> {
    await simulateNetworkConditions();
    const comment = {
      id: 'c_mock_' + Date.now(),
      author,
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&q=80',
      text,
      createdAt: new Date().toISOString(),
    };
    if (!mockCommentsStore[listingId]) {
      mockCommentsStore[listingId] = [
        {
          id: 'c_mock_1',
          author: 'alex_collector',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&q=80',
          text: 'Is the declared shipping tare weight verified by carrier scale?',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    mockCommentsStore[listingId].push(comment);
    return comment;
  }
}

const mockCommentsStore: Record<string, import('@/types').ListingComment[]> = {};
let currentListings = [...mockListings];

