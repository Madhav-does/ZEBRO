import { useState } from "react"
import { ShieldCheck, Search, Heart, Send, Moon, Sun, RefreshCw, Sparkles } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"

export function InstagramTopBar() {
  const { theme, toggleTheme, setShellTab, refreshFeed } = useAppStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showRefreshToast, setShowRefreshToast] = useState(false)

  const handleBrandClick = () => {
    setIsRefreshing(true)
    setShellTab("home")
    refreshFeed()
    window.scrollTo({ top: 0, behavior: "smooth" })
    setShowRefreshToast(true)
    
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
    setTimeout(() => {
      setShowRefreshToast(false)
    }, 2400)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between relative">
        {/* Zebro Brand Title with TrustLink Shield Badge & Instant Refresh Action */}
        <button
          onClick={handleBrandClick}
          className="flex items-center gap-2 cursor-pointer group text-left focus:outline-hidden"
          title="Click Zebro to refresh feed with new products"
          aria-label="Refresh Zebro feed"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xs group-hover:scale-105 group-hover:bg-emerald-500/25 transition-all">
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-xl tracking-tight text-foreground font-sans group-hover:text-emerald-400 transition-colors">
              Zebro
            </span>
            <span className="text-[10px] font-mono font-bold tracking-tight text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              TRUSTLINK
            </span>
          </div>
        </button>

        {/* Floating Toast Notification on Refresh */}
        {showRefreshToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded-full bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>✨ New Zebro products loaded!</span>
          </div>
        )}

        {/* Right Action Icons: Language, Theme, Activity Heart, Inbox */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full border border-border/60 bg-card/60 hover:bg-muted flex items-center justify-center text-foreground transition-all duration-150"
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>

          <button
            onClick={() => setShellTab("inbox")}
            className="relative w-8 h-8 rounded-full border border-border/60 bg-card/60 hover:bg-muted flex items-center justify-center text-foreground transition-all duration-150"
            aria-label="Direct Messages"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
