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
    staleTime: 2 * 1000,
    refetchInterval: (query) => {
      const status = query.state.data?.escrowStatus;
      if (status === 'funds_released' || status === 'refunded') {
        return false;
      }
      return 3000; // Live backend FSM reactive polling
    },
  });
}

export function useWeightAudit(orderId?: string) {
  const storeOrderId = useAppStore((state) => state.currentOrderId);
  const targetId = orderId || storeOrderId || 'ord_tl_8829104';
  const scenario = useAppStore((state) => state.demoScenario);

  return useQuery({
    queryKey: [...ESCROW_KEYS.weightAudit(targetId), scenario],
    queryFn: () => api.getWeightAudit(targetId),
    staleTime: 3 * 1000,
    refetchInterval: 4000,
  });
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ESCROW_KEYS.activeOrders,
    queryFn: () => api.getActiveOrders(),
    staleTime: 3 * 1000,
    refetchInterval: 4000,
  });
}

export function usePastOrders() {
  return useQuery({
    queryKey: ESCROW_KEYS.pastOrders,
    queryFn: () => api.getPastOrders(),
    staleTime: 10 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const setCurrentOrderId = useAppStore((state) => state.setCurrentOrderId);
  const setShellTab = useAppStore((state) => state.setShellTab);
  const setOrdersSubTab = useAppStore((state) => state.setOrdersSubTab);

  return useMutation({
    mutationFn: (payload: { productId: string; shippingAddress: string; paymentMethod: string }) =>
      api.createOrder(payload),
    onSuccess: (order: Order) => {
      setCurrentOrderId(order.id);
      setShellTab('orders');
      setOrdersSubTab('active');
      setActiveTab('tracker');
      queryClient.setQueryData([...ESCROW_KEYS.order(order.id), useAppStore.getState().demoScenario], order);
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
