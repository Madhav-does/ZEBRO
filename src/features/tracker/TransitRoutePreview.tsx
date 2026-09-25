import { useState } from "react"
import { TransitRoute } from "@/types"
import { Truck, Copy, Check, Package } from "lucide-react"

interface TransitRoutePreviewProps {
  route: TransitRoute
  carrierName: string
  trackingNumber: string
  currentStatus: string
}

export function TransitRoutePreview({
  route,
  carrierName,
  trackingNumber,
  currentStatus,
}: TransitRoutePreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isDelivered =
    currentStatus === "delivered_inspecting" ||
    currentStatus === "funds_released" ||
    currentStatus === "dispute_frozen"

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-4">
      {/* Top Bar: Carrier and Tracking Number */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {carrierName}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                EasyPost Synced
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <span>{trackingNumber}</span>
              <button
                onClick={handleCopy}
                className="hover:text-foreground p-0.5 transition-colors"
                title="Copy tracking number"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Status
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            {isDelivered ? "Delivered" : "In Transit"}
          </span>
        </div>
      </div>

      {/* Origin -> Destination Route Visual */}
      <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
            <div>
              <span className="font-semibold text-foreground block">
                {route.origin}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Seller Origin
              </span>
            </div>
          </div>

          <div className="flex-1 mx-3 flex items-center justify-center">
            <div className="relative w-full flex items-center">
              <div className="w-full h-0.5 bg-border/80" />
              <div
                className="absolute h-0.5 bg-emerald-400 transition-all duration-500"
                style={{ width: `${route.currentProgress}%` }}
              />
              <div
                className="absolute -top-2.5 -translate-x-1/2 p-1 rounded-full bg-card border border-emerald-400 text-emerald-400 shadow-sm"
                style={{ left: `${route.currentProgress}%` }}
              >
                {isDelivered ? (
                  <Package className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Truck className="w-3 h-3 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div>
              <span className="font-semibold text-foreground block">
                {route.destination}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Buyer Delivery
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
          </div>
        </div>

        {/* ETA & Checkpoint Summary */}
        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Transit Update:</span>
          <span className="font-mono text-foreground font-medium">
            {route.eta}
          </span>
        </div>
      </div>
    </div>
  )
}
