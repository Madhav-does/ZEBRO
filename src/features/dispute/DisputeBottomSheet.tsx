import { useState } from "react"
import { useFileDispute } from "@/hooks/useEscrow"
import { useAppStore } from "@/store/useAppStore"
import { DisputeReason } from "@/types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  ShieldAlert,
  Camera,
  AlertTriangle,
  Upload,
  X,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DisputeBottomSheet() {
  const { isDisputeOpen, setIsDisputeOpen, setDemoScenario, currentOrderId } = useAppStore()
  const fileDisputeMutation = useFileDispute()

  const [selectedReason, setSelectedReason] = useState<string>("empty_box")
  const [description, setDescription] = useState<string>("")
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80",
  ])

  const reasons: { id: DisputeReason; title: string; desc: string }[] = [
    {
      id: "empty_box",
      title: "Empty Box / Weight Mismatch",
      desc: "Package arrived with missing contents or matches scale anomaly.",
    },
    {
      id: "broken",
      title: "Damaged / Broken in Transit",
      desc: "Item arrived broken, chipped, or severely compromised.",
    },
    {
      id: "fake_item",
      title: "Counterfeit or Materially Different",
      desc: "Item does not match Zebro marketplace listing photos or description.",
    },
    {
      id: "other",
      title: "Package Marked Delivered but Missing",
      desc: "Carrier claims delivered but no package found.",
    },
  ]

  const handleAddMockPhoto = () => {
    if (photos.length < 3) {
      setPhotos((prev) => [
        ...prev,
        "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80",
      ])
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    fileDisputeMutation.mutate(
      {
        orderId: currentOrderId || "ord_tl_8829104",
        reason: selectedReason as DisputeReason,
        description: description || "Weight deficit detected upon opening package.",
        evidenceImages: photos,
      },
      {
        onSuccess: () => {
          setDemoScenario("dispute_filed")
          setIsDisputeOpen(false)
        },
      }
    )
  }

  return (
    <Sheet open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
      <SheetContent side="bottom" className="max-w-lg mx-auto sm:rounded-t-3xl">
        <SheetHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-base sm:text-lg">
                Freeze Escrow & File Dispute
              </SheetTitle>
              <SheetDescription className="text-xs">
                Funds are immediately halted in the smart vault. Seller cannot withdraw.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Reason Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              1. Select Issue Category
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => {
                const isSelected = selectedReason === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5",
                      isSelected
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30"
                        : "border-border/60 bg-background/50 hover:bg-muted text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                        isSelected
                          ? "border-rose-400 bg-rose-500 text-white"
                          : "border-muted-foreground/60"
                      )}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              2. Describe the discrepancy
            </label>
            <textarea
              rows={3}
              placeholder="Provide context on package condition, weight upon opening, or missing items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/50 p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 placeholder:text-muted-foreground"
            />
          </div>

          {/* Photo Evidence Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3. Photo Evidence ({photos.length}/3)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                Carrier scale reading pre-attached
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {photos.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group"
                >
                  <img
                    src={src}
                    alt="Evidence thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <button
                  onClick={handleAddMockPhoto}
                  className="w-20 h-20 rounded-xl border border-dashed border-border/80 hover:border-foreground/40 bg-muted/20 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px]">Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Smart Contract Freeze Disclaimer */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Submitting places $132.00 into cold storage. Carrier weight records will be
              automatically attached to your arbitration file.
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={fileDisputeMutation.isPending}
            className="w-full h-11 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {fileDisputeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Freezing Escrow Vault...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Freeze $132.00 Escrow & Submit File</span>
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
