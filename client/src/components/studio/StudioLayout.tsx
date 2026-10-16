"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import StudioBackground from "@/components/StudioBackground";
import StudioSidebar from "./StudioSidebar";
import StudioHeader from "./StudioHeader";
import { isProjectSignedIn } from "@/lib/projectApi";

type TabType = "hubProfile" | "campaignSubmissions" | "adminManagement" | "campaignsTab";

interface StudioLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Hide the studio header (title, bell, wallet, back to main app) and render children edge-to-edge, for pages that bring their own header. */
  hideHeader?: boolean;
}

/**
 * Shared layout wrapper for all /studio-dashboard/* pages.
 * Renders the StudioSidebar + header chrome around the given children.
 */
export default function StudioLayout({ children, title = "Nexura Studio", hideHeader = false }: StudioLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab from the current URL
  const deriveTab = (): TabType => {
    if (pathname.includes("hub-profile")) return "hubProfile";
    if (pathname.includes("admin-management")) return "adminManagement";
    if (pathname === "/studio-dashboard") return "campaignSubmissions";
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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StudioBackground />

      <div className="relative z-10 flex h-screen flex-col md:flex-row">
        <StudioSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          {!hideHeader && (
            <div className="hidden md:block">
              <StudioHeader title={title} />
            </div>
          )}

          {hideHeader ? (
            <main className="flex-1 overflow-y-auto relative bg-[#f7f5ff]">{children}</main>
          ) : (
            <main className="flex-1 overflow-y-auto pt-16 pb-24 px-4 md:pt-8 md:pb-8 md:px-9 relative bg-[#f7f5ff] text-[#1c2533]" style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}>
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
