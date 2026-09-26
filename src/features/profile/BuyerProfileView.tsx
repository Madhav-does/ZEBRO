import { ShieldCheck, Shield, CheckCircle2, PackageCheck, AlertCircle, Lock, ArrowUpRight, Package, ExternalLink, Scale } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { useActiveOrders, usePastOrders } from "@/hooks/useEscrow"

export function BuyerProfileView() {
  const { setShellTab, setOrdersSubTab, setCurrentOrderId, setIsReceiptOpen } = useAppStore()
  const { data: activeOrders = [] } = useActiveOrders()
  const { data: pastOrders = [] } = usePastOrders()

  const allOrders = [...activeOrders, ...pastOrders]
  const ordersProtectedCount = allOrders.length
  const disputesCount = allOrders.filter(
    (o) => o.escrowStatus === "dispute_frozen"
  ).length
  const totalEscrowed = allOrders.reduce(
    (acc, o) => acc + (o.product.price + o.product.shippingFee),
    0
  )

  return (
    <div className="space-y-4 pt-1">
      {/* Buyer Protection Status Bento */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-card to-background border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">Verified Buyer Shield</h3>
              <p className="text-[11px] text-muted-foreground font-mono">ID: tl_usr_99812</p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            TIER 1 PROTECTED
          </span>
        </div>

        {/* 3-stat buyer metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className="text-sm font-bold font-mono text-foreground">
              {ordersProtectedCount}
            </span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Orders Protected</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className={disputesCount > 0 ? "text-sm font-bold font-mono text-rose-400" : "text-sm font-bold font-mono text-emerald-400"}>
              {disputesCount}
            </span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Disputes Active</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className="text-sm font-bold font-mono text-foreground">
              ${Math.round(totalEscrowed)}
            </span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Total Escrowed</p>
          </div>
        </div>
      </div>

      {/* Quick link to active orders if present */}
      {activeOrders.length > 0 && (
        <button
          onClick={() => {
            setOrdersSubTab("active")
            setShellTab("orders")
          }}
          className="w-full p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-between text-xs transition-colors group"
        >
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-300">
              Track {activeOrders.length} Live Escrow Order{activeOrders.length > 1 ? "s" : ""}
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Order History / Settled Escrow Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Order History ({pastOrders.length})
            </h4>
          </div>

          <button
            onClick={() => {
              setOrdersSubTab("past")
              setShellTab("orders")
            }}
            className="text-[11px] text-emerald-400 hover:underline font-medium"
          >
            Open in Hub ➔
          </button>
        </div>

        {pastOrders.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-border/70 bg-card/40 space-y-2">
            <Package className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold text-foreground">No Past Orders Yet</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Completed transactions and settled escrow receipts will appear here once funds are released.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pastOrders.map((ord) => {
              const price = (ord?.product?.price ?? 0) + (ord?.product?.shippingFee ?? 0)
              const dateStr = ord?.createdAt
                ? new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Recent"
              const weightStr = (ord?.weightAudit?.actualKg ?? ord?.weightAudit?.declaredKg ?? 1.2).toFixed(2)

              return (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm space-y-2.5 shadow-xs hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={ord?.product?.images?.[0] || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80"}
                      alt={ord?.product?.title || "Product"}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80"
                      }}
                      className="w-12 h-12 rounded-xl object-cover border border-border/50 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {ord?.product?.title || "Protected Item"}
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground shrink-0">
                          ${price.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        @{ord?.seller?.handle || "creator"} · {dateStr}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Funds Released
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-400 bg-zinc-800/40 px-1.5 py-0.5 rounded border border-border/40">
                          <Scale className="w-2.5 h-2.5 text-emerald-400" />
                          {weightStr} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-muted-foreground text-[10px]">
                      Vault: {ord.escrowVaultAddress ? `${ord.escrowVaultAddress.slice(0, 8)}...` : "0x8f3a..."}
                    </span>

                    <button
                      onClick={() => {
                        setCurrentOrderId(ord.id)
                        setIsReceiptOpen(true)
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <span>Proof Receipt</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Escrow Guarantee Privileges */}
      <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          Active Buyer Protections
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">48-Hour Inspection Window</p>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Funds are never released until 48 hours after courier delivery confirmation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">Automated Scale Tare Audit</p>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Courier scales verify parcel weight against seller's declared specs before final transit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-[11px]">Instant Anomaly Freezing</p>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Any weight mismatch or buyer claim instantly halts smart contract fund release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
