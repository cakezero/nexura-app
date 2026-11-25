"use client";

import { useMemo, useState } from "react";
import { trustPerson, withdraw } from "@/lib/socialGraph/actions";
import { CHECKER } from "@/lib/socialGraph/config";
import { getActivity, getTrust, hostOf, peopleLikeYou, suggestPeople, type Project, type Suggestion } from "@/lib/socialGraph/graph";
import { pagePeople } from "@/lib/socialGraph/paged";
import { useGraph } from "./context";
import { Discover } from "./discover";
import { Feed } from "./feed";
import { MyInvites, Opportunities } from "./campaigns";
import { OpinionTable, PeopleList } from "./lists";
import { NetworkGraph, NetworkLegend } from "./network";
import { AddOpinionButton, PersonRow, ProjectCard, RecommendedBy } from "./parts";
import PersonPanelBody from "./PersonPanel";
import {
  Avatar, CheckMark, Empty, GhostButton, ListBar, Loading, Notice, PrimaryButton, SectionTitle, TILE, Table,
  displayName, trustAmount, useAction, useLoad, useScores, type View,
} from "./kit";

function ConnectFirst({ what }: { what: string }) {
  const { connect } = useGraph();
  return <Empty action={<PrimaryButton onClick={connect}>Connect wallet</PrimaryButton>}>Connect your wallet to see {what}.</Empty>;
}


