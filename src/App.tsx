import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAppStore } from "@/store/useAppStore"
import { OfflineBanner } from "@/components/shared/OfflineBanner"
import { DemoModeBadge } from "@/components/shared/DemoModeBadge"
import { InstagramShell } from "@/features/shell/InstagramShell"
import { DisputeBottomSheet } from "@/features/dispute/DisputeBottomSheet"
import { TrustReceiptModal } from "@/features/receipt/TrustReceiptModal"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 mins
      retry: 1,
    },
  },
})

function MainContent() {
  const { setBackendConnected } = useAppStore()

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

      {/* TrustLink Standalone Application */}
      <InstagramShell />

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
