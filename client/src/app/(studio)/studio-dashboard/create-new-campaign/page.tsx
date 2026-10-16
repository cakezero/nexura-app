"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { formatEther, parseEther } from "viem";
import StudioLayout from "@/components/studio/StudioLayout";
import CreateNewCampaigns, { type CampaignPayment, type PublishedCampaign } from "@/components/admin/CreateNewCampaign";
import { useStudioWallet } from "@/components/studio/useStudioWallet";
import { projectApiRequest } from "@/lib/projectApi";
import { createRewardsContract, payStudioHubFee } from "@/lib/performOnchainAction";
import { getNetwork } from "@/lib/runtimeNetwork";
import { useToast } from "@/hooks/use-toast";

type RewardsDeployment = {
  txHash: string;
  contractAddress: string;
  authorizedAddress: string;
  fundedAmount: string;
  rewardPerParticipant: string;
  maxClaimableParticipants: number;
};

type HubMe = { hub?: { pendingTxHash?: string | null; guildId?: string } };

/**
 * On-chain payments (launch fee + funding the rewards contract).
 * Off for now so campaigns can be tested without wallet payments: the reward step is marked
 * paid locally, campaigns publish without a funded reward pool, and the launch-fee check is
 * satisfied with a placeholder reference (the server checks that a reference exists, not the chain).
 * Turn this back on before launch.
 */
const PAYMENTS_ENABLED = false;

// New task catalog id → backend campaign-quest tag / category / default link
const TASK_TAG: Record<string, string> = {
  "follow-x": "follow-x",
  "comment-x": "comment-x",
  "retweet-x": "repost-x",
  "like-x": "like",
  "join-discord": "join-discord",
  "discord-msg": "send-message-discord",
  "portal-claims": "i-trust",
  "portal-collab": "i-collaborated",
  "portal-interacted": "i-interact",
  "portal-follow": "i-follow",
  "portal-support": "portal",
  "trust-username": "trust-name",
  "give-feedback": "feedback",
};
const DEFAULT_LINK: Record<string, string> = {
  "i-trust": "https://atlas.box",
  "i-collaborated": "https://atlas.box",
  "i-interact": "https://atlas.box",
  "i-follow": "https://atlas.box",
  "trust-name": "https://tns.intuition.box",
};

function toQuest(task: PublishedCampaign["stages"][number]["tasks"][number], guildId: string, stageKey: string, order: number) {
  const tag = TASK_TAG[task.taskTypeId] ?? "other";
  const isDiscord = tag === "join-discord" || tag === "send-message-discord";
  const isOnchain = tag.startsWith("i-") || tag === "portal" || tag === "trust-name";
  const verificationMode = isOnchain ? "auto"
    : tag === "feedback" ? "feedback"
    : task.validationMode === "api" ? "auto"
    : task.validationMode === "link" ? "link"
    : task.validationMode ? "manual" : "";
  return {
    quest: task.title,
    link: task.taskUrl || DEFAULT_LINK[tag] || "https://nexura.io",
    tag,
    category: tag.endsWith("-x") || tag === "like" ? "twitter" : isDiscord ? "discord" : "other",
    verificationMode,
    // Retention builder details, so the campaign can be reopened exactly as it was built
    stage: stageKey,
    order,
    points: Number(task.points) || 0,
    taskTypeId: task.taskTypeId,
    ...(task.validationMode ? { validationMode: task.validationMode } : {}),
    ...(task.apiEndpoint ? { apiEndpoint: task.apiEndpoint } : {}),
    ...(isDiscord && guildId ? { guildId, metadata: { guildId } } : {}),
  };
}

