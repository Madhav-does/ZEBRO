import { useState } from "react"
import { useCreateOrder } from "@/hooks/useEscrow"
import { useAppStore } from "@/store/useAppStore"
import { Lock, ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface CheckoutCTAProps {
  productId: string
  sellerId: string
  totalAmount: number
}

export function CheckoutCTA({
  productId,
  sellerId,
  totalAmount,
}: CheckoutCTAProps) {
  const { setActiveTab } = useAppStore()
  const createOrderMutation = useCreateOrder()
  const [isSuccess, setIsSuccess] = useState(false)

  const handleCheckout = () => {
    createOrderMutation.mutate(
      {
        productId,
        paymentMethod: "Apple Pay (Tokenized)",
        shippingAddress: "742 Evergreen Terrace, Springfield, OR 97477",
      },
      {
        onSuccess: () => {
          setIsSuccess(true)
          setTimeout(() => {
            setActiveTab("tracker")
            setIsSuccess(false)
          }, 800)
        },
      }
    )
  }

  const isLoading = createOrderMutation.isPending

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-xl border-t border-border/60 transition-all">
      <div className="max-w-md mx-auto space-y-2">
        {/* Security microcopy */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Lock className="w-3 h-3" />
            Zero-Risk Escrow Smart Vault
          </span>
          <span className="font-mono">48h Return Guarantee</span>
        </div>

        {/* Primary 1-Tap Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={isLoading || isSuccess}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Locking Funds into Escrow Vault...</span>
            </>
          ) : isSuccess ? (
            <>
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>Funds Vaulted! Switching to Live Tracker...</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5 font-bold">
                Lock ${totalAmount.toFixed(2)} with TrustLink Escrow
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Alternative 1-Tap Apple/Google Pay button */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
          <span>Supported:</span>
          <span className="font-medium text-foreground">Pay</span>
          <span>•</span>
          <span className="font-medium text-foreground">GPay</span>
          <span>•</span>
          <span className="font-medium text-foreground">Card</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" /> 100% Insured
          </span>
        </div>
      </div>
    </div>
  )
}
