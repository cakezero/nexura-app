"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, CircleUserRound, Compass, LayoutGrid, Megaphone, Plus, Search, Users } from "lucide-react";
import { isAddress } from "viem";
import { useUrlState } from "@/hooks/use-url-state";
import { hostOf, searchPeople } from "@/lib/socialGraph/graph";
import { GraphProvider, useGraph } from "@/components/socialGraph/context";
import { Avatar, CheckMark, FONT, INPUT, Loading, ScoreChip, SidePanel, displayName, useLoad, useScores } from "@/components/socialGraph/kit";
import { ActivityTab, MyProfileTab, OverviewTab, PeopleTab, ProjectsTab } from "@/components/socialGraph/tabs";
import OpinionPanel from "@/components/socialGraph/OpinionPanel";
import { OpportunityDetail, OpportunitiesTab } from "@/components/socialGraph/campaigns";
import ProjectPanel from "@/components/socialGraph/ProjectPanel";
import PersonPanel from "@/components/socialGraph/PersonPanel";
import ListProjectModal from "@/components/socialGraph/ListProjectModal";

const TABS = ["overview", "opportunities", "people", "projects", "profile", "activity"] as const;
type Tab = (typeof TABS)[number];
const NAV: { id: Tab; label: string; icon: typeof Compass }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "opportunities", label: "Opportunities", icon: Megaphone },
  { id: "people", label: "People", icon: Users },
  { id: "projects", label: "Projects", icon: Compass },
  { id: "profile", label: "My profile", icon: CircleUserRound },
  { id: "activity", label: "Activity", icon: Activity },
];

export default function SocialGraphPage() {
  return (
    <GraphProvider>
      <Workspace />
    </GraphProvider>
  );
}

