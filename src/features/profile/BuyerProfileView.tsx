import { ShieldCheck, Shield, CheckCircle2, PackageCheck, AlertCircle, Lock, ArrowUpRight } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"

export function BuyerProfileView() {
  const { setShellTab } = useAppStore()

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
            <span className="text-sm font-bold font-mono text-foreground">6</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Orders Protected</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className="text-sm font-bold font-mono text-emerald-400">0</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Disputes Filed</p>
          </div>
          <div className="p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className="text-sm font-bold font-mono text-foreground">$384</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Total Escrowed</p>
          </div>
        </div>
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

      {/* Quick link to active order */}
      <button
        onClick={() => setShellTab("orders")}
        className="w-full p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/50 flex items-center justify-between text-xs transition-colors group"
      >
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-foreground">Track Live In-Transit Escrow</span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>
    </div>
  )
}
