import { usePlatformFraudStats } from "@/hooks/useMarketplace"
import { ShieldAlert, Scale, DollarSign, Activity, Lock } from "lucide-react"

export function PlatformFraudFeedWidget() {
  const { data: stats, isLoading } = usePlatformFraudStats()

  if (isLoading) {
    return (
      <div className="mx-4 my-3 p-4 rounded-xl border border-border/40 bg-card/40 animate-pulse h-28" />
    )
  }

  if (!stats) return null

  return (
    <section className="mx-4 my-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-card to-background p-4 shadow-sm relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with live pulse */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-foreground uppercase">
            TrustLink Network Shield
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE METRICS
        </div>
      </div>

      {/* 3-Column Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 relative z-10">
        {/* Metric 1: Frozen */}
        <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Frozen</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold font-mono text-foreground">
              {stats.disputesFrozenToday}
            </span>
            <p className="text-[9px] text-muted-foreground leading-tight">Fraud alerts stopped</p>
          </div>
        </div>

        {/* Metric 2: Audits Passed */}
        <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <Scale className="w-3 h-3 text-emerald-400" />
            <span>Scales OK</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold font-mono text-foreground">
              {stats.weightAuditsPassed}
            </span>
            <p className="text-[9px] text-muted-foreground leading-tight">0% tare deviation</p>
          </div>
        </div>

        {/* Metric 3: Total Protected */}
        <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
            <DollarSign className="w-3 h-3 text-amber-400" />
            <span>Protected</span>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold font-mono text-foreground">
              ${stats.totalProtectedVolume.toLocaleString()}
            </span>
            <p className="text-[9px] text-muted-foreground leading-tight">Active in escrow</p>
          </div>
        </div>
      </div>
    </section>
  )
}
