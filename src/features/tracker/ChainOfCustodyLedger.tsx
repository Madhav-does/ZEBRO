import { useState } from "react"
import { TrackingEvent } from "@/types"
import { truncateHash } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChainOfCustodyLedgerProps {
  events: TrackingEvent[]
}

export function ChainOfCustodyLedger({ events }: ChainOfCustodyLedgerProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            Cryptographic Chain of Custody
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Immutable Ledger
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Every milestone is cryptographically signed by the carrier and recorded on
        the escrow state ledger.
      </p>

      {/* Vertical Ledger Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
        {events.map((evt, idx) => {
          const isCompleted = evt.status === "completed"
          const isActive = evt.status === "active"
          const isUpcoming = evt.status === "upcoming"
          const isAnomaly = evt.status === "anomaly"
          const isFrozen = evt.status === "frozen"
          const isExpanded = expandedIndex === idx

          return (
            <div key={evt.id} className="relative group">
              {/* Dot / Icon */}
              <div
                className={cn(
                  "absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isCompleted &&
                    "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40",
                  isActive &&
                    "bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40 animate-pulse",
                  isUpcoming &&
                    "bg-muted text-muted-foreground ring-1 ring-border",
                  isAnomaly &&
                    "bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40 animate-pulse",
                  isFrozen &&
                    "bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isAnomaly ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : isFrozen ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Event Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-semibold",
                      isCompleted && "text-foreground",
                      isActive && "text-amber-400",
                      isUpcoming && "text-muted-foreground",
                      isAnomaly && "text-rose-400",
                      isFrozen && "text-rose-400"
                    )}
                  >
                    {evt.title}
                  </span>

                  <span className="text-[11px] font-mono text-muted-foreground">
                    {evt.timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{evt.subtitle}</span>
                  {evt.detail && (
                    <button
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : idx)
                      }
                      className="text-[11px] hover:text-foreground flex items-center gap-0.5 ml-2 shrink-0"
                    >
                      {isExpanded ? (
                        <>
                          Less <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Details <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Cryptographic Proof Hash Chip */}
                {evt.hash && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Hash:
                    </span>
                    <button
                      onClick={() => handleCopy(evt.hash)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-[10px] font-mono text-emerald-400 transition-colors border border-border/40"
                      title="Click to copy cryptographic proof hash"
                    >
                      <span>{truncateHash(evt.hash, 6, 6)}</span>
                      {copiedHash === evt.hash ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 opacity-60" />
                      )}
                    </button>
                    {evt.location && (
                      <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                        • {evt.location}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded Details Drawer */}
                {isExpanded && evt.detail && (
                  <div className="mt-2 p-3 rounded-xl bg-background/60 border border-border/60 text-xs space-y-1.5 animate-in fade-in-50 duration-150">
                    <p className="text-muted-foreground">{evt.detail}</p>
                    <div className="pt-1 border-t border-border/40 text-[10px] font-mono break-all text-muted-foreground">
                      <span className="text-foreground font-semibold">
                        Immutable Node Proof:
                      </span>{" "}
                      {evt.hash}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
