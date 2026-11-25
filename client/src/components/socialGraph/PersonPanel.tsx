"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { sponsorUser, trustPerson, withdraw } from "@/lib/socialGraph/actions";
import { accountAtomId, short } from "@/lib/socialGraph/config";
import { getActivity, getClaims, getContributions, getInvites, getTrust, trustTripleId, type Claim, type Invite, type Person } from "@/lib/socialGraph/graph";
import { useToast } from "@/hooks/use-toast";
import { useGraph } from "./context";
import { OpinionTable } from "./lists";
import { amount, curatorShare, token } from "./campaigns";
import { NetworkGraph, NetworkLegend } from "./network";
import { AddOpinionButton, AmbassadorBadge, CuratorBadge, PersonName, ProjectName, ShareOpinion, TrustedBadge, VerifiedBadge, contributionText } from "./parts";
import {
  Avatar, CARD, GhostButton, INNER, INPUT, ListBar, Loading, Notice, PrimaryButton, SectionTitle, SegmentedTabs, Table, TILE,
  ago, displayName, trustAmount, useAction, useLoad, useScores, type Option, type Score,
} from "./kit";

type Tab = "opinions" | "trust" | "contributions";

export default function PersonPanel({ address }: { address: string }) {
  const g = useGraph();
  const { toast } = useToast();
  const { busy, run } = useAction();
  const [tab, setTab] = useState<Tab>("opinions");
  const [stake, setStake] = useState("");
  const [cap, setCap] = useState("");
  const [showSponsor, setShowSponsor] = useState(false);
  const [opKey, setOpKey] = useState(0);

  const trust = useLoad(() => getTrust(address), [address]);
  const activity = useLoad(() => getActivity(address), [address]);
  const claims = useLoad(() => getClaims(accountAtomId(address)), [address]);
  const contributions = useLoad(() => getContributions(address), [address]);
  const invites = useLoad(() => getInvites({ address }).catch(() => [] as Invite[]), [address]);
  const score = useScores([address]);
  const reload = () => { void trust.reload(); void activity.reload(); void claims.reload(); void contributions.reload(); setOpKey((k) => k + 1); g.refresh(); };
  const act = (key: string, fn: () => Promise<unknown>, done: string) => (g.me ? run(key, fn, done, reload) : (g.connect(), Promise.resolve(false)));

  const isMe = g.me === address;
  const person = activity.data?.person;
  const name = isMe ? "You" : displayName(address, person?.label);
  const iTrust = !!g.me && !!trust.data?.trustedBy.some((p) => p.address === g.me);
  const trustedByMine = (trust.data?.trustedBy ?? []).filter((p) => g.circle.has(p.address)).length;
  const s = score(address);
  const paidInvites = (invites.data ?? []).filter((i) => i.status === "paid");
  const invitedBy = paidInvites.filter((i) => i.invitee === address);
  const invited = paidInvites.filter((i) => i.inviter === address);
  const sponsoredBy = activity.data?.sponsoredBy ?? [];
  const sponsored = activity.data?.sponsored ?? [];
  const ambassador = invited.length > 0 || sponsored.length > 0;
  const camp = (id: string) => <button type="button" className="font-semibold hover:text-[#8a3ffc]" onClick={() => g.openCampaign(id)}>{g.campaigns.get(id)?.title ?? "an opportunity"}</button>;
  const curated = (g.projects ?? []).filter((p) => p.curator === address);
  const credits = curated.flatMap((p) => p.campaignIds.map((id) => ({ project: p, campaign: g.campaigns.get(id) })).filter((x) => x.campaign)).map((x) => ({ ...x, share: curatorShare(x.campaign!) }));
  const curator = credits.length > 0;
  const member = !!s || g.verified.has(address) || (contributions.data?.length ?? 0) > 0;

  return (
    <div className="space-y-[14px] p-[20px] pt-[24px]">
      <div className={`${CARD} !rounded-[28px] p-[18px]`}>
        <div className="flex items-center gap-[12px] pr-[36px]">
          <Avatar image={person?.image} name={person?.label || address} seed={address} size={52} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[6px]"><h2 className="truncate text-[20px] font-semibold tracking-[-0.5px]">{name}</h2>{member && <VerifiedBadge />}{ambassador && <AmbassadorBadge />}{curator && <CuratorBadge />}{!isMe && g.circle.has(address) && <TrustedBadge />}</div>
            <button type="button" className="inline-flex items-center gap-[6px] text-[12px] text-[#69728a] hover:text-[#8a3ffc]" onClick={() => { void navigator.clipboard?.writeText(address); toast({ title: "Address copied" }); }}>
              {short(address)} <Copy className="size-[12px]" />
            </button>
          </div>
        </div>

        <ScoreCard score={s} isMe={isMe} />

        <div className="mt-[10px] grid grid-cols-3 gap-[6px]">
          <Mini label="Trusted by" value={trust.data?.trustedBy.length ?? "…"} />
          <Mini label="Trusts" value={trust.data?.trusts.length ?? "…"} />
          <Mini label="Opinions about them" value={claims.data?.length ?? "…"} />
        </div>

        {!isMe && (
          <div className="mt-[12px] space-y-[8px]">
            <div className="flex flex-wrap items-center gap-[8px]">
              <AddOpinionButton person={address} label={person?.label} onDone={reload} />
              <input className={`${INPUT} !h-[34px] !w-[84px] !text-[13px]`} value={stake} onChange={(e) => setStake(e.target.value)} placeholder="TRUST" inputMode="decimal" aria-label="TRUST to stake on your trust" />
              <GhostButton small busy={busy === "trust"} onClick={() => act("trust", () => trustPerson(address, stake), `You trust ${name}`)}>{iTrust ? "Trust more" : "Trust"}</GhostButton>
              {iTrust && <GhostButton busy={busy === "untrust"} onClick={() => act("untrust", () => withdraw(trustTripleId(g.me!, address)), `You no longer trust ${name}`)}>Stop trusting</GhostButton>}
              <GhostButton small onClick={() => setShowSponsor((v) => !v)}>Sponsor gas</GhostButton>
            </div>
            {showSponsor && (
              <div className={`${INNER} !rounded-[18px] space-y-[8px] p-[12px]`}>
                <p className="text-[13px] text-[#3d485c]">Send {name} TRUST to cover their gas. The amount is the cap; it&apos;s theirs once sent.</p>
                <div className="flex gap-[8px]">
                  <input className={`${INPUT} !h-[40px] !w-[130px]`} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="Cap in TRUST" inputMode="decimal" />
                  <PrimaryButton busy={busy === "sponsor"} disabled={!(Number(cap) > 0)} onClick={async () => { if (await act("sponsor", () => sponsorUser(address, cap), `You sponsored ${name}`)) { setCap(""); setShowSponsor(false); } }}>Send</PrimaryButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isMe && <GraphSays trustedBy={trust.data?.trustedBy ?? null} trustedByMine={trustedByMine} claims={claims.data} sponsors={activity.data?.sponsoredBy.length ?? 0} brought={invited.length + sponsored.length} contributions={contributions.data?.length ?? 0} />}

      <SegmentedTabs<Tab> label="Person sections" value={tab} onChange={setTab}
        items={[{ id: "opinions", label: `Opinions${claims.data?.length ? ` (${claims.data.length})` : ""}` }, { id: "trust", label: "Trust" }, { id: "contributions", label: "Contributions" }]} />

      {tab === "opinions" && (
        <div className="space-y-[10px]">
          {!isMe && <ShareOpinion kind="person" subject={{ person: address }} existing={claims.data ?? []} onDone={reload} />}
          <OpinionTable key={opKey} subject={accountAtomId(address)} compact />
        </div>
      )}

      {tab === "trust" && (trust.loading && !trust.data ? <Loading /> : (
        <div className="space-y-[10px]">
          {(trust.data?.trusts.length || trust.data?.trustedBy.length) ? (
            <div className={`${CARD} !rounded-[24px] overflow-hidden`}>
              <div className="px-[14px] pt-[12px]"><NetworkLegend /></div>
              <NetworkGraph center={{ address, label: person?.label, image: person?.image }} trusts={trust.data!.trusts} trustedBy={trust.data!.trustedBy} onOpen={g.openPerson} me={g.me} />
            </div>
          ) : null}
          <TrustLists trusts={trust.data?.trusts ?? []} trustedBy={trust.data?.trustedBy ?? []} isMe={isMe} onChange={reload} />
        </div>
      ))}

      {tab === "contributions" && (
        activity.loading && !activity.data ? <Loading /> : !activity.data ? <Notice tone="warn">{activity.error ?? "Couldn't load this"}</Notice> : (
          <div className="space-y-[10px]">
            <Section title="Campaigns" count={contributions.data?.length ?? 0} empty="No campaign activity written to the graph yet.">
              {(contributions.data ?? []).map((c, i) => <Line key={i} left={<button type="button" className="text-left hover:text-[#8a3ffc]" onClick={() => g.openCampaign(c.campaignId)}>{contributionText(c, g.campaigns)}</button>} right={ago(c.at)} />)}
            </Section>
            <Section title="Brought in by" count={invitedBy.length + sponsoredBy.length} empty="Nobody invited or sponsored them.">
              {invitedBy.map((i) => <Line key={i._id} left={<>Invited by <PersonName address={i.inviter} /> to {camp(i.campaign)}</>} right={`${i.amount} TRUST`} />)}
              {sponsoredBy.map((p) => <Line key={`s${p.address}`} left={<>Sponsored by <PersonName address={p.address} label={p.label} /></>} />)}
            </Section>
            <Section title="People they brought in" count={invited.length + sponsored.length} empty="None yet.">
              {invited.map((i) => <Line key={i._id} left={<><PersonName address={i.invitee} /> · invited to {camp(i.campaign)}</>} right={`${i.amount} TRUST`} />)}
              {sponsored.map((p) => <Line key={`s${p.address}`} left={<><PersonName address={p.address} label={p.label} /> · sponsored</>} />)}
            </Section>
            <Section title="Projects listed" count={activity.data.listed.length} empty="None yet.">
              {activity.data.listed.map((x) => {
                const mine = curated.some((p) => p.id === x.id);
                return <Line key={x.id} left={<><ProjectName id={x.id} name={x.name} />{mine ? <span className="text-[#98a0b4]"> · curator</span> : null}</>} right={ago(x.at)} />;
              })}
            </Section>
            {curator && (
              <Section title="Curator rewards" count={credits.length} empty="">
                {credits.map(({ project, campaign, share }) => (
                  <Line key={`${project.id}${campaign!._id}`} left={<><ProjectName id={project.id} name={project.name} /> · <button type="button" className="hover:text-[#8a3ffc]" onClick={() => g.openCampaign(campaign!._id)}>{campaign!.title}</button></>}
                    right={share > 0 ? `${amount(share)} ${token(campaign!)}` : "No curator reward"} />
                ))}
              </Section>
            )}
            <Section title="Recommends" count={activity.data.recommended.length} empty="None yet.">
              {activity.data.recommended.map((x) => <Line key={x.tripleId} left={<ProjectName id={x.id} name={x.name} />} right={`${trustAmount(x.staked)} TRUST`} />)}
            </Section>
            <Section title="Opinions they shared or took a side on" count={activity.data.claims.length} empty="None yet.">
              {activity.data.claims.map((c) => (
                <Line key={c.tripleId} left={<button type="button" className="text-left hover:text-[#8a3ffc]" onClick={() => g.openOpinion(c.tripleId)}>{c.side === "for" ? "Agrees" : "Disagrees"}: {c.about.name || (c.about.person ? short(c.about.person) : "a project")} is <b>“{c.text}”</b></button>} right={ago(c.at)} />
              ))}
            </Section>
          </div>
        )
      )}
    </div>
  );
}

function ScoreCard({ score, isMe }: { score: Score | null | undefined; isMe: boolean }) {
  const has = score?.nexuraScore != null;
  return (
    <div className={`${INNER} !rounded-[18px] mt-[12px] p-[12px]`}>
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[12px] font-semibold text-[#69728a]">Nexura score</span>
        <span className="text-[18px] font-semibold">{has ? `${score!.nexuraScore}%` : "No score yet"}</span>
      </div>
      {has ? (
        <>
          <div className="mt-[6px] h-[6px] overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[linear-gradient(150deg,#9b7cff_0%,#7c5cfc_45%,#5aa8ff_100%)]" style={{ width: `${score!.nexuraScore}%` }} /></div>
          <p className="mt-[6px] text-[11px] text-[#69728a]">Campaign retention {score!.retention ?? 0}% over {score!.campaigns} campaign{score!.campaigns === 1 ? "" : "s"} · trust from real members {score!.trust ?? 0}/100</p>
        </>
      ) : (
        <p className="mt-[4px] text-[11px] text-[#69728a]">{isMe ? "It appears once you finish a campaign stage on Nexura." : "They haven't finished a campaign stage on Nexura yet."}</p>
      )}
    </div>
  );
}

function GraphSays({ trustedBy, trustedByMine, claims, sponsors, brought, contributions }: { trustedBy: Person[] | null; trustedByMine: number; claims: Claim[] | null; sponsors: number; brought: number; contributions: number }) {
  if (!trustedBy || !claims) return <div className={`${CARD} !rounded-[24px] p-[16px]`}><Loading label="Reading the graph…" /></div>;
  const forT = claims.reduce((s, c) => s + c.forStaked, 0);
  const againstT = claims.reduce((s, c) => s + c.againstStaked, 0);
  const ranked = [...claims].sort((a, b) => (b.forStaked - b.againstStaked) - (a.forStaked - a.againstStaked));
  const best = ranked[0] && ranked[0].forStaked > ranked[0].againstStaked ? ranked[0] : null;
  const worst = [...ranked].reverse().find((c) => c.againstStaked > c.forStaked) ?? null;
  const rows: { tone: "good" | "bad" | "plain"; text: React.ReactNode }[] = [
    { tone: trustedBy.length ? "good" : "plain", text: trustedBy.length ? <>Trusted by <b>{trustedBy.length}</b> {trustedBy.length === 1 ? "person" : "people"}{trustedByMine ? <>, including <b>{trustedByMine}</b> you trust</> : ""}</> : "Nobody on the graph trusts them yet" },
    { tone: claims.length ? (forT >= againstT ? "good" : "bad") : "plain", text: claims.length ? <><b>{claims.length}</b> {claims.length === 1 ? "opinion" : "opinions"} about them · {trustAmount(forT)} TRUST agree, {trustAmount(againstT)} TRUST disagree</> : "No opinions about them yet" },
    ...(best ? [{ tone: "good" as const, text: <>Most agreed: “is {best.text}”</> }] : []),
    ...(worst ? [{ tone: "bad" as const, text: <>Disputed: “is {worst.text}”</> }] : []),
    { tone: contributions ? "good" : "plain", text: contributions ? <><b>{contributions}</b> campaign contribution{contributions === 1 ? "" : "s"} on Nexura</> : "No campaign contributions on Nexura yet" },
    ...(sponsors ? [{ tone: "good" as const, text: <>Sponsored by {sponsors} {sponsors === 1 ? "person" : "people"}</> }] : []),
    ...(brought ? [{ tone: "good" as const, text: <>Brought <b>{brought}</b> new {brought === 1 ? "person" : "people"} to Nexura</> }] : []),
  ];
  const dot = { good: "bg-[#0fb38a]", bad: "bg-[#e4545b]", plain: "bg-[#c4c9d6]" };
  return (
    <div className={`${CARD} !rounded-[24px] p-[16px]`}>
      <SectionTitle>What the graph says</SectionTitle>
      <ul className="space-y-[7px]">
        {rows.map((r, i) => <li key={i} className="flex items-start gap-[10px] text-[13px] leading-[19px] text-[#3d485c]"><span className={`mt-[6px] size-[7px] shrink-0 rounded-full ${dot[r.tone]}`} /><span className="min-w-0">{r.text}</span></li>)}
      </ul>
      <p className="mt-[10px] text-[11px] text-[#98a0b4]">Signals from people on the graph, not a verdict from Nexura. Trust your intuition.</p>
    </div>
  );
}

type TrustFilter = "trustedBy" | "trusts" | "mutual" | "mine";
type TrustSort = "highest" | "lowest" | "az" | "za";

function TrustLists({ trusts, trustedBy, isMe, onChange }: { trusts: Person[]; trustedBy: Person[]; isMe: boolean; onChange: () => void }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TrustFilter>("trustedBy");
  const [sort, setSort] = useState<TrustSort>("highest");
  const list = useMemo(() => {
    const out = new Set(trusts.map((p) => p.address));
    const base = filter === "trusts" ? trusts : filter === "mutual" ? trustedBy.filter((p) => out.has(p.address)) : filter === "mine" ? trustedBy.filter((p) => g.circle.has(p.address)) : trustedBy;
    const q = search.trim().toLowerCase();
    const l = base.filter((p) => !q || p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    const by = { highest: (a: Person, b: Person) => b.staked - a.staked, lowest: (a: Person, b: Person) => a.staked - b.staked, az: (a: Person, b: Person) => displayName(a.address, a.label).localeCompare(displayName(b.address, b.label)), za: (a: Person, b: Person) => displayName(b.address, b.label).localeCompare(displayName(a.address, a.label)) }[sort];
    return [...l].sort(by);
  }, [trusts, trustedBy, filter, sort, search, g.circle]);
  const score = useScores(list.slice(0, 50).map((p) => p.address));
  const filters: Option<TrustFilter>[] = [
    { id: "trustedBy", label: `Trust ${isMe ? "you" : "them"} (${trustedBy.length})` }, { id: "trusts", label: `${isMe ? "You" : "They"} trust (${trusts.length})` }, "divider",
    { id: "mutual", label: "Mutual" }, ...(g.me && !isMe ? [{ id: "mine" as const, label: "People I trust" }] : []),
  ];
  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Search by name or wallet" filter={filter} filters={filters} onFilter={setFilter}
        sort={sort} sorts={[{ id: "highest", label: "Highest TRUST" }, { id: "lowest", label: "Lowest TRUST" }, "divider", { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" }]} onSort={setSort} />
      {list.length === 0 ? <p className="px-[4px] text-[13px] text-[#69728a]">Nobody here.</p> : (
        <Table columns={[{ label: "Account", className: "flex-1" }, { label: "Nexura score", className: "w-[120px]" }, { label: "TRUST", className: "w-[90px] text-right" }]}>
          {list.slice(0, 200).map((p) => (
            <div key={p.address} role="button" tabIndex={0} onClick={() => g.openPerson(p.address)} className="flex cursor-pointer items-center gap-[12px] px-[14px] py-[8px] hover:bg-[#faf9fe]">
              <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={28} />
                <span className="truncate text-[13px] font-semibold">{p.address === g.me ? "You" : displayName(p.address, p.label)}</span>
                {g.circle.has(p.address) && <TrustedBadge />}
              </div>
              <span className="w-[120px] text-[12px] text-[#3d485c]">{score(p.address)?.nexuraScore != null ? `${score(p.address)!.nexuraScore}%` : "No score"}</span>
              <span className="w-[90px] text-right text-[12px] font-semibold">{trustAmount(p.staked)}</span>
              {isMe && filter === "trusts" && (
                <GhostButton small busy={busy === p.address} onClick={(e) => { e.stopPropagation(); void run(p.address, () => withdraw(trustTripleId(g.me!, p.address)), "Trust withdrawn", onChange); }}>Stop</GhostButton>
              )}
            </div>
          ))}
        </Table>
      )}
    </div>
  );
}

const Mini = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={`${INNER} !rounded-[16px] px-[10px] py-[7px]`}><p className="truncate text-[15px] font-semibold leading-[20px]">{value}</p><p className="truncate text-[10px] text-[#69728a]">{label}</p></div>
);

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className={`${TILE} p-[14px]`}>
      <SectionTitle>{title} ({count})</SectionTitle>
      {count === 0 ? <p className="text-[13px] text-[#98a0b4]">{empty}</p> : <div className="max-h-[300px] divide-y-[0.833px] divide-[rgba(28,37,51,0.07)] overflow-y-auto">{children}</div>}
    </div>
  );
}

const Line = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-[10px] py-[7px] text-[13px] text-[#3d485c]">
    <div className="min-w-0">{left}</div>
    {right && <span className="shrink-0 text-[12px] text-[#98a0b4]">{right}</span>}
  </div>
);
