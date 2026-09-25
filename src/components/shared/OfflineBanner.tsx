import { useAppStore } from "@/store/useAppStore"
import { WifiOff, AlertTriangle } from "lucide-react"

export function OfflineBanner() {
  const { isOfflineSimulated, isSimulatingSlowNetwork, setOfflineSimulated } =
    useAppStore()

  if (!isOfflineSimulated && !isSimulatingSlowNetwork) return null

  return (
    <div className="w-full bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs py-1.5 px-4 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2">
        {isOfflineSimulated ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium">
              Simulation Mode: Network is currently OFFLINE
            </span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-amber-300">
              Simulation Mode: Simulated High-Latency Network (2.5s delay)
            </span>
          </>
        )}
      </div>
      {isOfflineSimulated && (
        <button
          onClick={() => setOfflineSimulated(false)}
          className="text-[11px] underline hover:text-white transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}
