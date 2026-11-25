"use client";

import { useState } from "react";
import { ArrowBigDown, ArrowBigUp, Flag, Handshake, Info, MessageSquareQuote, Sparkles, ThumbsUp } from "lucide-react";
import type { Hex } from "viem";
import { recommendProject, stakeClaim, trustPerson, withdraw } from "@/lib/socialGraph/actions";
import { pageFeed, type FeedFilter, type FeedKind, type FeedPost, type TripleSort, type Who } from "@/lib/socialGraph/paged";
import { useGraph } from "./context";
import { TRIPLE_SORTS, fmt, useDebounced } from "./lists";
import { AddOpinionButton, PersonName, TrustedBadge, VerifiedBadge, contributionText } from "./parts";
import {
  Avatar, AvatarStack, Chip, Empty, GhostButton, ListBar, Notice, PageEnd, PrimaryButton, ScoreChip, TILE,
  ago, displayName, trustAmount, useAction, usePaged, useScores, type Option,
} from "./kit";

const KIND: Record<FeedKind, { label: string; icon: typeof Flag; tone: string }> = {
  opinion: { label: "Opinion", icon: MessageSquareQuote, tone: "bg-[rgba(138,63,252,0.1)] text-[#6e2bd8]" },
  trust: { label: "Trust", icon: Handshake, tone: "bg-[rgba(90,168,255,0.14)] text-[#2f6fc4]" },
  recommend: { label: "Recommendation", icon: ThumbsUp, tone: "bg-[rgba(15,179,138,0.12)] text-[#0b8a6a]" },
  listed: { label: "New project", icon: Sparkles, tone: "bg-[rgba(245,158,11,0.14)] text-[#9a6400]" },
  info: { label: "Project info", icon: Info, tone: "bg-[#f4f1fc] text-[#3d485c]" },
  contribution: { label: "Campaign", icon: Flag, tone: "bg-[rgba(228,84,91,0.1)] text-[#c2414a]" },
};

const FILTERS = (me: boolean): Option<FeedFilter>[] => [
  { id: "all", label: "Everything" }, "divider",
  { id: "people", label: "About people" }, { id: "projects", label: "About projects" }, "divider",
  { id: "opinion", label: "Opinions" }, { id: "trust", label: "Trust" }, { id: "recommend", label: "Recommendations" },
  { id: "listed", label: "New projects" }, { id: "info", label: "Project info" }, { id: "contribution", label: "Campaign activity" },
  ...(me ? ["divider" as const, { id: "trusted" as const, label: "From people I trust" }, { id: "mine" as const, label: "Mine" }, { id: "aboutMe" as const, label: "About me" }] : []),
];

export function Feed() {
  const g = useGraph();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [sort, setSort] = useState<TripleSort>("newest");
  const q = useDebounced(search);
  const circleKey = [...g.circle].sort().join(",");
  const page = usePaged((offset) => pageFeed({ filter, sort, search: q, offset, me: g.me, circle: [...g.circle] }), [filter, sort, q, g.me, circleKey]);
  const score = useScores(page.rows.map((r) => r.actor));

  return (
    <div className="min-w-0 space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Search people, projects and opinions" filter={filter} filters={FILTERS(!!g.me)} onFilter={setFilter} sort={sort} sorts={TRIPLE_SORTS} onSort={setSort} />
      {page.error ? <Notice tone="warn">{page.error}</Notice>
        : !page.loading && page.rows.length === 0 ? <Empty>{search || filter !== "all" ? "Nothing matches." : "Nothing yet."}</Empty>
        : (
          <div className="space-y-[8px]">
            {page.rows.map((p) => <Post key={p.id} p={p} score={score(p.actor)} onChange={page.reload} />)}
            <PageEnd loading={page.loading} more={page.more} onMore={page.loadMore} count={page.rows.length} total={page.total} noun="posts" />
          </div>
        )}
    </div>
  );
}

function About({ who }: { who: Who }) {
  const g = useGraph();
  const open = (e: React.MouseEvent) => { e.stopPropagation(); if (who.address) g.openPerson(who.address); else if (who.projectId) g.openProject(who.projectId); };
  return (
    <Chip onClick={open}>
      <Avatar image={who.image} name={who.name || who.address || "?"} seed={who.address ?? who.projectId ?? ""} size={20} square={!who.address} />
      {who.address ? (who.address === g.me ? "you" : displayName(who.address, who.name)) : who.name}
    </Chip>
  );
}

