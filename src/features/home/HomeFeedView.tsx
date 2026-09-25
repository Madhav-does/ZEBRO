import React from "react"
import { useListings } from "@/hooks/useMarketplace"
import { RecentlyProtectedTicker } from "./RecentlyProtectedTicker"
import { PlatformFraudFeedWidget } from "./PlatformFraudFeedWidget"
import { IGProductCard } from "./IGProductCard"
import { Listing } from "@/types"
import { useAppStore } from "@/store/useAppStore"
import { Loader2 } from "lucide-react"

interface HomeFeedViewProps {
  onBuyListing: (listing: Listing) => void
}

export function HomeFeedView({ onBuyListing }: HomeFeedViewProps) {
  const { data: listings, isLoading } = useListings()

  return (
    <div className="flex flex-col pb-20">
      {/* 1. Recently Protected Escrows Ticker */}
      <RecentlyProtectedTicker />

      {/* 2. Feed Products with Pinned Fraud Stats Widget */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs">Loading Instagram marketplace feed...</span>
        </div>
      ) : !listings || listings.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          No listings available in this category.
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {listings.map((listing, index) => (
            <React.Fragment key={listing.id}>
              <IGProductCard
                listing={listing}
                onBuy={onBuyListing}
              />
              {/* Insert Platform Fraud Widget after the 2nd item */}
              {index === 1 && <PlatformFraudFeedWidget />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
