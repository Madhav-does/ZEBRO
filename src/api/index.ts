import { ApiClient } from './client';
import { MockApiClient } from './mock';
import { Seller, Product, Order, WeightAudit, DisputePayload, Dispute, DemoScenario, Listing, RecentlyProtectedItem, PlatformFraudStats, Storefront, Payout, SellerAnalytics, Thread } from '@/types';
import { useAppStore } from '@/store/useAppStore';

/**
 * Determine dynamic base API URL based on runtime environment.
 * On Android Emulator (Capacitor native), 10.0.2.2 maps directly to the host PC's 127.0.0.1.
 */
export const getBaseApiUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  if (isNative) {
    return 'http://10.0.2.2:4000/api/v1';
  }
  return 'http://localhost:4000/api/v1';
};

/**
 * Zebro Full-Stack Environment Configuration
 */
export const ENV = {
  USE_MOCK_API: (import.meta as any).env?.VITE_USE_MOCK_API === 'true' ? true : false,
  get API_BASE_URL() {
    return getBaseApiUrl();
  },
  INSPECTION_WINDOW_SECONDS: parseInt((import.meta as any).env?.VITE_INSPECTION_WINDOW_SECONDS || '48', 10),
};

const mockFallback = new MockApiClient();

/**
 * Real API Client implementation with resilient local fallbacks
 * 
 * Connects frontend TanStack Query hooks directly to the Fastify backend.
 * Automatically authenticates with signed JWT tokens matching the current UI userRole.
 * If backend endpoints or network conditions are unavailable on mobile, falls back to
 * internal simulation state to ensure the demo is always smooth and never freezes.
 */
class RealApiClient implements ApiClient {
  private get baseUrl() {
    return ENV.API_BASE_URL;
  }
  private tokenCache: Record<string, string> = {};

