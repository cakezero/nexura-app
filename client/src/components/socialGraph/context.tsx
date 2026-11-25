"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getAddress, isAddress } from "viem";
import { useWallet } from "@/hooks/use-wallet";
import { readUrlParam, writeUrlParam } from "@/hooks/use-url-state";
import { CHECKER } from "@/lib/socialGraph/config";
import { getTrust, getVerifiedMembers, listProjects, type Person, type Project } from "@/lib/socialGraph/graph";
import { loadCampaigns, useLoad, type CampaignSummary } from "./kit";

export type Panel = { kind: "project"; id: string } | { kind: "person"; address: string } | { kind: "opinion"; id: string } | null;

type Graph = {
  me: string | null;
  isChecker: boolean;
  connect: () => void;
  circle: Set<string>;
  myTrust: { trusts: Person[]; trustedBy: Person[] } | null;
  projects: Project[] | null;
  projectsLoading: boolean;
  projectsError: string | null;
  campaigns: Map<string, CampaignSummary>;
  verified: Set<string>;
  panel: Panel;
  openProject: (id: string) => void;
  openPerson: (address: string) => void;
  openOpinion: (tripleId: string) => void;
  opportunity: string | null;
  openCampaign: (id: string) => void;
  closeOpportunity: () => void;
  closePanel: () => void;
  listOpen: { website?: string } | null;
  openList: (prefill?: { website?: string }) => void;
  closeList: () => void;
  refresh: () => void;
};

const Ctx = createContext<Graph | null>(null);
export const useGraph = () => {
  const g = useContext(Ctx);
  if (!g) throw new Error("useGraph outside GraphProvider");
  return g;
};

const initialPanel = (): Panel => {
  const p = readUrlParam("project");
  if (p && /^0x[0-9a-f]{64}$/i.test(p)) return { kind: "project", id: p };
  const o = readUrlParam("opinion");
  if (o && /^0x[0-9a-f]{64}$/i.test(o)) return { kind: "opinion", id: o };
  const a = readUrlParam("person");
  if (a && isAddress(a)) return { kind: "person", address: getAddress(a) };
  return null;
};

export function GraphProvider({ children }: { children: ReactNode }) {
  const { address, connectWallet } = useWallet();
  const me = address && isAddress(address) ? getAddress(address) : null;
  const [panel, setPanel] = useState<Panel>(initialPanel);
  const [listOpen, setListOpen] = useState<{ website?: string } | null>(null);
  const [opportunity, setOpportunity] = useState<string | null>(() => { const c = readUrlParam("campaign"); return c && /^[0-9a-f]{24}$/i.test(c) ? c : null; });
  const openOpportunity = useCallback((id: string | null) => {
    setOpportunity(id);
    writeUrlParam("campaign", id);
    if (!id) writeUrlParam("invite", null);
  }, []);

  const projects = useLoad(listProjects, []);
  const trust = useLoad(async () => (me ? getTrust(me) : null), [me]);
  const campaigns = useLoad(loadCampaigns, []);
  const verified = useLoad(getVerifiedMembers, []);

  const show = useCallback((p: Panel) => {
    setPanel(p);
    writeUrlParam("project", p?.kind === "project" ? p.id : null);
    writeUrlParam("person", p?.kind === "person" ? p.address : null);
    writeUrlParam("opinion", p?.kind === "opinion" ? p.id : null);
  }, []);

  const value = useMemo<Graph>(() => ({
    me,
    isChecker: !!me && me === CHECKER,
    connect: () => connectWallet(),
    circle: new Set(trust.data?.trusts.map((p) => p.address) ?? []),
    myTrust: trust.data ?? null,
    projects: projects.data,
    projectsLoading: projects.loading,
    projectsError: projects.error,
    campaigns: campaigns.data ?? new Map(),
    verified: verified.data ?? new Set(),
    panel,
    openProject: (id) => show({ kind: "project", id }),
    openPerson: (a) => show({ kind: "person", address: getAddress(a) }),
    openOpinion: (id) => show({ kind: "opinion", id }),
    opportunity,
    openCampaign: (id) => { show(null); openOpportunity(id); },
    closeOpportunity: () => openOpportunity(null),
    closePanel: () => show(null),
    listOpen,
    openList: (prefill) => (me ? setListOpen(prefill ?? {}) : connectWallet()),
    closeList: () => setListOpen(null),
    refresh: () => { void projects.reload(); void trust.reload(); },
  }), [me, trust.data, projects.data, projects.loading, projects.error, campaigns.data, verified.data, panel, listOpen, show, opportunity, openOpportunity]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
