"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Copy, ExternalLink, Users } from "lucide-react";
import { isAddress } from "viem";
import { useToast } from "@/hooks/use-toast";
import { readUrlParam } from "@/hooks/use-url-state";
import { CURATOR_FEE } from "@/components/studio/campaign-flow/model";
import { apiRequestV2 } from "@/lib/queryClient";
import { inviteToCampaign } from "@/lib/socialGraph/actions";
import { acceptInvite, campaignPeople, getAmbassadorEarnings, getInvites, graphConfig, type CampaignPerson } from "@/lib/socialGraph/graph";
import { useGraph } from "./context";
import { PersonName, PersonRow, TrustedBadge } from "./parts";
import {
  Avatar, CARD, Chip, Empty, GhostButton, INNER, INPUT, ListBar, Loading, Notice, PrimaryButton, SectionTitle, TILE,
  campaignReward, displayName, useAction, useLoad, useScores, type CampaignSummary, type Option, type View,
} from "./kit";

type Status = "live" | "upcoming" | "ended";
export const statusOf = (c: CampaignSummary): Status => (c.status === "Ended" ? "ended" : c.status === "Scheduled" ? "upcoming" : "live");
const STATUS: Record<Status, { label: string; tone: "good" | "brand" | "plain" }> = { live: { label: "Live", tone: "good" }, upcoming: { label: "Upcoming", tone: "brand" }, ended: { label: "Ended", tone: "plain" } };
const time = (s?: string) => { const t = s ? new Date(s).getTime() : NaN; return Number.isFinite(t) ? t : null; };
export const pool = (c: CampaignSummary) => Number(c.reward?.pool ?? c.totalTrustAvailable ?? c.reward?.trustTokens ?? 0) || 0;
const placesLeft = (c: CampaignSummary) => (c.maxParticipants ? Math.max(0, c.maxParticipants - (c.participants ?? 0)) : null);
const needed = (c: CampaignSummary) => c.rewardsConfig?.nexuraScoreRequirementPct ?? 0;
export const logo = (c: CampaignSummary) => c.hubInfo?.logo || c.project_image || "";
const projectName = (c: CampaignSummary) => c.hubInfo?.name || c.project_name || "";
const day = (s?: string) => { const t = time(s); return t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""; };
const until = (s?: string) => {
  const t = time(s);
  if (!t) return "";
  const d = Math.ceil((t - Date.now()) / 86_400_000);
  return d < 0 ? `Ended ${day(s)}` : d === 0 ? "Ends today" : `${d} day${d === 1 ? "" : "s"} left`;
};

type Filter = "all" | Status | "joined" | "qualify";
type Sort = "ending" | "newest" | "poolHigh" | "poolLow" | "peopleMost" | "peopleFew" | "places" | "easiest" | "az" | "za";
const SORTS: Option<Sort>[] = [
  { id: "ending", label: "Ending soonest" }, { id: "newest", label: "Newest" }, "divider",
  { id: "poolHigh", label: "Biggest reward pool" }, { id: "poolLow", label: "Smallest reward pool" }, "divider",
  { id: "peopleMost", label: "Most participants" }, { id: "peopleFew", label: "Fewest participants" }, { id: "places", label: "Most places left" }, "divider",
  { id: "easiest", label: "Lowest score needed" }, "divider", { id: "az", label: "A–Z" }, { id: "za", label: "Z–A" },
];

export function useMyScore() {
  const g = useGraph();
  const score = useScores(g.me ? [g.me] : []);
  return g.me ? score(g.me)?.nexuraScore ?? null : null;
}

