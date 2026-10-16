/**
 * Studio governance rules for Admin Management, enforced in the frontend.
 *
 * Roles
 *  - Admin:       validates tasks manually. Cannot create, publish, edit, disable, close or fund
 *                 campaigns, and cannot make payments.
 *  - Super Admin: creates, edits, publishes, funds and manages campaigns, makes payments and edits
 *                 the project profile. Manages Admins, not Super Admins.
 *  - Owner:       everything a Super Admin can do, plus managing / removing Super Admins and
 *                 assigning signers. The Owner is the admin who created the hub (hub.superAdmin).
 *
 * Signers
 *  - Works like a Safe multisig. The Owner is always a signer. Being a Super Admin does not make
 *    someone a signer: any Super Admin or the Owner can propose adding, removing or replacing a
 *    signer (optionally with a new confirmation count), and the current signers confirm it.
 *  - Admins can never be signers.
 *
 * Proposals
 *  - Team changes and sensitive actions are proposals. Signers vote. A proposal is Approved once approvals reach the approval threshold, Rejected once
 *    rejections reach the rejection threshold, otherwise it stays Pending.
 *  - Payments never need approval.
 *  - Thresholds default to every signer and can only be changed through a proposal.
 *
 * Storage: the server (/hub/governance) holds proposals, signatures, signers and thresholds,
 * verifies every wallet signature and applies approved changes.
 */

import { ApiError, projectApiRequest } from "./projectApi";
import { BACKEND_URL } from "./constants";

export type BackendRole = "superadmin" | "admin";
export type StudioRole = "owner" | "superadmin" | "admin";

export type TeamMember = {
  _id: string;
  name: string;
  email?: string;
  role: BackendRole;
  createdAt?: string;
};

export const ROLE_LABEL: Record<StudioRole, string> = {
  owner: "Owner",
  superadmin: "Super Admin",
  admin: "Admin",
};

export const ROLE_SUMMARY: Record<StudioRole, string> = {
  owner: "Full control, including managing and removing Super Admins.",
  superadmin: "Creates, edits, publishes, funds and manages campaigns, makes payments and edits the project profile.",
  admin: "Validates tasks manually. Cannot create, publish, edit, disable, close or fund campaigns, and cannot make payments.",
};

// ─── Permissions matrix (Roles & permissions tab) ───────────────────────────
export type Permission =
  | "validateTasks" | "createCampaigns" | "editCampaigns" | "publishCampaigns" | "proposeCloseDisable"
  | "fundCampaigns" | "makePayments"
  | "editProfile"
  | "proposeChanges" | "voteProposals"
  | "manageAdmins" | "manageSuperAdmins";

