import { useState } from "react"
import { AlertTriangle, ShieldCheck, Scale, Upload, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface SellerDisputeViewProps {
  isOpen: boolean
  onClose: () => void
}

export function SellerDisputeView({ isOpen, onClose }: SellerDisputeViewProps) {
  const [resolutionStep, setResolutionStep] = useState<"review" | "uploaded" | "resolved">("review")

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-y-auto max-h-[90vh] bg-card border-t border-border/60">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="p-5 space-y-4">
          <SheetHeader className="text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold">Escrow Dispute Arbitration</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Order #TL-8829104 · Funds Frozen ($54.00)</p>
              </div>
            </div>
          </SheetHeader>

          {/* Dispute Context Banner */}
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-400">Dispute Claim: Tare Weight Discrepancy</span>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                CONTRACT FROZEN
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hub scale recorded 0.31 kg vs declared 0.42 kg (-26.1% deviation). Buyer filed claim for missing accessory. Smart contract payout is held until verification evidence is supplied.
            </p>
          </div>

          {resolutionStep === "review" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground">Seller Evidence Submission</h4>
                <p className="text-[11px] text-muted-foreground">
                  Provide your USPS/UPS drop-off counter receipt showing calibrated tare weight at intake:
                </p>

                <div
                  onClick={() => setResolutionStep("uploaded")}
                  className="border-2 border-dashed border-border/60 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-muted/20 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Upload Scale Tare Receipt</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG or PDF (Simulated tap to submit)</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResolutionStep("resolved")
                  }}
                  className="flex-1 text-xs h-10 border-border/50"
                >
                  Accept Return & Refund
                </Button>
                <Button
                  onClick={() => setResolutionStep("uploaded")}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10"
                >
                  Submit Counter Evidence
                </Button>
              </div>
            </div>
          )}

          {resolutionStep === "uploaded" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Evidence Submitted to Arbitrator</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Receipt OCR verification underway. Resolution expected within 6 hours.
                </p>
              </div>
              <Button
                onClick={() => {
                  setResolutionStep("review")
                  onClose()
                }}
                className="w-full bg-muted text-foreground hover:bg-muted/80 text-xs h-10"
              >
                Done
              </Button>
            </div>
          )}

          {resolutionStep === "resolved" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Return Label Generated</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Escrow will refund buyer upon return parcel intake scan.
                </p>
              </div>
              <Button
                onClick={() => {
                  setResolutionStep("review")
                  onClose()
                }}
                className="w-full bg-muted text-foreground hover:bg-muted/80 text-xs h-10"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
