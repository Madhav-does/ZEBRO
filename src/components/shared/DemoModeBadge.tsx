import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/api"
import { useAppStore } from "@/store/useAppStore"
import { DemoScenario } from "@/types"
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wifi,
  WifiOff,
  Clock,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DemoModeBadge() {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    demoScenario,
    setDemoScenario,
    isOfflineSimulated,
    setOfflineSimulated,
    isSimulatingSlowNetwork,
    setSimulatingSlowNetwork,
    setActiveTab,
    setIsReceiptOpen,
    setShellTab,
    setOrdersSubTab,
  } = useAppStore()

  const queryClient = useQueryClient()

  const handleSelectScenario = async (scId: DemoScenario) => {
    setDemoScenario(scId)
    setShellTab("orders")
    setOrdersSubTab("active")
    setActiveTab("tracker")
    try {
      await api.triggerDemoScenario(scId)
    } catch (err) {
      console.warn("Could not sync scenario with backend:", err)
    }
    queryClient.invalidateQueries({ queryKey: ["order"] })
    queryClient.invalidateQueries({ queryKey: ["weight-audit"] })
    queryClient.invalidateQueries({ queryKey: ["marketplace"] })
    queryClient.invalidateQueries({ queryKey: ["orders"] })
  }

  const toggleOfflineSimulation = () => setOfflineSimulated(!isOfflineSimulated)
  const toggleSlowNetwork = () => setSimulatingSlowNetwork(!isSimulatingSlowNetwork)

  const scenarios: {
    id: DemoScenario
    title: string
    desc: string
    badgeColor: string
    icon: typeof CheckCircle2
  }[] = [
    {
      id: "perfect_delivery",
      title: "1. Verified Delivery",
      desc: "Weight match (1.21kg vs 1.20kg). Clean escrow countdown & early release.",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: CheckCircle2,
    },
    {
      id: "weight_mismatch",
      title: "2. Weight Anomaly (Empty Box)",
      desc: "Carrier scale flagged 0.40kg vs declared 1.20kg (-66.7%). Auto-freeze triggered.",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle,
    },
    {
      id: "dispute_filed",
      title: "3. Buyer Dispute Active",
      desc: "Escrow funds locked in smart contract vault. Evidence timeline active.",
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      icon: ShieldAlert,
    },
  ]

  return (
    <div className="fixed bottom-20 left-3 z-50">
      {/* Expanded panel */}
      {isExpanded && (
        <div className="mb-2 w-80 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                Hackathon Demo Controller
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario Selectors */}
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">
              DEMO SCENARIOS:
            </p>
            {scenarios.map((sc) => {
              const isSelected = demoScenario === sc.id
              const Icon = sc.icon
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1",
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                      : "border-border/60 bg-background/50 hover:bg-muted/70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-foreground" />
                      {sc.title}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {sc.desc}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Network & Quick Actions */}
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">
              NETWORK SIMULATION:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleOfflineSimulation}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] border font-medium transition-colors",
                  isOfflineSimulated
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "border-border bg-background/40 hover:bg-muted text-muted-foreground"
                )}
              >
                {isOfflineSimulated ? (
                  <WifiOff className="w-3 h-3 text-rose-400" />
                ) : (
                  <Wifi className="w-3 h-3" />
                )}
                {isOfflineSimulated ? "Offline: ON" : "Simulate Offline"}
              </button>

              <button
                onClick={toggleSlowNetwork}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] border font-medium transition-colors",
                  isSimulatingSlowNetwork
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "border-border bg-background/40 hover:bg-muted text-muted-foreground"
                )}
              >
                <Clock className="w-3 h-3 text-amber-400" />
                {isSimulatingSlowNetwork ? "Slow Net: ON" : "2.5s Latency"}
              </button>
            </div>

            <button
              onClick={() => setIsReceiptOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] border border-border bg-background/40 hover:bg-muted text-foreground font-medium transition-colors mt-2"
            >
              <FileText className="w-3 h-3 text-emerald-400" />
              View Cryptographic Escrow Receipt
            </button>
          </div>
        </div>
      )}

      {/* Pill Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-emerald-500/30 bg-card/90 shadow-lg hover:shadow-emerald-500/10 text-xs font-semibold text-foreground backdrop-blur-md hover:bg-muted transition-all"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono tracking-tight text-emerald-400">
          DEMO:{" "}
          {demoScenario === "perfect_delivery"
            ? "1. Normal"
            : demoScenario === "weight_mismatch"
            ? "2. Anomaly"
            : "3. Dispute"}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}