export function OpportunitiesTab() {
  const g = useGraph();
  const mine = useMyScore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("live");
  const [sort, setSort] = useState<Sort>("ending");
  const [view, setView] = useState<View>("grid");
  const all = useMemo(() => [...g.campaigns.values()], [g.campaigns]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all.filter((c) => (!q || [c.title, projectName(c), c.sub_title, c.description].some((s) => s?.toLowerCase().includes(q)))
      && (filter === "all" || (filter === "joined" ? c.joined : filter === "qualify" ? statusOf(c) !== "ended" && (mine ?? 0) >= needed(c) : statusOf(c) === filter)));
    const far = Number.MAX_SAFE_INTEGER;
    const by: Record<Sort, (a: CampaignSummary, b: CampaignSummary) => number> = {
      ending: (a, b) => (time(a.ends_at) ?? far) - (time(b.ends_at) ?? far),
      newest: (a, b) => (time(b.starts_at ?? b.createdAt) ?? 0) - (time(a.starts_at ?? a.createdAt) ?? 0),
      poolHigh: (a, b) => pool(b) - pool(a), poolLow: (a, b) => pool(a) - pool(b),
      peopleMost: (a, b) => (b.participants ?? 0) - (a.participants ?? 0), peopleFew: (a, b) => (a.participants ?? 0) - (b.participants ?? 0),
      places: (a, b) => (placesLeft(b) ?? far) - (placesLeft(a) ?? far),
      easiest: (a, b) => needed(a) - needed(b),
      az: (a, b) => a.title.localeCompare(b.title), za: (a, b) => b.title.localeCompare(a.title),
    };
    return list.sort(by[sort]);
  }, [all, search, filter, sort, mine]);
  const filters: Option<Filter>[] = [
    { id: "all", label: "All" }, "divider", { id: "live", label: "Live" }, { id: "upcoming", label: "Upcoming" }, { id: "ended", label: "Ended" },
    ...(g.me ? ["divider" as const, { id: "joined" as const, label: "Joined by me" }, { id: "qualify" as const, label: "My score qualifies" }] : []),
  ];

  return (
    <div className="space-y-[10px]">
      <ListBar search={search} onSearch={setSearch} placeholder="Search opportunities or projects" filter={filter} filters={filters} onFilter={setFilter} sort={sort} sorts={SORTS} onSort={setSort} view={view} onView={setView} />
      {shown.length === 0 ? <Empty>{all.length === 0 ? "No opportunities yet." : "No opportunities match."}</Empty>
        : view === "grid" ? <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2 xl:grid-cols-3">{shown.map((c) => <CampaignCard key={c._id} c={c} mine={mine} />)}</div>
        : <div className={`${TILE} divide-y-[0.833px] divide-[rgba(28,37,51,0.07)] overflow-hidden`}>{shown.map((c) => <CampaignLine key={c._id} c={c} mine={mine} />)}</div>}
    </div>
  );
}

function Qualifies({ c, mine }: { c: CampaignSummary; mine: number | null }) {
  const need = needed(c);
  if (!need) return <span>No score needed</span>;
  if (mine == null) return <span>{need}%+ score</span>;
  return <span className={mine >= need ? "text-[#0b8a6a]" : "text-[#c2414a]"}>{mine >= need ? `You qualify (${need}%+)` : `Needs ${need}%, you have ${mine}%`}</span>;
}

