import { useState } from "react"
import { useThreads } from "@/hooks/useMarketplace"
import { useAppStore } from "@/store/useAppStore"
import { Thread } from "@/types"
import { Send, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Scale } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function InboxView() {
  const { data: threads, isLoading } = useThreads()
  const { setShellTab, setIsDisputeOpen, setCurrentOrderId, setOrdersSubTab } = useAppStore()

  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [replyText, setReplyText] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !activeThread) return
    // Optimistic append / simulation
    activeThread.lastMessage = replyText
    setReplyText("")
  }

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Messages & Arbitration</span>
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          3 Active Threads
        </span>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Loading conversation threads...
        </div>
      ) : !threads || threads.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          No message threads.
        </div>
      ) : (
        <div className="divide-y divide-border/40 rounded-2xl border border-border/40 overflow-hidden bg-card">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className="p-3.5 hover:bg-muted/30 cursor-pointer transition-colors flex items-start gap-3"
            >
              {/* Participant Avatar */}
              <div className="relative shrink-0">
                <img
                  src={thread.participant.avatarUrl}
                  alt={thread.participant.name}
                  className="w-11 h-11 rounded-full object-cover border border-border/50"
                />
                {thread.unread && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {thread.participant.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {thread.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {thread.lastMessage}
                </p>

                {/* State Chip & Order Link */}
                <div className="flex items-center gap-2 mt-2">
                  {thread.stateChip === "Escalated" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      ESCALATED DISPUTE
                    </span>
                  )}
                  {thread.stateChip === "Open" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      ACTIVE
                    </span>
                  )}
                  {thread.stateChip === "Resolved" && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-border/40">
                      RESOLVED
                    </span>
                  )}

                  {thread.orderId && (
                    <span className="text-[10px] font-mono text-emerald-400/80">
                      #{thread.orderId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thread Chat Sheet */}
      {activeThread && (
        <Sheet open={!!activeThread} onOpenChange={(open) => !open && setActiveThread(null)}>
          <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto p-0 overflow-hidden bg-card border-t border-border/60 h-[75vh] flex flex-col justify-between">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

            {/* Chat Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeThread.participant.avatarUrl}
                  alt={activeThread.participant.name}
                  className="w-9 h-9 rounded-full object-cover border border-border/50"
                />
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {activeThread.participant.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    @{activeThread.participant.handle} · {activeThread.participant.role}
                  </p>
                </div>
              </div>

              {activeThread.orderId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (activeThread.orderId) {
                      setCurrentOrderId(activeThread.orderId)
                    }
                    setOrdersSubTab("active")
                    setActiveThread(null)
                    setShellTab("orders")
                  }}
                  className="text-[10px] h-7 px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  View Escrow
                </Button>
              )}
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/30 space-y-1 max-w-[85%]">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {activeThread.participant.name} · {activeThread.timestamp}
                </span>
                <p className="text-foreground leading-relaxed">{activeThread.lastMessage}</p>
              </div>

              {activeThread.stateChip === "Escalated" && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-[11px] text-rose-300">
                  <span className="font-semibold block mb-0.5">Automated Escrow Alert</span>
                  Smart contract fund release has been paused due to courier tare weight mismatch.
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 flex items-center gap-2 bg-background/80 shrink-0">
              <Input
                placeholder="Type a message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-xs h-9 bg-muted/40 rounded-xl"
              />
              <Button type="submit" size="sm" className="h-9 px-3 bg-emerald-500 hover:bg-emerald-600 text-black">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
