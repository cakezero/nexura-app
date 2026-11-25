"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { pageOpinions, pagePeople } from "@/lib/socialGraph/paged";
import { useGraph } from "./context";
import { CampaignCard, Cover, amount, hosts, logo, pool, statusOf, token, useMyScore } from "./campaigns";
import { Avatar, CheckMark, TILE, displayName, trustAmount, useLoad, type CampaignSummary } from "./kit";

type Go = (tab: "people" | "projects" | "activity" | "opportunities") => void;
type Row = { key: string; image?: string; name: string; seed: string; square?: boolean; sub: ReactNode; open: () => void; badge?: ReactNode };

function TopList({ title, rows, onAll, loading, empty }: { title: string; rows: Row[]; onAll: () => void; loading?: boolean; empty: string }) {
  return (
    <div className={`${TILE} flex flex-col p-[14px]`}>
      <div className="mb-[6px] flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        <button type="button" onClick={onAll} className="inline-flex items-center gap-[2px] text-[11px] font-semibold text-[#69728a] hover:text-[#8a3ffc]">View all<ChevronRight className="size-[12px]" /></button>
      </div>
      {loading && !rows.length ? <div className="space-y-[8px] py-[4px]">{[0, 1, 2].map((i) => <div key={i} className="h-[30px] animate-pulse rounded-[10px] bg-[#f4f1fc]" />)}</div>
        : !rows.length ? <p className="py-[8px] text-[12px] text-[#98a0b4]">{empty}</p>
        : (
          <ol className="divide-y-[0.833px] divide-[rgba(28,37,51,0.06)]">
            {rows.slice(0, 5).map((r, i) => (
              <li key={r.key}>
                <button type="button" onClick={r.open} className="flex w-full items-center gap-[9px] py-[7px] text-left hover:text-[#8a3ffc]">
                  <span className="w-[12px] text-[11px] font-semibold text-[#98a0b4]">{i + 1}</span>
                  <Avatar image={r.image} name={r.name} seed={r.seed} size={26} square={r.square} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-[4px] truncate text-[13px] font-semibold">{r.name}{r.badge}</span>
                    <span className="block truncate text-[11px] text-[#98a0b4]">{r.sub}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
    </div>
  );
}

function Spotlight({ items, goTo }: { items: CampaignSummary[]; goTo: Go }) {
  const g = useGraph();
  const lead = items[0];
  if (!lead) return null;
  return (
    <div className={`${TILE} grid gap-[18px] p-[18px] md:grid-cols-[1fr_200px_1fr] md:items-center`}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a3ffc]">Opportunities</p>
        <h2 className="mt-[4px] text-[24px] font-semibold leading-[28px] tracking-[-0.6px]">What&apos;s moving up.</h2>
        <button type="button" onClick={() => goTo("opportunities")} className="mt-[14px] inline-flex items-center gap-[6px] rounded-[40px] bg-[#8b3efe] px-[14px] py-[7px] text-[12px] font-semibold text-white hover:bg-[#7c2ff0]">Explore<ArrowRight className="size-[13px]" /></button>
      </div>
      <button type="button" onClick={() => g.openCampaign(lead._id)} className="group text-left">
        <Cover c={lead} className="aspect-[4/3] w-full rounded-[16px] transition group-hover:brightness-105" />
        <p className="mt-[6px] truncate text-[13px] font-semibold group-hover:text-[#8a3ffc]">{lead.title}</p>
        <p className="truncate text-[11px] text-[#98a0b4]">{hosts(lead)}</p>
      </button>
      <ol className="space-y-[6px]">
        {items.slice(0, 3).map((c, i) => (
          <li key={c._id}>
            <button type="button" onClick={() => g.openCampaign(c._id)}
              className={`flex w-full items-center gap-[10px] rounded-[14px] border-[0.833px] px-[10px] py-[8px] text-left transition ${i === 0 ? "border-[rgba(138,63,252,0.35)] bg-[rgba(138,63,252,0.05)]" : "border-transparent hover:bg-[#faf9fe]"}`}>
              <span className="text-[11px] font-semibold text-[#98a0b4]">{String(i + 1).padStart(2, "0")}</span>
              <Avatar image={logo(c)} name={c.title} seed={c._id} size={28} square />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{c.title}</span>
                <span className="block truncate text-[11px] text-[#98a0b4]">{[(c.participants ?? 0).toLocaleString() + " joined", pool(c) ? `${amount(pool(c))} ${token(c)}` : ""].filter(Boolean).join(" · ")}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Discover({ goTo }: { goTo: Go }) {
  const g = useGraph();
  const mine = useMyScore();
  const live = useMemo(() => [...g.campaigns.values()].filter((c) => statusOf(c) !== "ended")
    .sort((a, b) => (b.participants ?? 0) - (a.participants ?? 0)), [g.campaigns]);
  const opinions = useLoad(() => pageOpinions({ filter: "all", sort: "forMost", search: "", offset: 0, me: null, circle: [] }), []);
  const disputed = useLoad(() => pageOpinions({ filter: "disputed", sort: "againstMost", search: "", offset: 0, me: null, circle: [] }), []);
  const newcomers = useLoad(() => pagePeople({ filter: "all", sort: "newest", search: "", offset: 0, me: null, circle: [] }), []);
  const valued = useLoad(() => pagePeople({ filter: "all", sort: "capHigh", search: "", offset: 0, me: null, circle: [] }), []);
  const projects = g.projects ?? [];
  const newest = useMemo(() => [...projects].sort((a, b) => b.listedAt.localeCompare(a.listedAt)), [projects]);

  const opinionRow = (o: NonNullable<typeof opinions.data>["rows"][number]): Row => ({
    key: o.tripleId, image: o.about.image, name: o.about.person ? displayName(o.about.person, o.about.name) : o.about.name, seed: o.about.person ?? o.about.projectId ?? "", square: !o.about.person,
    sub: <>is “{o.text}” · {o.agree} agree, {o.disagree} disagree</>, open: () => g.openOpinion(o.tripleId),
  });

  return (
    <div className="min-w-0 space-y-[18px]">
      <Spotlight items={live} goTo={goTo} />

      <section>
        <h2 className="mb-[8px] text-[14px] font-semibold">Top right now</h2>
        <div className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-3">
          <TopList title="Most agreed opinions" onAll={() => goTo("activity")} loading={opinions.loading} empty="No opinions yet." rows={(opinions.data?.rows ?? []).map(opinionRow)} />
          <TopList title="Disputed" onAll={() => goTo("activity")} loading={disputed.loading} empty="Nothing disputed." rows={(disputed.data?.rows ?? []).map(opinionRow)} />
          <TopList title="New on the graph" onAll={() => goTo("people")} loading={newcomers.loading} empty="Nobody yet."
            rows={(newcomers.data?.rows ?? []).map((p) => ({ key: p.address, image: p.image, name: displayName(p.address, p.label), seed: p.address, sub: `${p.trustedBy} trust · ${p.opinions} opinions`, open: () => g.openPerson(p.address) }))} />
          <TopList title="Highest market cap" onAll={() => goTo("people")} loading={valued.loading} empty="Nobody yet."
            rows={(valued.data?.rows ?? []).map((p) => ({ key: p.address, image: p.image, name: displayName(p.address, p.label), seed: p.address, sub: `${trustAmount(p.cap)} TRUST · ${p.positions} positions`, open: () => g.openPerson(p.address) }))} />
          <TopList title="Newly listed projects" onAll={() => goTo("projects")} loading={g.projectsLoading} empty="No projects yet."
            rows={newest.map((p) => ({ key: p.id, image: p.image, name: p.name, seed: p.id, square: true, badge: p.checked ? <CheckMark className="size-[12px]" /> : undefined, sub: `${p.recommenders.length} recommend · ${trustAmount(p.staked)} TRUST`, open: () => g.openProject(p.id) }))} />
        </div>
      </section>

      {live.length > 3 && (
        <section>
          <div className="mb-[8px] flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">Featured opportunities</h2>
            <button type="button" onClick={() => goTo("opportunities")} className="inline-flex items-center gap-[2px] text-[11px] font-semibold text-[#69728a] hover:text-[#8a3ffc]">View all<ChevronRight className="size-[12px]" /></button>
          </div>
          <div className="-mx-[4px] flex snap-x gap-[12px] overflow-x-auto px-[4px] pb-[6px]">
            {live.slice(3, 13).map((c) => <div key={c._id} className="w-[250px] shrink-0 snap-start"><CampaignCard c={c} mine={mine} /></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
