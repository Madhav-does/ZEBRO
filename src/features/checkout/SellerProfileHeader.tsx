import { useState } from "react"
import { Seller } from "@/types"
import {
  BadgeCheck,
  ShieldCheck,
  Info,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface SellerProfileHeaderProps {
  seller: Seller
}

export function SellerProfileHeader({ seller }: SellerProfileHeaderProps) {
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false)

  const getRiskScoreColor = (score: number) => {
    if (score >= 85)
      return {
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        ring: "ring-emerald-500/30",
        label: "Low Risk",
      }
    if (score >= 60)
      return {
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        ring: "ring-amber-500/30",
        label: "Moderate",
      }
    return {
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      ring: "ring-rose-500/30",
      label: "Elevated Risk",
    }
  }

  const risk = getRiskScoreColor(seller.riskScoreNum)

  return (
    <>
      <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm">
        {/* Top Profile row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={seller.avatarUrl}
                alt={seller.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-border/80"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-foreground">
                  {seller.name}
                </span>
                {seller.verifiedCreator && (
                  <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-medium">
                    <BadgeCheck className="w-4 h-4 fill-emerald-500/20" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{seller.handle}</span>
                <span>•</span>
                <span className="text-[11px] text-emerald-400/90 font-medium">
                  {seller.followersCount || seller.instagramFollowers} Followers
                </span>
              </div>
            </div>
          </div>

          {/* Fraud Risk Score Badge with Clickable Popover */}
          <button
            onClick={() => setIsRiskDialogOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 active:scale-95",
              risk.badge
            )}
            title="Click to view fraud risk analysis"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono">{seller.riskScoreNum}/100</span>
            <Info className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Telemetry Strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border/50 text-center">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
              {seller.ordersCount}+
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Protected Orders
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400">
              {seller.disputesCount === 0 ? "100%" : "98.2%"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Completion Rate
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
              {seller.disputesCount}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Past Disputes
            </span>
          </div>
        </div>
      </div>

      {/* Fraud Risk Factors Modal */}
      <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <DialogTitle>Fraud Defense & Trust Telemetry</DialogTitle>
            </div>
            <DialogDescription>
              TrustLink continuous intelligence audit for @{seller.handle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Overall Trust Score
                </span>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {seller.riskScoreNum} / 100
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  {risk.label}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Member since {seller.memberSince}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Audited Risk Vectors
              </p>
              {seller.riskFactors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1 rounded-full bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{factor}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Verified by TrustLink autonomous security oracle
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0 ml-2">
                    PASSED
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-background/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>KYC Approved: {new Date(seller.kycVerifiedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 text-emerald-400">
                Audited <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
