import { WeightAudit } from "@/types"
import { formatWeight } from "@/lib/utils"
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Truck,
  Box,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface WeightAuditCardProps {
  audit: WeightAudit
}

export function WeightAuditCard({ audit }: WeightAuditCardProps) {
  const isTampered = !!audit.tamperDetected
  const isAnomaly = audit.status === "anomaly" && !isTampered
  const isPending = audit.status === "pending"
  const isMatch = audit.status === "match" && !isTampered

  // Scale bounds from 0 to 2.0 kg
  const maxScale = 2.0
  const declaredPct = Math.min(Math.max((audit.declaredKg / maxScale) * 100, 0), 100)
  const actualPct = audit.actualKg
    ? Math.min(Math.max((audit.actualKg / maxScale) * 100, 0), 100)
    : 0

  const deliveryKg = audit.deliveryWeightKg || 0.35
  const deliveryPct = Math.min(Math.max((deliveryKg / maxScale) * 100, 0), 100)

  const minToleranceKg = audit.declaredKg - audit.toleranceKg
  const maxToleranceKg = audit.declaredKg + audit.toleranceKg
  const minTolerancePct = Math.max((minToleranceKg / maxScale) * 100, 0)
  const maxTolerancePct = Math.min((maxToleranceKg / maxScale) * 100, 100)

  const delta = isPending ? 0 : audit.actualKg - audit.declaredKg
  const deltaPct = isPending ? "0.0" : ((delta / audit.declaredKg) * 100).toFixed(1)

  const tamperLossKg = audit.actualKg - deliveryKg
  const tamperLossPct = ((tamperLossKg / (audit.actualKg || audit.declaredKg)) * 100).toFixed(1)

  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl border p-4 sm:p-5 backdrop-blur-md shadow-sm transition-all",
        isTampered
          ? "border-rose-500/50 bg-rose-500/10 shadow-rose-500/10"
          : isAnomaly
          ? "border-rose-500/50 bg-rose-500/5 shadow-rose-500/10"
          : "border-border/80 bg-card/60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
              isTampered || isAnomaly
                ? "bg-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 text-emerald-400"
            )}
          >
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {isTampered ? "Dual-Point Telemetry: In-Transit Audit" : "Carrier Intake Weight Audit"}
              </h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Anti-Scam Telemetry
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isTampered
                ? "Two-point certified weight audit: origin postal scale vs delivery scale"
                : "Direct telemetry from carrier intake certified postal scale"}
            </p>
          </div>
        </div>

        {/* Audit Status Pill */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
            isTampered && "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
            isMatch && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
            isAnomaly && "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse",
            isPending && "bg-amber-500/15 text-amber-400 border-amber-500/30"
          )}
        >
          {isTampered && <ShieldAlert className="w-3.5 h-3.5" />}
          {isMatch && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isAnomaly && <AlertTriangle className="w-3.5 h-3.5" />}
          {isPending && <Clock className="w-3.5 h-3.5" />}
          <span className="uppercase text-[11px] font-mono tracking-wide">
            {isTampered
              ? "Tampered in Transit"
              : isMatch
              ? "Audit Passed"
              : isAnomaly
              ? "Intake Deficit"
              : "Pending Weigh-In"}
          </span>
        </div>
      </div>

      {/* IN-TRANSIT TAMPERING BANNER (Scenario B) */}
      {isTampered && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Carrier In-Transit Theft Confirmed (Dual-Point Telemetry)</span>
          </div>

          <p className="text-[11px] leading-relaxed text-rose-200">
            <strong>Origin Scale (#97201):</strong> Verified seller shipped full <strong>{formatWeight(audit.actualKg)}</strong> (Match ✓).<br />
            <strong>Delivery Arrival Scale:</strong> Measured only <strong>{formatWeight(deliveryKg)}</strong> (-{tamperLossPct}% weight loss).
          </p>

          <div className="p-2.5 rounded-xl bg-background/60 border border-rose-500/20 text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Carrier Liability Determination:</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Because origin intake scale verified 1.24kg, <strong>seller fraud is completely ruled out</strong>. Package was compromised while under USPS custody between Denver and Austin sorting facilities. Smart contract escrow auto-freezes to protect buyer; carrier insurance covers the seller.
            </p>
          </div>
        </div>
      )}

      {/* ORIGIN DEFICIT ANOMALY BANNER (Scenario A) */}
      {isAnomaly && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-200">
                Origin Intake Deficit: Empty Box / Partial Package
              </span>
              <span>
                Carrier postal scale at origin counter measured <strong>{formatWeight(audit.actualKg)}</strong> vs declared{" "}
                <strong>{formatWeight(audit.declaredKg)}</strong> ({deltaPct}% variance).
                Escrow payout is <strong>frozen at origin counter before dispatch</strong>.
              </span>
            </div>
          </div>
          {audit.notes && (
            <p className="text-[10px] text-rose-400/90 font-mono mt-1 pt-1 border-t border-rose-500/30">
              Station Log: {audit.notes}
            </p>
          )}
        </div>
      )}

      {/* Weight Metrics Cards */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-background/50 border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Declared Weight
          </span>
          <span className="text-base font-bold font-mono text-foreground">
            {formatWeight(audit.declaredKg)}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Seller manifest specification
          </span>
        </div>

        <div className="p-3 rounded-xl bg-background/50 border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Origin Counter Scale
          </span>
          <span
            className={cn(
              "text-base font-bold font-mono",
              isAnomaly
                ? "text-rose-400"
                : isPending
                ? "text-amber-400"
                : "text-emerald-400"
            )}
          >
            {isPending ? "Pending Drop-off" : formatWeight(audit.actualKg)}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            {isPending ? "Awaiting counter weigh-in" : isAnomaly ? `${deltaPct}% Deficit` : `Match (NIST-CAL-7718)`}
          </span>
        </div>

        {isTampered ? (
          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-bold">
              Delivery Handover Scale
            </span>
            <span className="text-base font-bold font-mono text-rose-400">
              {formatWeight(deliveryKg)}
            </span>
            <span className="text-[10px] text-rose-300 block mt-0.5">
              -{tamperLossPct}% stolen in transit
            </span>
          </div>
        ) : (
          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-background/50 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
              Tolerance Range
            </span>
            <span className="text-base font-bold font-mono text-foreground">
              ±{formatWeight(audit.toleranceKg)}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Allowed: {minToleranceKg.toFixed(2)}kg - {maxToleranceKg.toFixed(2)}kg
            </span>
          </div>
        )}
      </div>

      {/* Helpful note banner when pending dropoff */}
      {isPending && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            {audit.notes || "Merchant is packaging order. Postal scale intake tare scan will execute when dropped off at USPS counter."}
          </span>
        </div>
      )}

      {/* Visual Weight Tolerance Bar */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>0.0 kg</span>
          <span>1.0 kg</span>
          <span>2.0 kg</span>
        </div>

        <div className="relative h-6 w-full rounded-xl bg-muted/60 border border-border/60 overflow-visible flex items-center">
          {/* Tolerance Zone Band */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
            style={{
              left: `${minTolerancePct}%`,
              width: `${maxTolerancePct - minTolerancePct}%`,
            }}
            title="Acceptable Weight Tolerance Window"
          />

          {/* Declared marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/70 z-10"
            style={{ left: `${declaredPct}%` }}
          >
            <div className="absolute -top-5 -translate-x-1/2 text-[9px] font-mono font-bold bg-background border border-border px-1 rounded text-foreground whitespace-nowrap">
              Declared ({audit.declaredKg}kg)
            </div>
          </div>

          {/* Origin actual reading marker (only when verified by scale) */}
          {!isPending && audit.actualKg > 0 && (
            <div
              className={cn(
                "absolute top-0 bottom-0 w-1 z-20 transition-all",
                isAnomaly ? "bg-rose-500" : "bg-emerald-400"
              )}
              style={{ left: `${actualPct}%` }}
            >
              <div
                className={cn(
                  "absolute -bottom-6 -translate-x-1/2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-black whitespace-nowrap shadow-md",
                  isAnomaly ? "bg-rose-400" : "bg-emerald-400"
                )}
              >
                {isTampered ? `Origin: ${audit.actualKg}kg ✓` : `Actual: ${audit.actualKg}kg`}
              </div>
            </div>
          )}

          {/* Delivery tampered reading marker (if in-transit tampering occurred) */}
          {isTampered && (
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-rose-500 z-30 transition-all animate-pulse"
              style={{ left: `${deliveryPct}%` }}
            >
              <div className="absolute -bottom-6 -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-rose-500 text-white whitespace-nowrap shadow-lg">
                Arrival: {deliveryKg}kg ⚠️
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
            Acceptable tolerance window
          </span>
          <span className="font-mono text-muted-foreground truncate max-w-xs">
            {isTampered
              ? "Dual Audit: Portland #97201 ➔ Austin #78701"
              : `${audit.carrierStation} (${audit.scaleId})`}
          </span>
        </div>
      </div>
    </div>
  )
}
