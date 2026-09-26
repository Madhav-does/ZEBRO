import { useState, useEffect } from "react"
import { Order } from "@/types"
import { useReleaseEscrow } from "@/hooks/useEscrow"
import { useAppStore } from "@/store/useAppStore"
import {
  Clock,
  KeyRound,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Loader2,
  PackageCheck,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InspectionClockProps {
  order: Order
}

export function InspectionClock({ order }: InspectionClockProps) {
  const { setIsDisputeOpen, setIsReceiptOpen } = useAppStore()
  const releaseEscrowMutation = useReleaseEscrow()

  const isFrozen = order.escrowStatus === "dispute_frozen"
  const isReleased = order.escrowStatus === "funds_released"
  const isInspecting = order.escrowStatus === "delivered_inspecting"
  const isPendingDelivery = order.escrowStatus === "payment_locked" || order.escrowStatus === "in_transit"

  // Initial calculation based on current order state
  const getInitialSeconds = () => {
    if (isReleased) return 0
    if (order.inspectionRemainingSeconds && order.inspectionRemainingSeconds > 0) {
      return order.inspectionRemainingSeconds
    }
    if (isInspecting) return 47 * 3600 + 58 * 60 + 24
    return 48 * 3600 // Full 48 hours queued
  }

  const [secondsRemaining, setSecondsRemaining] = useState<number>(getInitialSeconds)

  // Reactive state synchronization when backend order updates or user switches orders
  useEffect(() => {
    if (isReleased) {
      setSecondsRemaining(0)
    } else if (order.inspectionRemainingSeconds && order.inspectionRemainingSeconds > 0) {
      setSecondsRemaining(order.inspectionRemainingSeconds)
    } else if (isInspecting) {
      setSecondsRemaining((prev) => (prev > 0 && prev < 48 * 3600 ? prev : 47 * 3600 + 58 * 60 + 24))
    } else {
      setSecondsRemaining(48 * 3600)
    }
  }, [order.id, order.escrowStatus, order.inspectionRemainingSeconds, isReleased, isInspecting])

  // Live ticking countdown simulation while actively inspecting
  useEffect(() => {
    if (!isInspecting) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isInspecting])

  const hours = Math.floor(secondsRemaining / 3600)
  const minutes = Math.floor((secondsRemaining % 3600) / 60)
  const seconds = secondsRemaining % 60

  // 48 hours total in seconds = 172,800
  const maxSeconds = 48 * 3600
  const progressPct = isPendingDelivery
    ? 100
    : isReleased
    ? 0
    : Math.min(Math.max((secondsRemaining / maxSeconds) * 100, 0), 100)

  const handleReleaseEarly = () => {
    releaseEscrowMutation.mutate(order.id, {
      onSuccess: () => {
        setIsReceiptOpen(true)
      },
    })
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            {isPendingDelivery ? "48-Hour Inspection Window" : "Live Inspection Window"}
          </h3>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase",
            isFrozen && "bg-rose-500/15 text-rose-400 border-rose-500/30",
            isReleased && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
            isPendingDelivery && "bg-blue-500/15 text-blue-400 border-blue-500/30",
            isInspecting && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse"
          )}
        >
          {isFrozen
            ? "Escrow Frozen"
            : isReleased
            ? "Funds Released"
            : isPendingDelivery
            ? "Pending Delivery"
            : "Live Inspection (Ticking)"}
        </span>
      </div>

      {/* Countdown Ring & Digital Clock */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-background/50 border border-border/50">
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-muted/40"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn(
                  "transition-all duration-1000",
                  isFrozen
                    ? "text-rose-400"
                    : isPendingDelivery
                    ? "text-blue-400"
                    : isReleased
                    ? "text-zinc-600"
                    : "text-emerald-400"
                )}
                strokeDasharray={`${progressPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Clock
              className={cn(
                "w-5 h-5 absolute",
                isFrozen
                  ? "text-rose-400"
                  : isPendingDelivery
                  ? "text-blue-400"
                  : isReleased
                  ? "text-zinc-500"
                  : "text-emerald-400"
              )}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                {isPendingDelivery ? "Guaranteed Return Window" : "Remaining Inspection Time"}
              </span>
              {isPendingDelivery && (
                <span className="text-[9px] font-mono px-1 rounded bg-blue-500/20 text-blue-300">
                  Queued
                </span>
              )}
              {isInspecting && (
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-400">
                  Live
                </span>
              )}
            </div>

            <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground tabular-nums">
              {String(hours).padStart(2, "0")}h :{" "}
              {String(minutes).padStart(2, "0")}m :{" "}
              {String(seconds).padStart(2, "0")}s
            </div>

            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isFrozen
                ? "Timer paused. Dispute arbitration in progress."
                : isReleased
                ? "Inspection period elapsed. Payout settled to seller."
                : isPendingDelivery
                ? "48h window activates upon verified courier doorstep delivery."
                : "Funds auto-release to creator when timer hits 00:00:00."}
            </p>
          </div>
        </div>

        {/* 6-Digit Delivery OTP */}
        {order.deliveryOtp && (
          <div className="sm:border-l sm:border-border/60 sm:pl-4 text-center sm:text-right w-full sm:w-auto">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block flex items-center justify-center sm:justify-end gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" />
              Delivery OTP
            </span>
            <span className="text-lg font-mono font-bold tracking-widest text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 inline-block mt-1">
              {order.deliveryOtp}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Give code to courier at doorstep
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Confirm & Release vs Report Issue */}
      <div className="space-y-2 pt-1">
        {isReleased ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Escrow funds have been successfully released to @{order.seller.handle}.
              </span>
            </div>
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="text-xs font-bold underline hover:text-white"
            >
              View Receipt
            </button>
          </div>
        ) : isFrozen ? (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Escrow Vault Frozen — Smart Contract Lock Active</span>
            </div>
            <p className="text-[11px] text-rose-300">
              Payout is on hold. Neutral arbitrator has been assigned to review
              carrier scale telemetry and seller dispatch logs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Early Release Button */}
            <button
              onClick={handleReleaseEarly}
              disabled={releaseEscrowMutation.isPending}
              className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {releaseEscrowMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Releasing Vault Funds...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Confirm & Release Funds Early</span>
                </>
              )}
            </button>

            {/* Dispute / Freeze Button */}
            <button
              onClick={() => setIsDisputeOpen(true)}
              className="w-full h-11 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Report Issue / Freeze Escrow</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span>Non-custodial smart contract payout: ${(order.product.price + order.product.shippingFee).toFixed(2)} USD</span>
        </div>
      </div>
    </div>
  )
}