export function OverviewTab({ goTo }: { goTo: (tab: "people" | "projects" | "activity" | "opportunities") => void }) {
  const g = useGraph();
  const top = useLoad(() => pagePeople({ filter: "all", sort: "trustMost", search: "", offset: 0, me: null, circle: [] }), []);
  const topScore = useScores((top.data?.rows ?? []).slice(0, 5).map((p) => p.address));
  const moving = useMemo(() => [...(g.projects ?? [])].filter((p) => p.recommenders.length).sort((a, b) => b.recommenders.length - a.recommenders.length || b.staked - a.staked).slice(0, 4), [g.projects]);

  return (
    <div className="space-y-[16px]">
      <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <Discover goTo={goTo} />
        <aside className="space-y-[12px]">
          <Opportunities onAll={() => goTo("opportunities")} />
          <NetworkCard fallback={top.data?.rows[0]} />
          <div className={`${TILE} p-[14px]`}>
            <SectionTitle right={<button type="button" onClick={() => goTo("people")} className="text-[12px] font-semibold text-[#8a3ffc] hover:underline">All people</button>}>Most trusted</SectionTitle>
            {top.loading && !top.data ? <Loading /> : !top.data?.rows.length ? <p className="text-[13px] text-[#69728a]">Nobody yet.</p> : (
              <div className="space-y-[8px]">
                {top.data.rows.slice(0, 5).map((p, i) => (
                  <button key={p.address} type="button" onClick={() => g.openPerson(p.address)} className="flex w-full items-center gap-[10px] rounded-[12px] px-[4px] py-[2px] text-left hover:bg-[#faf9fe]">
                    <span className="w-[18px] text-[11px] font-semibold text-[#98a0b4] font-['Geist_Mono','ui-monospace',monospace]">{String(i + 1).padStart(2, "0")}</span>
                    <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{displayName(p.address, p.label)}</span>
                    <span className="text-[11px] text-[#69728a]">{p.trustedBy} trust{topScore(p.address)?.nexuraScore != null ? ` · ${topScore(p.address)!.nexuraScore}%` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={`${TILE} p-[14px]`}>
            <SectionTitle right={<button type="button" onClick={() => goTo("projects")} className="text-[12px] font-semibold text-[#8a3ffc] hover:underline">All projects</button>}>Moving up</SectionTitle>
            {moving.length === 0 ? <p className="text-[13px] text-[#69728a]">No recommended projects yet.</p> : (
              <div className="space-y-[8px]">
                {moving.map((p) => (
                  <button key={p.id} type="button" onClick={() => g.openProject(p.id)} className="flex w-full items-center gap-[10px] rounded-[12px] px-[4px] py-[2px] text-left hover:bg-[#faf9fe]">
                    <Avatar image={p.image} name={p.name} seed={p.id} size={28} square />
                    <div className="min-w-0 flex-1"><p className="flex items-center gap-[4px] truncate text-[13px] font-semibold">{p.name}{p.checked && <CheckMark className="size-[13px]" />}</p><p className="text-[11px] text-[#69728a]">{p.recommenders.length} recommend · {trustAmount(p.staked)} TRUST</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {g.me && <Suggested />}
        </aside>
      </div>
    </div>
  );
}

function NetworkCard({ fallback }: { fallback?: { address: string; label?: string; image?: string } }) {
  const g = useGraph();
  const center = g.me ? { address: g.me } : fallback;
  const circleKey = [...g.circle].sort().join(",");
  const trust = useLoad(async () => (center && !g.me ? getTrust(center.address) : null), [center?.address, g.me]);
  const sug = useLoad(async () => (g.me ? suggestPeople(g.me, [...g.circle]) : []), [g.me, circleKey]);
  if (!center) return null;
  const data = g.me ? g.myTrust : trust.data;
  const empty = data && !data.trusts.length && !data.trustedBy.length;
  return (
    <div className={`${TILE} overflow-hidden`}>
      <div className="px-[14px] pt-[14px]"><SectionTitle right={<NetworkLegend suggested={!!g.me} />}>{g.me ? "Your network" : "Network"}</SectionTitle></div>
      {!data ? <Loading /> : empty ? (
        <div className="px-[14px] pb-[14px]"><Empty>{g.me ? "Trust someone to start your network." : "Nobody yet."}</Empty></div>
      ) : (
        <NetworkGraph center={center} trusts={data.trusts} trustedBy={data.trustedBy} suggested={sug.data ?? []} onOpen={g.openPerson} me={g.me} />
      )}
    </div>
  );
}

function Suggested() {
  const g = useGraph();
  const { busy, run } = useAction();
  const circleKey = [...g.circle].sort().join(",");
  const s = useLoad(async () => (g.me ? peopleLikeYou(g.me, [...g.circle]) : []), [g.me, circleKey]);
  const score = useScores((s.data ?? []).map((p) => p.address));
  const why = (p: Suggestion) => [p.via.length ? `Trusted by ${p.via.length} you trust` : "", p.shared ? `In ${p.shared} of your opportunities` : ""].filter(Boolean).join(" · ");
  return (
    <div className={`${TILE} p-[14px]`}>
      <SectionTitle>People like you</SectionTitle>
      {s.loading && !s.data ? <Loading />
        : !s.data?.length ? <p className="text-[13px] text-[#69728a]">Trust people or join an opportunity, and people like you show up here.</p>
        : s.data.slice(0, 5).map((p) => (
          <PersonRow key={p.address} address={p.address} label={p.label} image={p.image} score={score(p.address)} sub={why(p)}
            right={<div className="flex gap-[6px]"><AddOpinionButton person={p.address} label={p.label} /><GhostButton small busy={busy === p.address} onClick={() => run(p.address, () => trustPerson(p.address), `You trust ${displayName(p.address, p.label)}`, g.refresh)}>Trust</GhostButton></div>} />
        ))}
    </div>
  );
}


export const PeopleTab = () => <PeopleList />;
export const ActivityTab = () => <div className="max-w-[880px]"><Feed /></div>;


type ProjectFilter = "all" | "checked" | "community" | "trusted" | "campaign" | "unrecommended";
type ProjectSort = "recMost" | "recFew" | "stakedHigh" | "stakedLow" | "newest" | "oldest" | "az" | "za";
const score = (p: Project, circle: Set<string>) => p.recommenders.filter((r) => circle.has(r.account)).length * 3 + p.recommenders.length;

export function ProjectsTab() {
  const g = useGraph();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [sort, setSort] = useState<ProjectSort>("recMost");
  const [view, setView] = useState<View>("grid");
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (g.projects ?? []).filter((p) => !q || p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    if (filter === "checked") list = list.filter((p) => p.checked);
    if (filter === "community") list = list.filter((p) => !p.checked);
    if (filter === "trusted") list = list.filter((p) => g.circle.has(p.curator) || p.recommenders.some((r) => g.circle.has(r.account)));
    if (filter === "unrecommended") list = list.filter((p) => !p.recommenders.length);
    if (filter === "campaign") list = list.filter((p) => p.campaignIds.some((id) => g.campaigns.get(id)?.status !== "Ended" && g.campaigns.has(id)));
    const by: Record<ProjectSort, (a: Project, b: Project) => number> = {
      recMost: (a, b) => score(b, g.circle) - score(a, g.circle), recFew: (a, b) => score(a, g.circle) - score(b, g.circle),
      stakedHigh: (a, b) => b.staked - a.staked, stakedLow: (a, b) => a.staked - b.staked,
      newest: (a, b) => b.listedAt.localeCompare(a.listedAt), oldest: (a, b) => a.listedAt.localeCompare(b.listedAt),
      az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
    };
    return [...list].sort(by[sort]);
  }, [g.projects, g.circle, g.campaigns, search, filter, sort]);

  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Search projects by name, website or description" view={view} onView={setView}
        filter={filter} onFilter={setFilter} filters={[{ id: "all", label: "All" }, "divider", { id: "checked", label: "Checked by Nexura" }, { id: "community", label: "Listed by the community" }, { id: "campaign", label: "Running a campaign" }, { id: "unrecommended", label: "Not recommended yet" }, ...(g.me ? ["divider" as const, { id: "trusted" as const, label: "Recommended by people I trust" }] : [])]}
        sort={sort} onSort={setSort} sorts={[{ id: "recMost", label: "Most recommended" }, { id: "recFew", label: "Fewest recommendations" }, "divider", { id: "stakedHigh", label: "Highest market cap" }, { id: "stakedLow", label: "Lowest market cap" }, "divider", { id: "newest", label: "Newest" }, { id: "oldest", label: "Oldest" }, "divider", { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" }]} />
      {(filter === "checked" || filter === "community") && (
        <Notice tone={filter === "checked" ? "info" : "warn"}>
          {filter === "checked" ? "Nexura researched these projects and reached out to them. We don't control them, and a check isn't an endorsement." : "Anyone can list a project. Do your own research and trust your intuition."}
        </Notice>
      )}
      {filter === "checked" && !CHECKER && <Notice tone="warn">NEXT_PUBLIC_GRAPH_CHECKER isn&apos;t set on this app, so no project can show as checked.</Notice>}
      {g.projectsLoading && !g.projects ? <Loading />
        : g.projectsError ? <Notice tone="warn">{g.projectsError}</Notice>
        : shown.length === 0 ? <Empty>{search || filter !== "all" ? "No projects match." : "No projects yet. Listing is free for everyone."}</Empty>
        : view === "grid" ? <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-3">{shown.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        : (
          <Table columns={[{ label: "Project", className: "flex-1" }, { label: "Recommended by", className: "w-[240px]" }, { label: "TRUST", className: "w-[90px] text-right" }]}>
            {shown.map((p) => (
              <div key={p.id} role="button" tabIndex={0} onClick={() => g.openProject(p.id)} className="flex cursor-pointer flex-col gap-[8px] px-[16px] py-[10px] hover:bg-[#faf9fe] md:flex-row md:items-center md:gap-[12px]">
                <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                  <Avatar image={p.image} name={p.name} seed={p.id} size={32} square />
                  <div className="min-w-0"><p className="flex items-center gap-[4px] truncate text-[14px] font-semibold">{p.name}{p.checked && <CheckMark className="size-[14px]" />}</p><p className="truncate text-[12px] text-[#98a0b4]">{hostOf(p.url)}</p></div>
                </div>
                <div className="md:w-[240px]"><RecommendedBy project={p} /></div>
                <span className="text-[13px] font-semibold md:w-[90px] md:text-right">{trustAmount(p.staked)}</span>
              </div>
            ))}
          </Table>
        )}
    </div>
  );
}


export function MyProfileTab() {
  const g = useGraph();
  if (!g.me) return <ConnectFirst what="your profile: your Nexura score, contributions, opinions about you and your network" />;
  return (
    <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-[28px] bg-white/60">
        <PersonPanelBody key={g.me} address={g.me} />
      </div>
      <aside className="space-y-[12px]">
        <MyActions />
        <MyInvites />
        <Suggested />
      </aside>
    </div>
  );
}

function MyActions() {
  const g = useGraph();
  const { busy, run } = useAction();
  const act = useLoad(async () => (g.me ? getActivity(g.me) : null), [g.me]);
  if (!act.data) return null;
  const a = act.data;
  return (
    <div className={`${TILE} p-[14px]`}>
      <SectionTitle>Your projects</SectionTitle>
      {a.listed.length === 0 && a.recommended.length === 0 ? <p className="text-[13px] text-[#69728a]">You haven&apos;t listed or recommended a project yet.</p> : (
        <div className="max-h-[320px] space-y-[6px] overflow-y-auto">
          {a.listed.map((x) => (
            <button key={`l${x.id}`} type="button" onClick={() => g.openProject(x.id)} className="flex w-full items-center gap-[8px] rounded-[12px] px-[4px] py-[3px] text-left hover:bg-[#faf9fe]">
              <Avatar image={x.image} name={x.name} seed={x.id} size={24} square /><span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{x.name}</span><span className="text-[11px] text-[#98a0b4]">Listed</span>
            </button>
          ))}
          {a.recommended.map((x) => (
            <div key={`r${x.tripleId}`} className="flex items-center gap-[8px] px-[4px] py-[3px]">
              <button type="button" onClick={() => g.openProject(x.id)} className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold hover:text-[#8a3ffc]">{x.name}</button>
              <span className="text-[11px] text-[#98a0b4]">{trustAmount(x.staked)} TRUST</span>
              <GhostButton small busy={busy === x.tripleId} onClick={() => run(x.tripleId, () => withdraw(x.tripleId), "Recommendation withdrawn", () => { void act.reload(); g.refresh(); })}>Withdraw</GhostButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

