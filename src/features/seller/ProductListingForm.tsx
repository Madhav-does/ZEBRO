import { useState } from "react"
import { useCreateListing } from "@/hooks/useMarketplace"
import { ShieldCheck, Scale, Upload, Info, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ListingCategory } from "@/types"

interface ProductListingFormProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: ListingCategory[] = [
  "Ceramics",
  "Apparel",
  "Prints",
  "Jewelry",
  "Home",
  "Vintage"
]

export function ProductListingForm({ isOpen, onClose }: ProductListingFormProps) {
  const createListingMutation = useCreateListing()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ListingCategory>("Ceramics")
  const [price, setPrice] = useState("")
  const [shippingFee, setShippingFee] = useState("6.00")
  const [declaredWeightKg, setDeclaredWeightKg] = useState("")
  const [showWeightInfo, setShowWeightInfo] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !price || !declaredWeightKg) return

    createListingMutation.mutate({
      title,
      description,
      category,
      price: parseFloat(price),
      shippingFee: parseFloat(shippingFee) || 0,
      declaredWeightKg: parseFloat(declaredWeightKg),
      images: [
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80"
      ],
      tags: ["handcrafted", category.toLowerCase()]
    }, {
      onSuccess: () => {
        setIsSuccess(true)
        setTimeout(() => {
          setIsSuccess(false)
          onClose()
          setTitle("")
          setPrice("")
          setDeclaredWeightKg("")
          setDescription("")
        }, 1200)
      }
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-y-auto max-h-[90vh] bg-card border-t border-border/60">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1" />

        <div className="p-5 space-y-4">
          <SheetHeader className="text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold">List Protected Product</SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  Includes automatic postal scale tare verification
                </p>
              </div>
            </div>
          </SheetHeader>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Listing Published!</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your item is live on Zebro Escrow with tamper-evident scale protection enabled.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-border/60 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-muted/20 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">Add Product Photos</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Mock upload active · Tap to browse</p>
              </div>

              {/* Title & Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Product Title</label>
                <Input
                  required
                  placeholder="e.g. Stoneware Espresso Tumbler (Set of 2)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/80 text-xs h-10"
                />
              </div>

              {/* Category Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        category === cat
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold"
                          : "bg-background/60 border-border/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Price ($ USD)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="38.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-background/80 text-xs h-10 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Shipping ($ USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="6.00"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="bg-background/80 text-xs h-10 font-mono"
                  />
                </div>
              </div>

              {/* Declared Weight (Fraud Prevention Core) */}
              <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Declared Package Weight (kg)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowWeightInfo(!showWeightInfo)}
                    className="text-muted-foreground hover:text-foreground p-0.5"
                    aria-label="Why we ask for weight"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showWeightInfo && (
                  <p className="text-[10px] text-emerald-400/90 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20 leading-relaxed">
                    TrustLink integrates with courier transit scales. If the dropped-off package tare deviates by &gt;5%, the payout is automatically frozen to prevent "empty box" scams.
                  </p>
                )}

                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="e.g. 0.45"
                  value={declaredWeightKg}
                  onChange={(e) => setDeclaredWeightKg(e.target.value)}
                  className="bg-background/80 text-xs h-10 font-mono"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Description & Item Caption</label>
                <textarea
                  rows={2}
                  placeholder="Describe your item, provenance, dimensions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background/80 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={createListingMutation.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-11 rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {createListingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to Escrow...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Publish Escrow-Protected Listing</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
