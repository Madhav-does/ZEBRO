import { useAppStore } from "@/store/useAppStore"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ShieldCheck, Scale, CheckCircle2, ArrowRight, Hash, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MiniReceiptDrawer() {
  const { selectedMiniReceipt, setSelectedMiniReceipt, setIsReceiptOpen } = useAppStore()

  const isOpen = !!selectedMiniReceipt

  const handleOpenFullReceipt = () => {
    setSelectedMiniReceipt(null)
    setIsReceiptOpen(true)
  }

  if (!selectedMiniReceipt) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && setSelectedMiniReceipt(null)}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-md mx-auto p-0 overflow-hidden bg-card border-t border-border/60">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold flex items-center gap-1.5">
                  Verified Escrow Proof
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                    PASSED
                  </span>
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Receipt #{selectedMiniReceipt.receiptId}
                </p>
              </div>
            </div>

            <span className="text-base font-mono font-extrabold text-emerald-400">
              ${selectedMiniReceipt.amount.toFixed(2)}
            </span>
          </div>

          {/* Product & Participants Row */}
          <div className="flex items-center gap-3.5 bg-muted/30 p-3 rounded-xl border border-border/40">
            <img
              src={selectedMiniReceipt.itemImage}
              alt={selectedMiniReceipt.itemTitle}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80"
              }}
              className="w-14 h-14 rounded-lg object-cover border border-border/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-foreground truncate">
                {selectedMiniReceipt.itemTitle}
              </h4>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                <span className="truncate">@{selectedMiniReceipt.sellerHandle}</span>
                <span>→</span>
                <span className="truncate text-foreground font-medium">@{selectedMiniReceipt.buyerHandle}</span>
              </div>
            </div>
          </div>

          {/* Verification Highlights Bento */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-muted/20 border border-border/30 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audited Weight</span>
              </div>
              <p className="text-xs font-mono font-bold text-foreground">
                {selectedMiniReceipt.verifiedWeightKg} kg <span className="text-emerald-400 font-normal text-[10px]">match (0.0% dev)</span>
              </p>
            </div>

            <div className="bg-muted/20 border border-border/30 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Protected At</span>
              </div>
              <p className="text-xs font-mono font-medium text-foreground truncate">
                {selectedMiniReceipt.timestamp.includes("ago")
                  ? selectedMiniReceipt.timestamp
                  : isNaN(Date.parse(selectedMiniReceipt.timestamp))
                  ? selectedMiniReceipt.timestamp
                  : new Date(selectedMiniReceipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Tx Hash Ledger Verification */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                CRYPTOGRAPHIC PROOF RECORDED
              </span>
              <span className="text-[10px] text-muted-foreground">Polygon PoS</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground truncate">
              <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{selectedMiniReceipt.txHash}</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleOpenFullReceipt}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs h-10 shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>View Full Trust Receipt & On-Chain Audit</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
