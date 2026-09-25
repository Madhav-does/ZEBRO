import { ShieldCheck, Search, Heart, Send, Moon, Sun } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"

export function InstagramTopBar() {
  const { theme, toggleTheme, setShellTab } = useAppStore()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* IG Brand Title with TrustLink Shield Badge */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShellTab("home")}>
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-foreground font-sans">
              Instagram
            </span>
            <span className="text-[10px] font-mono font-bold tracking-tight text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              TRUSTLINK
            </span>
          </div>
        </div>

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
