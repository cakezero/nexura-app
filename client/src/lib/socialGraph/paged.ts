import { formatEther, getAddress, type Hex } from "viem";
import { resilientFetch } from "@/lib/resilientFetch";
import { ATOM, CLAIM_LABEL, TAG_LABEL, accountAtomId, graphqlUrl, idOf, infoByPredicate, textAtom } from "./config";
import { graphConfig, parseContribution, type Contribution } from "./graph";

export const PAGE = 25;
const CLAIM_ID = idOf(textAtom(CLAIM_LABEL));
const TAG_ID = idOf(textAtom(TAG_LABEL));
const IS_PROJECT = { as_subject_triples: { predicate_id: { _eq: ATOM.hasTag }, object_id: { _eq: TAG_ID } } };

async function gql<T = any>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await resilientFetch(graphqlUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables }) }, { retries: 2 });
  if (!res.ok) throw new Error(`Intuition is unreachable right now (${res.status})`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}
const addr = (a: string) => { try { return getAddress(a); } catch { return a; } };
const named = (l?: string | null) => (l && !/^0x[0-9a-f]{4}/i.test(l) ? l : undefined);
const trust = (wei?: string | null) => Number(formatEther(BigInt(wei ?? "0")));
const like = (q: string) => `%${q.trim().replace(/[%_]/g, "")}%`;
const worth = (p: any) => {
  const price = p?.vault?.current_share_price;
  return price ? Number(formatEther((BigInt(p.shares ?? "0") * BigInt(price)) / 10n ** 18n)) : trust(p?.shares);
};

export type Page<T> = { rows: T[]; total: number };

const JOINED_ID = idOf(textAtom("joined"));
const COMPLETED_ID = idOf(textAtom("completed"));
const INFO_IDS = Object.keys(infoByPredicate);
const isMember = (attester: string | null) => attester
  ? { as_subject_triples: { creator_id: { _eq: attester }, predicate_id: { _in: [JOINED_ID, COMPLETED_ID] } } }
  : { term_id: { _eq: "0x0" } };

export type TripleSort = "newest" | "oldest" | "capHigh" | "capLow" | "posMost" | "posFew" | "forMost" | "forFew" | "againstMost" | "againstFew" | "az" | "za";
const tripleOrder = (s: TripleSort): any[] => ({
  newest: [{ created_at: "desc" }], oldest: [{ created_at: "asc" }],
  capHigh: [{ term: { total_market_cap: "desc_nulls_last" } }, { created_at: "desc" }], capLow: [{ term: { total_market_cap: "asc_nulls_last" } }, { created_at: "desc" }],
  posMost: [{ positions_aggregate: { count: "desc" } }, { counter_positions_aggregate: { count: "desc" } }, { created_at: "desc" }],
  posFew: [{ positions_aggregate: { count: "asc" } }, { counter_positions_aggregate: { count: "asc" } }, { created_at: "desc" }],
  forMost: [{ positions_aggregate: { count: "desc" } }, { created_at: "desc" }], forFew: [{ positions_aggregate: { count: "asc" } }, { created_at: "desc" }],
  againstMost: [{ counter_positions_aggregate: { count: "desc" } }, { created_at: "desc" }], againstFew: [{ counter_positions_aggregate: { count: "asc" } }, { created_at: "desc" }],
  az: [{ object: { label: "asc" } }], za: [{ object: { label: "desc" } }],
}[s]);

export type AtomSort = "trustMost" | "trustFew" | "capHigh" | "capLow" | "posMost" | "posFew" | "opinionsMost" | "opinionsFew" | "newest" | "oldest" | "az" | "za";
const atomOrder = (s: AtomSort): any[] => ({
  trustMost: [{ as_object_triples_aggregate: { count: "desc" } }], trustFew: [{ as_object_triples_aggregate: { count: "asc" } }],
  capHigh: [{ term: { total_market_cap: "desc_nulls_last" } }], capLow: [{ term: { total_market_cap: "asc_nulls_last" } }],
  posMost: [{ positions_aggregate: { count: "desc" } }], posFew: [{ positions_aggregate: { count: "asc" } }],
  opinionsMost: [{ as_subject_triples_aggregate: { count: "desc" } }], opinionsFew: [{ as_subject_triples_aggregate: { count: "asc" } }],
  newest: [{ created_at: "desc" }], oldest: [{ created_at: "asc" }], az: [{ label: "asc" }], za: [{ label: "desc" }],
}[s]);


