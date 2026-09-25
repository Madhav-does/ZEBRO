import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAppStore } from "@/store/useAppStore"
import { GlobalHeader } from "@/components/shared/GlobalHeader"
import { OfflineBanner } from "@/components/shared/OfflineBanner"
import { DemoModeBadge } from "@/components/shared/DemoModeBadge"
import { CheckoutView } from "@/features/checkout/CheckoutView"
import { TrackerView } from "@/features/tracker/TrackerView"
import { InstagramShell } from "@/features/shell/InstagramShell"
import { DisputeBottomSheet } from "@/features/dispute/DisputeBottomSheet"
import { TrustReceiptModal } from "@/features/receipt/TrustReceiptModal"
import { ShoppingBag, Radio, Sparkles, Smartphone, Layers } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
      retry: 1,
    },
  },
})

function MainContent() {
  const { activeTab, setActiveTab, demoScenario, backendConnected, setBackendConnected } = useAppStore()
  // Mode switcher: Default is 'phase2' (Instagram Marketplace Shell), with 'phase1' (Isolated Checkout & Tracker)
  const [appMode, setAppMode] = useState<"phase2" | "phase1">("phase2")

  useEffect(() => {
    fetch("http://localhost:4000/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") setBackendConnected(true)
      })
      .catch(() => setBackendConnected(false))
  }, [setBackendConnected])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      <OfflineBanner />

      {/* Mode Switcher Bar for Hackathon Judges */}
      <aside aria-label="Demo Phase Switcher" className="w-full bg-muted/70 border-b border-border/40 py-1.5 px-4 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-foreground text-[11px]">TrustLink:</span>
            </div>

            {backendConnected ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Phase 3 Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-zinc-800 border border-border text-zinc-400">
                Mock Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setAppMode("phase2")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                appMode === "phase2"
                  ? "bg-emerald-500 text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone className="w-3 h-3" />
              <span>Phase 2 (Instagram Shell)</span>
            </button>

            <button
              onClick={() => setAppMode("phase1")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                appMode === "phase1"
                  ? "bg-emerald-500 text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="w-3 h-3" />
              <span>Phase 1 (Isolated View)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Render Mode */}
      {appMode === "phase2" ? (
        /* Phase 2: Instagram-Embedded Marketplace Shell */
        <InstagramShell />
      ) : (
        /* Phase 1: Pure Isolated Checkout & Tracker */
        <>
          <GlobalHeader />
          <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4 pb-20">
            {/* Animated Navigation Tabs */}
            <div className="relative mb-5 p-1 rounded-2xl bg-muted/50 border border-border/60 flex items-center backdrop-blur-md">
              <button
                onClick={() => setActiveTab("checkout")}
                className={cn(
                  "relative flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 z-10",
                  activeTab === "checkout" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === "checkout" && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-card border border-border/80 rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <ShoppingBag className="w-4 h-4" />
                <span>1. Instant Checkout</span>
              </button>

              <button
                onClick={() => setActiveTab("tracker")}
                className={cn(
                  "relative flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 z-10",
                  activeTab === "tracker" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === "tracker" && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-card border border-border/80 rounded-xl shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      demoScenario === "weight_mismatch"
                        ? "bg-amber-400"
                        : demoScenario === "dispute_filed"
                        ? "bg-rose-400"
                        : "bg-emerald-400"
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      demoScenario === "weight_mismatch"
                        ? "bg-amber-500"
                        : demoScenario === "dispute_filed"
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    )}
                  />
                </span>
                <Radio className="w-4 h-4" />
                <span>2. Live Escrow Tracker</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "checkout" ? (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckoutView />
                </motion.div>
              ) : (
                <motion.div
                  key="tracker"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrackerView />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}

      {/* Global Modals & Controls */}
      <DisputeBottomSheet />
      <TrustReceiptModal />
      <DemoModeBadge />
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainContent />
    </QueryClientProvider>
  )
}

export default App
