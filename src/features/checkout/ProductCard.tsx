import { useState } from "react"
import { Product } from "@/types"
import { formatCurrency, formatWeight } from "@/lib/utils"
import { ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Scale } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const shippingCost = product.shippingFee ?? 0.0
  const escrowFeeOriginal = 4.5
  const escrowFeeActual = 0.0 // Sponsored free protection
  const total = product.price + shippingCost + escrowFeeActual

  const fallbackImage = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80"

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 overflow-hidden backdrop-blur-md shadow-sm">
      {/* Product Image Carousel */}
      <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={currentImageIndex}
            src={product.images[currentImageIndex] || fallbackImage}
            alt={product.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackImage
            }}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>

        {/* Carousel controls */}
        {product.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === currentImageIndex
                      ? "w-4 bg-emerald-400"
                      : "bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Guaranteed weight badge overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 text-white text-[11px] font-medium backdrop-blur-md">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Declared: {formatWeight(product.declaredWeightKg)}</span>
        </div>

        {/* Escrow badge overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-black text-[11px] font-bold shadow-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Escrow Protected</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400">
              Verified Listing
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-[11px] text-muted-foreground">
              {product.category}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {product.title}
          </h2>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">
            {product.subtitle}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Item Price and Fee Breakdown */}
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Listing Price</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              Insured Tracked Shipping
            </span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(shippingCost)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              TrustLink Escrow Protection
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                PROMO
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="line-through text-muted-foreground font-mono text-[11px]">
                {formatCurrency(escrowFeeOriginal)}
              </span>
              <span className="font-mono font-bold text-emerald-400">
                $0.00 FREE
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-sm font-bold">
            <span className="text-foreground">Total in Escrow</span>
            <span className="font-mono text-base text-emerald-400">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