export type FeedKind = "opinion" | "trust" | "recommend" | "listed" | "info" | "contribution";
export type FeedFilter = "all" | "people" | "projects" | FeedKind | "trusted" | "mine" | "aboutMe";
export type Who = { address?: string; projectId?: string; name: string; image?: string };
export type FeedPost = {
  id: Hex; counterId: Hex; kind: FeedKind; at: string;
  actor: string; actorLabel?: string; actorImage?: string;
  about: Who; text: string; field?: string; contribution?: Contribution;
  cap: number; forCount: number; forTrust: number; againstCount: number; againstTrust: number;
  backers: { account: string; label?: string; image?: string }[];
  mySide: "for" | "against" | null;
};

const ATOM_Q = `term_id type label data image value { thing { name image } }`;
const whoOf = (a: any): Who => a?.type === "Account"
  ? { address: addr(a.data), name: named(a.label) ?? "", image: a.image || undefined }
  : { projectId: a?.term_id, name: a?.value?.thing?.name || a?.label || "a project", image: a?.value?.thing?.image || a?.image || undefined };

export async function pageFeed(o: { filter: FeedFilter; sort: TripleSort; search: string; offset: number; me: string | null; circle: string[] }): Promise<Page<FeedPost>> {
  const { attester } = await graphConfig();
  const me = o.me ? addr(o.me) : "0x0";
  const meId = o.me ? accountAtomId(o.me) : "0x0";
  const circle = o.circle.map(addr);
  const nexuraTrust = [isMember(attester), ...(o.me ? [{ term_id: { _eq: meId } }] : []), ...(circle.length ? [{ term_id: { _in: circle.map(accountAtomId) } }] : [])];
  const branches: Record<FeedKind | "opinionPerson" | "opinionProject", any> = {
    opinion: null,
    opinionPerson: { predicate_id: { _eq: CLAIM_ID }, subject: { type: { _eq: "Account" } } },
    opinionProject: { predicate_id: { _eq: CLAIM_ID }, subject: IS_PROJECT },
    trust: { predicate_id: { _eq: ATOM.trusts }, subject: { type: { _eq: "Account" } }, object: { type: { _eq: "Account" } }, _or: [{ subject: { _or: nexuraTrust } }, { object: { _or: nexuraTrust } }] },
    recommend: { subject_id: { _eq: ATOM.I }, predicate_id: { _eq: ATOM.recommends }, object: IS_PROJECT },
    listed: { predicate_id: { _eq: ATOM.hasTag }, object_id: { _eq: TAG_ID } },
    info: { predicate_id: { _in: INFO_IDS }, subject: IS_PROJECT },
    contribution: attester ? { creator_id: { _eq: attester }, predicate_id: { _in: [JOINED_ID, COMPLETED_ID] }, subject: { type: { _eq: "Account" } } } : null,
  };
  const pick = (...k: (keyof typeof branches)[]) => k.map((x) => branches[x]).filter(Boolean);
  const kinds = {
    people: pick("opinionPerson", "trust", "contribution"),
    projects: pick("opinionProject", "recommend", "listed", "info"),
    opinion: pick("opinionPerson", "opinionProject"),
    trust: pick("trust"), recommend: pick("recommend"), listed: pick("listed"), info: pick("info"), contribution: pick("contribution"),
  } as Record<string, any[]>;
  const all = pick("opinionPerson", "opinionProject", "trust", "recommend", "listed", "info", "contribution");
  const and: any[] = [{ _or: kinds[o.filter] ?? all }];
  if (o.filter === "trusted") and.push({ _or: [{ creator_id: { _in: circle } }, { subject_id: { _in: circle.map(accountAtomId) }, predicate_id: { _eq: ATOM.trusts } }, { positions: { account_id: { _in: circle }, shares: { _gt: "0" } } }] });
  if (o.filter === "mine") and.push({ _or: [{ creator_id: { _eq: me } }, { subject_id: { _eq: meId } }, { positions: { account_id: { _eq: me }, shares: { _gt: "0" } } }, { counter_positions: { account_id: { _eq: me }, shares: { _gt: "0" } } }] });
  if (o.filter === "aboutMe") and.push({ _or: [{ subject_id: { _eq: meId }, predicate_id: { _eq: CLAIM_ID } }, { object_id: { _eq: meId } }] });
  if (o.search.trim()) and.push({ _or: [{ subject: { label: { _ilike: like(o.search) } } }, { object: { label: { _ilike: like(o.search) } } }, { creator: { label: { _ilike: like(o.search) } } }] });

  const data = await gql(`query($w: triples_bool_exp!, $o: [triples_order_by!], $off: Int!, $lim: Int!, $me: String!) {
    rows: triples(where: $w, order_by: $o, offset: $off, limit: $lim) {
      term_id counter_term_id created_at predicate_id creator_id creator { label image }
      subject { ${ATOM_Q} } object { ${ATOM_Q} }
      term { total_market_cap total_assets } counter_term { total_assets }
      forCount: positions_aggregate(where:{ shares:{_gt:"0"} }) { aggregate { count } }
      againstCount: counter_positions_aggregate(where:{ shares:{_gt:"0"} }) { aggregate { count } }
      backers: positions(where:{ shares:{_gt:"0"} }, order_by:{ shares: desc }, limit: 4) { account_id account { label image } }
      mineFor: positions(where:{ account_id:{_eq:$me}, shares:{_gt:"0"} }) { account_id }
      mineAgainst: counter_positions(where:{ account_id:{_eq:$me}, shares:{_gt:"0"} }) { account_id }
    }
    total: triples_aggregate(where: $w) { aggregate { count } }
  }`, { w: { _and: and }, o: tripleOrder(o.sort), off: o.offset, lim: PAGE, me });

  const rows: FeedPost[] = data.rows.map((t: any) => {
    const p = t.predicate_id;
    const kind: FeedKind = p === CLAIM_ID ? "opinion" : p === ATOM.trusts ? "trust" : p === ATOM.recommends ? "recommend" : p === ATOM.hasTag ? "listed" : p === JOINED_ID || p === COMPLETED_ID ? "contribution" : "info";
    const creator = { actor: addr(t.creator_id), actorLabel: named(t.creator?.label), actorImage: t.creator?.image || undefined };
    const subjectActor = { actor: addr(t.subject?.data ?? ""), actorLabel: named(t.subject?.label), actorImage: t.subject?.image || undefined };
    const base = {
      id: t.term_id, counterId: t.counter_term_id, kind, at: t.created_at,
      cap: trust(t.term?.total_market_cap), forCount: t.forCount.aggregate.count, forTrust: trust(t.term?.total_assets),
      againstCount: t.againstCount.aggregate.count, againstTrust: trust(t.counter_term?.total_assets),
      backers: t.backers.map((b: any) => ({ account: addr(b.account_id), label: named(b.account?.label), image: b.account?.image || undefined })),
      mySide: t.mineFor.length ? "for" as const : t.mineAgainst.length ? "against" as const : null,
    };
    if (kind === "trust") return { ...base, ...subjectActor, about: whoOf(t.object), text: "" };
    if (kind === "contribution") return { ...base, ...subjectActor, about: whoOf(t.subject), text: "", contribution: parseContribution(p, t.object?.label, t.created_at) ?? undefined };
    if (kind === "recommend") return { ...base, ...creator, about: whoOf(t.object), text: "" };
    if (kind === "info") return { ...base, ...creator, about: whoOf(t.subject), text: t.object?.label ?? "", field: infoByPredicate[p]?.label };
    return { ...base, ...creator, about: whoOf(t.subject), text: kind === "opinion" ? t.object?.label ?? "" : "" };
  });
  return { total: data.total.aggregate.count, rows };
}

