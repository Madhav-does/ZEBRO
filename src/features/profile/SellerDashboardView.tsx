import { useState } from "react"
import { useStorefront } from "@/hooks/useMarketplace"
import { useActiveOrders } from "@/hooks/useEscrow"
import { TrustScoreCard } from "@/features/seller/TrustScoreCard"
import { SellerAnalyticsCard } from "@/features/seller/SellerAnalyticsCard"
import { ProductListingForm } from "@/features/seller/ProductListingForm"
import { PayoutBalanceScreen } from "@/features/seller/PayoutBalanceScreen"
import { SellerDisputeView } from "@/features/seller/SellerDisputeView"
import { ShieldCheck, Plus, DollarSign, AlertTriangle, Scale, Star, ExternalLink, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SellerDashboardView() {
  const { data: storefront, isLoading } = useStorefront("urban_ceramics")
  const { data: activeOrders = [] } = useActiveOrders()
  const frozenCount = activeOrders.filter(
    (o) => o.escrowStatus === "dispute_frozen"
  ).length

  const [isListingFormOpen, setIsListingFormOpen] = useState(false)
  const [isPayoutOpen, setIsPayoutOpen] = useState(false)
  const [isDisputeOpen, setIsDisputeOpen] = useState(false)

  if (isLoading || !storefront) {
    return <div className="py-16 text-center text-xs text-muted-foreground">Loading seller dashboard...</div>
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Storefront Overview Card */}
      <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
        <div className="flex items-start gap-3">
          <img
            src={storefront.seller.avatarUrl}
            alt={storefront.seller.storeName || storefront.seller.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-foreground truncate">
                {storefront.seller.storeName || storefront.seller.name}
              </h3>
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5" />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              {storefront.bio}
            </p>

            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400" />
                {storefront.rating} ({storefront.reviewsCount})
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground font-mono">
                {storefront.activeListingsCount} Active Listings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => setIsListingFormOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Item</span>
        </Button>

        <Button
          onClick={() => setIsPayoutOpen(true)}
          variant="outline"
          className="border-border/60 hover:bg-muted text-xs h-10 rounded-xl flex items-center justify-center gap-1"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payouts</span>
        </Button>

        <Button
          onClick={() => setIsDisputeOpen(true)}
          variant="outline"
          className="border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs h-10 rounded-xl flex items-center justify-center gap-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Freeze ({frozenCount})</span>
        </Button>
      </div>

      {/* Tier 2 Trust Score Progress Card */}
      <TrustScoreCard />

      {/* Performance Analytics with Sparkline */}
      <SellerAnalyticsCard />

      {/* Storefront Active Listings */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-foreground">Active Store Listings ({storefront.listings.length})</h4>
          <span className="text-[10px] text-emerald-400 font-mono">All Escrow-Protected</span>
        </div>

        <div className="space-y-2">
          {storefront.listings.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-card border border-border/40 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-11 h-11 rounded-lg object-cover border border-border/50 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-mono">
                    <span>${item.price.toFixed(2)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Scale className="w-2.5 h-2.5" /> {item.declaredWeightKg} kg declared
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-sheets */}
      <ProductListingForm
        isOpen={isListingFormOpen}
        onClose={() => setIsListingFormOpen(false)}
      />

      <PayoutBalanceScreen
        isOpen={isPayoutOpen}
        onClose={() => setIsPayoutOpen(false)}
      />

      <SellerDisputeView
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
      />
    </div>
  )
}
