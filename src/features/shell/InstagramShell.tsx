import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { Listing } from "@/types"
import { InstagramTopBar } from "./InstagramTopBar"
import { BottomTabBar } from "./BottomTabBar"
import { HomeFeedView } from "@/features/home/HomeFeedView"
import { ExploreView } from "@/features/explore/ExploreView"
import { OrdersHubView } from "@/features/orders/OrdersHubView"
import { InboxView } from "@/features/inbox/InboxView"
import { ProfileView } from "@/features/profile/ProfileView"
import { MiniReceiptDrawer } from "@/features/home/MiniReceiptDrawer"
import { CheckoutView } from "@/features/checkout/CheckoutView"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShieldCheck, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function InstagramShell() {
  const { shellTab, setShellTab } = useAppStore()
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [activeListing, setActiveListing] = useState<Listing | null>(null)

  const handleBuyListing = (listing: Listing) => {
    setActiveListing(listing)
    setCheckoutModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative border-x border-border/30 shadow-2xl">
      {/* 1. Instagram Top Bar */}
      <InstagramTopBar />

      {/* 2. Main Tab Views */}
      <main className="flex-1 w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          {shellTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <HomeFeedView onBuyListing={handleBuyListing} />
            </motion.div>
          )}

          {shellTab === "explore" && (
            <motion.div
              key="explore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ExploreView onBuyListing={handleBuyListing} />
            </motion.div>
          )}

          {shellTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <OrdersHubView />
            </motion.div>
          )}

          {shellTab === "inbox" && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <InboxView />
            </motion.div>
          )}

          {shellTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Bottom 5-Tab Bar */}
      <BottomTabBar />

      {/* 4. Mini Receipt Drawer (Story Ticker popup) */}
      <MiniReceiptDrawer />

      {/* 5. Phase 1 Instant Checkout Embedded Drawer */}
      <Sheet open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-y-auto max-h-[92vh] bg-background border-t border-border/60">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />
          
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <SheetTitle className="text-sm font-bold">TrustLink Instant Checkout</SheetTitle>
            </div>
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            <CheckoutView />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
