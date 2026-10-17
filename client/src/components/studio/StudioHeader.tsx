"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useStudioWallet } from "./useStudioWallet";
import { ChainLogo, NETWORKS, NetworkList, POPOVER, POPOVER_TITLE, getInjectedWallet, switchWalletChain, type NetworkId } from "@/components/admin/CreateNewCampaign";
import { getNetwork } from "@/lib/runtimeNetwork";
import { usePathname, useRouter } from "next/navigation";
import { OPEN_PROPOSALS_EVENT, useProposalNotifications } from "./useProposalNotifications";
import NotificationsPanel from "./NotificationsPanel";
import { STUDIO_SIGN_IN_URL, useProjectSession } from "./useProjectSession";
import SignInPrompt from "./SignInPrompt";

const NEXURA_MAIN_APP_URL = "https://nexura.intuition.box/discover";

function shortAddress(a: string): string { return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a; }

/**
 * Shared header for the studio + user dashboards: page title, notifications bell,
 * wallet connect / address menu and a "Back to Main App" button.
 * Mirrors the header used on the Create Campaign page.
 */
export default function StudioHeader({ title }: { title: string }) {
  const { address: connectedAddress, connect: connectWallet, disconnect: disconnectWallet } = useStudioWallet();
  // An expired session hides the wallet and notifications until the admin signs in again
  const signedIn = useProjectSession();
  const walletAddress = signedIn ? connectedAddress : null;
  const [signInFor, setSignInFor] = useState<"bell" | "wallet" | null>(null);
  const { chainId } = useAccount();
  const [walletOpen, setWalletOpen] = useState(false);
  const [network, setNetwork] = useState<NetworkId>(getNetwork() === "mainnet" ? "intuition" : "intuition-testnet");
  // Follow the network the connected wallet is on
  useEffect(() => {
    const match = NETWORKS.find(n => n.chainId === chainId);
    if (match) setNetwork(match.id);
  }, [chainId]);
  const activeNetwork = NETWORKS.find(n => n.id === network) || NETWORKS[0];
  const changeNetwork = (id: NetworkId) => {
    setNetwork(id);
    const eth = getInjectedWallet();
    const net = NETWORKS.find(n => n.id === id);
    if (eth && net) switchWalletChain(eth, net.chainId).catch(() => {});
  };
  const [bellOpen, setBellOpen] = useState(false);
  const { items: allNotifications, unread: allUnread, markRead } = useProposalNotifications();
  const notifications = signedIn ? allNotifications : [];
  const unread = signedIn ? allUnread : 0;
  const router = useRouter();
  const pathname = usePathname();
  const goSignIn = () => { setSignInFor(null); router.push(STUDIO_SIGN_IN_URL); };
  const openProposal = () => {
    setBellOpen(false);
    if (pathname?.includes("/studio-dashboard/admin-management")) window.dispatchEvent(new Event(OPEN_PROPOSALS_EVENT));
    else router.push("/studio-dashboard/admin-management?tab=proposals");
  };
  const walletRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellOpen && !signInFor) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (bellRef.current?.contains(t) || walletRef.current?.contains(t)) return;
      setBellOpen(false); setSignInFor(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setBellOpen(false); setSignInFor(null); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [bellOpen, signInFor]);
  // Signing back in closes the prompt
  useEffect(() => { if (signedIn) setSignInFor(null); else setBellOpen(false); }, [signedIn]);
  useEffect(() => {
    if (!walletOpen) return;
    const onDown = (e: MouseEvent) => { if (walletRef.current && !walletRef.current.contains(e.target as Node)) setWalletOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setWalletOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [walletOpen]);
  useEffect(() => { if (!walletAddress) setWalletOpen(false); }, [walletAddress]);

  return (
    <div style={{ height: 52, background: "#ffffff", borderBottom: "0.833px solid rgba(28,37,51,0.19)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 36px", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
      <span style={{ fontSize: 20, fontWeight: 600, color: "#1c2533", lineHeight: "20.93px", whiteSpace: "nowrap" }}>{title}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Bell */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <button
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={bellOpen}
            onClick={() => {
              setWalletOpen(false);
              if (!signedIn) { setSignInFor(s => (s === "bell" ? null : "bell")); return; }
              setBellOpen(o => !o);
            }}
            style={{ position: "relative", width: 37.99, height: 37.99, background: "#f7f5ff", border: "1px solid rgba(28,37,51,0.09)", borderRadius: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.5A4 4 0 005 6.5V10.5L3.5 12.5h11L13 10.5V6.5A4 4 0 009 2.5z" stroke="#6B7280" strokeWidth="1.3"/><path d="M7.5 14.5a1.5 1.5 0 003 0" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round"/></svg>
            {unread > 0 && (
              <span style={{ position: "absolute", top: -5, left: 20.7, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, background: "#e4545b", border: "1.667px solid #faf9ff", color: "white", fontSize: 11, fontWeight: 700, lineHeight: "15.7px", textAlign: "center", boxSizing: "border-box" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {signInFor === "bell" && <SignInPrompt what="see your notifications" onSignIn={goSignIn} />}
          {bellOpen && signedIn && (
            <NotificationsPanel items={notifications} unread={unread} onOpen={openProposal} onMarkRead={markRead} onViewAll={openProposal} />
          )}
        </div>

        {/* Wallet: connect button until a wallet is connected, then address + menu */}
        <div ref={walletRef} style={{ position: "relative" }}>
          {!walletAddress ? (
            <button
              onClick={() => {
                setBellOpen(false);
                if (!signedIn) { setSignInFor(s => (s === "wallet" ? null : "wallet")); return; }
                connectWallet();
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(165.12deg, #7C3AED 0%, #6b21d8 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "0 16px", cursor: "pointer", height: 38, whiteSpace: "nowrap", fontFamily: "inherit" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.75" y="3.5" width="12.5" height="9.5" rx="2" stroke="white" strokeWidth="1.3"/><path d="M1.75 6h12.5" stroke="white" strokeWidth="1.3"/><circle cx="11" cy="9.5" r="0.9" fill="white"/></svg>
              <span style={{ fontSize: 12.8, fontWeight: 600, color: "#f7f5ff" }}>Connect wallet</span>
            </button>
          ) : (
            <button
              aria-haspopup="listbox" aria-expanded={walletOpen} aria-label={`Wallet on ${activeNetwork.name}. Switch network`}
              onClick={() => { setWalletOpen(o => !o); setBellOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(165.12deg, #7C3AED 0%, #6b21d8 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "6.833px 10px 6.833px 12.833px", cursor: "pointer", height: 38 }}
            >
              <div style={{ width: 6.99, height: 6.99, borderRadius: "50%", background: "#3fd9b8", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "#f7f5ff", fontFamily: "monospace", flex: 1, whiteSpace: "nowrap" }}>{shortAddress(walletAddress)}</span>
              <span style={{ display: "inline-flex", padding: 1.5, borderRadius: "50%", background: "white", flexShrink: 0 }}><ChainLogo logo={activeNetwork.logo} size={16} /></span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0, transform: walletOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M3 4.5l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          {signInFor === "wallet" && <SignInPrompt what="connect your wallet" onSignIn={goSignIn} />}
          {walletOpen && walletAddress && (
            <div style={{ ...POPOVER, right: 0, width: 210, borderRadius: 16, padding: 5 }}>
              <div style={{ ...POPOVER_TITLE, fontSize: 10.5, padding: "6px 9px 4px" }}>Network</div>
              <NetworkList value={network} onSelect={id => { changeNetwork(id); setWalletOpen(false); }} />
              <div style={{ borderTop: "1px solid rgba(28,37,51,0.07)", marginTop: 3, paddingTop: 3 }}>
              <button onClick={() => { setWalletOpen(false); disconnectWallet(); }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "6px 9px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#EF4444" }}>Disconnect wallet</span>
              </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Main App */}
        <button
          onClick={() => { window.location.href = NEXURA_MAIN_APP_URL; }}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "#000000", border: "1px solid #000000", borderRadius: 999, padding: "0 17px", cursor: "pointer", height: 38, whiteSpace: "nowrap" }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M6 3H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 2h3v3M12 2L7 7" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 12.8, fontWeight: 600, color: "#f7f5ff" }}>Back to Main App</span>
        </button>
      </div>
    </div>
  );
}
