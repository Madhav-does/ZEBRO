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
  const { setDemoScenario } = useAppStore()

  const handleSimulate = async (scenario: DemoScenario, actionLabel: string) => {
    setIsSimulating(true)
    setActiveAction(actionLabel)
    setDemoScenario(scenario)

    try {
      // Call backend directly with the active order ID
      await fetch("http://localhost:4000/api/v1/demo/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          orderId: order.id,
        }),
      })
    } catch (err) {
      console.warn("[Simulator] Could not trigger backend scenario directly, calling api client:", err)
      await api.triggerDemoScenario(scenario)
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-400 transition-all shadow-xs">
          <Scale className="w-3.5 h-3.5" />
          <span>Simulate Carrier & Scale</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-5 bg-background border-t border-border/60">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="text-left space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold">Postal Scale & FSM Simulator</SheetTitle>
              <p className="text-xs text-muted-foreground">
                Trigger real-time logistics events for Order #{order.orderNumber}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-3">
          {/* Action 1: Perfect Delivery */}
          <button
            onClick={() => handleSimulate("perfect_delivery", "scale_match")}
            disabled={isSimulating}
            className="w-full p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  1. Postal Scale Tare Match & Delivery
                  <span className="text-[10px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">
                    PASS
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Carrier intake scale scans {((order.weightAudit.declaredKg || 1.2) * 1.04).toFixed(2)}kg (matches manifest). Advances parcel to Doorstep Delivery.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "scale_match" ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 2: Weight Anomaly */}
          <button
            onClick={() => handleSimulate("weight_mismatch", "weight_anomaly")}
            disabled={isSimulating}
            className="w-full p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  2. Postal Scale Tare Deficit (Empty Box)
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-400">
                    ANOMALY
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Postal intake scale detects -66% tare deficit (0.40kg vs {order.weightAudit.declaredKg}kg). FSM immediately freezes neutral vault.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "weight_anomaly" ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            )}
          </button>

          {/* Action 3: Dispute Filed */}
          <button
            onClick={() => handleSimulate("dispute_filed", "dispute")}
            disabled={isSimulating}
            className="w-full p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-left flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  3. Unboxing Discrepancy Dispute
                  <span className="text-[10px] font-mono px-1 rounded bg-rose-500/20 text-rose-400">
                    DISPUTE
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Buyer files evidence photo. Smart contract locks funds and initiates 48h creator response window.
                </p>
              </div>
            </div>
            {isSimulating && activeAction === "dispute" ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
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