  private async getAuthHeader(): Promise<string | undefined> {
    const role = useAppStore.getState().userRole || 'buyer';
    if (this.tokenCache[role]) {
      return `Bearer ${this.tokenCache[role]}`;
    }

    try {
      const handle = role === 'seller' ? 'urban_ceramics' : 'alex_k';
      const res = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, role }),
      });
      if (res.ok) {
        const data = await res.json();
        this.tokenCache[role] = data.token;
        return `Bearer ${data.token}`;
      }
    } catch {
      // Continue without token if network error
    }
    return undefined;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const authHeader = await this.getAuthHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...((options?.headers as Record<string, string>) || {}),
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (netErr) {
      // If 10.0.2.2 failed, try localhost:4000 in case adb reverse is active
      if (this.baseUrl.includes('10.0.2.2:4000')) {
        try {
          response = await fetch(`http://localhost:4000/api/v1${endpoint}`, {
            ...options,
            headers,
          });
        } catch {
          throw netErr;
        }
      } else {
        throw netErr;
      }
    }

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Fall back to default status message
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  }

  async getSeller(idOrHandle: string): Promise<Seller> {
    try {
      return await this.request<Seller>(`/sellers/${idOrHandle}`);
    } catch {
      return await mockFallback.getSeller(idOrHandle);
    }
  }

  async getProduct(id: string): Promise<Product> {
    try {
      return await this.request<Product>(`/products/${id}`);
    } catch {
      return await mockFallback.getProduct(id);
    }
  }

  async getOrder(id: string): Promise<Order> {
    try {
      return await this.request<Order>(`/orders/${id}`);
    } catch (err) {
      console.warn(`[RealApiClient] Failed to fetch order ${id} from server, using fallback:`, err);
      return await mockFallback.getOrder(id);
    }
  }

  async createOrder(payload: { productId: string; shippingAddress: string; paymentMethod: string }): Promise<Order> {
    try {
      const res = await this.request<any>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          listingId: payload.productId,
          shippingAddress: payload.shippingAddress,
          paymentMethod: payload.paymentMethod,
        }),
      });

      const orderId = res.orderId || res.id;
      if (orderId && (res.status === 'PAYMENT_PENDING' || res.escrowStatus === 'payment_locked')) {
        try {
          const confirmed = await this.request<Order>(`/orders/${orderId}/confirm-payment`, {
            method: 'POST',
          });
          return confirmed;
        } catch {
          return res as Order;
        }
      }
      return res as Order;
    } catch {
      return await mockFallback.createOrder(payload);
    }
  }

  async releaseEscrow(orderId: string): Promise<{ success: boolean; txHash: string; releasedAt: string }> {
    try {
      return await this.request<{ success: boolean; txHash: string; releasedAt: string }>(`/escrow/${orderId}/release`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('[RealApiClient] releaseEscrow failed on server, using fallback:', err);
      return await mockFallback.releaseEscrow(orderId);
    }
  }

  async fileDispute(payload: DisputePayload): Promise<Dispute> {
    try {
      return await this.request<Dispute>(`/escrow/${payload.orderId}/dispute`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[RealApiClient] fileDispute failed on server, using fallback:', err);
      return await mockFallback.fileDispute(payload);
    }
  }

  async getWeightAudit(orderId: string): Promise<WeightAudit> {
    try {
      return await this.request<WeightAudit>(`/escrow/${orderId}/weight-audit`);
    } catch {
      return await mockFallback.getWeightAudit(orderId);
    }
  }

  async getListings(category?: string, query?: string, shuffle?: boolean): Promise<Listing[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (query) params.append('q', query);
      if (shuffle) params.append('shuffle', 'true');
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return await this.request<Listing[]>(`/listings${queryStr}`);
    } catch {
      return await mockFallback.getListings(category, query, shuffle);
    }
  }

  async getRecentlyProtected(): Promise<RecentlyProtectedItem[]> {
    try {
      return await this.request<RecentlyProtectedItem[]>('/marketplace/recently-protected');
    } catch {
      return await mockFallback.getRecentlyProtected();
    }
  }

  async getPlatformFraudStats(): Promise<PlatformFraudStats> {
    try {
      return await this.request<PlatformFraudStats>('/marketplace/fraud-stats');
    } catch {
      return await mockFallback.getPlatformFraudStats();
    }
  }

  async getStorefront(sellerId: string): Promise<Storefront> {
    try {
      return await this.request<Storefront>(`/storefronts/${sellerId}`);
    } catch {
      return await mockFallback.getStorefront(sellerId);
    }
  }

  async getPayouts(sellerId: string): Promise<Payout> {
    try {
      return await this.request<Payout>(`/sellers/${sellerId}/payouts`);
    } catch {
      return await mockFallback.getPayouts(sellerId);
    }
  }

  async getSellerAnalytics(sellerId: string): Promise<SellerAnalytics> {
    try {
      return await this.request<SellerAnalytics>(`/sellers/${sellerId}/analytics`);
    } catch {
      return await mockFallback.getSellerAnalytics(sellerId);
    }
  }

  async getThreads(): Promise<Thread[]> {
    try {
      return await this.request<Thread[]>('/inbox/threads');
    } catch {
      return await mockFallback.getThreads();
    }
  }

  async createListing(payload: Partial<Listing>): Promise<Listing> {
    try {
      return await this.request<Listing>('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return await mockFallback.createListing(payload);
    }
  }

  async getActiveOrders(): Promise<Order[]> {
    try {
      const orders = await this.request<Order[]>('/orders/active');
      if (orders && orders.length > 0) return orders;
      return await mockFallback.getActiveOrders();
    } catch (err) {
      console.warn('[RealApiClient] getActiveOrders failed, using fallback:', err);
      return await mockFallback.getActiveOrders();
    }
  }

  async getPastOrders(): Promise<Order[]> {
    try {
      return await this.request<Order[]>('/orders/past');
    } catch {
      return await mockFallback.getPastOrders();
    }
  }

  async triggerDemoScenario(scenario: DemoScenario, orderId?: string): Promise<any> {
    try {
      return await this.request<any>('/demo/scenario', {
        method: 'POST',
        body: JSON.stringify({ scenario, orderId }),
      });
    } catch (err) {
      console.warn('[RealApiClient] /demo/scenario failed, falling back to local simulation:', err);
      return await mockFallback.triggerDemoScenario(scenario, orderId);
    }
  }

  async getComments(listingId: string): Promise<import('@/types').ListingComment[]> {
    try {
      return await this.request<import('@/types').ListingComment[]>(`/listings/${listingId}/comments`);
    } catch {
      return await mockFallback.getComments(listingId);
    }
  }

  async addComment(listingId: string, text: string, author?: string): Promise<import('@/types').ListingComment> {
    try {
      return await this.request<import('@/types').ListingComment>(`/listings/${listingId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text, author }),
      });
    } catch {
      return await mockFallback.addComment(listingId, text, author);
    }
  }
}

// Single singleton API instance consumed by all hooks
export const api: ApiClient = ENV.USE_MOCK_API ? mockFallback : new RealApiClient();
export * from './client';
