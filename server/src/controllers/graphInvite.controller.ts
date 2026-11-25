import { formatEther, getAddress, isAddress, isHash, parseEther } from "viem";
import logger from "@/config/logger";
import { campaign, campaignCompleted } from "@/models/campaign.model";
import { graphInvite } from "@/models/graphInvite.model";
import { user } from "@/models/user.model";
import { getPublicClient } from "@/utils/account";
import { BAD_REQUEST, CONFLICT, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "@/utils/status.utils";

const trustSetting = (name: string, fallback: string) => {
  const raw = process.env[name]?.trim();
  try {
    if (raw && Number(raw) > 0) return parseEther(raw as `${number}`);
  } catch {}
  if (raw) logger.warn(`${name} isn't a positive TRUST amount; using ${fallback}`);
  return parseEther(fallback as `${number}`);
};

export const INVITE_MIN = trustSetting("INVITE_MIN_TRUST", "0.5");
export const INVITE_MAX = (() => { const max = trustSetting("INVITE_MAX_TRUST", "10"); return max < INVITE_MIN ? INVITE_MIN : max; })();
export const AMBASSADOR_POOL_PCT = 5;
const NEWCOMER_MS = 24 * 60 * 60 * 1000;
export const inviteSettings = () => ({ min: formatEther(INVITE_MIN), max: formatEther(INVITE_MAX), poolSharePct: AMBASSADOR_POOL_PCT });

const NOT_NEW = "Already on Nexura. Invites only count for people new to Nexura.";
export async function isNewcomer(address: string, nowMs = Date.now()) {
  const u = await user.findOne({ address }).select("_id createdAt").lean() as any;
  if (!u) return true;
  const created = new Date(u.createdAt ?? 0).getTime();
  return nowMs - created < NEWCOMER_MS && !(await campaignCompleted.exists({ user: u._id }));
}

const lower = (a: unknown) => (typeof a === "string" && isAddress(a) ? getAddress(a).toLowerCase() : "");
const idOk = (v: unknown) => typeof v === "string" && /^[0-9a-f]{24}$/i.test(v);

async function me(req: GlobalRequest) {
  const u = await user.findById(req.id).select("address").lean() as any;
  return lower(u?.address);
}

async function openCampaign(id: string) {
  const c = await campaign.findById(id).select("status").lean() as any;
  return c && c.status !== "Save" && c.status !== "Deleted" && c.status !== "Ended" ? c : null;
}

export const acceptInvite = async (req: GlobalRequest, res: GlobalResponse) => {
  const { campaign: cid, inviter: rawInviter } = req.body ?? {};
  const inviter = lower(rawInviter);
  if (!idOk(cid) || !inviter) { res.status(BAD_REQUEST).json({ error: "This invite link is broken" }); return; }
  try {
    const invitee = await me(req);
    if (!invitee) { res.status(BAD_REQUEST).json({ error: "Connect your wallet first" }); return; }
    if (invitee === inviter) { res.status(BAD_REQUEST).json({ error: "You can't accept your own invite" }); return; }
    if (!(await openCampaign(cid))) { res.status(NOT_FOUND).json({ error: "This opportunity is closed" }); return; }
    const existing = await graphInvite.findOne({ campaign: cid, invitee }).lean() as any;
    if (existing) {
      res.status(OK).json({ invite: existing, alreadyInvited: existing.inviter !== inviter });
      return;
    }
    if (!(await isNewcomer(invitee))) { res.status(BAD_REQUEST).json({ error: NOT_NEW, notNew: true }); return; }
    const invite = await graphInvite.create({ campaign: cid, inviter, invitee });
    res.status(OK).json({ invite });
  } catch (error: any) {
    if (error?.code === 11000) { res.status(CONFLICT).json({ error: "You already have an invite for this opportunity" }); return; }
    logger.error(`acceptInvite: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't accept the invite. Try again." });
  }
};

export const payInvite = async (req: GlobalRequest, res: GlobalResponse) => {
  const { campaign: cid, invitee: rawInvitee, txHash } = req.body ?? {};
  const invitee = lower(rawInvitee);
  if (!idOk(cid) || !invitee || typeof txHash !== "string" || !isHash(txHash)) { res.status(BAD_REQUEST).json({ error: "Missing the opportunity, the person or the payment" }); return; }
  try {
    const inviter = await me(req);
    if (!inviter) { res.status(BAD_REQUEST).json({ error: "Connect your wallet first" }); return; }
    if (inviter === invitee) { res.status(BAD_REQUEST).json({ error: "You can't invite yourself" }); return; }
    if (!(await openCampaign(cid))) { res.status(NOT_FOUND).json({ error: "This opportunity is closed" }); return; }
    const taken = await graphInvite.findOne({ campaign: cid, invitee }).lean() as any;
    if (taken && taken.inviter !== inviter) { res.status(CONFLICT).json({ error: "Someone else already invited this person" }); return; }
    if (taken?.status === "paid") { res.status(OK).json({ invite: taken }); return; }
    if (!taken && !(await isNewcomer(invitee))) { res.status(BAD_REQUEST).json({ error: NOT_NEW, notNew: true }); return; }
    if (await graphInvite.exists({ txHash: txHash.toLowerCase() })) { res.status(CONFLICT).json({ error: "This payment was already used for an invite" }); return; }

    const client = getPublicClient();
    const [tx, receipt] = await Promise.all([client.getTransaction({ hash: txHash as `0x${string}` }), client.getTransactionReceipt({ hash: txHash as `0x${string}` })]);
    if (receipt.status !== "success") { res.status(BAD_REQUEST).json({ error: "That payment failed on-chain" }); return; }
    if (lower(tx.from) !== inviter || lower(tx.to ?? "") !== invitee) { res.status(FORBIDDEN).json({ error: "That payment isn't from you to this person" }); return; }
    if (tx.value < INVITE_MIN || tx.value > INVITE_MAX) { res.status(BAD_REQUEST).json({ error: `Invites cost between ${formatEther(INVITE_MIN)} and ${formatEther(INVITE_MAX)} TRUST` }); return; }

    const invite = await graphInvite.findOneAndUpdate(
      { campaign: cid, invitee, inviter },
      { $set: { status: "paid", amount: formatEther(tx.value), txHash: txHash.toLowerCase(), paidAt: new Date() }, $setOnInsert: { campaign: cid, invitee, inviter } },
      { upsert: true, new: true },
    ).lean();
    res.status(OK).json({ invite });
  } catch (error: any) {
    if (error?.code === 11000) { res.status(CONFLICT).json({ error: "Someone else already invited this person" }); return; }
    if (/not be found|TransactionNotFound|TransactionReceiptNotFound/i.test(String(error?.name ?? error?.message))) { res.status(BAD_REQUEST).json({ error: "That payment isn't on-chain yet. Try again in a few seconds." }); return; }
    logger.error(`payInvite: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't record the invite. Try again." });
  }
};

export const listInvites = async (req: GlobalRequest, res: GlobalResponse) => {
  const address = lower(req.query.address);
  const cid = req.query.campaign;
  if (!address && !idOk(cid)) { res.status(BAD_REQUEST).json({ error: "Send a wallet address or an opportunity" }); return; }
  try {
    const where: Record<string, unknown> = {};
    if (address) where.$or = [{ inviter: address }, { invitee: address }];
    if (idOk(cid)) where.campaign = cid;
    const invites = await graphInvite.find(where).sort({ createdAt: -1 }).limit(500).select("campaign inviter invitee status amount txHash paidAt createdAt").lean();
    res.status(OK).json({ invites, settings: inviteSettings() });
  } catch (error: any) {
    logger.error(`listInvites: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't load invites" });
  }
};

export const checkInvite = async (req: GlobalRequest, res: GlobalResponse) => {
  const cid = req.query.campaign;
  const invitee = lower(req.query.invitee);
  const inviter = lower(req.query.inviter);
  if (!idOk(cid) || !invitee || !inviter) { res.status(BAD_REQUEST).json({ error: "Send the opportunity, the inviter and the person" }); return; }
  try {
    const no = (reason: string) => res.status(OK).json({ ok: false, reason });
    if (invitee === inviter) return void no("You can't invite yourself");
    if (!(await openCampaign(cid as string))) return void no("This opportunity is closed");
    const taken = await graphInvite.findOne({ campaign: cid, invitee }).lean() as any;
    if (taken && taken.inviter !== inviter) return void no("Someone else already invited this person");
    if (taken?.status === "paid") return void no("You already invited this person");
    if (!taken && !(await isNewcomer(invitee))) return void no(NOT_NEW);
    res.status(OK).json({ ok: true });
  } catch (error: any) {
    logger.error(`checkInvite: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't check this invite" });
  }
};

export const ambassadorEarnings = async (req: GlobalRequest, res: GlobalResponse) => {
  const address = lower(req.query.address);
  if (!address) { res.status(BAD_REQUEST).json({ error: "Send a wallet address" }); return; }
  try {
    const mine = await graphInvite.find({ inviter: address, status: "paid" }).select("campaign").lean() as any[];
    const ids = [...new Set(mine.map((i) => String(i.campaign)))];
    const [campaigns, paid] = await Promise.all([
      campaign.find({ _id: { $in: ids } }).select("title rewardsConfig rewardAsset status").lean() as Promise<any[]>,
      graphInvite.find({ campaign: { $in: ids }, status: "paid" }).select("campaign inviter invitee").lean() as Promise<any[]>,
    ]);
    const users = await user.find({ address: { $in: [...new Set(paid.map((i) => i.invitee))] } }).select("_id address").lean() as any[];
    const joins = await campaignCompleted.find({ campaign: { $in: ids }, user: { $in: users.map((u) => u._id) } }).select("campaign user").lean() as any[];
    const addrOf = new Map(users.map((u) => [String(u._id), String(u.address).toLowerCase()]));
    const joined = new Set(joins.map((j) => `${j.campaign}:${addrOf.get(String(j.user))}`));
    const rows = campaigns.map((c) => {
      const valid = paid.filter((i) => String(i.campaign) === String(c._id) && joined.has(`${c._id}:${i.invitee}`));
      const yours = valid.filter((i) => i.inviter === address).length;
      const pool = (Number(c.rewardsConfig?.budget) || 0) * AMBASSADOR_POOL_PCT / 100;
      return { campaign: String(c._id), title: c.title, token: c.rewardsConfig?.token ?? c.rewardAsset?.token ?? "TRUST", pool, invitesJoined: valid.length, yours, share: valid.length ? (pool * yours) / valid.length : 0, ended: c.status === "Ended" };
    });
    res.status(OK).json({ poolPct: AMBASSADOR_POOL_PCT, campaigns: rows });
  } catch (error: any) {
    logger.error(`ambassadorEarnings: ${error?.message}`);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Couldn't load ambassador rewards" });
  }
};
