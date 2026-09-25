import { useSellerAnalytics } from "@/hooks/useMarketplace"
import { Eye, TrendingUp, CheckCircle, Clock } from "lucide-react"

export function SellerAnalyticsCard() {
  const { data: analytics, isLoading } = useSellerAnalytics("urban_ceramics")

  if (isLoading || !analytics) {
    return <div className="h-32 rounded-2xl bg-card border border-border/40 animate-pulse" />
  }

  // Generate lightweight SVG path from sparkline numbers
  const maxVal = Math.max(...analytics.sparkline)
  const minVal = Math.min(...analytics.sparkline)
  const range = maxVal - minVal || 1
  const width = 200
  const height = 40
  const points = analytics.sparkline
    .map((val, idx) => {
      const x = (idx / (analytics.sparkline.length - 1)) * width
      const y = height - ((val - minVal) / range) * (height - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground">Escrow Performance</h3>
        <span className="text-[10px] text-muted-foreground font-mono">Last 30 Days</span>
      </div>

      {/* 4 Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>Store Views</span>
          </div>
          <p className="text-sm font-bold font-mono text-foreground mt-0.5">
            {analytics.views.toLocaleString()}
          </p>
        </div>

        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Conversion Rate</span>
          </div>
          <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {analytics.conversionRate}%
          </p>
        </div>

        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Escrow Pass Rate</span>
          </div>
          <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {analytics.escrowSuccessRate}%
          </p>
        </div>

        <div className="p-2 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Avg Release Time</span>
          </div>
          <p className="text-sm font-bold font-mono text-foreground mt-0.5">
            {analytics.avgReleaseTimeHours}h
          </p>
        </div>
      </div>

      {/* Sparkline chart */}
      <div className="pt-2 border-t border-border/40">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Weekly Escrow Flow ($)</span>
          <span className="font-mono text-emerald-400">+18.4% vs last mo</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-500"
            points={points}
          />
        </svg>
      </div>
    </div>
  )
}
