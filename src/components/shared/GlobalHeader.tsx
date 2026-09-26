import { ShieldCheck, Moon, Sun, Lock } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { motion } from "framer-motion"

export function GlobalHeader() {
  const { theme, toggleTheme } = useAppStore()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Security Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                TrustLink
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-2.5 h-2.5" />
                ESCROW
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Zebro Direct & Bio Fraud Defense
            </p>
          </div>
        </div>

        {/* Right side controls: Language switcher, Theme toggle */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full border border-border/60 bg-card/60 hover:bg-muted flex items-center justify-center text-foreground transition-all duration-150 backdrop-blur-sm"
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </motion.div>
          </button>
        </div>
      </div>
    </header>
  )
}