export const PERMISSION_GROUPS: { title: string; items: { id: Permission; label: string }[] }[] = [
  {
    title: "Campaigns",
    items: [
      { id: "validateTasks", label: "Validate tasks manually" },
      { id: "createCampaigns", label: "Create campaigns" },
      { id: "editCampaigns", label: "Edit campaigns" },
      { id: "publishCampaigns", label: "Publish campaigns" },
      { id: "proposeCloseDisable", label: "Propose closing or disabling a campaign" },
    ],
  },
  {
    title: "Money",
    items: [
      { id: "fundCampaigns", label: "Fund campaigns" },
      { id: "makePayments", label: "Make payments and withdraw unclaimed rewards" },
    ],
  },
  { title: "Project", items: [{ id: "editProfile", label: "Edit the project profile" }] },
  {
    title: "Governance",
    items: [
      { id: "proposeChanges", label: "Propose changes" },
      { id: "voteProposals", label: "Approve or reject proposals" },
    ],
  },
  {
    title: "Team",
    items: [
      { id: "manageAdmins", label: "Add and manage Admins" },
      { id: "manageSuperAdmins", label: "Manage and remove Super Admins" },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.id));

const ROLE_PERMISSIONS: Record<StudioRole, Set<Permission>> = {
  owner: new Set(ALL_PERMISSIONS),
  superadmin: new Set(ALL_PERMISSIONS.filter(p => p !== "manageSuperAdmins")),
  admin: new Set<Permission>(["validateTasks"]),
};

export const PERMISSION_COUNT = ALL_PERMISSIONS.length;

export function can(role: StudioRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionCount(role: StudioRole): number {
  return ROLE_PERMISSIONS[role].size;
}

/** Owner = the admin who created the hub; everyone else keeps their backend role. */
export function studioRole(member: Pick<TeamMember, "_id" | "role">, ownerId: string | null): StudioRole {
  if (ownerId && member._id === ownerId) return "owner";
  return member.role === "superadmin" ? "superadmin" : "admin";
}

/** Can `actor` open Manage for `target`? Owner manages everyone else; Super Admin manages Admins only. */
export function canManageMember(actor: StudioRole, target: StudioRole): boolean {
  if (target === "owner") return false;
  if (target === "superadmin") return can(actor, "manageSuperAdmins");
  return can(actor, "manageAdmins");
}

/** Roles `actor` may invite or assign. */
export function assignableRoles(actor: StudioRole): BackendRole[] {
  if (can(actor, "manageSuperAdmins")) return ["admin", "superadmin"];
  if (can(actor, "manageAdmins")) return ["admin"];
  return [];
}

// ─── Proposals ───────────────────────────────────────────────────────────────
export type Vote = "approve" | "reject";
export type ProposalStatus = "pending" | "executed" | "rejected";

export type ProposalAction =
  | { kind: "thresholds"; approval: number; rejection: number; prevApproval: number; prevRejection: number }
  | { kind: "invite"; email: string; role: BackendRole }
  | { kind: "member"; adminId: string; adminName: string; fromRole: BackendRole; toRole: BackendRole }
  | { kind: "signer"; adminId: string; adminName: string; add: boolean; threshold?: number }
  | { kind: "replaceSigner"; oldId: string; oldName: string; newId: string; newName: string }
  | { kind: "revoke"; adminId: string; adminName: string }
  | { kind: "transferOwnership"; newOwnerId: string; newOwnerName?: string; prevOwnerId?: string; prevOwnerName?: string }
  /** Ends a live campaign `noticeDays` (7) after the proposal is approved; it never ends immediately. */
  | { kind: "endCampaign"; campaignId: string; campaignTitle?: string; noticeDays?: number }
  /** Changes to a published campaign; applied only once the signers approve. `changes` holds the builder's save fields. */
  | { kind: "editCampaign"; campaignId: string; campaignTitle?: string; changes: Record<string, unknown> };

/** Wallet signature proving a signer proposed / voted (Safe-style). */
export type ProposalSignature = { address: string; signature: string; message: string; signedAt: string };

export type Proposal = {
  id: string;
  title: string;
  change: string;
  action: ProposalAction;
  proposedBy: { id: string; name: string };
  createdAt: string;
  votes: Record<string, Vote>;
  status: ProposalStatus;
  resolvedAt?: string;
  resolvedCount?: number;
  /** Wallet signatures by admin id, for the proposal itself (proposer) and every vote. */
  signatures?: Record<string, ProposalSignature>;
  /** Set when a proposal reached its approvals but applying it failed; it can be executed again. */
  executionError?: string;
};


// ─── Server state (GET /hub/governance) ──────────────────────────────────────
/** Governance as the server reports it. The server decides signers, thresholds and outcomes. */
export type GovernanceSnapshot = {
  ownerId: string | null;
  meId: string;
  signerIds: string[];
  /** adminId -> linked wallet */
  signerWallets: Record<string, string>;
  thresholds: { approval: number; rejection: number };
  proposals: Proposal[];
};

export const EMPTY_SNAPSHOT: GovernanceSnapshot = {
  ownerId: null, meId: "", signerIds: [], signerWallets: {}, thresholds: { approval: 1, rejection: 1 }, proposals: [],
};

/** The EIP-712 payload a wallet signs, sent alongside every governance request. */
export type SignedPayload = { signature: string; message: Record<string, string> };

export const fetchGovernance = () =>
  projectApiRequest<GovernanceSnapshot>({ method: "GET", endpoint: "/hub/governance" });

export const submitProposal = (body: { ref: string; title: string; change: string; action: ProposalAction; clientUrl: string } & SignedPayload) =>
  projectApiRequest<GovernanceSnapshot>({ method: "POST", endpoint: "/hub/governance/proposals", data: body });

export const submitVote = (ref: string, body: { vote: Vote } & SignedPayload) =>
  projectApiRequest<GovernanceSnapshot>({ method: "POST", endpoint: `/hub/governance/proposals/${encodeURIComponent(ref)}/vote`, data: body });

export const submitExecution = (ref: string, body: SignedPayload) =>
  projectApiRequest<GovernanceSnapshot>({ method: "POST", endpoint: `/hub/governance/proposals/${encodeURIComponent(ref)}/execute`, data: body });

/**
 * True when the connected API doesn't have the governance endpoints yet (an older deployment):
 * the route is missing (404/405) or the request can't be made at all.
 */
export function isGovernanceUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 404 || err.status === 405;
  return err instanceof TypeError && /failed to fetch|load failed|networkerror/i.test(err.message);
}

/** Host of the API the studio is talking to, for messages. */
export const apiHost = (() => { try { return new URL(String(BACKEND_URL)).host; } catch { return String(BACKEND_URL ?? "the API"); } })();

/** Fired on window after any governance change, so the notification bell refreshes. */
export const GOVERNANCE_EVENT = "nexura-governance-update";
export const notifyGovernanceChanged = () => {
  try { window.dispatchEvent(new Event(GOVERNANCE_EVENT)); } catch {}
};

/** Pending proposals waiting for this signer's approval or rejection. */
export function awaitingMyVote(snap: GovernanceSnapshot): Proposal[] {
  if (!snap.signerIds.includes(snap.meId)) return [];
  return snap.proposals.filter(p => p.status === "pending" && !p.votes[snap.meId] && p.proposedBy.id !== snap.meId);
}

/**
 * Smallest approval threshold allowed: 2 whenever the team has 2+ signers, so one Owner or
 * Super Admin can never execute a proposal alone. A team with a single signer needs 1.
 */
export function minApprovalThreshold(signerCount: number): number {
  return Math.min(2, Math.max(1, signerCount));
}

export function tally(p: Proposal, signerIds: Set<string>) {
  let approvals = 0, rejections = 0;
  for (const [id, v] of Object.entries(p.votes)) {
    if (!signerIds.has(id)) continue; // votes from members who lost signer status don't count
    if (v === "approve") approvals++; else rejections++;
  }
  return { approvals, rejections };
}

export function newProposalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const mon = d.toLocaleString("en-US", { month: "short" });
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${mon} ${d.getDate()} · ${d.getFullYear()}, ${time}`;
}