export type OpinionFilter = "all" | "people" | "projects" | "trusted" | "mine" | "aboutMe" | "agreed" | "disputed";
export type OpinionSort = TripleSort;
export type OpinionRow = {
  tripleId: Hex; counterId: Hex; text: string; at: string; by: string; byLabel?: string;
  about: { person?: string; projectId?: string; name: string; image?: string };
  agree: number; agreeTrust: number; disagree: number; disagreeTrust: number;
  mySide: "for" | "against" | null;
};

export async function pageOpinions(o: { filter: OpinionFilter; sort: OpinionSort; search: string; offset: number; me: string | null; circle: string[]; subject?: string }): Promise<Page<OpinionRow>> {
  const and: any[] = [{ predicate_id: { _eq: CLAIM_ID } }];
  and.push(o.subject ? { subject_id: { _eq: o.subject } } : { _or: [{ subject: { type: { _eq: "Account" } } }, { subject: IS_PROJECT }] });
  if (o.search.trim()) and.push({ _or: [{ object: { label: { _ilike: like(o.search) } } }, { subject: { label: { _ilike: like(o.search) } } }] });
  const circle = o.circle.map(addr);
  const me = o.me ? addr(o.me) : "0x0";
  const filters: Record<OpinionFilter, any> = {
    all: {},
    people: { subject: { type: { _eq: "Account" } } },
    projects: { subject: IS_PROJECT },
    trusted: { _or: [{ creator_id: { _in: circle } }, { positions: { account_id: { _in: circle }, shares: { _gt: "0" } } }, { counter_positions: { account_id: { _in: circle }, shares: { _gt: "0" } } }] },
    mine: { _or: [{ creator_id: { _eq: me } }, { positions: { account_id: { _eq: me }, shares: { _gt: "0" } } }, { counter_positions: { account_id: { _eq: me }, shares: { _gt: "0" } } }] },
    aboutMe: { subject_id: { _eq: o.me ? accountAtomId(o.me) : "0x0" } },
    agreed: { _not: { counter_positions: { shares: { _gt: "0" } } } },
    disputed: { counter_positions: { shares: { _gt: "0" } } },
  };
  and.push(filters[o.filter]);
  const data = await gql(`query($w: triples_bool_exp!, $o: [triples_order_by!], $off: Int!, $lim: Int!, $me: String!) {
    rows: triples(where: $w, order_by: $o, offset: $off, limit: $lim) {
      term_id counter_term_id created_at creator_id creator { label } object { label }
      subject { term_id type label data image value { thing { name image } } }
      term { total_assets } counter_term { total_assets }
      agree: positions_aggregate(where:{ shares:{_gt:"0"} }) { aggregate { count } }
      disagree: counter_positions_aggregate(where:{ shares:{_gt:"0"} }) { aggregate { count } }
      mineFor: positions(where:{ account_id:{_eq:$me}, shares:{_gt:"0"} }) { account_id }
      mineAgainst: counter_positions(where:{ account_id:{_eq:$me}, shares:{_gt:"0"} }) { account_id }
    }
    total: triples_aggregate(where: $w) { aggregate { count } }
  }`, { w: { _and: and }, o: tripleOrder(o.sort), off: o.offset, lim: PAGE, me });
  return {
    total: data.total.aggregate.count,
    rows: data.rows.map((t: any) => {
      const s = t.subject;
      const isPerson = s?.type === "Account";
      return {
        tripleId: t.term_id, counterId: t.counter_term_id, text: t.object?.label ?? "", at: t.created_at, by: addr(t.creator_id), byLabel: named(t.creator?.label),
        about: isPerson ? { person: addr(s.data), name: named(s.label) ?? "", image: s.image || undefined } : { projectId: s?.term_id, name: s?.value?.thing?.name || s?.label || "a project", image: s?.value?.thing?.image || s?.image || undefined },
        agree: t.agree.aggregate.count, agreeTrust: trust(t.term?.total_assets),
        disagree: t.disagree.aggregate.count, disagreeTrust: trust(t.counter_term?.total_assets),
        mySide: t.mineFor.length ? "for" : t.mineAgainst.length ? "against" : null,
      };
    }),
  };
}


