import { cn } from "../../../lib/utils";
import { Users, Zap, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { getStoredUserSession } from "../../../lib/userSession";

type TabType = "questsTab" | "questSubmissions";

interface UserSidebarProps {
  activeTab: TabType;
  onLogout?: () => void;
  onNavigate?: () => void;
}

export default function UserSidebar({ activeTab, onLogout, onNavigate }: UserSidebarProps) {
  const [, setLocation] = useLocation();
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png");
  const [username, setUsername] = useState("@user");

  const syncUser = useCallback(() => {
    try {
      const session = getStoredUserSession();
      if (session) {
        setUsername(session.username || session.name || "@user");
        setUserAvatar(session.avatar || "/default-avatar.png");
      }
    } catch {}
  }, []);

  useEffect(() => {
    syncUser();
    const handler = () => syncUser();
    window.addEventListener("user-session-update", handler);
    return () => window.removeEventListener("user-session-update", handler);
  }, []);

  const sidebarItems: { title: string; icon: any; id: TabType }[] = [
    { title: "Quests", icon: Users, id: "questsTab" },
    { title: "Dashboard", icon: Zap, id: "questSubmissions" },
  ];

  const routeByTab: Record<TabType, string> = {
    questsTab: "/user-dashboard/quests-tab",
    questSubmissions: "/user-dashboard",
  };

  return (
    <aside className="w-60 h-full flex flex-col bg-black/60 backdrop-blur-md border-r border-white/10">
      {/* Logo / Brand */}
      <div className="flex items-center h-16 border-b border-white/10 px-4">
        <div className="w-8 h-8 rounded-lg bg-[#8B3EFE] flex items-center justify-center text-white font-bold text-sm">
          N
        </div>
        <span className="ml-3 text-white font-semibold text-sm">Nexura</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setLocation(routeByTab[item.id]);
                onNavigate?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[#8B3EFE] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <img
            src={userAvatar}
            alt={username}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/default-avatar.png";
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{username}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-white/50 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
