"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { isAddress, type Hex } from "viem";
import { addProjectInfo, backClaim, checkProject, linkCampaign, recommendProject, withdraw } from "@/lib/socialGraph/actions";
import { INFO_FIELDS, type InfoKey } from "@/lib/socialGraph/config";
import { getProject, hostOf, recommendTripleId, type InfoItem } from "@/lib/socialGraph/graph";
import { getChain } from "@/lib/chain";
import { useGraph } from "./context";
import { PersonName, ShareOpinion } from "./parts";
import { OpinionTable, PositionsTable } from "./lists";
import {
  Avatar, CARD, CheckMark, GhostButton, INNER, INPUT, Loading, Notice, PrimaryButton, SectionTitle, SegmentedTabs,
  ago, campaignReward, displayName, trustAmount, useAction, useLoad, useScores,
} from "./kit";
import { amount, curatorShare, token } from "./campaigns";

const SECTIONS: { title: string; keys: InfoKey[] }[] = [
  { title: "Socials", keys: ["x", "discord"] },
  { title: "Documents", keys: ["docs", "tokenomics", "roadmap"] },
  { title: "Token", keys: ["token", "market"] },
  { title: "Who's behind it", keys: ["team", "investors", "ambassadors"] },
];
type Tab = "overview" | "claims" | "people";

