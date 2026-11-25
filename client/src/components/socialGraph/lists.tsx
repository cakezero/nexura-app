"use client";

import { useEffect, useState } from "react";
import { stakeClaim, trustPerson, withdraw } from "@/lib/socialGraph/actions";
import {
  pageOpinions, pagePeople, pagePositions,
  type OpinionFilter, type OpinionRow, type OpinionSort, type PeopleFilter, type PeopleSort, type PersonRowData, type PositionFilter, type PositionSort, type TripleSort,
} from "@/lib/socialGraph/paged";
import { useGraph } from "./context";
import { AddOpinionButton, TrustedBadge } from "./parts";
import {
  Avatar, Chip, Empty, GhostButton, ListBar, Notice, PageEnd, PrimaryButton, ScoreBar, TILE, Table,
  displayName, short, trustAmount, useAction, usePaged, useScores, type Option, type View,
} from "./kit";

export const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : trustAmount(n));
export function useDebounced(v: string, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}


const OPINION_FILTERS = (me: boolean, subject: boolean): Option<OpinionFilter>[] => [
  { id: "all", label: "All" }, "divider",
  ...(subject ? [] : [{ id: "people" as const, label: "About people" }, { id: "projects" as const, label: "About projects" }, "divider" as const]),
  ...(me ? [{ id: "trusted" as const, label: "From people I trust" }, { id: "mine" as const, label: "Mine" }, ...(subject ? [] : [{ id: "aboutMe" as const, label: "About me" }]), "divider" as const] : []),
  { id: "agreed", label: "No disagreement" }, { id: "disputed", label: "Disputed" },
];
export const TRIPLE_SORTS: Option<TripleSort>[] = [
  { id: "newest", label: "Newest" }, { id: "oldest", label: "Oldest" }, "divider",
  { id: "capHigh", label: "Highest market cap" }, { id: "capLow", label: "Lowest market cap" }, "divider",
  { id: "posMost", label: "Most positions" }, { id: "posFew", label: "Fewest positions" }, "divider",
  { id: "forMost", label: "Most supporters" }, { id: "forFew", label: "Fewest supporters" }, "divider",
  { id: "againstMost", label: "Most opposers" }, { id: "againstFew", label: "Fewest opposers" },
];
const OPINION_SORTS: Option<OpinionSort>[] = [...TRIPLE_SORTS, "divider", { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" }];

export function OpinionTable({ subject, compact }: { subject?: string; compact?: boolean }) {
  const g = useGraph();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OpinionFilter>("all");
  const [sort, setSort] = useState<OpinionSort>("capHigh");
  const q = useDebounced(search);
  const circleKey = [...g.circle].sort().join(",");
  const page = usePaged((offset) => pageOpinions({ filter, sort, search: q, offset, me: g.me, circle: [...g.circle], subject }), [filter, sort, q, g.me, circleKey, subject]);

  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder={subject ? "Search these opinions" : "Search opinions by person, project or words"}
        filter={filter} filters={OPINION_FILTERS(!!g.me, !!subject)} onFilter={setFilter} sort={sort} sorts={OPINION_SORTS} onSort={setSort} />
      {page.error ? <Notice tone="warn">{page.error}</Notice>
        : !page.loading && page.rows.length === 0 ? <Empty>{search || filter !== "all" ? "No opinions match." : subject ? "No opinions yet. Share the first one." : "No opinions yet. Open anyone's profile to share the first one."}</Empty>
        : (
          <Table stacked={compact} columns={[{ label: "Opinion", className: "flex-1" }, { label: "Agree", className: "w-[170px]" }, { label: "Disagree", className: "w-[170px]" }, { label: "", className: "w-[190px]" }]}
            footer={<PageEnd loading={page.loading} more={page.more} onMore={page.loadMore} count={page.rows.length} total={page.total} noun="opinions" />}>
            {page.rows.map((o) => <OpinionLine key={o.tripleId} o={o} hideAbout={!!subject} compact={compact} onChange={page.reload} />)}
          </Table>
        )}
    </div>
  );
}

function OpinionLine({ o, hideAbout, compact, onChange }: { o: OpinionRow; hideAbout: boolean; compact?: boolean; onChange: () => void }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const act = (key: string, fn: () => Promise<unknown>, done: string) => (g.me ? run(key, fn, done, onChange) : (g.connect(), Promise.resolve(false)));
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div role="button" tabIndex={0} onClick={() => g.openOpinion(o.tripleId)} onKeyDown={(e) => e.key === "Enter" && g.openOpinion(o.tripleId)}
      className={`flex cursor-pointer flex-col gap-[8px] px-[16px] py-[10px] hover:bg-[#faf9fe] ${compact ? "" : "md:flex-row md:items-center md:gap-[12px]"}`}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[6px]">
        {!hideAbout && (
          <Chip onClick={(e) => { stop(e); if (o.about.person) g.openPerson(o.about.person); else if (o.about.projectId) g.openProject(o.about.projectId); }}>
            <Avatar image={o.about.image} name={o.about.name || o.about.person || "?"} seed={o.about.person ?? o.about.projectId ?? ""} size={20} square={!o.about.person} />
            {o.about.person ? (o.about.person === g.me ? "You" : displayName(o.about.person, o.about.name)) : o.about.name}
          </Chip>
        )}
        <span className="text-[13px] text-[#69728a]">is</span>
        <Chip>{o.text}</Chip>
      </div>
      <div className={`flex flex-wrap items-center gap-[8px] ${compact ? "" : "md:contents"}`}>
      <div className={`flex items-center gap-[6px] whitespace-nowrap ${compact ? "" : "md:w-[170px]"}`}><span className="text-[12px] text-[#0b8a6a]">{o.agree} agree</span><Chip tone="good">{fmt(o.agreeTrust)} TRUST</Chip></div>
      <div className={`flex items-center gap-[6px] whitespace-nowrap ${compact ? "" : "md:w-[170px]"}`}><span className="text-[12px] text-[#c2414a]">{o.disagree} disagree</span><Chip tone="bad">{fmt(o.disagreeTrust)} TRUST</Chip></div>
      <div className={`flex gap-[6px] ${compact ? "ml-auto" : "md:w-[190px] md:justify-end"}`} onClick={stop}>
        {o.mySide === "for"
          ? <GhostButton small busy={busy === "w"} onClick={() => act("w", () => withdraw(o.tripleId), "Agree withdrawn")}>Agreed · undo</GhostButton>
          : o.mySide === "against"
          ? <GhostButton small busy={busy === "w"} onClick={() => act("w", () => withdraw(o.counterId), "Disagree withdrawn")}>Disagreed · undo</GhostButton>
          : <>
              <PrimaryButton small busy={busy === "f"} onClick={() => act("f", () => stakeClaim(o.tripleId, "for"), "You agree")}>Agree</PrimaryButton>
              <GhostButton small danger busy={busy === "a"} onClick={() => act("a", () => stakeClaim(o.tripleId, "against"), "You disagree")}>Disagree</GhostButton>
            </>}
      </div>
      </div>
    </div>
  );
}


