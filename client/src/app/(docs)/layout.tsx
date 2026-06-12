"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import ProfileBar from "@/components/ProfileBar";
import AnalyticsBackground from "@/components/AnalyticsBackground";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location]);

  return (
    <div className="flex h-screen w-full text-white selection:bg-blue-500/30 relative">

      {/* BACKGROUND FOR ALL PAGES */}
      <AnalyticsBackground />

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10">

        <header className="flex items-center p-4 app-header">

          {/* LEFT: Logo (only for docs) */}
          <div className="hidden lg:flex items-center">
            <img
              src="/nexura-logo.png"
              alt="Nexura"
              className="h-8 w-auto"
            />
          </div>

          <SidebarTrigger
            data-testid="button-sidebar-toggle"
            className="md:hidden"
          />

          {/* RIGHT: Controls */}
          <div className="ml-auto flex items-center gap-4">
            <ProfileBar />
          </div>

        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