function Workspace() {
  const g = useGraph();
  const [tab, setTab] = useUrlState<Tab>("tab", "overview", TABS);

  return (
    <div style={FONT} className="text-[#1c2533]" data-testid="social-graph-page">
      <div className="mb-[14px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a3ffc]">Nexura social graph</p>
        <h1 className="text-[28px] font-semibold tracking-[-0.8px]">{NAV.find((n) => n.id === tab)?.label}</h1>
      </div>
      <header className="sticky top-0 z-20 -mx-4 mb-[16px] border-b-[0.833px] border-[rgba(28,37,51,0.09)] bg-[#f7f5ff]/95 px-4 pb-[12px] pt-[4px] backdrop-blur">
        <div className="flex flex-wrap items-center gap-[12px]">
          <GraphSearch />
          <div className="ml-auto flex items-center gap-[10px]">
            <button type="button" onClick={() => g.openList()} className="inline-flex min-h-[40px] items-center gap-[8px] rounded-[40px] border-[0.833px] border-[rgba(28,37,51,0.15)] bg-white px-[16px] text-[14px] font-semibold text-[#1c2533] transition-colors hover:border-[#8b3efe] hover:bg-[#8b3efe] hover:text-white"><Plus className="size-[16px]" />List a project</button>
            <MeChip onOpen={() => setTab("profile")} />
          </div>
        </div>
        <nav className="mt-[12px] flex gap-[4px] overflow-x-auto" aria-label="Social graph">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-[8px] border-b-[2px] px-[14px] pb-[10px] pt-[6px] text-[14px] font-semibold transition ${tab === id ? "border-[#8b3efe] text-[#1c2533]" : "border-transparent text-[#69728a] hover:text-[#1c2533]"}`}>
              <Icon className="size-[16px]" />{label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "overview" && <OverviewTab goTo={setTab} />}
      {tab === "opportunities" && <OpportunitiesTab />}
      {tab === "people" && <PeopleTab />}
      {tab === "projects" && <ProjectsTab />}
      {tab === "profile" && <MyProfileTab />}
      {tab === "activity" && <ActivityTab />}

      <SidePanel narrow={!g.panel && !!g.opportunity} open={!!g.panel || !!g.opportunity} onClose={g.panel ? g.closePanel : g.closeOpportunity} label={g.panel?.kind === "project" ? "Project" : g.panel?.kind === "opinion" ? "Opinion" : g.panel ? "Person" : "Opportunity"}>
        {!g.panel && g.opportunity && <OpportunityDetail key={g.opportunity} id={g.opportunity} />}
        {g.panel?.kind === "opinion" && <OpinionPanel key={g.panel.id} id={g.panel.id} />}
        {g.panel?.kind === "project" && <ProjectPanel key={g.panel.id} id={g.panel.id} />}
        {g.panel?.kind === "person" && <PersonPanel key={g.panel.address} address={g.panel.address} />}
      </SidePanel>
      {g.listOpen && <ListProjectModal />}
    </div>
  );
}

function MeChip({ onOpen }: { onOpen: () => void }) {
  const g = useGraph();
  const score = useScores(g.me ? [g.me] : []);
  if (!g.me) return <button type="button" onClick={g.connect} className="min-h-[40px] rounded-[40px] border-[0.833px] border-[rgba(28,37,51,0.15)] bg-white px-[16px] text-[14px] font-semibold hover:bg-[#f7f4fe]">Connect wallet</button>;
  return (
    <button type="button" onClick={() => onOpen()} title="Your profile"
      className="flex items-center gap-[8px] rounded-[40px] border-[0.833px] border-[rgba(28,37,51,0.15)] bg-white py-[4px] pl-[4px] pr-[12px] hover:border-[#8a3ffc]">
      <Avatar name={g.me} seed={g.me} size={32} />
      <span className="hidden text-left sm:block">
        <span className="block text-[13px] font-semibold leading-[16px]">You</span>
        <span className="block text-[11px] leading-[14px] text-[#69728a]">{g.myTrust ? `${g.myTrust.trustedBy.length} trust you` : "…"}</span>
      </span>
      <ScoreChip score={score(g.me)} />
    </button>
  );
}

function GraphSearch() {
  const g = useGraph();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const term = q.trim();
  const people = useLoad(async () => (term.length >= 2 ? searchPeople(term) : []), [term]);
  const isUrl = /^https?:\/\/|^[\w-]+\.[a-z]{2,}(\/|$)/i.test(term) && !isAddress(term);
  const projects = useMemo(() => {
    if (term.length < 2) return [];
    const t = term.toLowerCase();
    const host = isUrl ? hostOf(term) : "";
    return (g.projects ?? []).filter((p) => (host && hostOf(p.url) === host) || p.name.toLowerCase().includes(t) || hostOf(p.url).includes(t)).slice(0, 6);
  }, [term, isUrl, g.projects]);
  const score = useScores((people.data ?? []).map((p) => p.address));

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (fn: () => void) => { fn(); setOpen(false); setQ(""); };

  return (
    <div ref={box} className="relative min-w-[260px] flex-1 md:max-w-[560px]">
      <Search className="pointer-events-none absolute left-[14px] top-1/2 size-[16px] -translate-y-1/2 text-[#98a0b4]" />
      <input className={`${INPUT} !h-[44px] !rounded-[40px] !bg-white !pl-[40px]`} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder="Search projects and people, or paste a link or wallet" aria-label="Search the social graph" />
      {open && term.length >= 2 && (
        <div className="absolute left-0 right-0 top-[52px] z-30 max-h-[420px] overflow-y-auto rounded-[24px] border-[0.833px] border-[rgba(28,37,51,0.12)] bg-white p-[8px] shadow-[0_16px_40px_rgba(28,37,51,0.16)]">
          {projects.length > 0 && <p className="px-[10px] pb-[4px] pt-[6px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a0b4]">Projects</p>}
          {projects.map((p) => (
            <button key={p.id} type="button" onClick={() => pick(() => g.openProject(p.id))} className="flex w-full items-center gap-[10px] rounded-[16px] px-[10px] py-[8px] text-left hover:bg-[#f7f4fe]">
              <Avatar image={p.image} name={p.name} seed={p.id} size={32} square />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-[6px] text-[14px] font-semibold">{p.name}{p.checked && <CheckMark className="size-[14px]" />}</span><span className="block truncate text-[12px] text-[#69728a]">{hostOf(p.url)}</span></span>
            </button>
          ))}
          {isUrl && projects.length === 0 && (
            <button type="button" onClick={() => pick(() => g.openList({ website: /^https?:\/\//i.test(term) ? term : `https://${term}` }))} className="flex w-full items-center gap-[10px] rounded-[16px] px-[10px] py-[10px] text-left hover:bg-[#f7f4fe]">
              <span className="flex size-[32px] items-center justify-center rounded-[10px] bg-[rgba(138,63,252,0.1)] text-[#8a3ffc]"><Plus className="size-[16px]" /></span>
              <span className="text-[14px]"><b>{hostOf(term)}</b> isn&apos;t listed yet. List it</span>
            </button>
          )}
          <p className="px-[10px] pb-[4px] pt-[8px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a0b4]">People</p>
          {people.loading && !people.data?.length ? <Loading label="Searching…" />
            : !people.data?.length ? <p className="px-[10px] py-[6px] text-[13px] text-[#69728a]">Nobody found by that name.</p>
            : people.data.map((p) => (
              <button key={p.address} type="button" onClick={() => pick(() => g.openPerson(p.address))} className="flex w-full items-center gap-[10px] rounded-[16px] px-[10px] py-[8px] text-left hover:bg-[#f7f4fe]">
                <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={32} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{displayName(p.address, p.label)}</span>
                <ScoreChip score={score(p.address)} />
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
