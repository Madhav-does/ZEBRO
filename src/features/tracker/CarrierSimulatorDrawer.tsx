import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/api"
import { useAppStore } from "@/store/useAppStore"
import { DemoScenario, Order } from "@/types"
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Truck,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Package,
  Play,
  Coins,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface CarrierSimulatorDrawerProps {
  order: Order
}

export function CarrierSimulatorDrawer({ order }: CarrierSimulatorDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { setDemoScenario, setIsReceiptOpen } = useAppStore()

  const handleSimulate = async (scenario: DemoScenario, actionLabel: string) => {
    setIsSimulating(true)
    setActiveAction(actionLabel)
    setDemoScenario(scenario)

    try {
      if (scenario === "release_funds") {
        await api.releaseEscrow(order.id)
        setIsReceiptOpen(true)
      } else {
        await api.triggerDemoScenario(scenario, order.id)
      }
    } catch (err) {
      console.warn("[Simulator] Error triggering scenario:", err)
    } finally {
      // Invalidate queries so frontend reactively pulls the latest SQLite database state
      await queryClient.invalidateQueries({ queryKey: ["order"] })
      await queryClient.invalidateQueries({ queryKey: ["weight-audit"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      setIsSimulating(false)
      setActiveAction(null)
      setIsOpen(false)
    }
  }

  const declaredWeight = order.weightAudit?.declaredKg || 1.2

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-400 transition-all shadow-xs">
          <Scale className="w-3.5 h-3.5" />
          <span>Simulate Carrier & Scale</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-5 bg-background border-t border-border/60 max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="text-left space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Courier Lifecycle & FSM Simulator</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Trigger real logistics milestones for Order #{order.orderNumber}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2.5">
          {/* Action 1: Merchant Drop-Off & Scale Weigh-In */}
          <button
            onClick={() => handleSimulate("merchant_dropoff", "dropoff")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  1. Merchant Drops Off & Scale Weigh-In
                  <span className="text-[10px] font-mono px-1 rounded bg-blue-500/20 text-blue-300">
                    INTAKE
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  USPS Station clerk scans parcel on certified scale (NIST-CAL-7718). Verifies {(declaredWeight * 1.035).toFixed(2)}kg vs {declaredWeight.toFixed(2)}kg declared. Advances order to In Transit.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "dropoff" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 2: Courier Transit & Doorstep Delivery */}
          <button
            onClick={() => handleSimulate("out_for_delivery", "delivery")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  2. Courier Transit & Doorstep Drop
                  <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">
                    DELIVERY
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  USPS transports parcel through Denver & Austin hubs, confirms doorstep drop, and activates the live 48-second inspection countdown.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "delivery" ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 3: Auto-Play Full Journey */}
          <button
            onClick={() => handleSimulate("perfect_delivery", "full_journey")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  3. Auto-Play Complete Logistics Journey
                  <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-400">
                    AUTO
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Simulates dropoff, postal tare verification, and courier doorstep handover in continuous sequence.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "full_journey" ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 4: Empty Box Tare Anomaly */}
          <button
            onClick={() => handleSimulate("weight_mismatch", "weight_anomaly")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  4. Postal Scale Tare Anomaly (Empty Box)
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                    ANOMALY
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Counter scale flags -66% deficit (0.40kg vs {declaredWeight.toFixed(2)}kg declared). Smart contract instantly freezes vault funds.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "weight_anomaly" ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 5: In-Transit Tampering & Delivery Weight Loss */}
          <button
            onClick={() => handleSimulate("transit_tampering", "tampering")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  5. In-Transit Theft & Delivery Loss
                  <span className="text-[10px] font-mono px-1 rounded bg-rose-500/30 text-rose-300">
                    TAMPERING
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Passes origin counter at {(declaredWeight * 1.035).toFixed(2)}kg, but package is tampered between sorting hubs and delivery scale measures 0.35kg (-71% loss). Dual-point telemetry proves carrier liability.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "tampering" ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 6: Dispute Filed */}
          <button
            onClick={() => handleSimulate("dispute_filed", "dispute")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  6. Unboxing Discrepancy Dispute
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                    DISPUTE
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Customer submits photo evidence during inspection window. Freezes funds and assigns neutral arbitrator.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "dispute" ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 6: Confirm & Release Early */}
          <button
            onClick={() => handleSimulate("release_funds", "release")}
            disabled={isSimulating}
            className="w-full p-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/20 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  6. Confirm Satisfaction & Release Funds
                  <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/30 text-emerald-300">
                    SETTLE
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Buyer approves early release, disburses escrow payout to seller, and opens cryptographic Trust Receipt bill.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "release" ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-4">
          All events execute directly on the live SQLite database & EasyPost weight audit engine.
        </p>
      </SheetContent>
    </Sheet>
  )
}
