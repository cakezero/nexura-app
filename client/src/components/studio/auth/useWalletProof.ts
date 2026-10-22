"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

export type WalletProof = { address: string; message: string; signature: string; at: number };

// The server accepts a login signature for 10 minutes; sign again a little before that
const PROOF_TTL_MS = 9 * 60 * 1000;
const SIGN_TIMEOUT_MS = 90 * 1000;

/** Wallet login signature for Studio. With `signOnConnect` it asks as soon as a wallet connects. */
export function useWalletProof({ signOnConnect = false } = {}) {
  const { address: liveAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const address = isConnected && liveAddress ? liveAddress : null;
  const [proof, setProof] = useState<WalletProof | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  const signingFor = useRef<string | null>(null);

  const sign = useCallback(async (addr: string): Promise<WalletProof | null> => {
    if (signingFor.current === addr) return null;
    signingFor.current = addr;
    setSigning(true); setSignError("");
    const message = `Nexura Wallet Login\nAddress: ${addr}\nNonce: ${Date.now()}`;
    try {
      const signature = await Promise.race([
        signMessageAsync({ message }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), SIGN_TIMEOUT_MS)),
      ]);
      const next = { address: addr, message, signature, at: Date.now() };
      setProof(next);
      return next;
    } catch (err) {
      setSignError((err as Error)?.message === "timeout"
        ? "Your wallet didn't respond. Open it and press Sign again."
        : "Sign the message in your wallet to verify it.");
      return null;
    } finally {
      signingFor.current = null;
      setSigning(false);
    }
  }, [signMessageAsync]);

  useEffect(() => {
    if (!address) { setProof(null); setSignError(""); return; }
    if (proof?.address !== address) {
      setProof(null);
      if (signOnConnect) void sign(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const verified = !!proof && proof.address === address && Date.now() - proof.at < PROOF_TTL_MS;

  /** A fresh proof for the connected wallet, signing again only when needed. */
  const getProof = useCallback(async () => {
    if (!address) return null;
    return verified ? proof : sign(address);
  }, [address, verified, proof, sign]);

  return { address, proof, verified, signing, signError, sign, getProof, clearProof: () => setProof(null) };
}