export type PositionFilter = "all" | "for" | "against" | "trusted";
export type PositionSort = "highest" | "lowest" | "newest" | "oldest" | "az" | "za";
export type PositionRow = { id: string; account: string; label?: string; image?: string; side: "for" | "against"; amount: number; at: string };

export async function pagePositions(o: { tripleId: string; counterId?: string; filter: PositionFilter; sort: PositionSort; search: string; offset: number; circle: string[] }): Promise<Page<PositionRow>> {
  const terms = o.filter === "for" || !o.counterId ? [o.tripleId] : o.filter === "against" ? [o.counterId] : [o.tripleId, o.counterId];
  const and: any[] = [{ term_id: { _in: terms } }, { shares: { _gt: "0" } }];
  if (o.filter === "trusted") and.push({ account_id: { _in: o.circle.map(addr) } });
  if (o.search.trim()) and.push({ _or: [{ account: { label: { _ilike: like(o.search) } } }, { account_id: { _ilike: like(o.search) } }] });
  const orders: Record<PositionSort, any> = {
    highest: [{ shares: "desc" }], lowest: [{ shares: "asc" }], newest: [{ created_at: "desc" }], oldest: [{ created_at: "asc" }],
    az: [{ account: { label: "asc" } }], za: [{ account: { label: "desc" } }],
  };
  const data = await gql(`query($w: positions_bool_exp!, $o: [positions_order_by!], $off: Int!, $lim: Int!) {
    rows: positions(where: $w, order_by: $o, offset: $off, limit: $lim) { id term_id account_id account { label image } shares created_at vault { current_share_price } }
    total: positions_aggregate(where: $w) { aggregate { count } }
  }`, { w: { _and: and }, o: orders[o.sort], off: o.offset, lim: PAGE });
  return {
    total: data.total.aggregate.count,
    rows: data.rows.map((p: any) => ({ id: p.id, account: addr(p.account_id), label: named(p.account?.label), image: p.account?.image || undefined, side: p.term_id === o.counterId ? "against" : "for", amount: worth(p), at: p.created_at })),
  };
}


