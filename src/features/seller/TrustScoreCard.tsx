import { useState } from "react"
import { ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, Award, Zap, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function TrustScoreCard() {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentScore = 88
  const tierProgress = 75 // 75% toward Tier 3

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-card to-background p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-foreground">Seller Trust Tier</h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                TIER 2
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Standard 48h Escrow Release</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-mono font-extrabold text-foreground">{currentScore}</span>
          <span className="text-[10px] text-muted-foreground font-mono">/100</span>
        </div>
      </div>

      {/* Progress Bar to Tier 3 */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Next: Tier 3 (Instant Escrow Payouts)
          </span>
          <span className="font-mono text-emerald-400 font-bold text-[10px]">
            {tierProgress}% complete
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
      </div>

      {/* Expandable Checklist for Tier 3 unlock */}
      <div className="pt-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground py-1 transition-colors"
        >
          <span>Requirements to reach Tier 3</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2 pt-2 border-t border-border/40 text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-foreground">Tare Weight Accuracy &gt; 99%</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400">99.8% (Passed)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-foreground">Zero Chargebacks or Freezes</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400">0/0 (Passed)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-foreground">Complete 10 Escrow Deliveries</span>
              </div>
              <span className="font-mono text-[10px] text-amber-400">8 / 10 done</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