export default function ProjectPanel({ id }: { id: string }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const page = useLoad(() => getProject(id), [id]);
  const [tab, setTab] = useState<Tab>("overview");
  const [stake, setStake] = useState("");
  const [field, setField] = useState<InfoKey>("x");
  const [value, setValue] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [opKey, setOpKey] = useState(0);
  const reload = () => { void page.reload(); g.refresh(); };
  const act = (key: string, fn: () => Promise<unknown>, done: string) => (g.me ? run(key, fn, done, reload) : (g.connect(), Promise.resolve(false)));
  const explorer = getChain().blockExplorers?.default.url;


  if (page.loading && !page.data) return <Loading />;
  if (page.error) return <div className="p-[28px]"><Notice tone="warn">{page.error}</Notice></div>;
  if (!page.data) return <div className="p-[28px]"><Notice tone="warn">This project isn't on the graph.</Notice></div>;

  const { project: p, info, claims } = page.data;
  const iRecommend = !!g.me && p.recommenders.some((r) => r.account === g.me);
  const trustedRecs = p.recommenders.filter((r) => g.circle.has(r.account)).length;
  const linked = p.campaignIds.map((cid) => ({ id: cid, c: g.campaigns.get(cid) })).filter((x) => x.c);

  return (
    <div className="space-y-[16px] p-[20px] pt-[24px]">
      <div className={`${CARD} !rounded-[28px] p-[18px]`}>
        <div className="flex items-start gap-[14px] pr-[36px]">
          <Avatar image={p.image} name={p.name} seed={p.id} size={52} square />
          <div className="min-w-0">
            <div className="flex items-center gap-[8px]">
              <h2 className="truncate text-[20px] font-semibold tracking-[-0.5px]">{p.name}</h2>
              {p.checked && <CheckMark className="size-[20px]" />}
            </div>
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[4px] text-[13px] text-[#69728a] hover:text-[#8a3ffc]">{hostOf(p.url)}<ExternalLink className="size-[12px]" /></a>}
            <p className="mt-[4px] text-[12px] text-[#98a0b4]">Curated by <PersonName address={p.curator} label={p.curatorLabel} className="!font-medium !text-[#69728a]" /> · {ago(p.listedAt)}</p>
          </div>
        </div>
        {p.description && <p className="mt-[14px] text-[14px] leading-[21px] text-[#3d485c]">{p.description}</p>}

        <div className="mt-[16px] grid grid-cols-3 gap-[8px]">
          <div className={`${INNER} !rounded-[16px] px-[10px] py-[7px]`}><p className="text-[15px] font-semibold">{p.recommenders.length}</p><p className="text-[11px] text-[#69728a]">recommend it</p></div>
          <div className={`${INNER} !rounded-[16px] px-[10px] py-[7px]`}><p className="text-[15px] font-semibold">{trustedRecs}</p><p className="text-[11px] text-[#69728a]">you trust</p></div>
          <div className={`${INNER} !rounded-[16px] px-[10px] py-[7px]`}><p className="text-[15px] font-semibold">{trustAmount(p.staked)}</p><p className="text-[11px] text-[#69728a]">TRUST staked</p></div>
        </div>

        <div className="mt-[16px] flex flex-wrap items-center gap-[8px]">
          <input className={`${INPUT} !w-[110px]`} value={stake} onChange={(e) => setStake(e.target.value)} placeholder="TRUST" inputMode="decimal" aria-label="TRUST to stake" />
          <PrimaryButton busy={busy === "rec"} onClick={() => act("rec", () => recommendProject(p.id as Hex, stake), `You recommend ${p.name}`)}>{iRecommend ? "Recommend more" : "Recommend"}</PrimaryButton>
          {iRecommend && <GhostButton busy={busy === "unrec"} onClick={() => act("unrec", () => withdraw(recommendTripleId(p.id)), "Recommendation withdrawn")}>Withdraw</GhostButton>}
        </div>

        <div className="mt-[16px]">
          <Notice tone={p.checked ? "info" : "warn"}>
            {p.checked
              ? "Checked by Nexura: we researched this project and reached out to it. We don't control it, and a check isn't an endorsement."
              : "Listed by the community. Anyone can list a project; do your own research and trust your intuition."}
          </Notice>
        </div>
      </div>

      {linked.map(({ id: cid, c }) => (
        <button type="button" key={cid} onClick={() => g.openCampaign(cid)} className={`${CARD} flex w-full items-center justify-between gap-[12px] p-[18px] text-left hover:border-[rgba(138,63,252,0.4)]`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0b8a6a]">{c!.status === "Ended" ? "Campaign ended" : "Live campaign"}</p>
            <p className="text-[15px] font-semibold">{c!.title}</p>
          </div>
          <div className="text-right">
            {campaignReward(c!) && <span className="rounded-[40px] bg-[rgba(15,179,138,0.12)] px-[10px] py-[4px] text-[12px] font-semibold text-[#0b8a6a]">{campaignReward(c!)}</span>}
            <p className="mt-[6px] text-[11px] text-[#69728a]">{curatorShare(c!) > 0 ? <>Curator {displayName(p.curator, p.curatorLabel)} earns {amount(curatorShare(c!))} {token(c!)}</> : <>No curator reward on this one</>}</p>
          </div>
        </button>
      ))}

      <SegmentedTabs<Tab> label="Project sections" value={tab} onChange={setTab}
        items={[{ id: "overview", label: "DYOR" }, { id: "claims", label: `Opinions${claims.length ? ` (${claims.length})` : ""}` }, { id: "people", label: `Recommended by${p.recommenders.length ? ` (${p.recommenders.length})` : ""}` }]} />

      {tab === "overview" && (
        <div className="space-y-[12px]">
          <div className={`${CARD} !rounded-[24px] p-[16px]`}>
            <SectionTitle>Social opinion</SectionTitle>
            <a className="inline-flex items-center gap-[6px] text-[14px] font-semibold text-[#8a3ffc] hover:underline" target="_blank" rel="noopener noreferrer" href={`https://x.com/search?q=${encodeURIComponent(p.name)}&f=live`}>
              See what people say about {p.name} on X <ExternalLink className="size-[13px]" />
            </a>
          </div>
          {SECTIONS.map((s) => {
            const items = info.filter((i) => s.keys.includes(i.key as InfoKey));
            return (
              <div key={s.title} className={`${CARD} !rounded-[24px] p-[16px]`}>
                <SectionTitle>{s.title}</SectionTitle>
                {items.length === 0 ? <p className="text-[13px] text-[#98a0b4]">Nobody has added this yet.</p> : (
                  <div className="space-y-[8px]">
                    {items.map((i) => <InfoRow key={i.tripleId} item={i} explorer={explorer} busy={busy === i.tripleId} onBack={() => act(i.tripleId, () => backClaim(i.tripleId as Hex), "You back this info")} />)}
                  </div>
                )}
              </div>
            );
          })}
          <div className={`${CARD} !rounded-[24px] space-y-[10px] p-[16px]`}>
            <SectionTitle>Add info</SectionTitle>
            <select className={INPUT} value={field} onChange={(e) => setField(e.target.value as InfoKey)}>
              {INFO_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div className="flex gap-[8px]">
              <input className={INPUT} value={value} onChange={(e) => setValue(e.target.value)} placeholder={INFO_FIELDS.find((f) => f.key === field)?.placeholder} maxLength={300} />
              <PrimaryButton busy={busy === "info"} disabled={!value.trim()} onClick={async () => { if (await act("info", () => addProjectInfo(p.id as Hex, { [field]: [value] }), "Info added")) setValue(""); }}>Add</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {tab === "claims" && (
        <div className="space-y-[10px]">
          <ShareOpinion kind="project" subject={{ project: p.id as Hex }} existing={claims} onDone={() => { reload(); setOpKey((k) => k + 1); }} />
          <OpinionTable key={opKey} subject={p.id} compact />
        </div>
      )}

      {tab === "people" && <PositionsTable tripleId={recommendTripleId(p.id)} noun="recommendations" />}

      {g.isChecker && (
        <div className={`${CARD} !rounded-[24px] space-y-[10px] p-[16px]`}>
          <SectionTitle>Nexura team</SectionTitle>
          {!p.checked && <PrimaryButton className="w-full" busy={busy === "check"} onClick={() => act("check", () => checkProject(p.id as Hex), "Project checked")}>Add Nexura check</PrimaryButton>}
          <div className="flex gap-[8px]">
            <input className={INPUT} value={campaignId} onChange={(e) => setCampaignId(e.target.value.trim())} placeholder="Campaign ID" />
            <GhostButton busy={busy === "link"} disabled={!/^[a-f0-9]{24}$/i.test(campaignId) || !g.campaigns.has(campaignId)}
              onClick={async () => { if (await act("link", () => linkCampaign(p.id as Hex, campaignId), "Campaign linked")) setCampaignId(""); }}>
              Link campaign
            </GhostButton>
          </div>
          {/^[a-f0-9]{24}$/i.test(campaignId) && !g.campaigns.has(campaignId) && <p className="text-[12px] text-[#c2414a]">No published campaign has that ID.</p>}
        </div>
      )}
    </div>
  );
}

function InfoRow({ item, explorer, busy, onBack }: { item: InfoItem; explorer?: string; busy: boolean; onBack: () => void }) {
  const { me, circle } = useGraph();
  const link = /^https?:\/\//i.test(item.value) ? item.value : item.key === "token" && isAddress(item.value) && explorer ? `${explorer}/address/${item.value}` : null;
  const mine = !!me && item.backers.some((b) => b.account === me);
  const friends = item.backers.filter((b) => circle.has(b.account)).length;
  return (
    <div className={`${INNER} flex items-center justify-between gap-[10px] px-[14px] py-[10px]`}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a0b4]">{item.label}</p>
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="break-all text-[14px] font-medium text-[#1c2533] hover:text-[#8a3ffc]">{item.value}</a> : <p className="break-all text-[14px] font-medium">{item.value}</p>}
        <p className="text-[11px] text-[#98a0b4]">Added by <PersonName address={item.addedBy} label={item.addedByLabel} className="!font-medium !text-[#69728a]" /> · {item.backers.length} backing{friends ? ` · ${friends} you trust` : ""}</p>
      </div>
      {mine ? <span className="shrink-0 text-[12px] font-semibold text-[#0b8a6a]">You back this</span> : <GhostButton small busy={busy} onClick={onBack}>Back it</GhostButton>}
    </div>
  );
}
