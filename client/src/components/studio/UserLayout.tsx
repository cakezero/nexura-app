"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudioBackground from "@/components/StudioBackground";
import UserSidebar from "./userSidebar";
import { getStoredUserSession, storeUserSession } from "@/lib/userSession";
import { projectApiRequest } from "@/lib/projectApi";
import { userApiRequest } from "@/lib/userApi";

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
  const pathname = usePathname();
  const router = useRouter();

  const user = getStoredUserSession();
  const apiPrefix = user?.type === "user" ? "/user-hub" : "/hub";
  const apiRequest = user?.type === "user" ? userApiRequest : projectApiRequest;

  const deriveTab = (): TabType => {
    if (pathname.includes("quests-tab") || pathname.includes("create-new-quest")) return "questsTab";
    if (pathname.includes("lessons-tab") || pathname.includes("create-lesson")) return "lessonsTab";
    if (pathname.includes("dashboard")) return "questSubmissions";
    return "questsTab";
  };

  const [activeTab, setActiveTab] = useState<TabType>(deriveTab);

  useEffect(() => {
    setActiveTab(deriveTab());
  }, [pathname]);

  useEffect(() => {
    if (!user?.type || user.type !== "user") {
      router.push("/discover");
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
    <div className="relative min-h-screen overflow-hidden">
      <StudioBackground />

      <div className="relative z-10 flex h-screen flex-col md:flex-row">
        <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
          <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 md:pt-8 md:pb-8 md:px-8 relative bg-black/20" style={{  }}>
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
