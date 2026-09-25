import { useState, useEffect, useRef } from "react"
import { useListings } from "@/hooks/useMarketplace"
import { useAppStore } from "@/store/useAppStore"
import { Listing } from "@/types"
import { Search, X, ShieldCheck, Scale, Loader2, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ExploreViewProps {
  onBuyListing: (listing: Listing) => void
}

const CATEGORIES = ["All", "Ceramics", "Apparel", "Prints", "Jewelry", "Home", "Watches", "Tech", "Leather Goods", "Vintage"]
const FALLBACK_THUMB = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=80"

export function ExploreView({ onBuyListing }: ExploreViewProps) {
  const { exploreCategory, setExploreCategory, exploreSearchQuery, setExploreSearchQuery } = useAppStore()
  const { data: allListings = [], isLoading } = useListings(
    exploreCategory === "All" ? undefined : exploreCategory,
    exploreSearchQuery || undefined
  )

  const [displayedCount, setDisplayedCount] = useState<number>(6)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset displayed count on category or search change
  useEffect(() => {
    setDisplayedCount(6)
  }, [exploreCategory, exploreSearchQuery])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || allListings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setDisplayedCount((prev) => prev + 6)
            setIsLoadingMore(false)
          }, 300)
        }
      },
      { rootMargin: "250px" }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [allListings.length, isLoadingMore])

  const visibleListings: Listing[] = []
  if (allListings.length > 0) {
    for (let i = 0; i < displayedCount; i++) {
      const original = allListings[i % allListings.length]
      visibleListings.push({
        ...original,
        id: `${original.id}_exp_${i}`,
      })
    }
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-3.5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search escrow-protected goods & creators..."
          value={exploreSearchQuery}
          onChange={(e) => setExploreSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10 bg-muted/40 rounded-xl border-border/40 text-xs focus-visible:ring-emerald-500"
        />
        {exploreSearchQuery && (
          <button
            onClick={() => setExploreSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setExploreCategory(cat)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-xl border shrink-0 transition-all font-medium",
              exploreCategory === cat
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold shadow-xs"
                : "bg-card border-border/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2-Column Product Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs">Exploring marketplace listings...</span>
        </div>
      ) : allListings.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          No items found matching "{exploreSearchQuery}".
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {visibleListings.map((item) => (
              <div
                key={item.id}
                onClick={() => onBuyListing(item)}
                className="group cursor-pointer rounded-2xl border border-border/40 bg-card overflow-hidden hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Product Thumbnail */}
                <div className="relative aspect-square w-full bg-muted/30 overflow-hidden">
                  <img
                    src={item.images[0] || FALLBACK_THUMB}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Shield badge */}
                  <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-emerald-400 p-1 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                  </div>

                  {/* Weight badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-zinc-300 px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-0.5">
                    <Scale className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{item.declaredWeightKg}kg</span>
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-foreground">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.shippingFee && item.shippingFee > 0 ? `+$${item.shippingFee.toFixed(2)}` : "Free ship"}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </p>

                  <p className="text-[10px] text-muted-foreground truncate">
                    @{item.seller.handle || item.seller.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading more items...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
