import { useState } from "react"
import { Order } from "@/types"
import { api } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/store/useAppStore"
import {
  CheckCircle2,
  Scale,
  Truck,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Loader2,
  Box,
  KeyRound,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LifecycleStepperBarProps {
  order: Order
}

export function LifecycleStepperBar({ order }: LifecycleStepperBarProps) {
  const queryClient = useQueryClient()
  const { setDemoScenario, setIsReceiptOpen } = useAppStore()
  const [isAdvancing, setIsAdvancing] = useState(false)

  const status = order.escrowStatus
  const isLocked = status === "payment_locked"
  const isTransit = status === "in_transit"
  const isInspecting = status === "delivered_inspecting"
  const isReleased = status === "funds_released"
  const isFrozen = status === "dispute_frozen"

  // 4 Main stages
  const steps = [
    {
      id: "step1",
      name: "Payment Vaulted",
      desc: "Escrow Locked",
      completed: true,
      active: isLocked,
      icon: ShieldCheck,
    },
    {
      id: "step2",
      name: "Postal Scale Intake",
      desc: isLocked ? "Pending Drop-off" : "NIST Tare Passed",
      completed: !isLocked,
      active: isLocked,
      icon: Scale,
    },
    {
      id: "step3",
      name: "Hubs & Delivery",
      desc: isLocked ? "Queued" : isTransit ? "In Transit" : "Delivered",
      completed: isInspecting || isReleased,
      active: isTransit,
      icon: Truck,
    },
    {
      id: "step4",
      name: "48s Inspection",
      desc: isReleased ? "Finalized" : isInspecting ? "Clock Live" : "Pending",
      completed: isReleased,
      active: isInspecting,
      icon: Clock,
    },
  ]

  const handleAdvance = async (scenario: "merchant_dropoff" | "out_for_delivery" | "release_funds") => {
    setIsAdvancing(true)
    setDemoScenario(scenario)

    try {
      if (scenario === "release_funds") {
        await api.releaseEscrow(order.id)
        setIsReceiptOpen(true)
      } else {
        await api.triggerDemoScenario(scenario, order.id)
      }
    } catch (err) {
      console.warn("[LifecycleStepper] Error advancing stage:", err)
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["order"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      setIsAdvancing(false)
    }
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/70 p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-4">
      {/* Stepper Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <h3 className="font-bold text-xs sm:text-sm text-foreground">
            Order Lifecycle Progress
          </h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          Step {isLocked ? "1 of 4" : isTransit ? "2 of 4" : isInspecting ? "3 of 4" : "4 of 4 Completed"}
        </span>
      </div>

      {/* 4 Step Visual Pills */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((st, idx) => {
          const Icon = st.icon
          return (
            <div
              key={st.id}
              className={cn(
                "p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1",
                st.completed && !st.active && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                st.active && "bg-blue-500/15 border-blue-500/40 text-blue-400 ring-2 ring-blue-500/20",
                !st.completed && !st.active && "bg-muted/30 border-border/40 text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  st.completed && !st.active && "bg-emerald-500/20 text-emerald-400",
                  st.active && "bg-blue-500/20 text-blue-400 animate-pulse",
                  !st.completed && !st.active && "bg-muted text-muted-foreground/60"
                )}
              >
                {st.completed && !st.active ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold truncate w-full">
                {st.name}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground truncate hidden sm:block">
                {st.desc}
              </span>
            </div>
          )
        })}
      </div>

      {/* Interactive Current Action Stage Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-background/60 border border-border/60 space-y-3">
        {isLocked && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Box className="w-4 h-4 text-amber-400" />
                <span>Next Lifecycle Event: Merchant Drop-Off & Postal Counter Weigh-In</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Payment is secured in the smart vault. The merchant packages the item and brings it to USPS Station #97201. The NIST-certified postal scale verifies parcel weight against the declared manifest before courier transit begins.
              </p>
            </div>

            <button
              onClick={() => handleAdvance("merchant_dropoff")}
              disabled={isAdvancing}
              className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isAdvancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Executing Scale Weigh-In...</span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4 text-slate-950" />
                  <span>Advance: Simulate Merchant Drop-off & Postal Scale Scan</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </>
              )}
            </button>
          </>
        )}

        {isTransit && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Next Lifecycle Event: Courier Doorstep Delivery & Handover</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scale audit PASSED ({order.weightAudit.actualKg} kg verified vs {order.weightAudit.declaredKg} kg declared). The package is in transit across sorting hubs. Advance to simulate courier arrival at customer doorstep with OTP verification.
              </p>
            </div>

            <button
              onClick={() => handleAdvance("out_for_delivery")}
              disabled={isAdvancing}
              className="w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isAdvancing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Simulating Doorstep Handover...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>Advance: Simulate Courier Doorstep Delivery (Starts 48s Clock)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </>
              )}
            </button>
          </>
        )}

        {isInspecting && (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Live State: 48-Second Inspection Clock is Ticking</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Doorstep delivery confirmed with OTP {order.deliveryOtp}. You have 48 seconds to inspect the item. Funds automatically release to @{order.seller.handle} when timer reaches 0, or click below to release early.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleAdvance("release_funds")}
                disabled={isAdvancing}
                className="w-full h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isAdvancing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Disbursing Funds...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Confirm & Release Funds Early</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleAdvance("merchant_dropoff")}
                className="w-full h-10 rounded-xl border border-border/80 bg-background/50 hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preview Cryptographic Receipt</span>
              </button>
            </div>
          </>
        )}

        {isReleased && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Escrow Settlement Complete & Finalized</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Payment has been released from smart vault to @{order.seller.handle}. Verified on Base L2.
              </p>
            </div>

            <button
              onClick={() => setIsReceiptOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Cryptographic Bill</span>
            </button>
          </div>
        )}

        {isFrozen && (
          <div className="space-y-1 text-xs text-rose-300">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Escrow State Frozen</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Automated protection active. Neutral arbitrator has been assigned to review carrier telemetry.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
