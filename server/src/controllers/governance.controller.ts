import { ethers } from "ethers";
import logger from "@/config/logger";
import { hub, hubAdmin } from "@/models/hub.model";
import { hubGovernance, governanceProposal } from "@/models/governance.model";
import { createHubInvite } from "@/utils/hubInvite";
import { BAD_REQUEST, CREATED, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "@/utils/status.utils";

/*
 * Admin Management governance, modelled on a Safe multisig.
 *
 * Roles
 *  - Owner (hub.superAdmin): always a signer; the only one who can change or revoke Super Admins.
 *  - Super Admin: becomes a signer only through an approved proposal (being a Super Admin doesn't
 *    make you a signer, so promotions never silently change the confirmation count).
 *  - Signers (Owner + Super Admins added as signers) make every proposal and vote on it.
 *  - Admin: no governance actions.
 *  - Ownership can move to an existing Super Admin through a proposal only the Owner can make
 *    (e.g. when the Owner's email or wallet is compromised); the signers confirm it.
 *
 * Every proposal, approval, rejection and execution carries an EIP-712 signature from the admin's
 * wallet. An admin's first signature links that wallet; afterwards only that wallet can sign for them.
 * A proposal executes on the server once approvals reach the approval threshold, and is rejected
 * once rejections reach the rejection threshold. Votes only count while the voter is a signer.
 */

// ─── Signing (must match the studio client) ──────────────────────────────────
const SIGN_DOMAIN = { name: "Nexura Studio", version: "1" };
const SIGN_TYPES = {
  StudioAction: [
    { name: "hub", type: "string" },
    { name: "action", type: "string" },
    { name: "proposal", type: "string" },
    { name: "proposalId", type: "string" },
    { name: "signer", type: "string" },
    { name: "signedAt", type: "string" },
  ],
};
const SIGNATURE_MAX_AGE_MS = 10 * 60 * 1000;
const KIND_TO_VERB = { propose: "Propose", approve: "Approve", reject: "Reject", execute: "Execute" } as const;
type SignatureKind = keyof typeof KIND_TO_VERB;

type Role = "owner" | "superadmin" | "admin";
type BackendRole = "superadmin" | "admin";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

// ─── Context: team, signers and thresholds for one hub ───────────────────────
async function loadContext(hubId: string) {
  const hubDoc = await hub.findById(hubId).select("superAdmin name").lean() as any;
  if (!hubDoc) throw new HttpError(NOT_FOUND, "hub not found");
  const admins = await hubAdmin.find({ hub: hubId }).select("_id name email role createdAt").lean() as any[];
  let gov = await hubGovernance.findOne({ hub: hubId });
  if (!gov) gov = await hubGovernance.create({ hub: hubId });

  const ownerId = hubDoc.superAdmin ? String(hubDoc.superAdmin) : null;
  const roleOf = (a: { _id: unknown; role?: string }): Role =>
    String(a._id) === ownerId ? "owner" : a.role === "superadmin" ? "superadmin" : "admin";
  const nominated = new Set((gov.signers ?? []).map(String));
  const signers = admins.filter(a => roleOf(a) === "owner" || (roleOf(a) === "superadmin" && nominated.has(String(a._id))));
  const signerIds = new Set(signers.map(a => String(a._id)));
  const n = Math.max(1, signers.length);
  const clamp = (v: number | null | undefined, min: number) => Math.min(n, Math.max(min, v ?? n));
  const thresholds = {
    approval: clamp(gov.approvalThreshold, Math.min(2, n)),
    rejection: clamp(gov.rejectionThreshold, 1),
  };
  const adminById = (id: string) => admins.find(a => String(a._id) === id);

  return { hubId, hubDoc, admins, gov, ownerId, roleOf, signers, signerIds, thresholds, adminById };
}
type Ctx = Awaited<ReturnType<typeof loadContext>>;

/** Resolves the calling admin (project hub admins only). */
async function requireMe(req: GlobalRequest, ctx: Ctx) {
  const me = ctx.adminById(String(req.id));
  if (!me) throw new HttpError(FORBIDDEN, "only admins of this hub can use Admin Management");
  return { id: String(me._id), name: String(me.name ?? ""), role: ctx.roleOf(me) };
}

function hubIdOf(req: GlobalRequest): string {
  const id = req.admin?.hub ? String(req.admin.hub) : "";
  if (!id) throw new HttpError(BAD_REQUEST, "create a hub to continue");
  return id;
}

// ─── Signature verification ──────────────────────────────────────────────────
type SignedBody = { signature?: unknown; message?: unknown };

async function verifySignature(ctx: Ctx, me: { id: string; name: string }, kind: SignatureKind, proposal: { ref: string; title: string }, body: SignedBody) {
  const { signature, message } = body;
  if (typeof signature !== "string" || !signature.startsWith("0x")) throw new HttpError(BAD_REQUEST, "a wallet signature is required");
  if (!message || typeof message !== "object") throw new HttpError(BAD_REQUEST, "the signed message is required");
  const m = message as Record<string, unknown>;
  for (const f of ["hub", "action", "proposal", "proposalId", "signer", "signedAt"]) {
    if (typeof m[f] !== "string") throw new HttpError(BAD_REQUEST, `signed message is missing ${f}`);
  }
  if (m.action !== KIND_TO_VERB[kind]) throw new HttpError(BAD_REQUEST, "the signature is for a different action");
  if (m.proposalId !== proposal.ref || m.proposal !== proposal.title) throw new HttpError(BAD_REQUEST, "the signature is for a different proposal");
  if (!String(m.signer).includes(`(${me.id})`)) throw new HttpError(BAD_REQUEST, "the signature names a different admin");
  const signedAt = new Date(String(m.signedAt));
  if (isNaN(signedAt.getTime()) || Math.abs(Date.now() - signedAt.getTime()) > SIGNATURE_MAX_AGE_MS) {
    throw new HttpError(BAD_REQUEST, "the signature has expired, sign again");
  }

  let address: string;
  try {
    address = ethers.verifyTypedData(SIGN_DOMAIN, SIGN_TYPES, m, signature);
  } catch {
    throw new HttpError(BAD_REQUEST, "the wallet signature is not valid");
  }

  const wallets = ctx.gov.signerWallets as unknown as Map<string, string>;
  const linked = wallets.get(me.id);
  if (linked) {
    if (linked.toLowerCase() !== address.toLowerCase()) {
      throw new HttpError(FORBIDDEN, `sign with the wallet linked to your account (${linked.slice(0, 6)}…${linked.slice(-4)})`);
    }
  } else {
    // First signature: link this wallet, unless another admin of the hub already uses it
    for (const [adminId, wallet] of wallets.entries()) {
      if (adminId !== me.id && wallet.toLowerCase() === address.toLowerCase()) {
        throw new HttpError(FORBIDDEN, "this wallet is already linked to another admin of this hub");
      }
    }
    wallets.set(me.id, address);
    ctx.gov.markModified("signerWallets");
    await ctx.gov.save();
  }

  return { admin: me.id, name: me.name, kind, address, signature, message: m, signedAt };
}

// ─── Proposal validation (who can propose what) ──────────────────────────────
function pendingSignerChangeFor(pending: any[], adminId: string) {
  return pending.some(p => (p.action?.kind === "signer" && p.action.adminId === adminId)
    || (p.action?.kind === "replaceSigner" && (p.action.oldId === adminId || p.action.newId === adminId)));
}

async function validateAction(ctx: Ctx, me: { id: string; role: Role }, raw: any, clientUrl: string) {
  if (!raw || typeof raw !== "object" || typeof raw.kind !== "string") throw new HttpError(BAD_REQUEST, "action is required");
  const pending = await governanceProposal.find({ hub: ctx.hubId, status: "pending" }).select("action").lean() as any[];
  const n = ctx.signers.length;
  const target = (id: unknown) => {
    const a = typeof id === "string" ? ctx.adminById(id) : undefined;
    if (!a) throw new HttpError(NOT_FOUND, "admin not found in your hub");
    return a;
  };

  switch (raw.kind) {
    case "thresholds": {
      const { approval, rejection } = raw;
      if (n < 2) throw new HttpError(BAD_REQUEST, "add a second signer before changing the required confirmations");
      if (!isInt(approval) || approval < Math.min(2, n) || approval > n) throw new HttpError(BAD_REQUEST, `approvals must be between ${Math.min(2, n)} and ${n}`);
      if (!isInt(rejection) || rejection < 1 || rejection > n) throw new HttpError(BAD_REQUEST, `rejections must be between 1 and ${n}`);
      if (pending.some(p => p.action?.kind === "thresholds")) throw new HttpError(BAD_REQUEST, "a change to the required confirmations is already pending");
      return { kind: "thresholds", approval, rejection, prevApproval: ctx.thresholds.approval, prevRejection: ctx.thresholds.rejection };
    }
    case "invite": {
      const email = String(raw.email ?? "").trim().toLowerCase();
      const role: BackendRole = raw.role === "superadmin" ? "superadmin" : "admin";
      if (!EMAIL_RE.test(email)) throw new HttpError(BAD_REQUEST, "enter a valid email address");
      if (role === "superadmin" && me.role !== "owner") throw new HttpError(FORBIDDEN, "only the Owner can invite Super Admins");
      if (await hubAdmin.exists({ email })) throw new HttpError(BAD_REQUEST, "email is already in use");
      if (pending.some(p => p.action?.kind === "invite" && p.action.email === email)) throw new HttpError(BAD_REQUEST, "an invitation for this email is already pending");
      return { kind: "invite", email, role, clientUrl };
    }
    case "member": {
      const t = target(raw.adminId);
      const tRole = ctx.roleOf(t);
      const toRole: BackendRole = raw.toRole === "superadmin" ? "superadmin" : "admin";
      if (String(t._id) === me.id) throw new HttpError(BAD_REQUEST, "you cannot change your own role");
      if (tRole === "owner") throw new HttpError(FORBIDDEN, "the Owner's role cannot be changed");
      if ((tRole === "superadmin" || toRole === "superadmin") && me.role !== "owner") throw new HttpError(FORBIDDEN, "only the Owner can manage Super Admins");
      if (t.role === toRole) throw new HttpError(BAD_REQUEST, "that admin already has this role");
      return { kind: "member", adminId: String(t._id), adminName: t.name, fromRole: t.role, toRole };
    }
    case "revoke": {
      const t = target(raw.adminId);
      const tRole = ctx.roleOf(t);
      if (String(t._id) === me.id) throw new HttpError(BAD_REQUEST, "you cannot revoke your own access");
      if (tRole === "owner") throw new HttpError(FORBIDDEN, "the Owner's access cannot be revoked");
      if (tRole === "superadmin" && me.role !== "owner") throw new HttpError(FORBIDDEN, "only the Owner can revoke a Super Admin");
      return { kind: "revoke", adminId: String(t._id), adminName: t.name };
    }
    case "signer": {
      const t = target(raw.adminId);
      const id = String(t._id);
      const add = raw.add === true;
      if (pendingSignerChangeFor(pending, id)) throw new HttpError(BAD_REQUEST, "a signer change for this admin is already pending");
      const next = add ? n + 1 : n - 1;
      if (add) {
        if (ctx.roleOf(t) !== "superadmin") throw new HttpError(BAD_REQUEST, "only Super Admins can be added as signers");
        if (ctx.signerIds.has(id)) throw new HttpError(BAD_REQUEST, "that admin is already a signer");
      } else {
        if (ctx.roleOf(t) === "owner") throw new HttpError(FORBIDDEN, "the Owner is always a signer");
        if (!ctx.signerIds.has(id)) throw new HttpError(BAD_REQUEST, "that admin is not a signer");
      }
      let threshold: number | undefined;
      if (raw.threshold !== undefined && raw.threshold !== null) {
        if (!isInt(raw.threshold) || raw.threshold < Math.min(2, next) || raw.threshold > next) {
          throw new HttpError(BAD_REQUEST, `required confirmations must be between ${Math.min(2, next)} and ${next}`);
        }
        threshold = raw.threshold;
      }
      return { kind: "signer", adminId: id, adminName: t.name, add, ...(threshold ? { threshold } : {}) };
    }
    case "replaceSigner": {
      const oldT = target(raw.oldId);
      const newT = target(raw.newId);
      const oldId = String(oldT._id), newId = String(newT._id);
      if (ctx.roleOf(oldT) === "owner") throw new HttpError(FORBIDDEN, "the Owner is always a signer");
      if (!ctx.signerIds.has(oldId)) throw new HttpError(BAD_REQUEST, "the admin being replaced is not a signer");
      if (ctx.roleOf(newT) !== "superadmin" || ctx.signerIds.has(newId)) throw new HttpError(BAD_REQUEST, "pick a Super Admin who isn't a signer yet");
      if (pendingSignerChangeFor(pending, oldId) || pendingSignerChangeFor(pending, newId)) throw new HttpError(BAD_REQUEST, "a signer change for one of these admins is already pending");
      return { kind: "replaceSigner", oldId, oldName: oldT.name, newId, newName: newT.name };
    }
    case "transferOwnership": {
      if (me.role !== "owner") throw new HttpError(FORBIDDEN, "only the Owner can transfer ownership");
      const t = target(raw.newOwnerId);
      const id = String(t._id);
      if (id === me.id) throw new HttpError(BAD_REQUEST, "you are already the Owner");
      if (ctx.roleOf(t) !== "superadmin") throw new HttpError(BAD_REQUEST, "ownership can only go to an existing Super Admin");
      if (pending.some(p => p.action?.kind === "transferOwnership")) throw new HttpError(BAD_REQUEST, "an ownership transfer is already pending");
      const prev = ctx.adminById(me.id);
      return { kind: "transferOwnership", newOwnerId: id, newOwnerName: t.name, prevOwnerId: me.id, prevOwnerName: prev?.name ?? "" };
    }
    default:
      throw new HttpError(BAD_REQUEST, "unknown action");
  }
}

// ─── Tally + execution ───────────────────────────────────────────────────────
function tally(ctx: Ctx, proposal: any) {
  const latest = new Map<string, "approve" | "reject">();
  for (const s of proposal.signatures ?? []) {
    const id = String(s.admin);
    if (!ctx.signerIds.has(id)) continue;
    if (s.kind === "approve" || (s.kind === "propose" && id === String(proposal.proposedBy.id))) latest.set(id, "approve");
    else if (s.kind === "reject") latest.set(id, "reject");
  }
  let approvals = 0, rejections = 0;
  for (const v of latest.values()) v === "approve" ? approvals++ : rejections++;
  return { approvals, rejections, votes: latest };
}

async function runAction(ctx: Ctx, action: any) {
  const gov = ctx.gov;
  const signerList = () => (gov.signers ?? []).map(String);
  const setSigners = (ids: string[]) => { (gov as any).signers = Array.from(new Set(ids)); };

  switch (action.kind) {
    case "thresholds":
      gov.approvalThreshold = action.approval;
      gov.rejectionThreshold = action.rejection;
      break;
    case "invite":
      await createHubInvite({ hubId: ctx.hubId, email: action.email, role: action.role, clientUrl: action.clientUrl });
      break;
    case "member": {
      const t = ctx.adminById(action.adminId);
      if (!t) throw new Error("that admin is no longer in the hub");
      if (ctx.roleOf(t) === "owner") throw new Error("the Owner's role cannot be changed");
      await hubAdmin.findByIdAndUpdate(action.adminId, { role: action.toRole });
      if (action.toRole === "admin") setSigners(signerList().filter(id => id !== action.adminId)); // Admins can't sign
      break;
    }
    case "revoke": {
      const t = ctx.adminById(action.adminId);
      if (!t) throw new Error("that admin is no longer in the hub");
      if (ctx.roleOf(t) === "owner") throw new Error("the Owner's access cannot be revoked");
      await hubAdmin.findByIdAndDelete(action.adminId);
      setSigners(signerList().filter(id => id !== action.adminId));
      (gov.signerWallets as unknown as Map<string, string>).delete(action.adminId);
      gov.markModified("signerWallets");
      break;
    }
    case "signer": {
      const t = ctx.adminById(action.adminId);
      if (!t) throw new Error("that admin is no longer in the hub");
      if (action.add) {
        if (ctx.roleOf(t) !== "superadmin") throw new Error("only Super Admins can be signers");
        setSigners([...signerList(), action.adminId]);
      } else {
        setSigners(signerList().filter(id => id !== action.adminId));
      }
      if (action.threshold) gov.approvalThreshold = action.threshold;
      break;
    }
    case "replaceSigner": {
      const t = ctx.adminById(action.newId);
      if (!t || ctx.roleOf(t) !== "superadmin") throw new Error("the replacement must be a Super Admin of this hub");
      setSigners([...signerList().filter(id => id !== action.oldId), action.newId]);
      break;
    }
    case "transferOwnership": {
      if (ctx.ownerId !== action.prevOwnerId) throw new Error("ownership has already changed since this was proposed");
      const t = ctx.adminById(action.newOwnerId);
      if (!t || ctx.roleOf(t) !== "superadmin") throw new Error("the new Owner must still be a Super Admin of this hub");
      await hub.findByIdAndUpdate(ctx.hubId, { superAdmin: action.newOwnerId });
      // The new Owner signs as Owner; the previous Owner stays a Super Admin and keeps signing,
      // so the confirmation count doesn't drop. The new Owner can propose removing them.
      setSigners([...signerList().filter(id => id !== action.newOwnerId), action.prevOwnerId]);
      break;
    }
    default:
      throw new Error("unknown action");
  }
  await gov.save();
}

/** Executes or rejects the proposal when a threshold is reached. Execution failures are kept so it can be retried. */
async function settle(ctx: Ctx, proposal: any) {
  if (proposal.status !== "pending") return;
  const { approvals, rejections } = tally(ctx, proposal);
  if (approvals >= ctx.thresholds.approval) {
    try {
      await runAction(ctx, proposal.action);
      proposal.status = "executed";
      proposal.resolvedAt = new Date();
      proposal.resolvedCount = approvals;
      proposal.executionError = null;
    } catch (err: any) {
      logger.error("governance execution failed:", err);
      proposal.executionError = err?.message || "the change could not be applied";
    }
  } else if (rejections >= ctx.thresholds.rejection) {
    proposal.status = "rejected";
    proposal.resolvedAt = new Date();
    proposal.resolvedCount = rejections;
  }
  await proposal.save();
}

// ─── Response shape (matches the studio client) ──────────────────────────────
function serializeProposal(ctx: Ctx, p: any) {
  const { votes } = tally(ctx, p);
  const allVotes: Record<string, "approve" | "reject"> = {};
  for (const s of p.signatures ?? []) {
    const id = String(s.admin);
    if (s.kind === "approve" || (s.kind === "propose" && ctx.signerIds.has(id))) allVotes[id] = "approve";
    else if (s.kind === "reject") allVotes[id] = "reject";
  }
  for (const [id, v] of votes) allVotes[id] = v;
  const signatures: Record<string, unknown> = {};
  for (const s of p.signatures ?? []) {
    const key = s.kind === "execute" ? `execute:${String(s.admin)}` : String(s.admin);
    if (s.kind === "propose" && signatures[key]) continue;
    signatures[key] = { address: s.address, signature: s.signature, message: JSON.stringify(s.message), signedAt: new Date(s.signedAt).toISOString() };
  }
  return {
    id: p.ref,
    title: p.title,
    change: p.change,
    action: p.action,
    proposedBy: { id: String(p.proposedBy.id), name: p.proposedBy.name },
    createdAt: new Date(p.createdAt).toISOString(),
    votes: allVotes,
    signatures,
    status: p.status,
    resolvedAt: p.resolvedAt ? new Date(p.resolvedAt).toISOString() : undefined,
    resolvedCount: p.resolvedCount ?? undefined,
    executionError: p.executionError ?? undefined,
  };
}

async function governanceState(ctx: Ctx, meId: string) {
  const proposals = await governanceProposal.find({ hub: ctx.hubId }).sort({ createdAt: -1 }).limit(200).lean();
  const wallets = ctx.gov.signerWallets as unknown as Map<string, string>;
  return {
    ownerId: ctx.ownerId,
    meId,
    signerIds: Array.from(ctx.signerIds),
    signerWallets: Object.fromEntries(wallets.entries()),
    thresholds: ctx.thresholds,
    proposals: proposals.map(p => serializeProposal(ctx, p)),
  };
}

function handleError(res: GlobalResponse, error: any, fallback: string) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  logger.error(error);
  res.status(INTERNAL_SERVER_ERROR).json({ error: fallback });
}

