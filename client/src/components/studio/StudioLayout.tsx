"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudioBackground from "@/components/StudioBackground";
import StudioSidebar from "./StudioSidebar";
import { isProjectSignedIn, clearProjectSession, projectApiRequest } from "@/lib/projectApi";
import { getStoredProjectToken } from "@/lib/projectApi";
import { useWallet } from "@/hooks/use-wallet";

type TabType = "hubProfile" | "campaignSubmissions" | "adminManagement" | "campaignsTab" | "campaignsFlow";

interface StudioLayoutProps {
  children: React.ReactNode;
  title?: string;
  onLogout?: () => void;
  /** Light canvas that fills the content column. Used by the new campaigns flow only. */
  bleed?: boolean;
}

/**
 * Shared layout wrapper for all /studio-dashboard/* pages.
 * Renders the StudioSidebar + header chrome around the given children.
 */
export default function StudioLayout({ children, title = "Nexura Studio", onLogout, bleed = false }: StudioLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab from the current URL
  const deriveTab = (): TabType => {
    if (pathname.includes("hub-profile")) return "hubProfile";
    if (pathname.includes("admin-management")) return "adminManagement";
    if (pathname === "/studio-dashboard") return "campaignSubmissions";
    if (pathname.includes("campaigns-flow")) return "campaignsFlow";
    if (pathname.includes("campaigns-tab") || pathname.includes("create-new-campaign") || pathname.includes("my-campaign"))
      return "campaignsTab";
    return "campaignSubmissions";
  };

  const [activeTab, setActiveTab] = useState<TabType>(deriveTab);

  useEffect(() => {
    setActiveTab(deriveTab());
  }, [pathname]);

  // Auth guard
  useEffect(() => {
    if (!isProjectSignedIn()) {
      router.push("/studio");
    }
  }, []);

  const handleLogout = () => {
    console.log("[ACTION] StudioLayout.handleLogout — project/hub sign-out");
    if (getStoredProjectToken()) {
      projectApiRequest({ method: "POST", endpoint: "/hub/logout" }).catch(() => {});
    }
    clearProjectSession();
    onLogout?.();
    router.push("/discover");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StudioBackground />

      <div className="relative z-10 flex h-screen flex-col md:flex-row">
        <StudioSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="hidden md:flex h-16 border-b border-white/10 items-center justify-between px-6 backdrop-blur-sm bg-black/30">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-lg font-semibold text-white whitespace-nowrap min-w-[200px]">{title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <StudioWalletButton />
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

          <main className={bleed
            ? "flex-1 overflow-y-auto relative bg-[#F7F5FF] pb-24 text-[#1C2533] md:pb-0"
            : "flex-1 overflow-y-auto pt-4 pb-8 px-4 md:pt-8 md:pb-8 md:px-8 relative bg-black/20"
          }>
            {bleed ? children : <div className="max-w-7xl mx-auto">{children}</div>}
          </main>
        </div>
      </div>
    </div>
  );
}

function StudioWalletButton() {
  const { isConnected, address, connectWallet } = useWallet();
  const label = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet";

  return (
    <button
      type="button"
      onClick={() => {
        if (!isConnected) connectWallet({ purpose: "org-signin" });
      }}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#8A3FFC] px-3 text-[13px] font-medium text-white"
    >
      <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-[#3DDC97]" : "bg-white/50"}`} />
      {label}
    </button>
  );
}


