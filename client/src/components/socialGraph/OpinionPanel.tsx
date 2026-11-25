"use client";

import { useState } from "react";
import { stakeClaim, withdraw } from "@/lib/socialGraph/actions";
import { getOpinion } from "@/lib/socialGraph/graph";
import { useGraph } from "./context";
import { PositionsTable } from "./lists";
import { PersonName } from "./parts";
import { Avatar, CARD, Chip, GhostButton, INPUT, Loading, Notice, PrimaryButton, SectionTitle, ago, displayName, trustAmount, useAction, useLoad } from "./kit";

export default function OpinionPanel({ id }: { id: string }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const op = useLoad(() => getOpinion(id), [id]);
  const [amount, setAmount] = useState("");
  const [tableKey, setTableKey] = useState(0);
  const reload = () => { void op.reload(); setTableKey((k) => k + 1); };
  const act = (key: string, fn: () => Promise<unknown>, done: string) => (g.me ? run(key, fn, done, reload) : (g.connect(), Promise.resolve(false)));

  if (op.loading && !op.data) return <Loading />;
  if (!op.data) return <div className="p-[24px]"><Notice tone="warn">{op.error ?? "This opinion isn't on the graph."}</Notice></div>;
  const o = op.data;
  const total = o.forStaked + o.againstStaked;
  const pct = total > 0 ? Math.round((o.forStaked / total) * 100) : 100;
  const mineFor = !!g.me && o.supporters.some((b) => b.account === g.me);
  const mineAgainst = !!g.me && o.opposers.some((b) => b.account === g.me);
  const aboutName = o.about.person ? (o.about.person === g.me ? "You" : displayName(o.about.person, o.about.name)) : o.about.name;

  return (
    <div className="space-y-[14px] p-[20px] pt-[24px]">
      <div className={`${CARD} !rounded-[28px] space-y-[14px] p-[18px]`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a3ffc]">Opinion</p>
        <div className="flex flex-wrap items-center gap-[8px] pr-[36px] text-[18px]">
          <Chip onClick={() => (o.about.person ? g.openPerson(o.about.person) : g.openProject(o.about.projectId!))}>
            <Avatar image={o.about.image} name={aboutName} seed={o.about.person ?? o.about.projectId ?? ""} size={22} square={!o.about.person} />{aboutName}
          </Chip>
          <span className="text-[14px] text-[#69728a]">is</span>
          <Chip>{o.text}</Chip>
        </div>
        <p className="text-[12px] text-[#98a0b4]">Shared by <PersonName address={o.by} label={o.byLabel} className="!font-medium !text-[#69728a]" /> · {ago(o.at)}</p>

        <div>
          <div className="mb-[6px] flex justify-between text-[12px]">
            <span className="font-semibold text-[#0b8a6a]">{o.supporters.length} agree · {trustAmount(o.forStaked)} TRUST</span>
            <span className="font-semibold text-[#c2414a]">{o.opposers.length} disagree · {trustAmount(o.againstStaked)} TRUST</span>
          </div>
          <div className="h-[8px] overflow-hidden rounded-full bg-[rgba(228,84,91,0.25)]"><div className="h-full rounded-full bg-[#0fb38a]" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          {mineFor || mineAgainst ? (
            <GhostButton busy={busy === "w"} onClick={() => act("w", () => withdraw(mineFor ? o.tripleId : o.counterId), "Withdrawn")}>{mineFor ? "You agree · withdraw" : "You disagree · withdraw"}</GhostButton>
          ) : (
            <>
              <input className={`${INPUT} !h-[40px] !w-[110px]`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="TRUST" inputMode="decimal" aria-label="TRUST to stake" title="Leave empty to stake the minimum. You can withdraw it later." />
              <PrimaryButton busy={busy === "f"} onClick={() => act("f", () => stakeClaim(o.tripleId, "for", amount), "You agree")}>Agree</PrimaryButton>
              <GhostButton danger busy={busy === "a"} onClick={() => act("a", () => stakeClaim(o.tripleId, "against", amount), "You disagree")}>Disagree</GhostButton>
            </>
          )}
        </div>
      </div>

      <div className={`${CARD} !rounded-[28px] p-[16px]`}>
        <SectionTitle>Positions on this opinion</SectionTitle>
        <PositionsTable key={tableKey} tripleId={o.tripleId} counterId={o.counterId} />
      </div>
    </div>
  );
}
