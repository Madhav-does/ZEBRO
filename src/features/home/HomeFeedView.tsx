import React, { useState, useEffect, useRef } from "react"
import { useListings } from "@/hooks/useMarketplace"
import { RecentlyProtectedTicker } from "./RecentlyProtectedTicker"
import { PlatformFraudFeedWidget } from "./PlatformFraudFeedWidget"
import { IGProductCard } from "./IGProductCard"
import { Listing } from "@/types"
import { Loader2, CheckCircle2, Sparkles } from "lucide-react"

interface HomeFeedViewProps {
  onBuyListing: (listing: Listing) => void
}

export function HomeFeedView({ onBuyListing }: HomeFeedViewProps) {
  const { data: allListings = [], isLoading } = useListings()
  const [displayedCount, setDisplayedCount] = useState<number>(4)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset or adjust displayed count when listings change
  useEffect(() => {
    if (allListings.length > 0 && displayedCount < 4) {
      setDisplayedCount(Math.min(4, allListings.length))
    }
  }, [allListings.length, displayedCount])

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || allListings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          // Simulate realistic Instagram network pagination delay (350ms)
          setTimeout(() => {
            setDisplayedCount((prev) => prev + 3)
            setIsLoadingMore(false)
          }, 350)
        }
      },
      { rootMargin: "300px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allListings.length, isLoadingMore])

  // Prepare visible listings: preserve original database ID so checkout matches real SQLite listing
  interface DisplayListing extends Listing {
    renderKey: string
  }
  const visibleListings: DisplayListing[] = []
  if (allListings.length > 0) {
    for (let i = 0; i < displayedCount; i++) {
      const original = allListings[i % allListings.length]
      visibleListings.push({
        ...original,
        renderKey: `${original.id}_feed_${i}`,
      })
    }
  }

  return (
    <div className="flex flex-col pb-24">
      {/* 1. Recently Protected Escrows Ticker (Story Tray) */}
      <RecentlyProtectedTicker />

      {/* 2. Feed Products with Pinned Fraud Stats Widget */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">Loading Instagram marketplace feed...</span>
        </div>
      ) : allListings.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          No listings available in this category.
        </div>
      ) : (
        <div className="divide-y divide-border/20">
          {visibleListings.map((listing, index) => (
            <React.Fragment key={listing.renderKey}>
              <IGProductCard listing={listing} onBuy={onBuyListing} />
              {/* Insert Platform Fraud Widget after the 2nd item */}
              {index === 1 && <PlatformFraudFeedWidget />}
            </React.Fragment>
          ))}

          {/* Infinite Scroll Sentinel & Loader */}
          <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center gap-2">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading more verified creator posts...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 py-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Scroll for endless verified marketplace discoveries</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
