"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClientProvider } from "@tanstack/react-query";
import { configureClient, API_URL_DEV, API_URL_PROD } from "@0xintuition/graphql";

import { wagmiConfig } from "@/lib/wagmiConfig";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth";
import { network } from "@/lib/constants";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

import "@rainbow-me/rainbowkit/styles.css";

// Point the Intuition GraphQL indexer at the chain the app is actually using.
// Default SDK config targets mainnet; on testnet that makes getAtomDetails /
// getTripleDetails return null, which breaks the proof-of-action flow.
configureClient({ apiUrl: network === "mainnet" ? API_URL_PROD : API_URL_DEV });

const sidebarStyle = {
  "--sidebar-width": "12rem",
  "--sidebar-width-icon": "4rem",
} as React.CSSProperties;

export function Providers({ children }: { children: ReactNode }) {
  // Gate first paint until mounted to avoid wagmi/RainbowKit SSR hydration
  // mismatches (wallet state + localStorage are client-only).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <AuthProvider>
            <TooltipProvider>
              <SidebarProvider defaultOpen={false} style={sidebarStyle}>
                {mounted ? children : null}
              </SidebarProvider>
            </TooltipProvider>
          </AuthProvider>
          <Toaster />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
