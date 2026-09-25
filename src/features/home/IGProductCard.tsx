import { useState, useRef } from "react"
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ShieldCheck,
  Scale,
  MoreHorizontal,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Music,
  Smile,
} from "lucide-react"
import { Listing } from "@/types"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface IGProductCardProps {
  listing: Listing
  onBuy: (listing: Listing) => void
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80"

export function IGProductCard({ listing, onBuy }: IGProductCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(listing.likesCount)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<string[]>([
    "Is the declared shipping tare weight verified by carrier scale?",
    "Stunning craftsmanship! Sent you a DM.",
  ])

  const lastTapRef = useRef<number>(0)
  const images = listing.images && listing.images.length > 0 ? listing.images : [FALLBACK_IMAGE]

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      if (!isLiked) {
        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }
      setShowHeartBurst(true)
      setTimeout(() => setShowHeartBurst(false), 800)
    }
    lastTapRef.current = now
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setComments((prev) => [...prev, commentText.trim()])
    setCommentText("")
  }

  return (
    <article className="border-b border-border/40 pb-4 bg-background">
      {/* 1. Creator Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={listing.seller.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&q=80"}
              alt={listing.seller.storeName || listing.seller.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&q=80"
              }}
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
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{listing.seller.location || "Verified Merchant"}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-zinc-400">
                <Music className="w-2.5 h-2.5 text-emerald-400" />
                <span>Original Audio</span>
              </span>
            </div>
          </div>
        </div>

        <button aria-label="More options" className="text-muted-foreground hover:text-foreground p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Edge-to-Edge Image Carousel with Double-Tap Heart Overlay */}
      <div
        onClick={handleDoubleTap}
        className="relative aspect-square w-full bg-muted/40 overflow-hidden group select-none cursor-pointer"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={listing.title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        </AnimatePresence>

        {/* Double-tap animated heart burst */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Navigation Arrows if multiple photos */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slide Index Badge (e.g. 1/3) */}
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white/90 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium shadow-sm z-10">
              {currentImageIndex + 1}/{images.length}
            </div>

            {/* Carousel Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm z-10">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all",
                    i === currentImageIndex ? "w-1.5 h-1.5 bg-emerald-400" : "w-1 h-1 bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Escrow Guarantee Floating Badge */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-sm z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TrustLink Escrow</span>
        </div>

        {/* Declared Tare Weight Pill (if not multi-image badge occupying spot) */}
        {images.length <= 1 && (
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/20 text-zinc-300 px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1 shadow-sm z-10">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>{listing.declaredWeightKg} kg declared</span>
          </div>
        )}

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md border border-border/60 text-white px-3 py-1.5 rounded-xl shadow-lg z-10">
          <span className="text-sm font-mono font-extrabold text-white">
            ${listing.price.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-400 ml-1.5 font-sans">
            {listing.shippingFee && listing.shippingFee > 0 ? `+$${listing.shippingFee.toFixed(2)} tracked` : "Free Insured Shipping"}
          </span>
        </div>
      </div>

      {/* 3. Action Bar: Like, Comment, Share, Save */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLike}
            className="focus:outline-none transition-transform active:scale-75"
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-rose-500 text-rose-500" : "text-foreground hover:text-muted-foreground"
              )}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment"
            className="text-foreground hover:text-muted-foreground transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button
            onClick={() => onBuy(listing)}
            aria-label="Share"
            className="text-foreground hover:text-muted-foreground transition-colors"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          aria-label={isSaved ? "Unsave" : "Save"}
          className="focus:outline-none transition-transform active:scale-75"
        >
          <Bookmark
            className={cn(
              "w-6 h-6 transition-colors",
              isSaved ? "fill-foreground text-foreground" : "text-foreground hover:text-muted-foreground"
            )}
          />
        </button>
      </div>

      {/* 4. Social & Caption Body */}
      <div className="px-4 pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            {likesCount.toLocaleString()} likes
          </p>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
            <Scale className="w-3 h-3 text-emerald-400" />
            <span>Tare: {listing.declaredWeightKg} kg</span>
          </div>
        </div>

        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-semibold mr-1.5">{listing.seller.storeName || listing.seller.name}</span>
          <span className="font-medium text-zinc-200">{listing.title}</span> — {listing.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {listing.tags.map((tag) => (
            <span key={tag} className="text-[11px] text-emerald-400 hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
          <span className="text-[11px] text-teal-400">#escrowprotected</span>
        </div>

        {/* Comments Section Toggle */}
        <div className="pt-1 text-[11px] text-muted-foreground">
          <button
            onClick={() => setShowComments(!showComments)}
            className="hover:underline text-[11px] text-muted-foreground block"
          >
            {showComments ? "Hide comments" : `View all ${comments.length + 4} comments`}
          </button>

          {showComments && (
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-border/40 py-1 text-xs">
              {comments.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="font-semibold text-foreground text-[11px]">buyer_{i + 1}:</span>
                  <span className="text-zinc-300 text-[11px]">{c}</span>
                </div>
              ))}

              <form onSubmit={handleAddComment} className="pt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="text-xs font-semibold text-emerald-400 disabled:opacity-40"
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 5. Escrow Buy CTA Button */}
        <div className="pt-2">
          <Button
            onClick={() => onBuy(listing)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs h-10 rounded-xl shadow-sm flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Buy with Escrow · ${(listing.price + (listing.shippingFee || 0)).toFixed(2)}</span>
          </Button>
        </div>
      </div>
    </article>
  )
}
