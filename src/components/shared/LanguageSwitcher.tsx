import { useState } from "react"
import { Globe, Check } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { Locale } from "@/types"
import { cn } from "@/lib/utils"

const LANGUAGES: { code: Locale; label: string; flag: string; native: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "es", label: "Spanish", flag: "🇪🇸", native: "Español" },
  { code: "fr", label: "French", flag: "🇫🇷", native: "Français" },
  { code: "de", label: "German", flag: "🇩🇪", native: "Deutsch" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", native: "हिन्दी" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", native: "日本語" },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  const activeLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0]

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border/60 bg-card/60 hover:bg-muted text-xs font-medium text-foreground transition-all duration-150 backdrop-blur-sm"
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="uppercase text-[11px] font-semibold tracking-wider">
          {activeLang.code}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              Select Language
            </div>
            <div className="space-y-0.5">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === locale
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-2.5 py-2 text-xs rounded-xl transition-colors",
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.native}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
