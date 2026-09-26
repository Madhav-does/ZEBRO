import { Lock, Scale, Clock, ShieldCheck, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function BentoEscrowGuarantee() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Triple-Layer Fraud Defense Guarantee
        </h3>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Zero-Risk Checkout
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Tile 1: Funds Locked in Escrow */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground">
              Smart Vault Escrow
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your money never goes directly to an unverified personal account. Funds rest in
              an immutable vault until you approve.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span>Non-custodial release</span>
          </div>
        </div>

        {/* Tile 2: Physical Weight Audit (The core empty-box anti-fraud feature!) */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-card/60 p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Anti-Scam
              </span>
            </div>
            <h4 className="text-xs font-bold text-foreground">
              Carrier Weight Audit
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Carriers physically weigh the parcel at intake. If an empty box is
              shipped, escrow locks automatically.
            </p>
          </div>

          {/* Mini Animated Scale Visual */}
          <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">Tolerance</span>
            <span className="text-emerald-400 font-semibold">±5% Strict</span>
          </div>
        </div>

        {/* Tile 3: 48h Inspection Window */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-foreground">
              48h Inspection Period
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Take 2 full days post-delivery to inspect authenticity. Confirm early
              or freeze funds with one tap.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span>Instant freeze button</span>
          </div>
        </div>
      </div>
    </div>
  )
}
