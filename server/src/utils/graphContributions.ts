import { calculateAtomId, calculateTripleId } from "@0xintuition/sdk";
import { getAddress, isAddress, parseAbi, toHex, type Hex } from "viem";
import logger from "@/config/logger";
import { campaign, campaignCompleted } from "@/models/campaign.model";
import { campaignQuest } from "@/models/quests.model";
import { campaignQuestCompleted } from "@/models/questsCompleted.models";
import { user } from "@/models/user.model";
import { graphContribution } from "@/models/graphContribution.model";
import { network } from "@/utils/env.utils";
import { buildCampaignStages, doneAt, scoreCampaignRetention } from "@/utils/retention";
import { getPublicClient, sendServerContractTx, serverWalletAddress } from "@/utils/account";
import { runExclusively } from "@/utils/jobLock";

export const GRAPH_ATTEST_ENABLED = process.env.GRAPH_ATTEST_ENABLED?.trim().toLowerCase() === "true";
const PER_PASS = Math.max(1, Math.min(500, Number(process.env.GRAPH_ATTEST_BATCH) || 100));
const INTERVAL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const MULTIVAULT: GlobalAddress = network === "mainnet" ? "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e" : "0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91";
const ABI = parseAbi([
  "function getAtomCost() view returns (uint256)",
  "function getTripleCost() view returns (uint256)",
  "function isTermCreated(bytes32 id) view returns (bool)",
  "function getShares(address account, bytes32 termId, uint256 curveId) view returns (uint256)",
  "function generalConfig() view returns (address admin, address protocolMultisig, uint256 feeDenominator, address trustBonding, uint256 minDeposit, uint256 minShare, uint256 atomDataMaxLength, uint256 feeThreshold)",
  "function createAtoms(bytes[] data, uint256[] assets) payable returns (bytes32[])",
  "function createTriples(bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets) payable returns (bytes32[])",
  "function depositBatch(address receiver, bytes32[] termIds, uint256[] curveIds, uint256[] assets, uint256[] minShares) payable returns (uint256[])",
]);

export const PREDICATE = { joined: "joined", finished: "completed" } as const;
export const campaignObject = (id: string) => `nexura:campaign:${id}`;
const text = (s: string) => toHex(s);
const accountData = (a: string) => toHex(getAddress(a));

export async function queueContributions(nowMs = Date.now()) {
  const joins = await campaignCompleted.find({}).select("user campaign createdAt").sort({ _id: -1 }).limit(20_000).lean() as any[];
  if (!joins.length) return 0;
  const userIds = [...new Set(joins.map((j) => String(j.user)))];
  const campaignIds = [...new Set(joins.map((j) => String(j.campaign)))];
  const [users, campaigns, quests] = await Promise.all([
    user.find({ _id: { $in: userIds } }).select("_id address").lean() as Promise<any[]>,
    campaign.find({ _id: { $in: campaignIds }, status: { $ne: "Save" } }).select("_id stages").lean() as Promise<any[]>,
    campaignQuest.find({ campaign: { $in: campaignIds } }).select("_id campaign stage").lean() as Promise<any[]>,
  ]);
  const completions = await campaignQuestCompleted.find({ user: { $in: userIds }, campaignQuest: { $in: quests.map((q) => q._id) }, done: true })
    .select("user campaignQuest updatedAt").lean() as any[];

  const address = new Map(users.filter((u) => isAddress(String(u.address ?? ""))).map((u) => [String(u._id), String(u.address).toLowerCase()]));
  const campaignById = new Map(campaigns.map((c) => [String(c._id), c]));
  const questsBy = new Map<string, any[]>();
  for (const q of quests) questsBy.set(String(q.campaign), [...(questsBy.get(String(q.campaign)) ?? []), q]);
  const doneBy = new Map<string, Map<string, number>>();
  for (const d of completions) {
    const m = doneBy.get(String(d.user)) ?? new Map();
    m.set(String(d.campaignQuest), doneAt(d));
    doneBy.set(String(d.user), m);
  }

  const ops: any[] = [];
  const add = (doc: Record<string, unknown>) => ops.push({ updateOne: { filter: { key: doc.key }, update: { $setOnInsert: doc }, upsert: true } });
  for (const j of joins) {
    const uid = String(j.user), cid = String(j.campaign);
    const addr = address.get(uid);
    const c = campaignById.get(cid);
    if (!addr || !c) continue;
    add({ key: `joined:${uid}:${cid}`, kind: "joined", user: uid, address: addr, campaign: cid });
    const stages = buildCampaignStages(c, questsBy.get(cid) ?? []);
    const { stagesCompleted, stagesTotal } = scoreCampaignRetention(stages, doneBy.get(uid) ?? new Map(), new Date(j.createdAt).getTime(), nowMs);
    if (stagesTotal > 0 && stagesCompleted === stagesTotal) add({ key: `finished:${uid}:${cid}`, kind: "finished", user: uid, address: addr, campaign: cid });
  }
  let queued = 0;
  for (let i = 0; i < ops.length; i += 1000) {
    const r = await graphContribution.bulkWrite(ops.slice(i, i + 1000), { ordered: false });
    queued += r.upsertedCount;
  }
  return queued;
}

