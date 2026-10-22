"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useReconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSilentWalletConnect } from "./useSilentWalletConnect";

// Set when the wallet is disconnected inside the studio, so the main-app session address is not shown again
const HIDDEN_KEY = "nexura:studio-wallet-hidden";
const SYNC_KEY = "nexura:studio-wallet-sync";

function broadcast(msg: { type: "connect" | "disconnect"; address?: string }) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify({ ...msg, at: Date.now() })); } catch { /* storage unavailable */ }
}

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

  // The shown session address needs a live wallet connection to sign: restore it without a popup
  const silentConnect = useSilentWalletConnect();
  useEffect(() => {
    if (sessionAddress && !isConnected) silentConnect(sessionAddress).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAddress]);

  // A fresh connection clears any earlier studio disconnect, and tells the other open tabs
  useEffect(() => {
    if (isConnected && address) {
      try { localStorage.removeItem(HIDDEN_KEY); } catch {}
      broadcast({ type: "connect", address });
    }
  }, [isConnected, address]);

  // Another tab connected or disconnected: follow it
  const { reconnect } = useReconnect();
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SYNC_KEY || !e.newValue) return;
      try {
        const msg = JSON.parse(e.newValue) as { type: "connect" | "disconnect"; address?: string };
        if (msg.type === "disconnect") {
          setSessionAddress(null);
          if (isConnected) disconnect();
        } else if (!isConnected) {
          reconnect();
        }
      } catch { /* ignore malformed messages */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isConnected, disconnect, reconnect]);

  const connect = useCallback(() => { openConnectModal?.(); }, [openConnectModal]);

  const disconnectWallet = useCallback(() => {
    const shown = (isConnected && address) || sessionAddress;
    if (shown) { try { localStorage.setItem(HIDDEN_KEY, shown); } catch {} }
    setSessionAddress(null);
    if (isConnected) disconnect();
    broadcast({ type: "disconnect" });
  }, [isConnected, address, sessionAddress, disconnect]);

  return {
    address: isConnected && address ? (address as string) : sessionAddress,
    connect,
    disconnect: disconnectWallet,
  };
}
