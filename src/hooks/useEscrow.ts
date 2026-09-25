import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { DisputePayload } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export const ESCROW_KEYS = {
  seller: (handle: string) => ['seller', handle] as const,
  product: (id: string) => ['product', id] as const,
  order: (id: string) => ['order', id] as const,
  weightAudit: (orderId: string) => ['weight-audit', orderId] as const,
};

export function useSeller(handleOrId: string = 'urban_ceramics') {
  return useQuery({
    queryKey: ESCROW_KEYS.seller(handleOrId),
    queryFn: () => api.getSeller(handleOrId),
    staleTime: 60 * 1000,
  });
}

export function useProduct(productId: string = 'prod_ceramic_vase_01') {
  return useQuery({
    queryKey: ESCROW_KEYS.product(productId),
    queryFn: () => api.getProduct(productId),
    staleTime: 60 * 1000,
  });
}

export function useOrder(orderId: string = 'ord_tl_8829104') {
  const scenario = useAppStore((state) => state.demoScenario);
  
  return useQuery({
    // Include scenario in key to trigger reactive refetch on demo scenario toggle
    queryKey: [...ESCROW_KEYS.order(orderId), scenario],
    queryFn: () => api.getOrder(orderId),
    staleTime: 10 * 1000,
  });
}

export function useWeightAudit(orderId: string = 'ord_tl_8829104') {
  const scenario = useAppStore((state) => state.demoScenario);

  return useQuery({
    queryKey: [...ESCROW_KEYS.weightAudit(orderId), scenario],
    queryFn: () => api.getWeightAudit(orderId),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  return useMutation({
    mutationFn: (payload: { productId: string; shippingAddress: string; paymentMethod: string }) =>
      api.createOrder(payload),
    onSuccess: (order) => {
      queryClient.setQueryData([...ESCROW_KEYS.order(order.id), useAppStore.getState().demoScenario], order);
      queryClient.invalidateQueries({ queryKey: ['order'] });
      // Switch to tracker tab to show live escrow
      setActiveTab('tracker');
    },
  });
}

export function useReleaseEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.releaseEscrow(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useFileDispute() {
  const queryClient = useQueryClient();
  const setDisputeOpen = useAppStore((state) => state.setDisputeOpen);

  return useMutation({
    mutationFn: (payload: DisputePayload) => api.fileDispute(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      setDisputeOpen(false);
    },
  });
}