const POSITION_SORTS: Option<PositionSort>[] = [
  { id: "highest", label: "Highest amount" }, { id: "lowest", label: "Lowest amount" }, "divider",
  { id: "newest", label: "Newest" }, { id: "oldest", label: "Oldest" }, "divider", { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" },
];

export function PositionsTable({ tripleId, counterId, noun = "positions" }: { tripleId: string; counterId?: string; noun?: string }) {
  const g = useGraph();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PositionFilter>("all");
  const [sort, setSort] = useState<PositionSort>("highest");
  const q = useDebounced(search);
  const circleKey = [...g.circle].sort().join(",");
  const page = usePaged((offset) => pagePositions({ tripleId, counterId, filter, sort, search: q, offset, circle: [...g.circle] }), [tripleId, counterId, filter, sort, q, circleKey]);
  const score = useScores(page.rows.map((r) => r.account));
  const filters: Option<PositionFilter>[] = [
    { id: "all", label: "All" },
    ...(counterId ? ["divider" as const, { id: "for" as const, label: "Agree" }, { id: "against" as const, label: "Disagree" }] : []),
    ...(g.me ? ["divider" as const, { id: "trusted" as const, label: "People I trust" }] : []),
  ];

  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Search by name or wallet" filter={filter} filters={filters} onFilter={setFilter} sort={sort} sorts={POSITION_SORTS} onSort={setSort} />
      {page.error ? <Notice tone="warn">{page.error}</Notice>
        : !page.loading && page.rows.length === 0 ? <Empty>Nobody here{search || filter !== "all" ? " matches" : " yet"}.</Empty>
        : (
          <Table columns={[{ label: "#", className: "w-[28px]" }, { label: "Account", className: "flex-1" }, { label: "Nexura score", className: "w-[130px]" }, ...(counterId ? [{ label: "Side", className: "w-[90px]" }] : []), { label: "Amount", className: "w-[110px] text-right" }]}
            footer={<PageEnd loading={page.loading} more={page.more} onMore={page.loadMore} count={page.rows.length} total={page.total} noun={noun} />}>
            {page.rows.map((r, i) => (
              <div key={r.id} role="button" tabIndex={0} onClick={() => g.openPerson(r.account)} className="flex cursor-pointer items-center gap-[12px] px-[16px] py-[9px] hover:bg-[#faf9fe]">
                <span className="w-[28px] text-[12px] text-[#98a0b4]">{i + 1}</span>
                <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                  <Avatar image={r.image} name={r.label || r.account} seed={r.account} size={30} />
                  <span className="truncate text-[14px] font-semibold">{r.account === g.me ? "You" : displayName(r.account, r.label)}</span>
                  {g.circle.has(r.account) && <TrustedBadge />}
                </div>
                <div className="hidden w-[130px] md:block"><ScoreBar score={score(r.account)} /></div>
                {counterId && <div className="w-[90px]"><Chip tone={r.side === "for" ? "good" : "bad"}>{r.side === "for" ? "Agree" : "Disagree"}</Chip></div>}
                <span className="w-[110px] text-right text-[13px] font-semibold">{trustAmount(r.amount)} TRUST</span>
              </div>
            ))}
          </Table>
        )}
    </div>
  );
}


