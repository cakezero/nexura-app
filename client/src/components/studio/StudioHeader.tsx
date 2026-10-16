"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useStudioWallet } from "./useStudioWallet";
import { ChainLogo, NETWORKS, NetworkList, POPOVER, POPOVER_TITLE, getInjectedWallet, switchWalletChain, type NetworkId } from "@/components/admin/CreateNewCampaign";
import { getNetwork } from "@/lib/runtimeNetwork";
import { usePathname, useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/adminGovernance";
import { OPEN_PROPOSALS_EVENT, useProposalNotifications } from "./useProposalNotifications";

const NEXURA_MAIN_APP_URL = "https://nexura.intuition.box/discover";

function shortAddress(a: string): string { return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a; }

/**
 * Shared header for the studio + user dashboards: page title, notifications bell,
 * wallet connect / address menu and a "Back to Main App" button.
 * Mirrors the header used on the Create Campaign page.
 */
export default function StudioHeader({ title }: { title: string }) {
  const { address: walletAddress, connect: connectWallet, disconnect: disconnectWallet } = useStudioWallet();
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
  const notifications = useProposalNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const openProposal = () => {
    setBellOpen(false);
    if (pathname?.includes("/studio-dashboard/admin-management")) window.dispatchEvent(new Event(OPEN_PROPOSALS_EVENT));
    else router.push("/studio-dashboard/admin-management?tab=proposals");
  };
  const walletRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setBellOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [bellOpen]);
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
            aria-label={notifications.length ? `Notifications, ${notifications.length} need attention` : "Notifications"} aria-expanded={bellOpen}
            onClick={() => { setBellOpen(o => !o); setWalletOpen(false); }}
            style={{ position: "relative", width: 37.99, height: 37.99, background: "#f7f5ff", border: "1px solid rgba(28,37,51,0.09)", borderRadius: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2.5A4 4 0 005 6.5V10.5L3.5 12.5h11L13 10.5V6.5A4 4 0 009 2.5z" stroke="#6B7280" strokeWidth="1.3"/><path d="M7.5 14.5a1.5 1.5 0 003 0" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round"/></svg>
            {notifications.length > 0 && (
              <span style={{ position: "absolute", top: -5, left: 20.7, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, background: "#e4545b", border: "1.667px solid #faf9ff", color: "white", fontSize: 11, fontWeight: 700, lineHeight: "15.7px", textAlign: "center", boxSizing: "border-box" }}>
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "white", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 8px 30px rgba(0,0,0,0.10)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1c2533" }}>Notifications</span>
              </div>
{notifications.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px", gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: "#f7f4fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2.5A4.5 4.5 0 005.5 7v4.5L4 13.5h12L14.5 11.5V7A4.5 4.5 0 0010 2.5z" stroke="#8a3ffc" strokeWidth="1.3"/><path d="M8 15.5a2 2 0 004 0" stroke="#8a3ffc" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1c2533" }}>You're all caught up</span>
                <span style={{ fontSize: 12, color: "#767a8c", textAlign: "center", lineHeight: "18px" }}>All notifications have been read. New activity will appear here.</span>
              </div>
              ) : (
                <div style={{ maxHeight: 340, overflowY: "auto", padding: 5 }}>
                  {notifications.map(n => (
                    <button key={n.id} onClick={openProposal}
                      onMouseEnter={e => { e.currentTarget.style.background = "#f7f4fe"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      style={{ width: "100%", display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 11px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: "#8a3ffc", marginTop: 6, flexShrink: 0 }} />
                      <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1c2533", lineHeight: "18px" }}>Signature needed: {n.title}</span>
                        <span style={{ fontSize: 11.5, color: "#69728a", lineHeight: "16px" }}>Proposed by {n.proposedBy.name} · {formatDateTime(n.createdAt)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wallet: connect button until a wallet is connected, then address + menu */}
        <div ref={walletRef} style={{ position: "relative" }}>
          {!walletAddress ? (
            <button
              onClick={() => { setBellOpen(false); connectWallet(); }}
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
          style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(167.33deg, #7C3AED 0%, #6b21d8 100%)", border: "1px solid rgba(167,139,250,0.28)", borderRadius: 999, padding: "0 17px", cursor: "pointer", height: 38, whiteSpace: "nowrap" }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M6 3H3a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="white" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 2h3v3M12 2L7 7" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 12.8, fontWeight: 600, color: "#f7f5ff" }}>Back to Main App</span>
        </button>
      </div>
    </div>
  );
}
