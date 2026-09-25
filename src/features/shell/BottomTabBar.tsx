import { Home, Compass, ShieldCheck, Send, User } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { ShellTab } from "@/types"
import { cn } from "@/lib/utils"

interface TabConfig {
  id: ShellTab
  label: string
  icon: typeof Home
  badge?: string | number | boolean
}

export function BottomTabBar() {
  const { shellTab, setShellTab, userRole } = useAppStore()

  const tabs: TabConfig[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "explore", label: "Explore", icon: Compass },
    { 
      id: "orders", 
      label: "Orders", 
      icon: ShieldCheck,
      badge: true // Live escrow protection indicator
    },
    { 
      id: "inbox", 
      label: "Inbox", 
      icon: Send,
      badge: 2 // 2 unread DMs/disputes
    },
    { 
      id: "profile", 
      label: userRole === "seller" ? "Dashboard" : "Profile", 
      icon: User 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-xl transition-colors">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = shellTab === tab.id
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              onClick={() => setShellTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-150 group",
                isActive ? "text-emerald-500 font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-150 group-active:scale-90",
                    isActive && "stroke-[2.5px] scale-105"
                  )}
                />
                
                {/* Active Tab Glow Pill */}
                {tab.id === "orders" && tab.badge && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-background"></span>
                  </span>
                )}

                {tab.id === "inbox" && tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={cn(
                "text-[10px] mt-1 tracking-tight transition-colors",
                isActive ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                {tab.label}
              </span>

              {/* Active Tab Underline dot */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
