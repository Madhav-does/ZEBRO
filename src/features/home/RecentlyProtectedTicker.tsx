import { useRecentlyProtected } from "@/hooks/useMarketplace"
import { useAppStore } from "@/store/useAppStore"
import { ShieldCheck, Sparkles } from "lucide-react"

export function RecentlyProtectedTicker() {
  const { data: items, isLoading } = useRecentlyProtected()
  const { setSelectedMiniReceipt } = useAppStore()

  if (isLoading) {
    return (
      <div className="py-3 px-4 flex gap-4 overflow-x-auto no-scrollbar border-b border-border/30">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted/60" />
            <div className="w-12 h-2.5 rounded bg-muted/60" />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) return null

  return (
    <section className="border-b border-border/30 bg-card/20 py-3">
      {/* Ticker Header Tag */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1">
            Recently Protected Escrows
          </span>
        </div>
        <span className="text-[10px] text-emerald-500 font-mono font-medium flex items-center gap-0.5">
          <Sparkles className="w-3 h-3" /> Live Feed
        </span>
      </div>

      {/* Horizontal Story Bubble Scroll */}
      <div className="flex gap-3.5 px-4 overflow-x-auto no-scrollbar scroll-smooth">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedMiniReceipt(item)}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            aria-label={`View receipt for ${item.itemTitle}`}
          >
            {/* Story Ring: Emerald-Teal gradient with verify badge */}
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 shadow-sm group-hover:scale-105 transition-transform duration-200">
              <div className="p-0.5 rounded-full bg-background">
                <img
                  src={item.itemImage}
                  alt={item.itemTitle}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=128&h=128&fit=crop&q=80"
                  }}
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-background shadow-xs">
                <ShieldCheck className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Buyer Handle & Amount */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-foreground max-w-[68px] truncate group-hover:text-emerald-400 transition-colors">
                @{item.buyerHandle}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-500">
                ${item.amount}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
