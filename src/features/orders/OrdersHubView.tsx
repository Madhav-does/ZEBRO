import { useEffect } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useActiveOrders, usePastOrders } from "@/hooks/useEscrow"
import { TrackerView } from "@/features/tracker/TrackerView"
import { ShieldCheck, Package, CheckCircle2, ExternalLink, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

export function OrdersHubView() {
  const { ordersSubTab, setOrdersSubTab, setIsReceiptOpen, currentOrderId, setCurrentOrderId, setShellTab } = useAppStore()
  const { data: activeOrders = [] } = useActiveOrders()
  const { data: pastOrdersFromApi = [] } = usePastOrders()

  // Auto-select first active order from database if not set
  useEffect(() => {
    if (activeOrders.length > 0 && (!currentOrderId || !activeOrders.some(o => o.id === currentOrderId))) {
      setCurrentOrderId(activeOrders[0].id)
    }
  }, [activeOrders, currentOrderId, setCurrentOrderId])

  const defaultPastOrders = [
    {
      id: "ord_tl_882194",
      title: "Handmade Ceramic Mug & Saucer Set",
      seller: "urban_ceramics",
      price: 42.00,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80",
      status: "Released to Seller",
      date: "May 18, 2026",
      verifiedWeight: 0.38,
      txHash: "0x892a...c01f"
    },
    {
      id: "ord_tl_771920",
      title: "Vintage Italian Leather Crossbody Bag",
      seller: "retro_leather_co",
      price: 85.00,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop&q=80",
      status: "Released to Seller",
      date: "May 10, 2026",
      verifiedWeight: 0.62,
      txHash: "0x33b1...e45a"
    }
  ]

  const activeCount = activeOrders.length
  const pastOrdersList = pastOrdersFromApi.length > 0 
    ? pastOrdersFromApi.map(o => ({
        id: o.id,
        title: o.product.title,
        seller: o.seller.handle,
        price: o.product.price + o.product.shippingFee,
        image: o.product.images[0] || 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80',
        status: o.escrowStatus === 'funds_released' ? 'Released to Seller' : o.escrowStatus,
        date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        verifiedWeight: o.weightAudit.actualKg,
        txHash: o.escrowVaultAddress ? `${o.escrowVaultAddress.slice(0, 6)}...${o.escrowVaultAddress.slice(-4)}` : '0x8f3a...b12a'
      }))
    : defaultPastOrders

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Sub-tab Switcher: Active Escrow vs Past Orders */}
      <div className="flex p-1 bg-muted/60 rounded-xl border border-border/50">
        <button
          onClick={() => setOrdersSubTab("active")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            ordersSubTab === "active"
              ? "bg-background text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Active Escrow ({activeCount})</span>
        </button>

        <button
          onClick={() => setOrdersSubTab("past")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            ordersSubTab === "past"
              ? "bg-background text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Past Orders ({pastOrdersList.length})</span>
        </button>
      </div>

      {/* View Content */}
      {ordersSubTab === "active" ? (
        <div className="space-y-4">
          {/* Active Orders List Pill Selector if multiple orders exist */}
          {activeOrders.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {activeOrders.map((ord) => {
                const isSelected = ord.id === currentOrderId
                return (
                  <button
                    key={ord.id}
                    onClick={() => setCurrentOrderId(ord.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{ord.orderNumber}</span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      ${(ord.product.price + ord.product.shippingFee).toFixed(2)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {activeOrders.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-dashed border-border/80 bg-card/40 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">No Active Escrow Orders</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Purchases made in the Feed or Explore are protected by TrustLink neutral escrow until 48h after verified delivery.
              </p>
              <button
                onClick={() => setShellTab("home")}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
              >
                Discover Verified Creator Goods
              </button>
            </div>
          ) : (
            <>
              {/* Active Order Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-card to-background border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Order #{activeOrders.find(o => o.id === currentOrderId)?.orderNumber || `TL-${currentOrderId.slice(-7).toUpperCase()}`}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        PROTECTED
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Neutral Escrow Smart Vault Active</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400">Live FSM</span>
              </div>

              {/* Embedded Live Escrow Tracker */}
              <TrackerView orderId={currentOrderId} />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider px-1">
            Settled Escrow Transactions
          </p>

          {pastOrdersList.map((order) => (
            <div
              key={order.id}
              className="p-3.5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <img
                  src={order.image}
                  alt={order.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80"
                  }}
                  className="w-14 h-14 rounded-xl object-cover border border-border/50 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-foreground truncate">
                      {order.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-foreground shrink-0">
                      ${order.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    @{order.seller} · {order.date}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                      <CheckCircle2 className="w-3 h-3" />
                      {order.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-border/40">
                      <Scale className="w-2.5 h-2.5 text-emerald-400" />
                      {order.verifiedWeight} kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="font-mono text-muted-foreground text-[10px]">
                  Tx: {order.txHash}
                </span>

                <button
                  onClick={() => setIsReceiptOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  <span>View Proof Receipt</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