const factOf = (row: any) => {
  const subject = accountData(row.address);
  const predicate = text(PREDICATE[row.kind as keyof typeof PREDICATE]);
  const object = text(campaignObject(String(row.campaign)));
  const ids = [calculateAtomId(subject), calculateAtomId(predicate), calculateAtomId(object)] as [Hex, Hex, Hex];
  return { atoms: [subject, predicate, object], ids, tripleId: calculateTripleId(...ids) as Hex };
};

export async function writeContributions() {
  const me = serverWalletAddress();
  if (!me) { logger.warn("graph contributions: the server wallet isn't set up, nothing written"); return { written: 0, failed: 0 }; }
  const rows = await graphContribution.find({ status: "pending" }).sort({ createdAt: 1 }).limit(PER_PASS).lean() as any[];
  if (!rows.length) return { written: 0, failed: 0 };
  const client = getPublicClient();
  const read = (functionName: any, args: any[] = []) => client.readContract({ address: MULTIVAULT, abi: ABI, functionName, args } as any) as Promise<any>;
  const facts = rows.map((r) => ({ row: r, ...factOf(r) }));

  try {
    const [atomCost, tripleCost, general] = await Promise.all([read("getAtomCost"), read("getTripleCost"), read("generalConfig")]);
    const minDeposit = general[4] as bigint;

    const atoms = [...new Set(facts.flatMap((f) => f.atoms))];
    const atomExists = await Promise.all(atoms.map((a) => read("isTermCreated", [calculateAtomId(a)])));
    const missing = atoms.filter((_, i) => !atomExists[i]);
    if (missing.length) await sendServerContractTx({ address: MULTIVAULT, abi: ABI, functionName: "createAtoms", args: [missing, missing.map(() => atomCost)], value: atomCost * BigInt(missing.length) });

    const unique = [...new Map(facts.map((f) => [f.tripleId, f])).values()];
    const exists = await Promise.all(unique.map((f) => read("isTermCreated", [f.tripleId])));
    const fresh = unique.filter((_, i) => !exists[i]);
    const old = unique.filter((_, i) => exists[i]);
    const held = await Promise.all(old.map((f) => read("getShares", [me, f.tripleId, 1n])));
    const toBack = old.filter((_, i) => (held[i] as bigint) === 0n);

    let txHash: string | null = null;
    if (fresh.length) {
      const each = tripleCost + minDeposit;
      txHash = await sendServerContractTx({ address: MULTIVAULT, abi: ABI, functionName: "createTriples", args: [fresh.map((f) => f.ids[0]), fresh.map((f) => f.ids[1]), fresh.map((f) => f.ids[2]), fresh.map(() => each)], value: each * BigInt(fresh.length) });
    }
    if (toBack.length) {
      txHash = await sendServerContractTx({ address: MULTIVAULT, abi: ABI, functionName: "depositBatch", args: [me, toBack.map((f) => f.tripleId), toBack.map(() => 1n), toBack.map(() => minDeposit), toBack.map(() => 0n)], value: minDeposit * BigInt(toBack.length) }) ?? txHash;
    }
    await graphContribution.bulkWrite(facts.map((f) => ({ updateOne: { filter: { _id: f.row._id }, update: { $set: { status: "written", tripleId: f.tripleId, txHash, writtenAt: new Date(), lastError: null } } } })));
    logger.info(`graph contributions: wrote ${facts.length} (${missing.length} new atoms, ${fresh.length} new triples, ${toBack.length} backed)`);
    return { written: facts.length, failed: 0 };
  } catch (err: any) {
    const msg = String(err?.shortMessage ?? err?.message ?? err).slice(0, 300);
    logger.error(`graph contributions: batch of ${rows.length} failed: ${msg}`);
    await graphContribution.updateMany({ _id: { $in: rows.map((r) => r._id) } }, { $inc: { attempts: 1 }, $set: { lastError: msg } });
    await graphContribution.updateMany({ _id: { $in: rows.map((r) => r._id) }, attempts: { $gte: MAX_ATTEMPTS } }, { $set: { status: "failed" } });
    return { written: 0, failed: rows.length };
  }
}

export async function runContributionPass() {
  const queued = await queueContributions();
  if (queued) logger.info(`graph contributions: queued ${queued} new`);
  return writeContributions();
}

export function startGraphContributionCron() {
  if (!GRAPH_ATTEST_ENABLED) {
    logger.warn("GRAPH_ATTEST_ENABLED isn't \"true\": Nexura contributions aren't written to the knowledge graph on this server");
    return;
  }
  const pass = () => runExclusively("graph-contributions", INTERVAL_MS, runContributionPass).catch((e) => logger.error(`graph contributions: ${e?.message}`));
  setTimeout(pass, 30_000);
  setInterval(pass, INTERVAL_MS);
  logger.info(`Graph contributions cron started (${INTERVAL_MS / 60000}m interval, ${PER_PASS} per pass)`);
}