export function Cover({ c, className = "" }: { c: CampaignSummary; className?: string }) {
  const [broken, setBroken] = useState(false);
  const src = c.projectCoverImage || "";
  return (
    <div className={`relative overflow-hidden bg-[linear-gradient(135deg,#f1ebff_0%,#e2d6ff_55%,#d6e6ff_100%)] ${className}`}>
      {src && !broken && <img src={src.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/")} alt="" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />}
    </div>
  );
}

const perPerson = (c: CampaignSummary) => {
  const fixed = Number(c.rewardsDeployment?.rewardPerParticipant);
  if (fixed > 0) return fixed;
  const seats = c.rewardsDeployment?.maxClaimableParticipants || c.rewardsConfig?.recipients || c.maxParticipants || 0;
  return seats > 0 && pool(c) > 0 ? pool(c) / seats : 0;
};
export const curatorShare = (c: CampaignSummary) => {
  const budget = Number(c.rewardsConfig?.budget) || 0;
  return c.rewardsConfig?.curatorRewardsOn && budget > 0 ? (budget * CURATOR_FEE) / 100 : 0;
};
export const token = (c: CampaignSummary) => c.rewardAsset?.token || c.rewardsConfig?.token || "TRUST";
export const amount = (n: number) => (n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n >= 1 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n > 0 ? n.toPrecision(2) : "0");
export const hosts = (c: CampaignSummary) => [projectName(c), ...(c.coHosts ?? []).map((h) => h.name)].filter(Boolean).join(" × ");
export const when = (c: CampaignSummary) => (statusOf(c) === "upcoming" ? `Starts ${day(c.starts_at)}` : until(c.ends_at));

function Facts({ c, mine }: { c: CampaignSummary; mine: number | null }) {
  const left = placesLeft(c);
  const items = [
    pool(c) > 0 && <span key="p" className="font-semibold text-[#1c2533]">{amount(pool(c))} {token(c)}</span>,
    <Qualifies key="q" c={c} mine={mine} />,
    <span key="j">{(c.participants ?? 0).toLocaleString()} joined{left != null ? `, ${left.toLocaleString()} left` : ""}</span>,
    when(c) && <span key="w">{when(c)}</span>,
  ].filter(Boolean);
  return <span className="flex flex-wrap items-center gap-x-[7px] gap-y-[2px]">{items.flatMap((x, i) => (i ? [<span key={`d${i}`} className="text-[#c4c9d6]">·</span>, x] : [x]))}</span>;
}

function StatusDot({ c }: { c: CampaignSummary }) {
  const st = statusOf(c);
  const color = st === "live" ? "bg-[#0fb38a]" : st === "upcoming" ? "bg-[#8b3efe]" : "bg-[#c4c9d6]";
  return <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold text-[#69728a]"><span className={`size-[6px] rounded-full ${color}`} />{STATUS[st].label}</span>;
}

const reward = (c: CampaignSummary) => (pool(c) > 0 ? `${amount(pool(c))} ${token(c)}` : Number(c.reward?.xp) > 0 ? `${c.reward?.xp} XP` : "No reward");
const scoreText = (c: CampaignSummary) => (needed(c) ? `${needed(c)}%+` : "Any");

export function CampaignCard({ c, mine }: { c: CampaignSummary; mine: number | null }) {
  const g = useGraph();
  const need = needed(c);
  const retention = c.rewardsConfig?.retentionRequirementPct;
  return (
    <button type="button" onClick={() => g.openCampaign(c._id)} className={`${TILE} group flex flex-col overflow-hidden text-left transition hover:border-[rgba(138,63,252,0.4)] hover:shadow-[0_10px_24px_rgba(28,37,51,0.08)]`}>
      <div className="relative">
        <Cover c={c} className="aspect-[2/1] w-full" />
        <span className="absolute left-[10px] top-[10px] rounded-[40px] bg-white/90 px-[8px] py-[3px] backdrop-blur"><StatusDot c={c} /></span>
        {c.joined && <span className="absolute right-[10px] top-[10px] rounded-[40px] bg-[#8b3efe] px-[8px] py-[3px] text-[11px] font-semibold text-white">Joined</span>}
      </div>
      <div className="flex flex-1 flex-col p-[14px]">
        <div className="flex items-center gap-[8px]">
          <Avatar image={logo(c)} name={projectName(c) || c.title} seed={c._id} size={28} square />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1c2533]">{hosts(c) || "Nexura"}</p>
            <p className="truncate text-[11px] text-[#98a0b4]">{(c.participants ?? 0).toLocaleString()} joined · {when(c) || "Open"}</p>
          </div>
        </div>
        <h3 className="mt-[10px] line-clamp-1 text-[15px] font-semibold group-hover:text-[#8a3ffc]">{c.title}</h3>
        {(c.sub_title || c.description) && <p className="line-clamp-1 text-[12px] text-[#69728a]">{c.sub_title || c.description}</p>}
        <dl className="mt-auto grid grid-cols-3 gap-[8px] border-t-[0.833px] border-[rgba(28,37,51,0.07)] pt-[10px] mt-[12px] text-[12px]">
          <div className="min-w-0"><dt className="text-[10px] text-[#98a0b4]">Reward</dt><dd className="truncate font-semibold">{reward(c)}</dd></div>
          <div><dt className="text-[10px] text-[#98a0b4]">Score</dt><dd className={`font-semibold ${need && mine != null ? (mine >= need ? "text-[#0b8a6a]" : "text-[#c2414a]") : ""}`}>{scoreText(c)}</dd></div>
          <div><dt className="text-[10px] text-[#98a0b4]">Retention</dt><dd className="font-semibold">{retention ? `${retention}%+` : "Any"}</dd></div>
        </dl>
      </div>
    </button>
  );
}

function CampaignLine({ c, mine }: { c: CampaignSummary; mine: number | null }) {
  const g = useGraph();
  return (
    <div role="button" tabIndex={0} onClick={() => g.openCampaign(c._id)} onKeyDown={(e) => e.key === "Enter" && g.openCampaign(c._id)}
      className="group flex cursor-pointer items-center gap-[14px] px-[14px] py-[10px] hover:bg-[#faf9fe]">
      <div className="relative shrink-0">
        <Cover c={c} className="h-[52px] w-[84px] rounded-[12px]" />
        <span className="absolute -bottom-[6px] -right-[6px] z-10 rounded-[10px] bg-white p-[2px]"><Avatar image={logo(c)} name={projectName(c) || c.title} seed={c._id} size={24} square /></span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[8px]"><h3 className="truncate text-[14px] font-semibold group-hover:text-[#8a3ffc]">{c.title}</h3>{c.joined && <span className="text-[11px] font-semibold text-[#6e2bd8]">Joined</span>}</div>
        <p className="truncate text-[12px] text-[#98a0b4]">{hosts(c)}</p>
      </div>
      <div className="hidden text-[12px] text-[#69728a] md:block"><Facts c={c} mine={mine} /></div>
      <StatusDot c={c} />
    </div>
  );
}

type Task = { _id: string; quest?: string; tag?: string; stage?: string; done?: boolean };
type Detail = { campaignQuests?: Task[]; joined?: boolean; rewardEligibility?: { eligible?: boolean; claimed?: boolean; reason?: string } | null; hubInfo?: CampaignSummary["hubInfo"] };
const TAG: Record<string, string> = { follow: "Follow on X", like: "Like a post", retweet: "Repost", comment: "Comment", discord: "Discord", portal: "Visit", feedback: "Feedback", quiz: "Quiz", proof: "Proof", telegram: "Telegram" };
const linkOf = (v?: string, base = "") => (!v ? "" : /^https?:\/\//i.test(v) ? v : `${base}${v.replace(/^@/, "")}`);
const Section = ({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="border-t-[0.833px] border-[rgba(28,37,51,0.08)] px-[20px] py-[14px]">
    <div className="mb-[8px] flex items-baseline justify-between gap-[10px]"><h3 className="text-[13px] font-semibold">{title}</h3>{right && <span className="text-[12px] text-[#69728a]">{right}</span>}</div>
    {children}
  </section>
);

export function OpportunityDetail({ id }: { id: string }) {
  const g = useGraph();
  const mine = useMyScore();
  const c = g.campaigns.get(id);
  const detail = useLoad(async () => (await apiRequestV2("GET", `/api/campaign/quests?id=${id}`)) as Detail, [id, g.me]);
  const people = useLoad(() => campaignPeople(id), [id]);
  const project = (g.projects ?? []).find((p) => p.campaignIds.includes(id));
  const [inviting, setInviting] = useState(false);
  const [more, setMore] = useState(false);

  if (!c) return <div className="p-[24px]">{g.campaigns.size ? <Notice tone="warn">This opportunity isn&apos;t available.</Notice> : <Loading />}</div>;

  const st = statusOf(c);
  const hub = { ...c.hubInfo, ...detail.data?.hubInfo };
  const joined = detail.data?.joined ?? c.joined;
  const tasks = detail.data?.campaignQuests ?? [];
  const stages = [...(c.stages ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const taskCount = (key: string) => tasks.filter((t) => t.stage === key).length;
  const list = [...(people.data ?? [])].sort((a, b) => Number(g.circle.has(b.address)) - Number(g.circle.has(a.address)));
  const links = [{ label: "Website", href: linkOf(hub.website) }, { label: "X", href: linkOf(hub.xAccount, "https://x.com/") }, { label: "Discord", href: linkOf(hub.discordServer) }].filter((l) => l.href);
  const eligibility = detail.data?.rewardEligibility;
  const need = needed(c);
  const retention = c.rewardsConfig?.retentionRequirementPct;
  const about = c.description && c.description !== c.sub_title ? c.description : "";

  return (
    <div className="min-h-full bg-white">
      <Cover c={c} className="h-[84px]" />
      <div className="px-[18px] pb-[18px]">
        <div className="flex items-end gap-[10px]">
          <div className="relative z-10 -mt-[20px] shrink-0 rounded-[12px] bg-white p-[2px] shadow-[0_2px_8px_rgba(28,37,51,0.12)]"><Avatar image={hub.logo || logo(c)} name={projectName(c) || c.title} seed={c._id} size={38} square /></div>
          <div className="min-w-0 pb-[1px]">
            {project ? <button type="button" onClick={() => g.openProject(project.id)} className="truncate text-[12px] font-semibold text-[#1c2533] hover:text-[#8a3ffc]">{hosts(c)}</button>
              : <p className="truncate text-[12px] font-semibold text-[#1c2533]">{hosts(c) || "Nexura"}</p>}
          </div>
        </div>

        <div className="mt-[10px] flex items-center gap-[8px]"><StatusDot c={c} />{joined && <span className="text-[11px] font-semibold text-[#6e2bd8]">Joined</span>}</div>
        <h2 className="text-[17px] font-semibold leading-[23px]">{c.title}</h2>
        {c.sub_title && <p className="text-[13px] text-[#69728a]">{c.sub_title}</p>}

        <dl className="mt-[12px] grid grid-cols-3 gap-[8px] rounded-[14px] bg-[#faf9fe] px-[12px] py-[10px] text-[12px]">
          <div className="min-w-0"><dt className="text-[10px] text-[#98a0b4]">Reward</dt><dd className="truncate font-semibold">{reward(c)}</dd></div>
          <div><dt className="text-[10px] text-[#98a0b4]">Score</dt><dd className={`font-semibold ${need && mine != null ? (mine >= need ? "text-[#0b8a6a]" : "text-[#c2414a]") : ""}`}>{scoreText(c)}{need && mine != null ? <span className="font-normal text-[#98a0b4]"> · you {mine}%</span> : null}</dd></div>
          <div><dt className="text-[10px] text-[#98a0b4]">Retention</dt><dd className="font-semibold">{retention ? `${retention}%+` : "Any"}</dd></div>
          <div><dt className="text-[10px] text-[#98a0b4]">Joined</dt><dd className="font-semibold">{(c.participants ?? 0).toLocaleString()}{c.maxParticipants ? ` / ${c.maxParticipants.toLocaleString()}` : ""}</dd></div>
          <div className="col-span-2"><dt className="text-[10px] text-[#98a0b4]">{st === "upcoming" ? "Starts" : "Ends"}</dt><dd className="font-semibold">{(st === "upcoming" ? day(c.starts_at) : day(c.ends_at)) || "Open"}{st === "live" && when(c) ? <span className="font-normal text-[#98a0b4]"> · {when(c)}</span> : null}</dd></div>
        </dl>

        {st !== "ended" && (
          <div className="mt-[12px] flex gap-[8px]">
            <a href={`/campaign/${c._id}`} className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-[6px] rounded-[40px] bg-[#8b3efe] px-[14px] text-[13px] font-semibold text-white hover:bg-[#7c2ff0]">{joined ? "Continue" : "Join"}<ExternalLink className="size-[12px]" /></a>
            <button type="button" onClick={() => setInviting((v) => !v)} className={`inline-flex min-h-[36px] items-center rounded-[40px] border-[0.833px] px-[14px] text-[13px] font-semibold ${inviting ? "border-[#8b3efe] text-[#6e2bd8]" : "border-[rgba(28,37,51,0.15)] text-[#1c2533] hover:border-[#8b3efe]"}`}>Invite</button>
          </div>
        )}
        {joined && eligibility && <p className={`mt-[6px] text-[12px] ${eligibility.claimed || eligibility.eligible ? "text-[#0b8a6a]" : "text-[#69728a]"}`}>{eligibility.claimed ? "Reward claimed" : eligibility.eligible ? "You're eligible for the reward" : eligibility.reason ?? ""}</p>}
        {st !== "ended" && <div className="mt-[12px] empty:hidden"><InviteBanner c={c} /></div>}
      </div>

      {inviting && st !== "ended" && <InviteSection c={c} people={people.data ?? []} />}

      {about && (
        <Section title="About">
          <p className={`whitespace-pre-line text-[13px] leading-[20px] text-[#3d485c] ${more ? "" : "line-clamp-3"}`}>{about}</p>
          {about.length > 160 && <button type="button" onClick={() => setMore((v) => !v)} className="mt-[4px] text-[12px] font-semibold text-[#8a3ffc]">{more ? "Less" : "More"}</button>}
        </Section>
      )}

      {stages.length > 0 && (
        <Section title="Stages">
          <ol className="space-y-[6px]">
            {stages.map((s, i) => (
              <li key={s.key} className="flex items-center gap-[10px] text-[13px]">
                <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[rgba(138,63,252,0.1)] text-[10px] font-semibold text-[#6e2bd8]">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                {taskCount(s.key) > 0 && <span className="text-[11px] text-[#98a0b4]">{taskCount(s.key)} task{taskCount(s.key) === 1 ? "" : "s"}</span>}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {list.length > 0 && (
        <Section title="People taking part" right={`${list.length}`}>
          <div className="flex flex-wrap gap-[6px]">
            {list.slice(0, 24).map((p) => (
              <button key={p.address} type="button" onClick={() => g.openPerson(p.address)} title={displayName(p.address, p.label)} className={`rounded-full ring-2 ${g.circle.has(p.address) ? "ring-[#8b3efe]" : p.finished ? "ring-[#0fb38a]" : "ring-transparent"}`}>
                <Avatar image={p.image} name={p.label || p.address} seed={p.address} size={28} />
              </button>
            ))}
            {list.length > 24 && <span className="self-center text-[12px] text-[#98a0b4]">+{list.length - 24}</span>}
          </div>
        </Section>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-[12px] border-t-[0.833px] border-[rgba(28,37,51,0.08)] px-[18px] py-[12px] text-[12px] text-[#69728a]">
          {links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[3px] hover:text-[#8a3ffc]">{l.label}<ExternalLink className="size-[10px]" /></a>)}
        </div>
      )}
    </div>
  );
}

export function Opportunities({ onAll }: { onAll: () => void }) {
  const g = useGraph();
  const mine = useMyScore();
  const live = useMemo(() => [...g.campaigns.values()].filter((c) => statusOf(c) === "live")
    .sort((a, b) => (time(a.ends_at) ?? Number.MAX_SAFE_INTEGER) - (time(b.ends_at) ?? Number.MAX_SAFE_INTEGER)).slice(0, 4), [g.campaigns]);
  return (
    <div className={`${TILE} p-[14px]`}>
      <SectionTitle right={<button type="button" onClick={onAll} className="text-[12px] font-semibold text-[#8a3ffc] hover:underline">All opportunities</button>}>Opportunities</SectionTitle>
      {!live.length ? <p className="text-[13px] text-[#69728a]">No live opportunities right now.</p> : (
        <div className="space-y-[8px]">
          {live.map((c) => (
            <button key={c._id} type="button" onClick={() => g.openCampaign(c._id)} className="flex w-full items-center gap-[10px] rounded-[12px] px-[4px] py-[2px] text-left hover:bg-[#faf9fe]">
              <Avatar image={logo(c)} name={projectName(c) || c.title} seed={c._id} size={28} square />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{c.title}</p>
                <p className="truncate text-[11px] text-[#69728a]">{[campaignReward(c), until(c.ends_at), needed(c) ? `${needed(c)}%+ score` : ""].filter(Boolean).join(" · ")}</p>
              </div>
              {mine != null && needed(c) > 0 && <span className={`text-[11px] font-semibold ${mine >= needed(c) ? "text-[#0b8a6a]" : "text-[#c2414a]"}`}>{mine >= needed(c) ? "Qualify" : "Not yet"}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteBanner({ c }: { c: CampaignSummary }) {
  const g = useGraph();
  const { busy, run } = useAction();
  const raw = readUrlParam("invite");
  const inviter = raw && isAddress(raw) ? raw : null;
  const mineQ = useLoad(async () => (g.me && inviter ? (await getInvites({ address: g.me, campaign: c._id })).find((i) => i.invitee === g.me) ?? null : null), [g.me, inviter, c._id]);
  if (!inviter || inviter.toLowerCase() === g.me?.toLowerCase()) return null;
  const mine = mineQ.data;
  return (
    <div className="rounded-[24px] border-[0.833px] border-[rgba(138,63,252,0.3)] bg-[rgba(138,63,252,0.06)] p-[16px]">
      <p className="text-[14px] text-[#1c2533]"><PersonName address={inviter} /> invited you to <b>{c.title}</b></p>
      <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
        {mine ? (
          <Chip tone={mine.status === "paid" ? "good" : "brand"}>{mine.status === "paid" ? `Invite confirmed · ${mine.amount} TRUST received` : "Invite accepted · waiting for them to confirm"}</Chip>
        ) : (
          <PrimaryButton small busy={busy === "accept"} onClick={() => (g.me ? void run("accept", () => acceptInvite(c._id, inviter), "Invite accepted", () => void mineQ.reload()) : g.connect())}>{g.me ? "Accept invite" : "Connect wallet to accept"}</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function InviteSection({ c, people }: { c: CampaignSummary; people: CampaignPerson[] }) {
  const g = useGraph();
  const { toast } = useToast();
  const { busy, run } = useAction();
  const cfg = useLoad(graphConfig, []);
  const limits = cfg.data?.invites ?? null;
  const invites = useLoad(async () => (g.me ? (await getInvites({ address: g.me, campaign: c._id })).filter((i) => i.inviter === g.me) : []), [g.me, c._id]);
  const [who, setWho] = useState("");
  const [amount, setAmount] = useState("");
  const status = new Map(people.map((p) => [p.address, p.finished ? "Finished" : "Joined"]));

  if (!g.me) return (
    <Section title="Invite people"><PrimaryButton small onClick={g.connect}>Connect wallet to get your invite link</PrimaryButton></Section>
  );
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/social-graph?tab=opportunities&campaign=${c._id}&invite=${g.me}`;
  const pay = (invitee: string) => {
    if (!limits) return;
    void run(`pay:${invitee}`, () => inviteToCampaign(c._id, invitee, amount || limits.min, limits), `You invited ${displayName(invitee)}`, () => { setWho(""); void invites.reload(); });
  };
  const list = invites.data ?? [];

  return (
    <Section title="Invite people" right={list.length ? `${list.filter((i) => i.status === "paid").length} invited · ${list.filter((i) => status.has(i.invitee)).length} joined` : undefined}>
      <div className="max-w-[760px] space-y-[12px]">
      <div className="flex items-center gap-[8px]">
        <input readOnly value={link} className={`${INPUT} !h-[40px] min-w-0 flex-1 !text-[12px]`} aria-label="Your invite link" onFocus={(e) => e.currentTarget.select()} />
        <GhostButton small onClick={() => { void navigator.clipboard?.writeText(link); toast({ title: "Invite link copied" }); }}><Copy className="size-[13px]" />Copy</GhostButton>
      </div>
      {!limits ? <Notice tone="warn">Invites aren&apos;t available on this server yet.</Notice> : (
        <>
          <div className="flex flex-wrap items-center gap-[8px]">
            <input className={`${INPUT} !h-[40px] min-w-[180px] flex-1`} value={who} onChange={(e) => setWho(e.target.value.trim())} placeholder="Wallet address to invite" aria-label="Wallet address to invite" />
            <input className={`${INPUT} !h-[40px] !w-[110px]`} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`${limits.min} TRUST`} inputMode="decimal" aria-label="TRUST to pay" />
            <PrimaryButton small busy={busy === `pay:${who}`} disabled={!isAddress(who)} onClick={() => pay(who)}>Pay &amp; invite</PrimaryButton>
          </div>
          <p className="text-[12px] text-[#69728a]">You pay {limits.min} to {limits.max} TRUST. It goes to the person you invite to cover their gas.</p>
        </>
      )}
      {list.length > 0 && (
        <div className="divide-y-[0.833px] divide-[rgba(28,37,51,0.07)]">
          {list.map((i) => (
            <div key={i._id} className="flex items-center gap-[10px] py-[7px] text-[13px]">
              <span className="min-w-0 flex-1 truncate"><PersonName address={i.invitee} /></span>
              {status.has(i.invitee) && <Chip tone="good">{status.get(i.invitee)}</Chip>}
              {i.status === "paid" ? <span className="text-[12px] text-[#69728a]">{i.amount} TRUST paid</span>
                : limits && <PrimaryButton small busy={busy === `pay:${i.invitee}`} onClick={() => pay(i.invitee)}>Confirm · pay {amount || limits.min}</PrimaryButton>}
            </div>
          ))}
        </div>
      )}
      </div>
    </Section>
  );
}

export function MyInvites() {
  const g = useGraph();
  const invites = useLoad(async () => (g.me ? (await getInvites({ address: g.me })).filter((i) => i.inviter === g.me) : []), [g.me]);
  const ids = [...new Set((invites.data ?? []).map((i) => i.campaign))].sort().join(",");
  const people = useLoad(async () => {
    const out = new Map<string, Map<string, boolean>>();
    for (const id of ids ? ids.split(",") : []) out.set(id, new Map((await campaignPeople(id)).map((p) => [p.address, p.finished])));
    return out;
  }, [ids]);
  const earnings = useLoad(async () => (g.me ? getAmbassadorEarnings(g.me) : null), [g.me]);
  if (!g.me || !invites.data) return null;
  const list = invites.data;
  const earned = (earnings.data?.campaigns ?? []).filter((r) => r.yours > 0);
  const state = (campaign: string, a: string) => people.data?.get(campaign)?.get(a);
  const joined = list.filter((i) => state(i.campaign, i.invitee) !== undefined).length;
  const finished = list.filter((i) => state(i.campaign, i.invitee) === true).length;
  const paid = list.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  return (
    <div className={`${TILE} p-[14px]`}>
      <SectionTitle>Your invites</SectionTitle>
      <div className="mb-[10px] grid grid-cols-4 gap-[6px]">
        {[["Invited", list.length], ["Joined", joined], ["Finished", finished], ["TRUST paid", Number(paid.toFixed(3))]].map(([k, v]) => (
          <div key={k} className={`${INNER} !rounded-[14px] px-[8px] py-[6px]`}><p className="text-[14px] font-semibold">{v}</p><p className="truncate text-[10px] text-[#69728a]">{k}</p></div>
        ))}
      </div>
      {earned.length > 0 && (
        <div className="mb-[10px] space-y-[4px] rounded-[14px] bg-[rgba(15,179,138,0.08)] px-[10px] py-[8px]">
          <p className="text-[12px] font-semibold text-[#0b8a6a]">Ambassador rewards ({earnings.data!.poolPct}% of each pool, shared by invites that joined)</p>
          {earned.map((r) => (
            <div key={r.campaign} className="flex items-center justify-between gap-[8px] text-[12px] text-[#3d485c]">
              <span className="min-w-0 truncate">{r.title} · {r.yours} of {r.invitesJoined}</span>
              <b>{Number(r.share.toFixed(4))} {r.token}</b>
            </div>
          ))}
        </div>
      )}
      {!list.length ? <p className="text-[13px] text-[#69728a]">Open an opportunity to get your invite link.</p> : (
        <div className="max-h-[260px] divide-y-[0.833px] divide-[rgba(28,37,51,0.07)] overflow-y-auto">
          {list.map((i) => {
            const st = state(i.campaign, i.invitee);
            return (
              <button key={i._id} type="button" onClick={() => g.openCampaign(i.campaign)} className="flex w-full items-center gap-[8px] py-[6px] text-left text-[12px] hover:text-[#8a3ffc]">
                <span className="min-w-0 flex-1 truncate"><b className="font-semibold">{displayName(i.invitee)}</b> · {g.campaigns.get(i.campaign)?.title ?? "an opportunity"}</span>
                <Chip tone={st === true ? "good" : st === false ? "brand" : i.status === "paid" ? "plain" : "bad"}>{st === true ? "Finished" : st === false ? "Joined" : i.status === "paid" ? "Invited" : "Waiting for you"}</Chip>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
