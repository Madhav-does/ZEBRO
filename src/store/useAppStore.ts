import { create } from 'zustand';
import { Locale, DemoScenario } from '@/types';

interface AppState {
  theme: 'light' | 'dark';
  locale: Locale;
  activeTab: 'checkout' | 'tracker';
  demoScenario: DemoScenario;
  isDisputeOpen: boolean;
  isReceiptOpen: boolean;
  isRiskFactorsOpen: boolean;
  isOfflineSimulated: boolean;
  isSimulatingSlowNetwork: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setLocale: (locale: Locale) => void;
  setActiveTab: (tab: 'checkout' | 'tracker') => void;
  setDemoScenario: (scenario: DemoScenario) => void;
  setDisputeOpen: (open: boolean) => void;
  setIsDisputeOpen: (open: boolean) => void;
  setReceiptOpen: (open: boolean) => void;
  setIsReceiptOpen: (open: boolean) => void;
  setRiskFactorsOpen: (open: boolean) => void;
  setOfflineSimulated: (offline: boolean) => void;
  setSimulatingSlowNetwork: (slow: boolean) => void;

  /* Phase 2 Marketplace State */
  shellTab: import('@/types').ShellTab;
  setShellTab: (tab: import('@/types').ShellTab) => void;
  userRole: import('@/types').UserRole;
  setUserRole: (role: import('@/types').UserRole) => void;
  ordersSubTab: 'active' | 'past';
  setOrdersSubTab: (sub: 'active' | 'past') => void;
  selectedListingId: string | null;
  setSelectedListingId: (id: string | null) => void;
  isListingDetailOpen: boolean;
  setIsListingDetailOpen: (open: boolean) => void;
  selectedMiniReceipt: import('@/types').RecentlyProtectedItem | null;
  setSelectedMiniReceipt: (item: import('@/types').RecentlyProtectedItem | null) => void;
  exploreCategory: string;
  setExploreCategory: (cat: string) => void;
  exploreSearchQuery: string;
  setExploreSearchQuery: (query: string) => void;
  currentOrderId: string;
  setCurrentOrderId: (id: string) => void;
  backendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;
  feedVersion: number;
  refreshFeed: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  locale: 'en',
  activeTab: 'checkout',
  demoScenario: 'perfect_delivery',
  isDisputeOpen: false,
  isReceiptOpen: false,
  isRiskFactorsOpen: false,
  isOfflineSimulated: false,
  isSimulatingSlowNetwork: false,

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },

  setLocale: (locale) => set({ locale }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setDemoScenario: (demoScenario) => set({ demoScenario }),
  setDisputeOpen: (isDisputeOpen) => set({ isDisputeOpen }),
  setIsDisputeOpen: (isDisputeOpen) => set({ isDisputeOpen }),
  setReceiptOpen: (isReceiptOpen) => set({ isReceiptOpen }),
  setIsReceiptOpen: (isReceiptOpen) => set({ isReceiptOpen }),
  setRiskFactorsOpen: (isRiskFactorsOpen) => set({ isRiskFactorsOpen }),
  setOfflineSimulated: (isOfflineSimulated) => set({ isOfflineSimulated }),
  setSimulatingSlowNetwork: (isSimulatingSlowNetwork) => set({ isSimulatingSlowNetwork }),

  /* Phase 2 Initial State & Setters */
  shellTab: 'home',
  setShellTab: (shellTab) => set({ shellTab }),
  userRole: 'buyer',
  setUserRole: (userRole) => set({ userRole }),
  ordersSubTab: 'active',
  setOrdersSubTab: (ordersSubTab) => set({ ordersSubTab }),
  selectedListingId: null,
  setSelectedListingId: (selectedListingId) => set({ selectedListingId }),
  isListingDetailOpen: false,
  setIsListingDetailOpen: (isListingDetailOpen) => set({ isListingDetailOpen }),
  selectedMiniReceipt: null,
  setSelectedMiniReceipt: (selectedMiniReceipt) => set({ selectedMiniReceipt }),
  exploreCategory: 'All',
  setExploreCategory: (exploreCategory) => set({ exploreCategory }),
  exploreSearchQuery: '',
  setExploreSearchQuery: (exploreSearchQuery) => set({ exploreSearchQuery }),
  currentOrderId: '',
  setCurrentOrderId: (currentOrderId) => set({ currentOrderId }),
  backendConnected: false,
  setBackendConnected: (backendConnected) => set({ backendConnected }),
  feedVersion: 0,
  refreshFeed: () => set((state) => ({ feedVersion: state.feedVersion + 1 })),
}));
