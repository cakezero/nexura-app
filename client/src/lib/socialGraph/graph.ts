import { calculateTripleId } from "@0xintuition/sdk";
import { formatEther, getAddress, isAddress, type Hex } from "viem";
import { resilientFetch } from "@/lib/resilientFetch";
import { apiRequestV2 } from "@/lib/queryClient";
import { ATOM, CAMPAIGN_LABEL, CHECKED_LABEL, CHECKER, CLAIM_LABEL, INFO_FIELDS, SPONSORS_LABEL, TAG_LABEL, accountAtomId, graphqlUrl, idOf, infoByPredicate, textAtom } from "./config";

async function gql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await resilientFetch(graphqlUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  }, { retries: 2 });
  if (!res.ok) throw new Error(`Intuition is unreachable right now (${res.status})`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const TAG_ID = idOf(textAtom(TAG_LABEL));
const CHECKED_ID = idOf(textAtom(CHECKED_LABEL));
const CAMPAIGN_ID = idOf(textAtom(CAMPAIGN_LABEL));
const SPONSORS_ID = idOf(textAtom(SPONSORS_LABEL));
const CLAIM_ID = idOf(textAtom(CLAIM_LABEL));
const INFO_IDS = Object.keys(infoByPredicate);

export const recommendTripleId = (projectId: string) => calculateTripleId(ATOM.I, ATOM.recommends, projectId as Hex) as Hex;
export const checkTripleId = (projectId: string) => calculateTripleId(ATOM.I, CHECKED_ID, projectId as Hex) as Hex;
export const trustTripleId = (from: string, to: string) => calculateTripleId(accountAtomId(from), ATOM.trusts, accountAtomId(to)) as Hex;

const trust = (wei?: string | null) => Number(formatEther(BigInt(wei ?? "0")));
const worth = (p: any) => {
  const price = p?.vault?.current_share_price;
  return price ? Number(formatEther((BigInt(p.shares ?? "0") * BigInt(price)) / 10n ** 18n)) : trust(p?.shares);
};
const addr = (a: string) => { try { return getAddress(a); } catch { return a; } };
const ATOM_FIELDS = `term_id label image data value { thing { name url image description } }`;
const POS = `account_id account { label image } shares vault { current_share_price }`;
const named = (l?: string | null) => (l && !/^0x[0-9a-f]{4}/i.test(l) ? l : undefined);
const IS_PROJECT = { as_subject_triples: { predicate_id: { _eq: ATOM.hasTag }, object_id: { _eq: TAG_ID } } };
const projectName = (a: any) => a?.value?.thing?.name || a?.label || "a project";

export type Project = {
  id: string; name: string; url: string; image: string; description: string;
  curator: string; curatorLabel?: string; listedAt: string; checked: boolean;
  recommenders: Backer[]; staked: number; campaignIds: string[];
};
export type Backer = { account: string; label?: string; image?: string; staked: number };
export type InfoItem = { tripleId: string; key: string; label: string; value: string; addedBy: string; addedByLabel?: string; backers: Backer[]; staked: number };
export type Claim = {
  tripleId: Hex; counterId: Hex; text: string; by: string; byLabel?: string; at: string;
  supporters: Backer[]; opposers: Backer[]; forStaked: number; againstStaked: number;
};

const backerOf = (p: any): Backer => ({ account: addr(p.account_id), label: named(p.account?.label), image: p.account?.image || undefined, staked: worth(p) });
const sum = (b: Backer[]) => b.reduce((s, x) => s + x.staked, 0);

const toProject = (atom: any, tag: { creator_id: string; created_at: string; creator?: { label?: string } | null }): Omit<Project, "checked" | "recommenders" | "staked" | "campaignIds"> => {
  const thing = atom?.value?.thing ?? {};
  return {
    id: atom.term_id,
    name: thing.name || atom.label || "Untitled project",
    url: thing.url && thing.url !== "null" ? thing.url : "",
    image: thing.image || atom.image || "",
    description: thing.description || "",
    curator: addr(tag.creator_id),
    curatorLabel: named(tag.creator?.label),
    listedAt: tag.created_at,
  };
};

async function projectSignals(ids: string[]) {
  if (!ids.length) return { rec: new Map<string, Backer[]>(), checked: new Set<string>(), campaigns: new Map<string, string[]>() };
  const recIds = ids.map(recommendTripleId);
  const checkIds = ids.map(checkTripleId);
  const data = await gql(`query($rec:[String!]!, $check:[String!]!, $ids:[String!]!, $camp:String!, $checker:String) {
    rec: positions(where:{ term_id:{_in:$rec}, shares:{_gt:"0"} }) { term_id ${POS} }
    checks: positions(where:{ term_id:{_in:$check}, shares:{_gt:"0"}, account_id:{_eq:$checker} }) { term_id }
    camps: triples(where:{ subject_id:{_in:$ids}, predicate_id:{_eq:$camp} }) { subject_id object { label } positions(where:{ account_id:{_eq:$checker}, shares:{_gt:"0"} }) { account_id } }
  }`, { rec: recIds, check: checkIds, ids, camp: CAMPAIGN_ID, checker: CHECKER ?? "0x0" });

  const byRec = new Map(recIds.map((r, i) => [r, ids[i]!]));
  const rec = new Map<string, Backer[]>();
  for (const p of data.rec) {
    const id = byRec.get(p.term_id);
    if (id) rec.set(id, [...(rec.get(id) ?? []), backerOf(p)]);
  }
  const byCheck = new Map(checkIds.map((c, i) => [c, ids[i]!]));
  const checked = new Set<string>(data.checks.map((c: any) => byCheck.get(c.term_id)).filter(Boolean));
  const campaigns = new Map<string, string[]>();
  for (const t of data.camps) {
    if (!t.positions.length) continue;
    const m = /^nexura:campaign:([a-f0-9]{24})$/i.exec(t.object?.label ?? "");
    if (m) campaigns.set(t.subject_id, [...(campaigns.get(t.subject_id) ?? []), m[1]!]);
  }
  return { rec, checked, campaigns };
}

const withSignals = (base: ReturnType<typeof toProject>, s: Awaited<ReturnType<typeof projectSignals>>): Project => {
  const backers = (s.rec.get(base.id) ?? []).sort((a, b) => b.staked - a.staked);
  return { ...base, checked: s.checked.has(base.id), recommenders: backers, staked: sum(backers), campaignIds: s.campaigns.get(base.id) ?? [] };
};

export async function listProjects(): Promise<Project[]> {
  const data = await gql(`query($tag:String!, $obj:String!) {
    triples(where:{ predicate_id:{_eq:$tag}, object_id:{_eq:$obj} }, order_by:{ created_at: asc }, limit: 300) {
      creator_id creator { label } created_at subject { ${ATOM_FIELDS} }
    }
  }`, { tag: ATOM.hasTag, obj: TAG_ID });
  const seen = new Set<string>();
  const base = data.triples.filter((t: any) => t.subject && !seen.has(t.subject.term_id) && seen.add(t.subject.term_id)).map((t: any) => toProject(t.subject, t));
  const signals = await projectSignals(base.map((p: any) => p.id));
  return base.map((p: any) => withSignals(p, signals));
}

const claimOf = (t: any): Claim => {
  const supporters = t.positions.map(backerOf).sort((a: Backer, b: Backer) => b.staked - a.staked);
  const opposers = t.counter_positions.map(backerOf).sort((a: Backer, b: Backer) => b.staked - a.staked);
  return {
    tripleId: t.term_id, counterId: t.counter_term_id, text: t.object?.label ?? "", by: addr(t.creator_id), byLabel: named(t.creator?.label), at: t.created_at,
    supporters, opposers, forStaked: sum(supporters), againstStaked: sum(opposers),
  };
};
const CLAIM_FIELDS = `term_id counter_term_id creator_id creator { label } created_at object { label }
  positions(where:{ shares:{_gt:"0"} }) { ${POS} } counter_positions(where:{ shares:{_gt:"0"} }) { ${POS} }`;

export async function getClaims(subjectId: string): Promise<Claim[]> {
  const data = await gql(`query($s:String!, $p:String!) { triples(where:{ subject_id:{_eq:$s}, predicate_id:{_eq:$p} }) { ${CLAIM_FIELDS} } }`, { s: subjectId, p: CLAIM_ID });
  return data.triples.map(claimOf).sort((a: Claim, b: Claim) => (b.forStaked + b.againstStaked) - (a.forStaked + a.againstStaked));
}

export async function getProject(id: string) {
  const data = await gql(`query($id:String!, $tag:String!, $obj:String!, $info:[String!]!) {
    atom(term_id:$id) { ${ATOM_FIELDS} creator_id created_at }
    tag: triples(where:{ subject_id:{_eq:$id}, predicate_id:{_eq:$tag}, object_id:{_eq:$obj} }, order_by:{ created_at: asc }, limit:1) { creator_id creator { label } created_at }
    info: triples(where:{ subject_id:{_eq:$id}, predicate_id:{_in:$info} }, order_by:{ created_at: asc }) {
      term_id creator_id creator { label } predicate_id object { label }
      positions(where:{ shares:{_gt:"0"} }) { ${POS} }
    }
  }`, { id, tag: ATOM.hasTag, obj: TAG_ID, info: INFO_IDS });
  if (!data.atom) return null;
  const tag = data.tag[0] ?? { creator_id: data.atom.creator_id, created_at: data.atom.created_at };
  const [signals, claims] = await Promise.all([projectSignals([id]), getClaims(id)]);
  const info: InfoItem[] = data.info.map((t: any) => {
    const f = infoByPredicate[t.predicate_id]!;
    const b: Backer[] = t.positions.map(backerOf);
    return { tripleId: t.term_id, key: f.key, label: f.label, value: t.object?.label ?? "", addedBy: addr(t.creator_id), addedByLabel: named(t.creator?.label), backers: b, staked: sum(b) };
  });
  info.sort((a, b) => b.staked - a.staked);
  return { project: withSignals(toProject(data.atom, tag), signals), info, claims, listed: data.tag.length > 0 };
}

export const hostOf = (u: string) => {
  try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

export async function findByWebsite(website: string, projects?: Project[]) {
  const host = hostOf(website);
  if (!host) return null;
  return (projects ?? (await listProjects())).find((p) => hostOf(p.url) === host) ?? null;
}

export type Person = { address: string; label: string; image: string; staked: number };

const personOf = (atom: any, staked = 0): Person => ({
  address: addr(atom?.data ?? ""),
  label: named(atom?.label) ?? "",
  image: atom?.image ?? "",
  staked,
});

export async function getTrust(address: string) {
  const me = accountAtomId(address);
  const data = await gql(`query($me:String!, $p:String!) {
    out: triples(where:{ subject_id:{_eq:$me}, predicate_id:{_eq:$p} }) { created_at object { term_id label image data type } positions(where:{ shares:{_gt:"0"} }) { account_id shares vault { current_share_price } } }
    in: triples(where:{ object_id:{_eq:$me}, predicate_id:{_eq:$p} }) { created_at subject { term_id label image data type } positions(where:{ shares:{_gt:"0"} }) { account_id shares vault { current_share_price } } }
  }`, { me, p: ATOM.trusts });
  const self = addr(address);
  const held = (t: any, who: string) => t.positions.find((p: any) => addr(p.account_id) === who);
  const trusts: Person[] = data.out
    .filter((t: any) => t.object?.type === "Account" && held(t, self))
    .map((t: any) => personOf(t.object, worth(held(t, self))))
    .sort((a: Person, b: Person) => b.staked - a.staked);
  const trustedBy: Person[] = data.in
    .filter((t: any) => t.subject?.type === "Account" && held(t, addr(t.subject.data)))
    .map((t: any) => personOf(t.subject, worth(held(t, addr(t.subject.data)))))
    .sort((a: Person, b: Person) => b.staked - a.staked);
  return { trusts, trustedBy };
}

export type Activity = {
  person: Person;
  listed: { id: string; name: string; image: string; at: string }[];
  recommended: { tripleId: Hex; id: string; name: string; image: string; staked: number; at: string }[];
  info: { tripleId: Hex; projectId: string; projectName: string; label: string; value: string; at: string }[];
  claims: (Claim & { about: { person?: string; projectId?: string; name?: string }; side: "for" | "against" })[];
  sponsoredBy: Person[];
  sponsored: Person[];
};

export async function getActivity(address: string): Promise<Activity> {
  const a = addr(address);
  const id = accountAtomId(address);
  const data = await gql(`query($a:String!, $id:String!, $tag:String!, $obj:String!, $rec:triples_bool_exp!, $info:triples_bool_exp!, $claim:String!, $sp:String!) {
    atom(term_id:$id) { label image data }
    listed: triples(where:{ creator_id:{_eq:$a}, predicate_id:{_eq:$tag}, object_id:{_eq:$obj} }, order_by:{ created_at: desc }) { created_at subject { ${ATOM_FIELDS} } }
    rec: positions(where:{ account_id:{_eq:$a}, shares:{_gt:"0"}, term:{ triple: $rec } }, order_by:{ created_at: desc }) { term_id created_at shares vault { current_share_price } term { triple { object { ${ATOM_FIELDS} } } } }
    info: positions(where:{ account_id:{_eq:$a}, shares:{_gt:"0"}, term:{ triple: $info } }, order_by:{ created_at: desc }) { term_id created_at term { triple { predicate_id subject { term_id label value { thing { name } } } object { label } } } }
    claims: triples(where:{ predicate_id:{_eq:$claim}, _or:[{ positions:{ account_id:{_eq:$a}, shares:{_gt:"0"} } }, { counter_positions:{ account_id:{_eq:$a}, shares:{_gt:"0"} } }] }, order_by:{ created_at: desc }, limit: 100) {
      ${CLAIM_FIELDS} subject { term_id type label data value { thing { name } } }
    }
    sponsoredBy: triples(where:{ object_id:{_eq:$id}, predicate_id:{_eq:$sp} }) { subject { data label image } }
    sponsored: triples(where:{ subject_id:{_eq:$id}, predicate_id:{_eq:$sp} }) { created_at object { data label image } }
  }`, {
    a, id, tag: ATOM.hasTag, obj: TAG_ID, claim: CLAIM_ID, sp: SPONSORS_ID,
    rec: { subject_id: { _eq: ATOM.I }, predicate_id: { _eq: ATOM.recommends }, object: IS_PROJECT },
    info: { predicate_id: { _in: INFO_IDS }, subject: IS_PROJECT },
  });
  return {
    person: { ...personOf(data.atom ?? { data: address }), address: a },
    listed: data.listed.map((t: any) => ({ id: t.subject.term_id as string, name: projectName(t.subject), image: t.subject?.value?.thing?.image || t.subject?.image || "", at: t.created_at as string })),
    recommended: data.rec.map((p: any) => ({ tripleId: p.term_id as Hex, id: p.term.triple.object.term_id as string, name: projectName(p.term.triple.object), image: p.term.triple.object?.value?.thing?.image || "", staked: worth(p), at: p.created_at as string })),
    info: data.info.map((p: any) => ({ tripleId: p.term_id as Hex, projectId: p.term.triple.subject.term_id as string, projectName: projectName(p.term.triple.subject), label: infoByPredicate[p.term.triple.predicate_id]?.label ?? "Info", value: p.term.triple.object?.label ?? "", at: p.created_at as string })),
    claims: data.claims.map((t: any) => {
      const c = claimOf(t);
      const subj = t.subject;
      const about = subj?.type === "Account" ? { person: addr(subj.data), name: named(subj.label) } : { projectId: subj?.term_id as string, name: projectName(subj) };
      const side: "for" | "against" = c.supporters.some((b) => b.account === a) ? "for" : "against";
      return { ...c, about, side };
    }),
    sponsoredBy: data.sponsoredBy.map((t: any) => personOf(t.subject)) as Person[],
    sponsored: data.sponsored.map((t: any) => personOf(t.object)) as Person[],
  };
}

export async function suggestPeople(me: string, circle: string[]): Promise<(Person & { via: string[] })[]> {
  if (!circle.length) return [];
  const data = await gql(`query($s:[String!]!, $p:String!) {
    triples(where:{ subject_id:{_in:$s}, predicate_id:{_eq:$p}, object:{ type:{_eq:"Account"} } }, limit: 500) { subject { data } object { data label image } positions(where:{ shares:{_gt:"0"} }) { account_id } }
  }`, { s: circle.map(accountAtomId), p: ATOM.trusts });
  const skip = new Set([addr(me), ...circle.map(addr)]);
  const by = new Map<string, Person & { via: string[] }>();
  for (const t of data.triples) {
    const truster = addr(t.subject?.data ?? "");
    if (!t.positions.some((p: any) => addr(p.account_id) === truster)) continue;
    const p = personOf(t.object);
    if (!p.address || skip.has(p.address)) continue;
    const cur = by.get(p.address) ?? { ...p, via: [] };
    cur.via.push(truster);
    by.set(p.address, cur);
  }
  return [...by.values()].sort((a, b) => b.via.length - a.via.length).slice(0, 12);
}

export async function searchPeople(q: string): Promise<Person[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  if (isAddress(term)) {
    const data = await gql(`query($id:String!) { atom(term_id:$id) { label image data } }`, { id: accountAtomId(term) });
    return [{ ...personOf(data.atom ?? { data: term }), address: addr(term) }];
  }
  const data = await gql(`query($q:String!) { accounts(where:{ label:{_ilike:$q}, type:{_eq:"Default"} }, limit: 8) { id label image } }`, { q: `%${term}%` });
  return data.accounts.map((a: any) => ({ address: addr(a.id), label: named(a.label) ?? "", image: a.image ?? "", staked: 0 }));
}


export type InviteSettings = { min: string; max: string; poolSharePct: number };
export type GraphConfig = { attester: string | null; contributionsOn: boolean; invites: InviteSettings | null };
let configP: Promise<GraphConfig> | null = null;
export function graphConfig(): Promise<GraphConfig> {
  configP ??= apiRequestV2("GET", "/api/graph/config")
    .then((r: any) => ({ attester: r?.attester && isAddress(r.attester) ? addr(r.attester) : null, contributionsOn: !!r?.contributionsOn, invites: r?.invites?.min ? r.invites : null }))
    .catch(() => { configP = null; return { attester: null, contributionsOn: false, invites: null }; });
  return configP;
}

const JOINED_ID = idOf(textAtom("joined"));
const COMPLETED_ID = idOf(textAtom("completed"));
export type Contribution = { kind: "joined" | "finished"; campaignId: string; at: string };
export const parseContribution = (predicateId: string, label: string, at: string): Contribution | null => {
  const m = /^nexura:campaign:([a-f0-9]{24})$/i.exec(label ?? "");
  if (!m) return null;
  if (predicateId === JOINED_ID) return { kind: "joined", campaignId: m[1]!, at };
  if (predicateId === COMPLETED_ID) return { kind: "finished", campaignId: m[1]!, at };
  return null;
};

export async function getContributions(address: string): Promise<Contribution[]> {
  const { attester } = await graphConfig();
  if (!attester) return [];
  const data = await gql(`query($s:String!, $p:[String!]!, $a:String!) {
    triples(where:{ subject_id:{_eq:$s}, predicate_id:{_in:$p}, positions:{ account_id:{_eq:$a}, shares:{_gt:"0"} } }, order_by:{ created_at: desc }) { predicate_id created_at object { label } }
  }`, { s: accountAtomId(address), p: [JOINED_ID, COMPLETED_ID], a: attester });
  return data.triples.map((t: any) => parseContribution(t.predicate_id, t.object?.label, t.created_at)).filter(Boolean);
}

export type Invite = { _id: string; campaign: string; inviter: string; invitee: string; status: "pending" | "paid"; amount: string | null; txHash: string | null; createdAt: string };
export async function getInvites(q: { address?: string; campaign?: string }): Promise<Invite[]> {
  const params = new URLSearchParams();
  if (q.address) params.set("address", q.address);
  if (q.campaign) params.set("campaign", q.campaign);
  const r: any = await apiRequestV2("GET", `/api/graph/invites?${params}`);
  return (r?.invites ?? []).map((i: any) => ({ ...i, campaign: String(i.campaign), inviter: addr(i.inviter), invitee: addr(i.invitee) }));
}
export type AmbassadorRow = { campaign: string; title: string; token: string; pool: number; invitesJoined: number; yours: number; share: number; ended: boolean };
export const getAmbassadorEarnings = async (address: string): Promise<{ poolPct: number; campaigns: AmbassadorRow[] }> =>
  (await apiRequestV2("GET", `/api/graph/invites/earnings?address=${address}`)) as any;
export const acceptInvite = (campaign: string, inviter: string) => apiRequestV2("POST", "/api/graph/invites/accept", { campaign, inviter });

export type CampaignPerson = Person & { finished: boolean; at: string };
export async function campaignPeople(campaignId: string): Promise<CampaignPerson[]> {
  const { attester } = await graphConfig();
  if (!attester) return [];
  const data = await gql(`query($p:[String!]!, $a:String!, $o:String!) {
    triples(where:{ predicate_id:{_in:$p}, creator_id:{_eq:$a}, object:{ label:{_eq:$o} }, subject:{ type:{_eq:"Account"} } }, order_by:{ created_at: desc }, limit: 1000) { predicate_id created_at subject { data label image } }
  }`, { p: [JOINED_ID, COMPLETED_ID], a: attester, o: `nexura:campaign:${campaignId}` });
  const by = new Map<string, CampaignPerson>();
  for (const t of data.triples) {
    const p = personOf(t.subject);
    const cur = by.get(p.address) ?? { ...p, finished: false, at: t.created_at };
    if (t.predicate_id === COMPLETED_ID) cur.finished = true;
    by.set(p.address, cur);
  }
  return [...by.values()];
}

export type Suggestion = Person & { via: string[]; shared: number };
export async function peopleLikeYou(me: string, circle: string[]): Promise<Suggestion[]> {
  const self = addr(me);
  const skip = new Set([self, ...circle.map(addr)]);
  const [byTrust, mine] = await Promise.all([suggestPeople(me, circle), getContributions(me)]);
  const out = new Map<string, Suggestion>();
  for (const p of byTrust) if (!skip.has(p.address)) out.set(p.address, { ...p, shared: 0 });
  const campaigns = [...new Set(mine.map((c) => c.campaignId))].slice(0, 10);
  const lists = await Promise.all(campaigns.map((id) => campaignPeople(id).catch(() => [] as CampaignPerson[])));
  for (const list of lists) {
    for (const p of list) {
      if (skip.has(p.address)) continue;
      const cur = out.get(p.address) ?? { ...p, via: [], shared: 0 };
      cur.shared += 1;
      out.set(p.address, cur);
    }
  }
  return [...out.values()].sort((a, b) => (b.via.length * 2 + b.shared) - (a.via.length * 2 + a.shared)).slice(0, 12);
}

export async function getVerifiedMembers(): Promise<Set<string>> {
  const { attester } = await graphConfig();
  if (!attester) return new Set();
  const data = await gql(`query($p:[String!]!, $a:String!) {
    triples(where:{ predicate_id:{_in:$p}, creator_id:{_eq:$a}, subject:{ type:{_eq:"Account"} } }, distinct_on: subject_id, limit: 20000) { subject { data } }
  }`, { p: [JOINED_ID, COMPLETED_ID], a: attester });
  return new Set(data.triples.map((t: any) => addr(t.subject?.data ?? "")));
}


export { INFO_FIELDS };

export async function getOpinion(tripleId: string) {
  const data = await gql(`query($id:String!) { triple(term_id:$id) { ${CLAIM_FIELDS} predicate_id subject { term_id type label data image value { thing { name image } } } } }`, { id: tripleId });
  const t = data.triple;
  if (!t || t.predicate_id !== CLAIM_ID) return null;
  const s = t.subject;
  const about = s?.type === "Account"
    ? { person: addr(s.data), name: named(s.label) ?? "", image: s.image || undefined }
    : { projectId: s?.term_id as string, name: projectName(s), image: s?.value?.thing?.image || s?.image || undefined };
  return { ...claimOf(t), about };
}
