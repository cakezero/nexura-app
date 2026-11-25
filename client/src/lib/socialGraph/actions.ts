import { MultiVaultAbi } from "@0xintuition/protocol";
import { calculateCounterTripleId, calculateTripleId } from "@0xintuition/sdk";
import { createWalletClient, custom, getAddress, parseEther, type Address, type Hex } from "viem";
import { getPublicClient } from "@/lib/viem";
import { getChain } from "@/lib/chain";
import { getMultivaultAddress } from "@/lib/constants";
import { apiRequestV2 } from "@/lib/queryClient";
import { ATOM, CAMPAIGN_LABEL, CHECKED_LABEL, CLAIM_LABEL, INFO_FIELDS, SPONSORS_LABEL, TAG_LABEL, accountAtom, campaignObject, idOf, invitedLabel, textAtom, type InfoKey } from "./config";

const CURVE = 1n;

async function session() {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("Connect a wallet first");
  const [current] = await provider.request({ method: "eth_requestAccounts" });
  if (!current) throw new Error("Connect a wallet first");
  const walletClient = createWalletClient({ chain: getChain(), account: getAddress(current), transport: custom(provider) });
  await walletClient.switchChain({ id: getChain().id });
  const publicClient = getPublicClient();
  const address = getMultivaultAddress();
  const account = getAddress(walletClient.account!.address);
  const read = <T,>(functionName: string, args: unknown[] = []) =>
    publicClient.readContract({ address, abi: MultiVaultAbi, functionName, args } as any) as Promise<T>;
  const write = async (functionName: string, args: unknown[], value: bigint) => {
    const { request } = await publicClient.simulateContract({ address, abi: MultiVaultAbi, functionName, args, value, account } as any);
    const hash = await walletClient.writeContract(request as any);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("The transaction failed on-chain");
    return hash;
  };
  return { publicClient, walletClient, account, read, write };
}
type Session = Awaited<ReturnType<typeof session>>;

async function ensureAtoms(s: Session, datas: Hex[]) {
  const unique = [...new Set(datas)];
  const created = await Promise.all(unique.map((d) => s.read<boolean>("isTermCreated", [idOf(d)])));
  const missing = unique.filter((_, i) => !created[i]);
  if (missing.length) {
    const cost = await s.read<bigint>("getAtomCost");
    await s.write("createAtoms", [missing, missing.map(() => cost)], cost * BigInt(missing.length));
  }
  return datas.map(idOf);
}

type Claim = [Hex, Hex, Hex];

async function stakeAmount(s: Session, stake?: bigint) {
  const { minDeposit } = await s.read<{ minDeposit: bigint }>("getGeneralConfig");
  return stake && stake > minDeposit ? stake : minDeposit;
}

async function stakeOn(s: Session, claims: Claim[], stake?: bigint) {
  const [cost, amount] = await Promise.all([s.read<bigint>("getTripleCost"), stakeAmount(s, stake)]);
  const ids = claims.map(([a, b, c]) => calculateTripleId(a, b, c) as Hex);
  const exists = await Promise.all(ids.map((id) => s.read<boolean>("isTermCreated", [id])));
  const fresh = claims.filter((_, i) => !exists[i]);
  const old = ids.filter((_, i) => exists[i]);
  if (fresh.length) {
    const each = cost + amount;
    await s.write("createTriples", [fresh.map((c) => c[0]), fresh.map((c) => c[1]), fresh.map((c) => c[2]), fresh.map(() => each)], each * BigInt(fresh.length));
  }
  if (old.length) {
    await s.write("depositBatch", [s.account, old, old.map(() => CURVE), old.map(() => amount), old.map(() => 0n)], amount * BigInt(old.length));
  }
  return ids;
}

const toWei = (trust?: string) => {
  const n = Number(trust);
  return Number.isFinite(n) && n > 0 ? parseEther(String(n) as `${number}`) : undefined;
};

export type ProjectInput = { name: string; website: string; description?: string; image?: string; info: Partial<Record<InfoKey, string[]>> };

const infoClaims = (projectId: Hex, info: ProjectInput["info"]) => {
  const datas: Hex[] = [];
  const claims: [Hex, Hex][] = [];
  for (const f of INFO_FIELDS) {
    for (const raw of info[f.key] ?? []) {
      const v = raw.trim();
      if (!v) continue;
      datas.push(textAtom(f.predicate), textAtom(v));
      claims.push([textAtom(f.predicate), textAtom(v)]);
    }
  }
  return { datas, claims: claims.map(([p, o]) => [projectId, idOf(p), idOf(o)] as Claim) };
};

export async function listProject(input: ProjectInput, opts: { check?: boolean } = {}) {
  const { uri } = await apiRequestV2("POST", "/api/graph/pin", { name: input.name, url: input.website, description: input.description, image: input.image });
  if (typeof uri !== "string" || !uri.startsWith("ipfs://")) throw new Error("Couldn't save the project details. Try again.");
  const s = await session();
  const projectData = textAtom(uri);
  const projectId = idOf(projectData);
  const { datas, claims } = infoClaims(projectId, input.info);
  const check: Claim[] = opts.check ? [[ATOM.I, idOf(textAtom(CHECKED_LABEL)), projectId]] : [];
  await ensureAtoms(s, [projectData, textAtom(TAG_LABEL), ...datas, ...(opts.check ? [textAtom(CHECKED_LABEL)] : [])]);
  await stakeOn(s, [[projectId, ATOM.hasTag, idOf(textAtom(TAG_LABEL))], ...claims, ...check]);
  return projectId;
}