const PEOPLE_SORTS: Option<PeopleSort>[] = [
  { id: "trustMost", label: "Most trusted" }, { id: "trustFew", label: "Least trusted" }, "divider",
  { id: "capHigh", label: "Highest market cap" }, { id: "capLow", label: "Lowest market cap" }, "divider",
  { id: "posMost", label: "Most positions" }, { id: "posFew", label: "Fewest positions" }, "divider",
  { id: "opinionsMost", label: "Most active" }, { id: "opinionsFew", label: "Least active" }, "divider",
  { id: "newest", label: "Newest" }, { id: "oldest", label: "Oldest" }, "divider",
  { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" },
];

export function PeopleList() {
  const g = useGraph();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [sort, setSort] = useState<PeopleSort>("trustMost");
  const [view, setView] = useState<View>("list");
  const q = useDebounced(search);
  const circleKey = [...g.circle].sort().join(",");
  const page = usePaged((offset) => pagePeople({ filter, sort, search: q, offset, me: g.me, circle: [...g.circle] }), [filter, sort, q, g.me, circleKey]);
  const score = useScores(page.rows.map((r) => r.address));
  const filters: Option<PeopleFilter>[] = [
    { id: "all", label: "All" }, { id: "members", label: "Nexura members" }, "divider",
    ...(g.me ? [{ id: "trusted" as const, label: "People I trust" }, { id: "trustMe" as const, label: "People who trust me" }, "divider" as const] : []),
    { id: "opinions", label: "Has opinions" }, { id: "disputed", label: "Has disputed opinions" },
  ];

  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Is this person worth trusting? Search a name or paste a wallet"
        filter={filter} filters={filters} onFilter={setFilter} sort={sort} sorts={PEOPLE_SORTS} onSort={setSort} view={view} onView={setView} />
      {page.error ? <Notice tone="warn">{page.error}</Notice>
        : !page.loading && page.rows.length === 0 ? (
          <Empty action={/^0x[0-9a-fA-F]{40}$/.test(search.trim()) ? <PrimaryButton onClick={() => g.openPerson(search.trim())}>Open this wallet</PrimaryButton> : undefined}>
            {/^0x[0-9a-fA-F]{40}$/.test(search.trim()) ? "Nobody has trusted this wallet or shared an opinion about it yet. Open it to be the first." : "Nobody matches."}
          </Empty>
        )
        : view === "grid" ? (
          <>
            <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-3">{page.rows.map((p) => <PersonTile key={p.address} p={p} score={score(p.address)} />)}</div>
            <PageEnd loading={page.loading} more={page.more} onMore={page.loadMore} count={page.rows.length} total={page.total} noun="people" />
          </>
        ) : (
          <Table columns={[{ label: "Person", className: "flex-1" }, { label: "Nexura score", className: "w-[130px]" }, { label: "Trusted by", className: "w-[80px]" }, { label: "Market cap", className: "w-[100px]" }, { label: "Opinions about them", className: "w-[200px]" }, { label: "", className: "w-[200px]" }]}
            footer={<PageEnd loading={page.loading} more={page.more} onMore={page.loadMore} count={page.rows.length} total={page.total} noun="people" />}>
            {page.rows.map((p) => <PersonLine key={p.address} p={p} score={score(p.address)} onChange={page.reload} />)}
          </Table>
        )}
    </div>
  );
}

