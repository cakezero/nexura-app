"use client";

import { useState, type ReactNode } from "react";
import type { Hex } from "viem";
import { makeClaim } from "@/lib/socialGraph/actions";
import { SUGGESTED_CLAIMS } from "@/lib/socialGraph/config";
import { hostOf, type Claim, type Contribution, type Project } from "@/lib/socialGraph/graph";
import { useGraph } from "./context";
import {
  Avatar, AvatarStack, CheckMark, GhostButton, INPUT, Modal, PrimaryButton, ScoreChip, TILE,
  campaignReward, displayName, trustAmount, useAction, type CampaignSummary, type Score,
} from "./kit";

export function PersonName({ address, label, className = "" }: { address: string; label?: string; className?: string }) {
  const { openPerson, me } = useGraph();
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); openPerson(address); }} className={`font-semibold text-[#1c2533] hover:text-[#8a3ffc] ${className}`}>
      {address === me ? "You" : displayName(address, label)}
    </button>
  );
}

export function ProjectName({ id, name }: { id: string; name: string }) {
  const { openProject } = useGraph();
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); openProject(id); }} className="font-semibold text-[#1c2533] hover:text-[#8a3ffc]">
      {name}
    </button>
  );
}

export const TrustedBadge = () => <span className="rounded-[40px] bg-[rgba(138,63,252,0.1)] px-[7px] py-[1px] text-[10px] font-semibold text-[#6e2bd8]">Trusted</span>;
export const VerifiedBadge = () => <span className="rounded-[40px] bg-[rgba(15,179,138,0.12)] px-[7px] py-[1px] text-[10px] font-semibold text-[#0b8a6a]" title="Has contributions on Nexura, written to the graph by Nexura">Nexura member</span>;

export const CuratorBadge = () => <span className="rounded-[40px] bg-[rgba(90,168,255,0.14)] px-[7px] py-[1px] text-[10px] font-semibold text-[#2f6fc4]" title="Listed a project that runs a Nexura campaign">Curator</span>;
export const AmbassadorBadge = () => <span className="rounded-[40px] bg-[rgba(245,158,11,0.14)] px-[7px] py-[1px] text-[10px] font-semibold text-[#9a6400]" title="Brought new people to Nexura">Ambassador</span>;

export function contributionText(c: Contribution, campaigns: Map<string, CampaignSummary>) {
  const camp = campaigns.get(c.campaignId);
  const title = camp?.title ?? "a campaign";
  return c.kind === "joined" ? `Joined ${title}` : `Finished ${title}`;
}

export function RecommendedBy({ project }: { project: Project }) {
  const { circle, me } = useGraph();
  const backers = [...project.recommenders].sort((a, b) => Number(circle.has(b.account)) - Number(circle.has(a.account)));
  if (!backers.length) return <span className="text-[12px] text-[#98a0b4]">No recommendations yet</span>;
  const trusted = backers.filter((b) => circle.has(b.account)).length;
  const first = backers[0]!;
  const others = backers.length - 1;
  return (
    <div className="flex min-w-0 items-center gap-[8px]">
      <AvatarStack people={backers} size={22} />
      <span className="truncate text-[12px] text-[#69728a]">
        {first.account === me ? "You" : displayName(first.account, first.label)}
        {others > 0 && ` +${others}`}
        {trusted > 0 && <span className="text-[#6e2bd8]"> · {trusted} you trust</span>}
      </span>
    </div>
  );
}

export function ProjectCard({ project: p }: { project: Project }) {
  const { openProject, campaigns } = useGraph();
  const live = p.campaignIds.map((id) => campaigns.get(id)).filter((c): c is CampaignSummary => !!c && c.status !== "Ended");
  const reward = live[0] ? campaignReward(live[0]) : "";
  return (
    <button type="button" onClick={() => openProject(p.id)} className={`${TILE} flex flex-col gap-[10px] p-[16px] text-left transition hover:border-[rgba(138,63,252,0.4)] hover:shadow-[0_8px_20px_rgba(138,63,252,0.08)]`}>
      <div className="flex items-center gap-[10px]">
        <Avatar image={p.image} name={p.name} seed={p.id} size={40} square />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[5px]"><h3 className="truncate text-[15px] font-semibold">{p.name}</h3>{p.checked && <CheckMark className="size-[15px]" />}</div>
          <p className="truncate text-[12px] text-[#69728a]">{[hostOf(p.url), `by ${displayName(p.curator, p.curatorLabel)}`].filter(Boolean).join(" · ")}</p>
        </div>
        {reward && <span className="shrink-0 rounded-[40px] bg-[rgba(15,179,138,0.12)] px-[8px] py-[3px] text-[11px] font-semibold text-[#0b8a6a]">{reward}</span>}
      </div>
      <p className="line-clamp-2 text-[13px] leading-[18px] text-[#3d485c]">{p.description || "No description yet."}</p>
      <div className="mt-auto flex items-center justify-between gap-[8px] border-t-[0.833px] border-[rgba(28,37,51,0.08)] pt-[10px]">
        <RecommendedBy project={p} />
        {p.staked > 0 && <span className="shrink-0 text-[12px] font-semibold text-[#3d485c]">{trustAmount(p.staked)} TRUST</span>}
      </div>
    </button>
  );
}

