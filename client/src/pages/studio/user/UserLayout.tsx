import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "../../../components/ui/button";
import AnimatedBackground from "../../../components/AnimatedBackground";
import UserSidebar from "./userSidebar";
import { getStoredUserSession, storeUserSession } from "../../../lib/userSession";
import { projectApiRequest } from "../../../lib/projectApi";
import { userApiRequest } from "../../../lib/userApi";

type TabType = "questSubmissions" | "questsTab" | "lessonsTab";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  onLogout?: () => void;
}

export default function UserLayout({
  children,
  title = "User Dashboard",
  onLogout,
}: UserLayoutProps) {
  const [location, setLocation] = useLocation();

  const user = getStoredUserSession();
  const apiPrefix = user?.type === "user" ? "/user-hub" : "/hub";
  const apiRequest = user?.type === "user" ? userApiRequest : projectApiRequest;

  const deriveTab = (): TabType => {
    if (location.includes("quests-tab") || location.includes("create-new-quest")) return "questsTab";
    if (location.includes("lessons-tab") || location.includes("create-lesson")) return "lessonsTab";
    if (location.includes("dashboard")) return "questSubmissions";
    return "questsTab";
  };

  const [activeTab, setActiveTab] = useState<TabType>(deriveTab);

  useEffect(() => {
    setActiveTab(deriveTab());
  }, [location]);

  useEffect(() => {
    if (!user?.type || user.type !== "user") {
      setLocation("/discover");
    }
  }, [user]);

  useEffect(() => {
    if (user?.token) {
      (async () => {
        try {
          const res = await apiRequest<{ hub?: any; admin?: any }>({
            method: "GET",
            endpoint: `${apiPrefix}/me`,
          });
          if (res.admin && res.hub) {
            const current = getStoredUserSession();
            if (current && (!current.hub || current.username !== res.admin.name)) {
              const updated = {
                ...current,
                hub: res.hub._id,
                username: res.admin.name,
                name: res.admin.name,
                avatar: res.hub.logo,
              };
              storeUserSession(updated);
              window.dispatchEvent(new Event("user-session-update"));
            }
          }
        } catch (err) {
          console.error("Failed to sync hub info in layout", err);
        }
      })();
    }
  }, [user?.token]);

  const handleLogout = () => {
    onLogout?.();
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#8B3EFE]/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#6366f1]/15 blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-[#a855f7]/10 blur-[80px] animate-pulse-glow" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 flex h-screen flex-col md:flex-row">
        <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatedBackground />

          {/* Desktop header */}
          <header className="hidden md:flex h-16 border-b border-white/10 items-center justify-between px-6 backdrop-blur-sm bg-black/30">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-lg font-semibold text-white whitespace-nowrap min-w-[200px]">{title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/5">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:text-red-400"
              >
                Logout
              </Button>
            </div>
          </header>

          {/* CONTENT AREA — padded for mobile top bar + bottom nav */}
          <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 md:pt-8 md:pb-8 md:px-8 relative bg-black/20">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