/** Whole-wei split: per-participant amount × participants must equal what the contract is funded with. */
function splitPool(pool: number, recipients: number) {
  const poolWei = parseEther(pool.toFixed(18).replace(/\.?0+$/, ""));
  const perWei = poolWei / BigInt(recipients);
  if (perWei <= 0n) throw new Error("The participant pool is too small for that many recipients.");
  return { total: formatEther(perWei * BigInt(recipients)), perParticipant: formatEther(perWei) };
}

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const wallet = useStudioWallet();
  const feeTxHash = useRef<string | null>(null);
  const deployment = useRef<RewardsDeployment | null>(null);
  const draftId = useRef<string | null>(null);
  const uploadedCover = useRef<File | null>(null);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  // The reward contract pays out in the app's native TRUST on Intuition
  const supportedRewards = getNetwork() === "mainnet"
    ? { network: "intuition", token: "TRUST", label: "TRUST on Intuition Mainnet" }
    : { network: "intuition-testnet", token: "tTRUST", label: "tTRUST on Intuition Testnet" };

  /** Pays the studio launch fee once (reusing an unspent payment the hub already has). */
  const ensureLaunchFee = async (): Promise<string> => {
    if (feeTxHash.current) return feeTxHash.current;
    const me = await projectApiRequest<HubMe>({ method: "GET", endpoint: "/hub/me" }).catch(() => null);
    const pending = me?.hub?.pendingTxHash;
    if (pending) { feeTxHash.current = pending; return pending; }
    if (!PAYMENTS_ENABLED) return `payments-disabled-${Date.now()}`;
    if (!wallet.address) { wallet.connect(); throw new Error("Connect your wallet to pay the campaign launch fee, then try again."); }
    const hash = await payStudioHubFee(undefined, undefined, true);
    await projectApiRequest({ method: "PATCH", endpoint: "/hub/save-payment-hash", data: { txHash: hash } });
    feeTxHash.current = hash;
    return hash;
  };

  /** "Pay campaign total": launch fee + deploy and fund the rewards contract with the participant pool. */
  const handlePay = async (p: CampaignPayment): Promise<{ txHash?: string }> => {
    if (p.network !== supportedRewards.network || p.token !== supportedRewards.token) {
      throw new Error(`On-chain reward payouts currently support ${supportedRewards.label} only. Choose that network and token to pay.`);
    }
    if (p.recipients <= 0) throw new Error("Set how many participants can be rewarded.");
    const startMs = new Date(p.startDate).getTime();
    if (isNaN(startMs)) throw new Error("Set the campaign start date first.");

    await ensureLaunchFee();
    if (deployment.current) return { txHash: deployment.current.txHash };

    const { total, perParticipant } = splitPool(p.participantPool, p.recipients);
    const d = await createRewardsContract({
      nameOfCampaign: p.campaignName || "Nexura campaign",
      totalRewards: total,
      rewardToken: perParticipant,
      startDate: Math.floor(startMs / 1000),
    });
    const cap = Number(d.maxClaimableParticipants ?? 0);
    if (!Number.isInteger(cap) || cap !== p.recipients) {
      throw new Error(`Deployment mismatch: the contract allows ${cap} participants, expected ${p.recipients}.`);
    }
    deployment.current = { ...d, maxClaimableParticipants: cap };
    return { txHash: d.txHash };
  };

  /** Saves the campaign and its quests as a draft (status "Save"), creating it on first save. */
  const saveDraft = (c: PublishedCampaign): Promise<string> => {
    const run = async () => {
      const tasks = c.stages.flatMap(s => s.tasks);
      const me = await projectApiRequest<HubMe>({ method: "GET", endpoint: "/hub/me" }).catch(() => null);
      const guildId = me?.hub?.guildId ?? "";
      const d = deployment.current;

      const fd = new FormData();
      fd.append("title", c.name);
      fd.append("description", c.description || c.name);
      fd.append("nameOfProject", c.name);
      fd.append("starts_at", new Date(c.startDate).toISOString());
      fd.append("ends_at", new Date(c.endDate).toISOString());
      fd.append("maxParticipants", String(d ? d.maxClaimableParticipants : 0));
      fd.append("reward", JSON.stringify({
        xp: tasks.reduce((sum, t) => sum + (Number(t.points) || 0), 0),
        pool: d ? Number(d.fundedAmount) : 0,
        trust: d ? Number(d.rewardPerParticipant) : 0,
      }));
      // Upload the cover only when it changed since the last save
      if (c.coverImage && c.coverImage !== uploadedCover.current) fd.append("coverImage", c.coverImage);
      fd.append("isDraft", "true");
      fd.append("campaignQuests", JSON.stringify(c.stages.flatMap(st => st.tasks.map((t, i) => toQuest(t, guildId, st.id, i)))));
      fd.append("stages", JSON.stringify(c.stages.map(st => ({ key: st.id, name: st.name, returnDays: st.returnDays, allocationPct: st.allocationPct }))));
      fd.append("rewardsEnabled", String(c.rewardsEnabled));
      if (c.rewards) fd.append("rewardsConfig", JSON.stringify(c.rewards));
      fd.append("templateId", c.templateId ?? "");

      const saved = await projectApiRequest<{ campaignId?: string }>({
        method: "PATCH", endpoint: "/hub/save-campaign", formData: fd,
        ...(draftId.current ? { params: { id: draftId.current } } : {}),
      });
      const campaignId = saved.campaignId ?? draftId.current;
      if (!campaignId) throw new Error("The campaign could not be saved.");
      draftId.current = campaignId;
      if (c.coverImage) uploadedCover.current = c.coverImage;
      return campaignId;
    };
    // Saves run one at a time so autosave and publish never create two drafts
    const next = saveQueue.current.then(run, run);
    saveQueue.current = next.catch(() => {});
    return next;
  };

  /** Autosave: needs at least a name and both dates (the server requires them). */
  const handleAutosave = async (c: PublishedCampaign): Promise<"saved" | "skipped"> => {
    if (!c.name || !c.startDate || !c.endDate) return "skipped";
    await saveDraft(c);
    return "saved";
  };

  /** Save draft → attach rewards contract → publish. */
  const handlePublish = async (c: PublishedCampaign) => {
    const tasks = c.stages.flatMap(s => s.tasks);
    if (tasks.length === 0) throw new Error("Add at least one task before publishing.");
    if (!c.coverImage && !uploadedCover.current) throw new Error("Add a cover image before publishing.");
    if (PAYMENTS_ENABLED && c.rewards && !deployment.current) throw new Error("Complete the payment on the Rewards & Funding step before publishing.");

    const txHash = await ensureLaunchFee();
    const campaignId = await saveDraft(c);
    const d = deployment.current;

    if (d) {
      await projectApiRequest({
        method: "PATCH",
        endpoint: "/hub/add-campaign-address",
        data: {
          id: campaignId,
          contractAddress: d.contractAddress,
          deploymentTxHash: d.txHash,
          fundedAmount: Number(d.fundedAmount),
          rewardPerParticipant: Number(d.rewardPerParticipant),
          maxClaimableParticipants: d.maxClaimableParticipants,
          authorizedAddress: d.authorizedAddress,
        },
      });
    }

    await projectApiRequest({ method: "PATCH", endpoint: "/hub/publish-campaign", params: { id: campaignId }, data: { txHash } });

    feeTxHash.current = null; // the launch fee is spent on this campaign
    deployment.current = null;
    draftId.current = null;
    uploadedCover.current = null;
    toast({ title: "Campaign published", description: `${c.name} is now listed in your campaigns.` });
    router.push("/studio-dashboard/campaigns-tab");
  };

  return (
    <StudioLayout title="Create Campaign" hideHeader>
      <CreateNewCampaigns
        walletAddress={wallet.address}
        onConnectWallet={wallet.connect}
        onDisconnectWallet={wallet.disconnect}
        onPay={PAYMENTS_ENABLED ? handlePay : undefined}
        onPublish={handlePublish}
        onAutosave={handleAutosave}
      />
    </StudioLayout>
  );
}