function Tags({ p }: { p: PersonRowData }) {
  if (!p.tags.length) return <span className="text-[12px] text-[#98a0b4]">None yet</span>;
  return (
    <div className="flex min-w-0 flex-wrap gap-[4px]">
      {p.tags.map((t) => <Chip key={t.text} tone={t.positive ? "plain" : "bad"}>{t.text}</Chip>)}
      {p.opinions > p.tags.length && <span className="self-center text-[11px] text-[#98a0b4]">+{p.opinions - p.tags.length}</span>}
    </div>
  );
}

function TrustButton({ address, label, onDone }: { address: string; label?: string; onDone: () => void }) {
  const g = useGraph();
  const { busy, run } = useAction();
  if (address === g.me) return null;
  if (g.circle.has(address)) return <span className="text-[12px] font-semibold text-[#6e2bd8]">Trusted</span>;
  return (
    <GhostButton small busy={busy === "t"} onClick={(e) => { e.stopPropagation(); if (!g.me) { g.connect(); return; } void run("t", () => trustPerson(address), `You trust ${displayName(address, label)}`, () => { g.refresh(); onDone(); }); }}>Trust</GhostButton>
  );
}

function PersonLine({ p, score, onChange }: { p: PersonRowData; score: ReturnType<ReturnType<typeof useScores>>; onChange: () => void }) {
  const g = useGraph();
  return (
    <div role="button" tabIndex={0} onClick={() => g.openPerson(p.address)} onKeyDown={(e) => e.key === "Enter" && g.openPerson(p.address)}
      className="flex cursor-pointer flex-col gap-[8px] px-[16px] py-[10px] hover:bg-[#faf9fe] md:flex-row md:items-center md:gap-[12px]">
      <div className="flex min-w-0 flex-1 items-center gap-[10px]">
        <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={34} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{p.address === g.me ? "You" : displayName(p.address, p.label)}</p>
          {p.label && <p className="truncate text-[12px] text-[#98a0b4]">{short(p.address)}</p>}
        </div>
      </div>
      <div className="md:w-[130px]"><ScoreBar score={score} /></div>
      <div className="text-[13px] md:w-[80px]"><b>{p.trustedBy}</b><span className="text-[#98a0b4] md:hidden"> trusted by</span></div>
      <div className="text-[13px] md:w-[100px]"><b>{fmt(p.cap)}</b><span className="text-[#98a0b4]"> TRUST</span><span className="block text-[11px] text-[#98a0b4]">{p.positions} positions</span></div>
      <div className="md:w-[200px]"><Tags p={p} /></div>
      <div className="flex gap-[6px] md:w-[200px] md:justify-end" onClick={(e) => e.stopPropagation()}><AddOpinionButton person={p.address} label={p.label} onDone={onChange} /><TrustButton address={p.address} label={p.label} onDone={onChange} /></div>
    </div>
  );
}

function PersonTile({ p, score }: { p: PersonRowData; score: ReturnType<ReturnType<typeof useScores>> }) {
  const g = useGraph();
  return (
    <div role="button" tabIndex={0} onClick={() => g.openPerson(p.address)} onKeyDown={(e) => e.key === "Enter" && g.openPerson(p.address)} className={`${TILE} flex cursor-pointer flex-col gap-[10px] p-[14px] text-left transition hover:border-[rgba(138,63,252,0.4)]`}>
      <div className="flex items-center gap-[10px]">
        <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[5px]"><span className="truncate text-[15px] font-semibold">{p.address === g.me ? "You" : displayName(p.address, p.label)}</span>{g.circle.has(p.address) && <TrustedBadge />}</div>
          {p.label && <p className="truncate text-[12px] text-[#98a0b4]">{short(p.address)}</p>}
        </div>
      </div>
      <ScoreBar score={score} />
      <div className="flex flex-wrap gap-x-[16px] gap-y-[2px] text-[12px] text-[#69728a]"><span><b className="text-[#1c2533]">{p.trustedBy}</b> trusted by</span><span><b className="text-[#1c2533]">{p.opinions}</b> opinions</span><span><b className="text-[#1c2533]">{fmt(p.cap)}</b> TRUST</span></div>
      <Tags p={p} />
      <div className="mt-auto flex gap-[6px]" onClick={(e) => e.stopPropagation()}><AddOpinionButton person={p.address} label={p.label} /><TrustButton address={p.address} label={p.label} onDone={() => {}} /></div>
    </div>
  );
}

