import { useState } from "react"
import { Heart, MessageCircle, Send, Bookmark, ShieldCheck, Scale, MoreHorizontal, CheckCircle2 } from "lucide-react"
import { Listing } from "@/types"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"
import { cn } from "@/lib/utils"

interface IGProductCardProps {
  listing: Listing
  onBuy: (listing: Listing) => void
}

export function IGProductCard({ listing, onBuy }: IGProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.likesCount)

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  return (
    <article className="border-b border-border/40 pb-4 bg-background">
      {/* 1. Creator Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={listing.seller.avatarUrl}
              alt={listing.seller.storeName || listing.seller.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-border/50"
            />
            {(listing.seller.isIdentityVerified ?? listing.seller.verifiedCreator) && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white ring-1 ring-background">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                {listing.seller.storeName || listing.seller.name}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-emerald-500 font-mono font-medium">
                Tier {listing.seller.trustTier || listing.seller.tier}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {listing.seller.location || "Verified Merchant"} · via Instagram
            </span>
          </div>
        </div>

        <button aria-label="More options" className="text-muted-foreground hover:text-foreground p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Edge-to-Edge Image with Trust Overlay */}
      <div className="relative aspect-square w-full bg-muted/40 overflow-hidden group">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {/* Escrow Guarantee Floating Badge */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TrustLink Escrow</span>
        </div>

        {/* Declared Weight Pill */}
        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/20 text-zinc-300 px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1 shadow-sm">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>{listing.declaredWeightKg} kg declared</span>
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md border border-border/60 text-white px-3 py-1.5 rounded-xl shadow-lg">
          <span className="text-sm font-mono font-extrabold text-white">
            ${listing.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-400 ml-1.5 font-sans">
            +${listing.shippingFee.toFixed(2)} tracked
          </span>
        </div>
      </div>

      {/* 3. Action Bar: Like, Comment, Share, Save */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            className="focus:outline-none transition-transform active:scale-80"
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-rose-500 text-rose-500" : "text-foreground"
              )}
            />
          </button>
          <button aria-label="Comment" className="text-foreground hover:text-muted-foreground transition-colors">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button aria-label="Share" className="text-foreground hover:text-muted-foreground transition-colors">
            <Send className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          aria-label={isSaved ? "Unsave" : "Save"}
          className="focus:outline-none transition-transform active:scale-80"
        >
          <Bookmark
            className={cn(
              "w-6 h-6 transition-colors",
              isSaved ? "fill-foreground text-foreground" : "text-foreground"
            )}
          />
        </button>
      </div>

      {/* 4. Social & Caption Body */}
      <div className="px-4 pt-2 space-y-1.5">
        <p className="text-xs font-semibold text-foreground">
          {likesCount.toLocaleString()} likes
        </p>

        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold mr-1.5">{listing.seller.storeName || listing.seller.name}</span>
          {listing.title} — {listing.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {listing.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
          <span className="text-[11px] text-teal-400">#escrowprotected</span>
        </div>

        {/* 5. Escrow Buy CTA Button */}
        <div className="pt-2">
          <Button
            onClick={() => onBuy(listing)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 rounded-xl shadow-sm flex items-center justify-center gap-2 group transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Buy with Escrow · ${(listing.price + listing.shippingFee).toFixed(2)}</span>
          </Button>
        </div>
      </div>
    </article>
  )
}
