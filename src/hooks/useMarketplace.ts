import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { Listing } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export const MARKETPLACE_KEYS = {
  listings: (category?: string, query?: string) => ['marketplace', 'listings', category || 'all', query || ''] as const,
  recentlyProtected: ['marketplace', 'recently-protected'] as const,
  fraudStats: ['marketplace', 'fraud-stats'] as const,
  storefront: (sellerId: string) => ['marketplace', 'storefront', sellerId] as const,
  payouts: (sellerId: string) => ['marketplace', 'payouts', sellerId] as const,
  analytics: (sellerId: string) => ['marketplace', 'analytics', sellerId] as const,
  threads: ['marketplace', 'threads'] as const,
};

export function useListings(category?: string, query?: string) {
  const feedVersion = useAppStore((state) => state.feedVersion);

  return useQuery({
    queryKey: [...MARKETPLACE_KEYS.listings(category, query), feedVersion],
    queryFn: () => api.getListings(category, query, feedVersion > 0),
    staleTime: 60 * 1000,
  });
}

export function useRecentlyProtected() {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.recentlyProtected,
    queryFn: () => api.getRecentlyProtected(),
    staleTime: 60 * 1000,
  });
}

export function usePlatformFraudStats() {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.fraudStats,
    queryFn: () => api.getPlatformFraudStats(),
    staleTime: 30 * 1000,
  });
}

export function useStorefront(sellerId: string = 'urban_ceramics') {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.storefront(sellerId),
    queryFn: () => api.getStorefront(sellerId),
    staleTime: 60 * 1000,
  });
}

export function usePayouts(sellerId: string = 'urban_ceramics') {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.payouts(sellerId),
    queryFn: () => api.getPayouts(sellerId),
    staleTime: 30 * 1000,
  });
}

export function useSellerAnalytics(sellerId: string = 'urban_ceramics') {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.analytics(sellerId),
    queryFn: () => api.getSellerAnalytics(sellerId),
    staleTime: 60 * 1000,
  });
}

export function useThreads() {
  return useQuery({
    queryKey: MARKETPLACE_KEYS.threads,
    queryFn: () => api.getThreads(),
    staleTime: 30 * 1000,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Listing>) => api.createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'storefront'] });
    },
  });
}
