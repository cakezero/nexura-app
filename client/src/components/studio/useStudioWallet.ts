"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

// Set when the wallet is disconnected inside the studio, so the main-app session address is not shown again
const HIDDEN_KEY = "nexura:studio-wallet-hidden";

/** Address the person signed in with on the main app (or used to create the hub). */
function getSessionWalletAddress(): string | null {
  const read = (key: string, field: string): string | null => {
    try {
      const raw = localStorage.getItem(key);
      const v = raw ? JSON.parse(raw)?.[field] : null;
      return typeof v === "string" && v ? v : null;
    } catch { return null; }
  };
  return read("nexura:wallet", "address") ?? read("user_profile", "address") ?? read("nexura-project:info", "walletAddress");
}

/**
 * Wallet connection for the studio header, via the app's wagmi + RainbowKit setup.
 * Shows the live wagmi connection, or — when the main app is signed in but wagmi hasn't
 * restored a connection — the address from that session, so people don't have to connect twice.
 * Unlike useWallet(), this never runs the main-app sign-in flow.
 */
export function useStudioWallet() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  useEffect(() => {
    const addr = getSessionWalletAddress();
    let hidden: string | null = null;
    try { hidden = localStorage.getItem(HIDDEN_KEY); } catch {}
    setSessionAddress(addr && addr.toLowerCase() !== hidden?.toLowerCase() ? addr : null);
  }, []);

  // A fresh connection clears any earlier studio disconnect
  useEffect(() => {
    if (isConnected) { try { localStorage.removeItem(HIDDEN_KEY); } catch {} }
  }, [isConnected]);

  const connect = useCallback(() => { openConnectModal?.(); }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    const shown = (isConnected && address) || sessionAddress;
    if (shown) { try { localStorage.setItem(HIDDEN_KEY, shown); } catch {} }
    setSessionAddress(null);
    if (isConnected) disconnect();
  }, [isConnected, address, sessionAddress, disconnect]);

  return {
    address: isConnected && address ? (address as string) : sessionAddress,
    connect,
    disconnect: disconnectWallet,
  };
}
