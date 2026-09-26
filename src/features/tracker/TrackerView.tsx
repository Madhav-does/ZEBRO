import { useOrder } from "@/hooks/useEscrow"
import { useAppStore } from "@/store/useAppStore"
import { LifecycleStepperBar } from "./LifecycleStepperBar"
import { WeightAuditCard } from "./WeightAuditCard"
import { TransitRoutePreview } from "./TransitRoutePreview"
import { InspectionClock } from "./InspectionClock"
import { ChainOfCustodyLedger } from "./ChainOfCustodyLedger"
import { CarrierSimulatorDrawer } from "./CarrierSimulatorDrawer"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  Lock,
  ShieldAlert,
} from "lucide-react"

export function TrackerView({ orderId }: { orderId?: string } = {}) {
  const { demoScenario, setIsReceiptOpen } = useAppStore()
  const { data: order, isLoading, isError, refetch } = useOrder(orderId)

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="p-8 text-center rounded-3xl border border-destructive/30 bg-destructive/5 space-y-4 my-6">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <div>
          <h3 className="text-base font-bold text-foreground">
            Unable to Retrieve Escrow Tracker
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Could not fetch order state from the escrow ledger.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Sync
        </button>
      </div>
    )
  }

  const isAnomaly = demoScenario === "weight_mismatch" || order.weightAudit.status === "anomaly"
  const isTampered = demoScenario === "transit_tampering" || !!order.weightAudit.tamperDetected
  const isDisputed = demoScenario === "dispute_filed" || (order.escrowStatus === "dispute_frozen" && !isTampered && !isAnomaly)
  const totalAmount = order.product.price + order.product.shippingFee

  const getStatusLabel = () => {
    switch (order.escrowStatus) {
      case "dispute_frozen":
        return "Escrow Frozen"
      case "funds_released":
        return "Funds Released"
      case "intake_audit":
        return "Intake Audit Anomaly"
      case "delivered_inspecting":
        return "Delivered & Inspecting"
      case "in_transit":
        return "In Transit"
      default:
        return "Escrow Locked"
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Escrow Status Banner */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {order.orderNumber}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  {getStatusLabel()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {formatCurrency(totalAmount)} Locked in Vault
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CarrierSimulatorDrawer order={order} />

            <button
              onClick={() => setIsReceiptOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted text-xs font-semibold text-foreground transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Receipt</span>
            </button>
          </div>
        </div>

        {/* Dynamic Scenario Advisory Note */}
        {isAnomaly && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-200">
                Automated Protection Active: Weight Anomaly Detected
              </span>
              <span>
                Carrier intake scale logged a significant weight deficit.
                Payout to creator has been paused pending unboxing confirmation.
              </span>
            </div>
          </div>
        )}

        {isTampered && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-rose-200">
                In-Transit Theft Detected: Carrier Liability Flagged
              </span>
              <span>
                Origin postal scale verified {order.weightAudit.actualKg}kg dispatched, but destination arrival scan measured only {order.weightAudit.deliveryWeightKg || 0.35}kg (-71% loss).
                Escrow vault is frozen to protect the buyer; carrier insurance covers the seller.
              </span>
            </div>
          </div>
        )}

        {isDisputed && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-200">
                Dispute Filed: Smart Contract Frozen
              </span>
              <span>
                Buyer requested arbitration on {new Date().toLocaleDateString()}.
                Reason: Empty box / package discrepancy.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Lifecycle Progress Stepper Bar */}
      <LifecycleStepperBar order={order} />

      {/* 48-Hour Inspection Timer & Release / Freeze Controls */}
      <InspectionClock order={order} />

      {/* Carrier Intake Weight Audit Card (Pivotal Anti-Scam Feature) */}
      <WeightAuditCard audit={order.weightAudit} />

      {/* EasyPost Transit Route Preview */}
      <TransitRoutePreview
        route={order.transitRoute}
        carrierName={order.carrierName}
        trackingNumber={order.trackingNumber}
        currentStatus={order.escrowStatus}
      />

      {/* Cryptographic Chain-of-Custody Ledger */}
      <ChainOfCustodyLedger events={order.trackingEvents} />
    </div>
  )
}
