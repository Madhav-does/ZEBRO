import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { DisputePayload, Order } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export const ESCROW_KEYS = {
  seller: (handle: string) => ['seller', handle] as const,
  product: (id: string) => ['product', id] as const,
  order: (id: string) => ['order', id] as const,
  weightAudit: (orderId: string) => ['weight-audit', orderId] as const,
  activeOrders: ['orders', 'active'] as const,
  pastOrders: ['orders', 'past'] as const,
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

export function useOrder(orderId?: string) {
  const storeOrderId = useAppStore((state) => state.currentOrderId);
  const targetId = orderId || storeOrderId || 'ord_tl_8829104';
  const scenario = useAppStore((state) => state.demoScenario);
  
  return useQuery({
    // Include scenario in key to trigger reactive refetch on demo scenario toggle
    queryKey: [...ESCROW_KEYS.order(targetId), scenario],
    queryFn: () => api.getOrder(targetId),
    staleTime: 5 * 1000,
    refetchInterval: 5000, // Poll state automatically so backend FSM events update live
  });
}

export function useWeightAudit(orderId?: string) {
  const storeOrderId = useAppStore((state) => state.currentOrderId);
  const targetId = orderId || storeOrderId || 'ord_tl_8829104';
  const scenario = useAppStore((state) => state.demoScenario);

  return useQuery({
    queryKey: [...ESCROW_KEYS.weightAudit(targetId), scenario],
    queryFn: () => api.getWeightAudit(targetId),
    staleTime: 5 * 1000,
  });
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ESCROW_KEYS.activeOrders,
    queryFn: () => api.getActiveOrders(),
    staleTime: 5 * 1000,
    refetchInterval: 10000,
  });
}

export function usePastOrders() {
  return useQuery({
    queryKey: ESCROW_KEYS.pastOrders,
    queryFn: () => api.getPastOrders(),
    staleTime: 15 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setCurrentOrderId = useAppStore((state) => state.setCurrentOrderId);

  return useMutation({
    mutationFn: (payload: { productId: string; shippingAddress: string; paymentMethod: string }) =>
      api.createOrder(payload),
    onSuccess: (order: Order) => {
      setCurrentOrderId(order.id);
      queryClient.setQueryData([...ESCROW_KEYS.order(order.id), useAppStore.getState().demoScenario], order);
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDisputeOpen(false);
    },
  });
}
