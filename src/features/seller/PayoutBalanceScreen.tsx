import { usePayouts } from "@/hooks/useMarketplace"
import { ShieldCheck, ArrowDownLeft, Clock, AlertTriangle, CheckCircle2, Lock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface PayoutBalanceScreenProps {
  isOpen: boolean
  onClose: () => void
}

export function PayoutBalanceScreen({ isOpen, onClose }: PayoutBalanceScreenProps) {
  const { data: payout, isLoading } = usePayouts("urban_ceramics")

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-y-auto max-h-[90vh] bg-card border-t border-border/60">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="p-5 space-y-4">
          <SheetHeader className="text-left pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold">Escrow Payouts & Balance</SheetTitle>
                  <p className="text-[11px] text-muted-foreground">Direct ACH / Stripe Connect</p>
                </div>
              </div>
            </div>
          </SheetHeader>

          {isLoading || !payout ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Loading balance ledger...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Balance Cards Bento */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-card to-background border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    Available for Payout
                  </span>
                  <div className="text-xl font-mono font-extrabold text-emerald-400">
                    ${payout.availableBalance.toFixed(2)}
                  </div>
                  <span className="text-[9px] text-emerald-500/80 font-mono">Released from escrow</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-card to-background border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Locked in Escrow
                    </span>
                    <Lock className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-xl font-mono font-extrabold text-amber-400">
                    ${payout.inEscrowBalance.toFixed(2)}
                  </div>
                  <span className="text-[9px] text-amber-500/80 font-mono">Under 48h inspection</span>
                </div>
              </div>

              {/* Monthly volume summary pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 text-xs">
                <span className="text-muted-foreground">Released This Month</span>
                <span className="font-mono font-bold text-foreground">
                  ${payout.releasedThisMonth.toFixed(2)} USD
                </span>
              </div>

              {/* Payout Action */}
              <Button
                disabled={payout.availableBalance <= 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Transfer ${payout.availableBalance.toFixed(2)} to Bank Account</span>
              </Button>

              {/* Transactions Ledger */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-foreground">Recent Escrow Ledger</h4>
                <div className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden bg-background/50">
                  {payout.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate max-w-[170px]">
                            {tx.itemTitle}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          #{tx.orderNumber} · {tx.date}
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="font-mono font-bold text-foreground">
                          +${tx.amount.toFixed(2)}
                        </span>
                        {tx.payoutStatus === "available" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
                            AVAILABLE
                          </span>
                        )}
                        {tx.payoutStatus === "in_escrow" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-mono border border-amber-500/30 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> ESCROW
                          </span>
                        )}
                        {tx.payoutStatus === "released" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono border border-border/40">
                            RELEASED
                          </span>
                        )}
                        {tx.payoutStatus === "frozen" && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 font-mono border border-rose-500/30 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> FROZEN
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
