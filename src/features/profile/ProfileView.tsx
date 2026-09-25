import { useAppStore } from "@/store/useAppStore"
import { BuyerProfileView } from "./BuyerProfileView"
import { SellerDashboardView } from "./SellerDashboardView"
import { ShieldCheck, User, Store } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProfileView() {
  const { userRole, setUserRole } = useAppStore()

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Role Segmented Switcher */}
      <div className="flex p-1 bg-muted/60 rounded-xl border border-border/50">
        <button
          onClick={() => setUserRole("buyer")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            userRole === "buyer"
              ? "bg-background text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span>Buyer Mode</span>
        </button>

        <button
          onClick={() => setUserRole("seller")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            userRole === "seller"
              ? "bg-background text-foreground shadow-xs border border-border/40 font-bold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>Seller Dashboard</span>
        </button>
      </div>

      {/* Role View Rendering */}
      {userRole === "buyer" ? (
        <BuyerProfileView />
      ) : (
        <SellerDashboardView />
      )}
    </div>
  )
}
