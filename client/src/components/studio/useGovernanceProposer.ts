"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { recoverTypedDataAddress } from "viem";
import { projectApiRequest } from "@/lib/projectApi";
import {
  EMPTY_SNAPSHOT, type GovernanceSnapshot, type ProposalAction,
  fetchGovernance, isGovernanceUnavailable, newProposalId, notifyGovernanceChanged, submitProposal,
} from "@/lib/adminGovernance";

// Same EIP-712 data Admin Management signs with (the server verifies it)
const SIGN_DOMAIN = { name: "Nexura Studio", version: "1" } as const;
const SIGN_TYPES = {
  StudioAction: [
    { name: "hub", type: "string" },
    { name: "action", type: "string" },
    { name: "proposal", type: "string" },
    { name: "proposalId", type: "string" },
    { name: "signer", type: "string" },
    { name: "signedAt", type: "string" },
  ],
} as const;

/**
 * Makes signed governance proposals from outside Admin Management (e.g. proposing to end a campaign).
 * Loads the governance state so callers can show what's already pending.
 */
export function useGovernanceProposer() {
  const [gov, setGov] = useState<GovernanceSnapshot>(EMPTY_SNAPSHOT);
  const [me, setMe] = useState<{ id: string; name: string; hubName: string } | null>(null);
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { openConnectModal } = useConnectModal();

  const refresh = useCallback(async () => {
    try { setGov(await fetchGovernance()); }
    catch (err) { if (!isGovernanceUnavailable(err)) console.error("Failed to load proposals:", err); }
  }, []);

  useEffect(() => {
    refresh();
    projectApiRequest<{ hub?: Record<string, any>; admin?: Record<string, any> }>({ method: "GET", endpoint: "/hub/me" })
      .then(r => { if (r?.admin?._id) setMe({ id: String(r.admin._id), name: String(r.admin.name ?? "Admin"), hubName: String(r.hub?.name ?? "") }); })
      .catch(() => {});
  }, [refresh]);

  /**
   * Has the connected wallet sign a studio action (EIP-712, no transaction or gas).
   * `id` is what the action is about: a proposal ref, or a campaign id when publishing.
   */
  const sign = async (verb: "Propose" | "Publish", title: string, id: string) => {
    if (!me) throw new Error("Your admin account is still loading. Try again in a moment.");
    if (!isConnected || !address) {
      openConnectModal?.();
      throw new Error("Connect your wallet to sign, then try again.");
    }
    const linked = gov.signerWallets?.[me.id];
    if (linked && linked.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`Switch to the wallet linked to your account (${linked.slice(0, 6)}…${linked.slice(-4)}) to sign.`);
    }
    const message = {
      hub: me.hubName,
      action: verb,
      proposal: title,
      proposalId: id,
      signer: `${me.name} (${me.id})`,
      signedAt: new Date().toISOString(),
    };
    let signature: `0x${string}`;
    try {
      signature = await signTypedDataAsync({ domain: SIGN_DOMAIN, types: SIGN_TYPES, primaryType: "StudioAction", message });
    } catch (err) {
      // Wallet errors are long; their short message says what actually happened
      const e = err as { shortMessage?: string; message?: string };
      throw new Error(e?.shortMessage || e?.message || "The wallet could not sign.");
    }
    const recovered = await recoverTypedDataAddress({ domain: SIGN_DOMAIN, types: SIGN_TYPES, primaryType: "StudioAction", message, signature });
    if (recovered.toLowerCase() !== address.toLowerCase()) throw new Error("The signature doesn't match the connected wallet.");
    return { signature, message };
  };

  /**
   * Signs the proposal with the admin's linked wallet and submits it. Throws with a readable reason.
   * `action` can be a function, built only after the wallet has signed (e.g. when it needs an upload first).
   */
  const propose = async (title: string, change: string, action: ProposalAction | (() => Promise<ProposalAction>)) => {
    if (me && !gov.signerIds.includes(me.id)) throw new Error("Only signers can make proposals. Ask a signer to add you in Admin Management.");
    const ref = newProposalId();
    const { signature, message } = await sign("Propose", title, ref);
    const resolved = typeof action === "function" ? await action() : action;
    const snap = await submitProposal({ ref, title, change, action: resolved, clientUrl: window.location.origin, signature, message });
    setGov(snap);
    notifyGovernanceChanged();
    return snap.proposals.find(p => p.id === ref) ?? null;
  };

  return { gov, propose, sign, refresh };
}