export function PersonRow({ address, label, image, score, right, sub }: { address: string; label?: string; image?: string; score?: Score | null; right?: ReactNode; sub?: ReactNode }) {
  const { openPerson, circle, me } = useGraph();
  return (
    <div className="flex items-center gap-[10px] rounded-[18px] px-[8px] py-[6px] hover:bg-[#f7f4fe]">
      <button type="button" onClick={() => openPerson(address)} className="flex min-w-0 flex-1 items-center gap-[10px] text-left">
        <Avatar image={image} name={label || address} seed={address} size={34} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[5px]">
            <span className="truncate text-[14px] font-semibold text-[#1c2533]">{address === me ? "You" : displayName(address, label)}</span>
            {circle.has(address) && <TrustedBadge />}
            <ScoreChip score={score} />
          </div>
          {sub && <div className="truncate text-[12px] text-[#69728a]">{sub}</div>}
        </div>
      </button>
      {right}
    </div>
  );
}

export function AddOpinionButton({ person, label, onDone, primary }: { person: string; label?: string; onDone?: () => void; primary?: boolean }) {
  const { me, connect } = useGraph();
  const [open, setOpen] = useState(false);
  if (person === me) return null;
  const Btn = primary === false ? GhostButton : PrimaryButton;
  return (
    <>
      <Btn small onClick={(e) => { e.stopPropagation(); if (!me) connect(); else setOpen(true); }}>Add opinion</Btn>
      {open && (
        <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Modal title={`Your opinion about ${displayName(person, label)}`} onClose={() => setOpen(false)}>
            <ShareOpinion kind="person" subject={{ person }} existing={[]} onDone={() => { setOpen(false); onDone?.(); }} />
          </Modal>
        </span>
      )}
    </>
  );
}

export function ShareOpinion({ subject, existing, kind, onDone }: { subject: { project?: Hex; person?: string }; existing: Claim[]; kind: "person" | "project"; onDone: () => void }) {
  const { me, connect } = useGraph();
  const { busy, run } = useAction();
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const taken = new Set(existing.map((c) => c.text.toLowerCase()));
  const suggestions = SUGGESTED_CLAIMS[kind].filter((s) => !taken.has(s));
  const share = async () => {
    if (!me) { connect(); return; }
    if (await run("claim", () => makeClaim(subject, text, amount), "Opinion shared", onDone)) setText("");
  };
  return (
    <div className={`${TILE} space-y-[8px] p-[12px]`}>
      <p className="text-[13px] font-semibold">Share an opinion</p>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {suggestions.map((x) => (
            <button key={x} type="button" onClick={() => setText(x)}
              className={`rounded-[10px] border-[0.833px] px-[8px] py-[3px] text-[12px] transition ${text === x ? "border-[#8a3ffc] bg-[rgba(138,63,252,0.1)] text-[#6e2bd8]" : "border-[rgba(28,37,51,0.15)] text-[#3d485c] hover:border-[#8a3ffc]"}`}>
              {x}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-[8px]">
        <span className="text-[13px] font-semibold text-[#69728a]">Is</span>
        <input className={`${INPUT} !h-[40px] min-w-[160px] flex-1`} value={text} onChange={(e) => setText(e.target.value)} placeholder="a reliable builder" maxLength={80} />
        <input className={`${INPUT} !h-[40px] !w-[96px]`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="TRUST" inputMode="decimal" aria-label="TRUST to stake" title="Leave empty to stake the minimum. You can withdraw it later." />
        <PrimaryButton small busy={busy === "claim"} disabled={text.trim().length < 2} onClick={share}>Share</PrimaryButton>
      </div>
    </div>
  );
}