function Post({ p, score, onChange }: { p: FeedPost; score: ReturnType<ReturnType<typeof useScores>>; onChange: () => void }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const act = (key: string, fn: () => Promise<unknown>, done: string) => (g.me ? void run(key, fn, done, () => { onChange(); g.refresh(); }) : g.connect());
  const k = KIND[p.kind];
  const open = () => {
    if (p.kind === "opinion") g.openOpinion(p.id);
    else if (p.kind === "contribution" && p.contribution) g.openCampaign(p.contribution.campaignId);
    else if (p.about.projectId) g.openProject(p.about.projectId);
    else g.openPerson(p.about.address ?? p.actor);
  };
  const others = Math.max(0, p.forCount - 1);
  const sentence = {
    opinion: <>says <About who={p.about} /> is <Chip tone="brand">{p.text}</Chip></>,
    trust: <>trusts <About who={p.about} /></>,
    recommend: <>recommends <About who={p.about} />{others > 0 && <span className="text-[#69728a]"> with {others} other{others === 1 ? "" : "s"}</span>}</>,
    listed: <>listed <About who={p.about} /></>,
    info: <>added {p.field ?? "info"} to <About who={p.about} /> <span className="break-all text-[#69728a]">{p.text}</span></>,
    contribution: <span className="text-[#3d485c]">{p.contribution ? contributionText(p.contribution, g.campaigns).replace(/^./, (c) => c.toLowerCase()) : "took part in a campaign"}</span>,
  }[p.kind];

  const action = (() => {
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    if (p.kind === "opinion") {
      if (p.mySide) return <GhostButton small busy={busy === "w"} onClick={(e) => { stop(e); act("w", () => withdraw(p.mySide === "for" ? p.id : p.counterId), "Withdrawn"); }}>{p.mySide === "for" ? "Agreed" : "Disagreed"} · undo</GhostButton>;
      return <>
        <PrimaryButton small busy={busy === "f"} onClick={(e) => { stop(e); act("f", () => stakeClaim(p.id, "for"), "You agree"); }}>Agree</PrimaryButton>
        <GhostButton small danger busy={busy === "a"} onClick={(e) => { stop(e); act("a", () => stakeClaim(p.id, "against"), "You disagree"); }}>Disagree</GhostButton>
      </>;
    }
    if ((p.kind === "trust" || p.kind === "contribution") && p.about.address && p.about.address !== g.me)
      return <>
        <AddOpinionButton person={p.about.address} label={p.about.name} onDone={onChange} />
        {!g.circle.has(p.about.address) && <GhostButton small busy={busy === "t"} onClick={(e) => { stop(e); act("t", () => trustPerson(p.about.address!), `You trust ${displayName(p.about.address!, p.about.name)}`); }}>{p.kind === "trust" ? "Trust too" : "Trust"}</GhostButton>}
      </>;
    if (p.kind === "recommend" && p.about.projectId && !p.mySide)
      return <PrimaryButton small busy={busy === "r"} onClick={(e) => { stop(e); act("r", () => recommendProject(p.about.projectId as Hex), "You recommend it"); }}>Recommend too</PrimaryButton>;
    return null;
  })();

  return (
    <article role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === "Enter" && open()}
      className={`${TILE} cursor-pointer px-[16px] py-[14px] transition hover:border-[rgba(138,63,252,0.35)] hover:shadow-[0_8px_24px_rgba(28,37,51,0.06)]`}>
      <div className="flex gap-[12px]">
        <button type="button" onClick={(e) => { e.stopPropagation(); g.openPerson(p.actor); }} className="shrink-0 self-start">
          <Avatar image={p.actorImage} name={p.actorLabel || p.actor} seed={p.actor} size={40} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-[6px] gap-y-[2px] text-[13px]">
            <PersonName address={p.actor} label={p.actorLabel} className="text-[14px]" />
            {p.actor !== g.me && g.circle.has(p.actor) && <TrustedBadge />}
            {g.verified.has(p.actor) && <VerifiedBadge />}
            <ScoreChip score={score} />
            <span className="text-[#98a0b4]">· {ago(p.at)}</span>
            <span className={`ml-auto inline-flex items-center gap-[4px] rounded-[40px] px-[8px] py-[2px] text-[11px] font-semibold ${k.tone}`}><k.icon className="size-[12px]" />{k.label}</span>
          </div>
          <div className="mt-[6px] flex flex-wrap items-center gap-[6px] text-[14px] leading-[22px] text-[#1c2533]">{sentence}</div>
          <div className="mt-[10px] flex flex-wrap items-center gap-[10px] text-[12px]">
            <span className="inline-flex items-center gap-[3px] font-semibold text-[#0b8a6a]" title="Supporters"><ArrowBigUp className="size-[16px]" />{p.forCount}<span className="font-normal text-[#69728a]">· {fmt(p.forTrust)}</span></span>
            <span className="inline-flex items-center gap-[3px] font-semibold text-[#c2414a]" title="Opposers"><ArrowBigDown className="size-[16px]" />{p.againstCount}<span className="font-normal text-[#69728a]">· {fmt(p.againstTrust)}</span></span>
            {p.backers.length > 0 && <AvatarStack people={p.backers} size={20} />}
            <span className="text-[#98a0b4]">{trustAmount(p.cap)} TRUST market cap</span>
            {action && <div className="ml-auto flex gap-[6px]">{action}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}
