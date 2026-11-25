import { getAddress } from "viem";
import logger from "@/config/logger";
import { campaignCompleted } from "@/models/campaign.model";
import { user } from "@/models/user.model";
import { network } from "@/utils/env.utils";
import { OUTBOUND_TIMEOUT_MS } from "@/utils/resilience";

export const TRUST_WEIGHT = Math.min(1, Math.max(0, Number(process.env.NEXURA_SCORE_TRUST_WEIGHT ?? 0.3)));
const GRAPHQL = process.env.INTUITION_GRAPHQL_URL?.trim() || (network === "mainnet" ? "https://mainnet.intuition.sh/v1/graphql" : "https://testnet.intuition.sh/v1/graphql");
const TRUSTS = "0x3a73f3b1613d166eea141a25a2adc70db9304ab3c4e90daecad05f86487c3ee9";
const CACHE_MS = 10 * 60 * 1000;

type Edge = { from: string; to: string; staked: number };
const lower = (a: string) => { try { return getAddress(a).toLowerCase(); } catch { return ""; } };

async function fetchTrustEdges(): Promise<Edge[]> {
  const query = `query($t:String!) { triples(where:{ predicate_id:{_eq:$t}, subject:{ type:{_eq:"Account"} }, object:{ type:{_eq:"Account"} } }, limit: 20000) {
    subject { data } object { data } positions(where:{ shares:{_gt:"0"} }) { account_id shares vault { current_share_price } } } }`;
  const r = await fetch(GRAPHQL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, variables: { t: TRUSTS } }), signal: AbortSignal.timeout(OUTBOUND_TIMEOUT_MS * 2) });
  const json: any = await r.json();
  if (!r.ok || json.errors) throw new Error(`trust graph unavailable (${r.status})`);
  const edges: Edge[] = [];
  for (const t of json.data.triples) {
    const from = lower(t.subject?.data ?? ""), to = lower(t.object?.data ?? "");
    if (!from || !to || from === to) continue;
    const held = t.positions.find((p: any) => lower(p.account_id) === from);
    if (!held) continue;
    const price = BigInt(held.vault?.current_share_price ?? "1000000000000000000");
    edges.push({ from, to, staked: Number((BigInt(held.shares) * price) / 10n ** 18n) / 1e18 });
  }
  return edges;
}

export function trustRank(edges: Edge[], seeds: Iterable<string>, iterations = 40, damping = 0.85): Map<string, number> {
  const nodes = new Set<string>();
  for (const e of edges) { nodes.add(e.from); nodes.add(e.to); }
  const seedList = [...new Set(seeds)].filter((s) => nodes.has(s));
  if (!seedList.length) return new Map();
  const restart = new Map(seedList.map((s) => [s, 1 / seedList.length]));
  const out = new Map<string, { to: string; w: number }[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), { to: e.to, w: Math.log1p(Math.max(e.staked, 0) * 100) + 1 }]);
  const outW = new Map([...out].map(([k, v]) => [k, v.reduce((s, x) => s + x.w, 0)]));
  let rank = new Map(restart);
  for (let i = 0; i < iterations; i++) {
    const next = new Map<string, number>();
    let dangling = 0;
    for (const n of nodes) {
      const r = rank.get(n) ?? 0;
      const links = out.get(n);
      if (!links?.length) { dangling += r; continue; }
      for (const l of links) next.set(l.to, (next.get(l.to) ?? 0) + damping * r * (l.w / outW.get(n)!));
    }
    for (const [s, w] of restart) next.set(s, (next.get(s) ?? 0) + (1 - damping + damping * dangling) * w);
    rank = next;
  }
  const max = Math.max(0, ...rank.values());
  return new Map([...rank].map(([k, v]) => [k, max > 0 ? Math.round((v / max) * 100) : 0]));
}

export type TrustScores = { ranks: Map<string, number>; ok: boolean };
let cache: { at: number; ranks: Map<string, number> } | null = null;
let pending: Promise<TrustScores> | null = null;

export async function trustScores(): Promise<TrustScores> {
  if (cache && Date.now() - cache.at < CACHE_MS) return { ranks: cache.ranks, ok: true };
  pending ??= (async () => {
    try {
      const [edges, joined] = await Promise.all([fetchTrustEdges(), campaignCompleted.distinct("user")]);
      const members = await user.find({ _id: { $in: joined } }).select("address").lean() as any[];
      const ranks = trustRank(edges, members.map((m) => lower(String(m.address ?? ""))).filter(Boolean));
      cache = { at: Date.now(), ranks };
      return { ranks, ok: true };
    } catch (err: any) {
      logger.warn(`graph trust: ${err?.message}`);
      return cache ? { ranks: cache.ranks, ok: true } : { ranks: new Map<string, number>(), ok: false };
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export const blendedScore = (retention: number | null, trust: number) =>
  retention == null ? null : Math.round((1 - TRUST_WEIGHT) * retention + TRUST_WEIGHT * trust);