export type PeopleFilter = "all" | "members" | "trusted" | "trustMe" | "opinions" | "disputed";
export type PeopleSort = AtomSort;
export type PersonRowData = {
  address: string; label?: string; image?: string; trustedBy: number; opinions: number; cap: number; positions: number;
  tags: { text: string; positive: boolean }[];
};

export async function pagePeople(o: { filter: PeopleFilter; sort: PeopleSort; search: string; offset: number; me: string | null; circle: string[] }): Promise<Page<PersonRowData>> {
  const { attester } = await graphConfig();
  const onGraph = { _or: [{ as_object_triples: { predicate_id: { _eq: ATOM.trusts }, subject: { type: { _eq: "Account" } } } }, { as_subject_triples: { predicate_id: { _eq: CLAIM_ID } } }, ...(attester ? [isMember(attester)] : [])] };
  const and: any[] = [{ type: { _eq: "Account" } }, onGraph];
  if (o.search.trim()) and.push({ _or: [{ label: { _ilike: like(o.search) } }, { data: { _ilike: like(o.search) } }] });
  const filters: Record<PeopleFilter, any> = {
    all: {},
    members: isMember(attester),
    trusted: { term_id: { _in: o.circle.map(accountAtomId) } },
    trustMe: { as_subject_triples: { predicate_id: { _eq: ATOM.trusts }, object_id: { _eq: o.me ? accountAtomId(o.me) : "0x0" } } },
    opinions: { as_subject_triples: { predicate_id: { _eq: CLAIM_ID } } },
    disputed: { as_subject_triples: { predicate_id: { _eq: CLAIM_ID }, counter_positions: { shares: { _gt: "0" } } } },
  };
  and.push(filters[o.filter]);
  const data = await gql(`query($w: atoms_bool_exp!, $o: [atoms_order_by!], $off: Int!, $lim: Int!, $t: String!, $c: String!) {
    rows: atoms(where: $w, order_by: $o, offset: $off, limit: $lim) {
      data label image term { total_market_cap } positions_aggregate { aggregate { count } }
      trustedBy: as_object_triples_aggregate(where:{ predicate_id:{_eq:$t}, subject:{ type:{_eq:"Account"} } }) { aggregate { count } }
      opinionCount: as_subject_triples_aggregate(where:{ predicate_id:{_eq:$c} }) { aggregate { count } }
      opinions: as_subject_triples(where:{ predicate_id:{_eq:$c} }, order_by:{ term:{ total_assets: desc_nulls_last } }, limit: 3) { object { label } term { total_assets } counter_term { total_assets } }
    }
    total: atoms_aggregate(where: $w) { aggregate { count } }
  }`, { w: { _and: and }, o: atomOrder(o.sort), off: o.offset, lim: PAGE, t: ATOM.trusts, c: CLAIM_ID });
  return {
    total: data.total.aggregate.count,
    rows: data.rows.map((a: any) => ({
      address: addr(a.data), label: named(a.label), image: a.image || undefined,
      cap: trust(a.term?.total_market_cap), positions: a.positions_aggregate.aggregate.count,
      trustedBy: a.trustedBy.aggregate.count, opinions: a.opinionCount.aggregate.count,
      tags: a.opinions.map((t: any) => ({ text: t.object?.label ?? "", positive: trust(t.term?.total_assets) >= trust(t.counter_term?.total_assets) })).filter((t: any) => t.text),
    })),
  };
}