// ─── Handlers ────────────────────────────────────────────────────────────────
export const getGovernance = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const ctx = await loadContext(hubIdOf(req));
    const me = await requireMe(req, ctx);
    res.status(OK).json(await governanceState(ctx, me.id));
  } catch (error) {
    handleError(res, error, "error loading admin management");
  }
};

export const createGovernanceProposal = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const ctx = await loadContext(hubIdOf(req));
    const me = await requireMe(req, ctx);
    if (!ctx.signerIds.has(me.id)) throw new HttpError(FORBIDDEN, "only signers can make proposals; ask a signer to add you");

    const { ref, title, change, action, clientUrl } = req.body ?? {};
    if (typeof ref !== "string" || !/^[a-z0-9-]{6,64}$/i.test(ref)) throw new HttpError(BAD_REQUEST, "proposal id is invalid");
    if (typeof title !== "string" || !title.trim() || title.length > 200) throw new HttpError(BAD_REQUEST, "proposal title is required");
    if (await governanceProposal.exists({ hub: ctx.hubId, ref })) throw new HttpError(BAD_REQUEST, "this proposal already exists");

    const origin = typeof clientUrl === "string" && /^https?:\/\//.test(clientUrl) ? clientUrl : "";
    const normalized = await validateAction(ctx, me, action, origin);
    const sig = await verifySignature(ctx, me, "propose", { ref, title }, req.body);

    const proposal = await governanceProposal.create({
      hub: ctx.hubId,
      ref,
      title: title.trim(),
      change: typeof change === "string" ? change.slice(0, 500) : "",
      action: normalized,
      proposedBy: { id: me.id, name: me.name },
      signatures: [sig],
    });
    await settle(ctx, proposal);
    const fresh = await loadContext(ctx.hubId);
    res.status(CREATED).json(await governanceState(fresh, me.id));
  } catch (error) {
    handleError(res, error, "error creating proposal");
  }
};

