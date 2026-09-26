import React, { useState, useEffect, useRef } from "react"
import { useListings } from "@/hooks/useMarketplace"
import { useAppStore } from "@/store/useAppStore"
import { RecentlyProtectedTicker } from "./RecentlyProtectedTicker"
import { PlatformFraudFeedWidget } from "./PlatformFraudFeedWidget"
import { IGProductCard } from "./IGProductCard"
import { Listing } from "@/types"
import { Loader2, Sparkles, Check } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

interface HomeFeedViewProps {
  onBuyListing: (listing: Listing) => void
}

export function HomeFeedView({ onBuyListing }: HomeFeedViewProps) {
  const { t } = useTranslation()
  const feedVersion = useAppStore((state) => state.feedVersion)
  const { data: allListings = [], isLoading } = useListings()
  const [displayedCount, setDisplayedCount] = useState<number>(4)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset displayed count when feedVersion changes (e.g. clicking Zebro title)
  useEffect(() => {
    setDisplayedCount(4)
  }, [feedVersion])

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
        if (target.isIntersecting && !isLoadingMore && displayedCount < allListings.length) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setDisplayedCount((prev) => Math.min(prev + 4, allListings.length))
            setIsLoadingMore(false)
          }, 350)
        }
      },
      { rootMargin: "300px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allListings.length, isLoadingMore, displayedCount])

  // Prepare visible listings: strictly slice unique products to prevent duplicate pictures
  interface DisplayListing extends Listing {
    renderKey: string
  }
  const visibleListings: DisplayListing[] = allListings
    .slice(0, displayedCount)
    .map((original, i) => ({
      ...original,
      renderKey: `${original.id}_feed_v${feedVersion}_${i}`,
    }))

  return (
    <div className="flex flex-col pb-24">
      {/* 1. Recently Protected Escrows Ticker (Story Tray) */}
      <RecentlyProtectedTicker />

      {/* 2. Feed Products with Pinned Fraud Stats Widget */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">{t("loading_feed")}</span>
        </div>
      ) : allListings.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted-foreground">
          {t("no_listings")}
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

          {/* Infinite Scroll Sentinel & Loader / Caught Up State */}
          <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center gap-2">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>{t("loading_more_posts")}</span>
              </div>
            ) : displayedCount >= allListings.length && allListings.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4 px-6 text-center animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-foreground">You're All Caught Up</span>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  You've viewed all {allListings.length} verified creator listings on Zebro. Tap the Zebro logo above anytime to refresh!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 py-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Scroll for more verified products</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