export async function addProjectInfo(projectId: Hex, info: ProjectInput["info"]) {
  const s = await session();
  const { datas, claims } = infoClaims(projectId, info);
  if (!claims.length) return;
  await ensureAtoms(s, datas);
  await stakeOn(s, claims);
}

export async function backClaim(tripleId: Hex, trust?: string) {
  const s = await session();
  await s.write("deposit", [s.account, tripleId, CURVE, 0n], await stakeAmount(s, toWei(trust)));
}

export async function recommendProject(projectId: Hex, trust?: string) {
  const s = await session();
  await stakeOn(s, [[ATOM.I, ATOM.recommends, projectId]], toWei(trust));
}

export async function trustPerson(person: string, trust?: string) {
  const s = await session();
  if (getAddress(person) === s.account) throw new Error("You can't add yourself");
  const [me, them] = await ensureAtoms(s, [accountAtom(s.account), accountAtom(person)]);
  await stakeOn(s, [[me, ATOM.trusts, them]], toWei(trust));
}

export async function makeClaim(subject: { project?: Hex; person?: string }, text: string, trust?: string) {
  const claim = text.trim().replace(/\s+/g, " ");
  if (claim.length < 2 || claim.length > 80) throw new Error("Write an opinion between 2 and 80 characters");
  const s = await session();
  const subjectData = subject.person ? accountAtom(subject.person) : null;
  if (!subjectData && !subject.project) throw new Error("Nothing to make a claim about");
  const ids = await ensureAtoms(s, [...(subjectData ? [subjectData] : []), textAtom(CLAIM_LABEL), textAtom(claim)]);
  const subjectId = subjectData ? ids[0]! : subject.project!;
  const [pred, obj] = ids.slice(subjectData ? 1 : 0);
  const [id] = await stakeOn(s, [[subjectId, pred!, obj!]], toWei(trust));
  return id!;
}

export async function stakeClaim(tripleId: Hex, side: "for" | "against", trust?: string) {
  const s = await session();
  const term = side === "for" ? tripleId : (calculateCounterTripleId(tripleId) as Hex);
  await s.write("deposit", [s.account, term, CURVE, 0n], await stakeAmount(s, toWei(trust)));
}

export const counterOf = (tripleId: Hex) => calculateCounterTripleId(tripleId) as Hex;

export async function withdraw(tripleId: Hex) {
  const s = await session();
  const shares = await s.read<bigint>("getShares", [s.account, tripleId, CURVE]);
  if (shares === 0n) return;
  const { request } = await s.publicClient.simulateContract({ address: getMultivaultAddress(), abi: MultiVaultAbi, functionName: "redeem", args: [s.account, tripleId, CURVE, shares, 0n], account: s.account } as any);
  const hash = await s.walletClient.writeContract(request as any);
  await s.publicClient.waitForTransactionReceipt({ hash });
}

export async function sponsorUser(user: string, capTrust: string) {
  const cap = toWei(capTrust);
  if (!cap) throw new Error("Enter how much TRUST to cover");
  const s = await session();
  const to = getAddress(user);
  if (to === s.account) throw new Error("You can't sponsor yourself");
  const [me, them, pred] = await ensureAtoms(s, [accountAtom(s.account), accountAtom(to), textAtom(SPONSORS_LABEL)]);
  await stakeOn(s, [[me, pred, them]]);
  const hash = await s.walletClient.sendTransaction({ account: s.account, to, value: cap, chain: getChain() } as any);
  await s.publicClient.waitForTransactionReceipt({ hash });
}

export async function inviteToCampaign(campaignId: string, invitee: string, amountTrust: string, limits: { min: string; max: string }) {
  const value = toWei(amountTrust);
  if (!value || value < parseEther(limits.min as `${number}`) || value > parseEther(limits.max as `${number}`)) throw new Error(`Pay between ${limits.min} and ${limits.max} TRUST`);
  const s = await session();
  const to = getAddress(invitee);
  if (to === s.account) throw new Error("You can't invite yourself");
  const check: any = await apiRequestV2("GET", `/api/graph/invites/check?campaign=${campaignId}&inviter=${s.account}&invitee=${to}`);
  if (!check?.ok) throw new Error(check?.reason ?? "This person can't be invited");
  const hash = await s.walletClient.sendTransaction({ account: s.account, to, value, chain: getChain() } as any);
  const receipt = await s.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("The payment failed on-chain");
  await apiRequestV2("POST", "/api/graph/invites/pay", { campaign: campaignId, invitee: to, txHash: hash });
  const [me, them, pred] = await ensureAtoms(s, [accountAtom(s.account), accountAtom(to), textAtom(invitedLabel(campaignId))]);
  await stakeOn(s, [[me, pred, them]]);
  return hash;
}

export async function checkProject(projectId: Hex) {
  const s = await session();
  const [pred] = await ensureAtoms(s, [textAtom(CHECKED_LABEL)]);
  await stakeOn(s, [[ATOM.I, pred, projectId]]);
}

export async function linkCampaign(projectId: Hex, campaignId: string) {
  const s = await session();
  const [pred, obj] = await ensureAtoms(s, [textAtom(CAMPAIGN_LABEL), textAtom(campaignObject(campaignId))]);
  await stakeOn(s, [[projectId, pred, obj]]);
}

export const isUserRejection = (e: any) => /user rejected|denied|rejected the request/i.test(String(e?.shortMessage ?? e?.message ?? e));
export type { Address };
