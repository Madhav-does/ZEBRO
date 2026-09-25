import { useSeller, useProduct } from "@/hooks/useEscrow"
import { SellerProfileHeader } from "./SellerProfileHeader"
import { ProductCard } from "./ProductCard"
import { BentoEscrowGuarantee } from "./BentoEscrowGuarantee"
import { CardPaymentAccordion } from "./CardPaymentAccordion"
import { CheckoutCTA } from "./CheckoutCTA"
import { Skeleton } from "@/components/ui/skeleton"
import { Instagram, AlertCircle, RefreshCw } from "lucide-react"

export function CheckoutView() {
  const { data: seller, isLoading: isSellerLoading, isError: isSellerError, refetch: refetchSeller } =
    useSeller("seller_001")
  const { data: product, isLoading: isProductLoading, isError: isProductError, refetch: refetchProduct } =
    useProduct("prod_001")

  if (isSellerLoading || isProductLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    )
  }

  if (isSellerError || isProductError || !seller || !product) {
    return (
      <div className="p-8 text-center rounded-3xl border border-destructive/30 bg-destructive/5 space-y-4 my-6">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <div>
          <h3 className="text-base font-bold text-foreground">
            Unable to Load Checkout Data
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Simulated network failure or connection timed out.
          </p>
        </div>
        <button
          onClick={() => {
            refetchSeller()
            refetchProduct()
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-muted text-foreground transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    )
  }

  const shippingCost = 12.0
  const totalAmount = product.price + shippingCost

  return (
    <div className="space-y-5 pb-6">
      {/* Instagram Context Pill */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-emerald-500/10 border border-purple-500/20 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Instagram className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Direct Purchase Link
            </span>
            <span className="text-muted-foreground text-[11px] block sm:inline sm:ml-1.5">
              Initiated via Instagram DM
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Escrow Active
        </span>
      </div>

      {/* Seller Header */}
      <SellerProfileHeader seller={seller} />

      {/* Product Information & Price Breakdown */}
      <ProductCard product={product} />

      {/* Triple-Layer Bento Escrow Guarantee */}
      <BentoEscrowGuarantee />

      {/* Credit / Debit Card Accordion */}
      <CardPaymentAccordion />

      {/* Sticky Bottom 1-Tap Checkout CTA */}
      <CheckoutCTA
        productId={product.id}
        sellerId={seller.id}
        totalAmount={totalAmount}
      />
    </div>
  )
}