export const voteOnGovernanceProposal = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const ctx = await loadContext(hubIdOf(req));
    const me = await requireMe(req, ctx);
    const vote = req.body?.vote;
    if (vote !== "approve" && vote !== "reject") throw new HttpError(BAD_REQUEST, "vote must be approve or reject");
    if (!ctx.signerIds.has(me.id)) throw new HttpError(FORBIDDEN, "only signers can approve or reject proposals");

    const proposal = await governanceProposal.findOne({ hub: ctx.hubId, ref: req.params.ref });
    if (!proposal) throw new HttpError(NOT_FOUND, "proposal not found");
    if (proposal.status !== "pending") throw new HttpError(BAD_REQUEST, "this proposal is already decided");
    if (String(proposal.proposedBy?.id) === me.id) throw new HttpError(BAD_REQUEST, "you proposed this, so your signature is already counted");
    if (proposal.signatures.some((s: any) => String(s.admin) === me.id && (s.kind === "approve" || s.kind === "reject"))) {
      throw new HttpError(BAD_REQUEST, "you have already voted on this proposal");
    }

    const sig = await verifySignature(ctx, me, vote, { ref: proposal.ref, title: proposal.title }, req.body);
    proposal.signatures.push(sig as any);
    await settle(ctx, proposal);
    const fresh = await loadContext(ctx.hubId);
    res.status(OK).json(await governanceState(fresh, me.id));
  } catch (error) {
    handleError(res, error, "error recording vote");
  }
};

export const executeGovernanceProposal = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const ctx = await loadContext(hubIdOf(req));
    const me = await requireMe(req, ctx);
    const proposal = await governanceProposal.findOne({ hub: ctx.hubId, ref: req.params.ref });
    if (!proposal) throw new HttpError(NOT_FOUND, "proposal not found");
    if (proposal.status !== "pending") throw new HttpError(BAD_REQUEST, "this proposal is already decided");
    if (!ctx.signerIds.has(me.id) && String(proposal.proposedBy?.id) !== me.id) {
      throw new HttpError(FORBIDDEN, "only signers or the proposer can execute a proposal");
    }
    const { approvals } = tally(ctx, proposal);
    if (approvals < ctx.thresholds.approval) {
      throw new HttpError(BAD_REQUEST, `needs ${ctx.thresholds.approval} confirmations, has ${approvals}`);
    }

    const sig = await verifySignature(ctx, me, "execute", { ref: proposal.ref, title: proposal.title }, req.body);
    proposal.signatures.push(sig as any);
    await settle(ctx, proposal);
    const fresh = await loadContext(ctx.hubId);
    res.status(OK).json(await governanceState(fresh, me.id));
  } catch (error) {
    handleError(res, error, "error executing proposal");
  }
};
