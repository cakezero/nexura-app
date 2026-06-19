"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowUp, X, ExternalLink } from "lucide-react";
import { apiRequestV2 } from "@/lib/queryClient";

export type RelicPhase = "scanning" | "found" | "ready" | "failure" | "claimed";

// The relic XP was already CLAIMED for this quest (vs. genuinely no relics).
// Backend: "quest has already been completed" / "quest reward has already been claimed".
const isAlreadyClaimedError = (err: any) => {
  const msg = String(err?.message || err?.info?.error || "").toLowerCase();
  return msg.includes("already") && (msg.includes("complete") || msg.includes("claim"));
};

// Relics were verified on a previous open but the XP was never claimed.
// Backend: "claim xp to complete quest" — send the user straight to the claim step.
const isPendingClaimError = (err: any) => {
  const msg = String(err?.message || err?.info?.error || "").toLowerCase();
  return !msg.includes("already") && msg.includes("claim") && msg.includes("complete");
};

interface RelicScanModalProps {
  questId: string;
  reward: number;
  onClose: () => void;
  onClaimed?: () => void;
  /** when true the modal simulates phases without hitting the backend (for visual capture) */
  simulate?: boolean;
  /** force a starting phase (used for screenshots) */
  forcePhase?: RelicPhase;
}

const STEPS = [
  "Verify wallet connection",
  "Scanning for Relics",
  "Preparing XP rewards",
];

const OPENSEA_URL = "https://opensea.io/collection/nexura-relics";

export default function RelicScanModal({
  questId,
  reward,
  onClose,
  onClaimed,
  simulate = false,
  forcePhase,
}: RelicScanModalProps) {
  const [phase, setPhase] = useState<RelicPhase>("scanning");
  const [relicCount, setRelicCount] = useState<number>(0);
  const [claiming, setClaiming] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  // timed simulation that walks scanning -> found -> ready so the animation reads
  const runSimulation = useCallback((count: number) => {
    clearTimers();
    setPhase("scanning");
    setRelicCount(count);
    timers.current.push(setTimeout(() => setPhase("found"), 1000));
    timers.current.push(setTimeout(() => setPhase("ready"), 2000));
  }, [clearTimers]);

  const runFailureSimulation = useCallback(() => {
    clearTimers();
    setPhase("scanning");
    timers.current.push(setTimeout(() => setPhase("failure"), 1400));
  }, [clearTimers]);

  const startScan = useCallback(async () => {
    clearTimers();
    setPhase("scanning");

    if (forcePhase) {
      // screenshot mode: hold whatever phase was requested
      setPhase(forcePhase);
      if (forcePhase !== "failure") setRelicCount((c) => c || 52);
      return;
    }

    if (simulate) {
      runSimulation(52);
      return;
    }

    // Resolve from the API, but cap the scan so the modal never spins longer
    // than ~6s (if verify is slow or hangs, fall through to the recheck screen).
    const verifyPromise = apiRequestV2(
      "POST",
      `/api/quest/verify-relic?questId=${encodeURIComponent(questId)}`
    );

    try {
      let timedOut = false;
      const timeoutPromise = new Promise<null>((resolve) => {
        timers.current.push(
          setTimeout(() => {
            timedOut = true;
            resolve(null);
          }, 6000)
        );
      });

      const res: any = await Promise.race([verifyPromise, timeoutPromise]);

      if (timedOut || !res) {
        runFailureSimulation();
        return;
      }

      const verified = res?.verified === true || /verified/i.test(res?.message || "");
      if (!verified) {
        runFailureSimulation();
        return;
      }
      const count = Number(res?.count) || 1;
      setRelicCount(count);
      setPhase("found");
      timers.current.push(setTimeout(() => setPhase("ready"), 800));
    } catch (err: any) {
      // Already claimed — show the claimed state, not the no-relics screen.
      if (isAlreadyClaimedError(err)) {
        clearTimers();
        setPhase("claimed");
        return;
      }
      // Verified before but never claimed — jump straight to the claim step.
      if (isPendingClaimError(err)) {
        clearTimers();
        setRelicCount((c) => c || 1);
        setPhase("ready");
        return;
      }
      // Verify failed (no relic / auth / network) — fail gracefully into the
      // no-relics recheck phase instead of spinning.
      runFailureSimulation();
    }
  }, [clearTimers, forcePhase, simulate, questId, runSimulation, runFailureSimulation]);

  useEffect(() => {
    startScan();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaim = useCallback(async () => {
    if (phase !== "ready" || claiming) return;
    setClaiming(true);
    try {
      if (!simulate && !forcePhase) {
        await apiRequestV2(
          "POST",
          `/api/quest/claim-relic-reward?questId=${encodeURIComponent(questId)}`
        );
      }
      onClaimed?.();
      onClose();
    } catch (err: any) {
      // Already claimed — surface the claimed state instead of a false success.
      // Any other failure keeps the modal open so the user can retry.
      if (isAlreadyClaimedError(err)) {
        clearTimers();
        setPhase("claimed");
      }
    } finally {
      setClaiming(false);
    }
  }, [phase, claiming, simulate, forcePhase, questId, onClaimed, onClose, clearTimers]);

  const handleRecheck = useCallback(() => {
    setRelicCount(0);
    startScan();
  }, [startScan]);

  const active = phase === "scanning" || phase === "found" || phase === "ready";
  const isFailure = phase === "failure";
  const isClaimed = phase === "claimed";

  const statusText =
    phase === "scanning"
      ? "Scanning for Relics…"
      : phase === "found"
      ? `${relicCount} relics found`
      : phase === "ready"
      ? "Preparing XP rewards"
      : isClaimed
      ? "Relics already verified"
      : "Oops! No Relics Found";

  const stepDone = (i: number) => {
    if (phase === "scanning") return i < 1;
    if (phase === "found") return i < 2;
    if (phase === "ready") return i < 3;
    return false;
  };

  const claimEnabled = phase === "ready" && !claiming;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[40px]"
        style={{
          background:
            "linear-gradient(142.8deg, rgb(15,12,30) 0%, rgb(22,16,42) 100%)",
          border: "1px solid rgba(124,77,255,0.35)",
          boxShadow: "0px 24px 80px 0px rgba(80,30,200,0.4)",
        }}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between px-[22px] pt-[22px]">
          <div className="flex flex-col">
            <span className="text-[18px] font-bold leading-tight text-[#e8e0ff]">
              Scanning Wallet
            </span>
            <span className="mt-0.5 text-[12px] font-normal text-[#7c7399]">
              Discovering your relics…
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-[27.6px] w-[27.6px] items-center justify-center rounded-[8px] text-[#7c7399] transition hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* SCAN VISUAL */}
        <div className="mt-6 flex justify-center">
          <div className="relative flex h-[82px] w-[82px] items-center justify-center">
            {/* outer ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 ${
                active ? "animate-spin" : ""
              }`}
              style={{
                borderColor: "transparent",
                borderTopColor: "#9b6dff",
                borderRightColor: "#9b6dff",
                animationDuration: "2.2s",
              }}
            />
            {/* middle ring (reverse) */}
            <div
              className={`absolute inset-[10px] rounded-full border-2 ${
                active ? "animate-spin" : ""
              }`}
              style={{
                borderColor: "transparent",
                borderBottomColor: "rgba(255,255,255,0.5)",
                borderLeftColor: "rgba(255,255,255,0.5)",
                animationDuration: "1.5s",
                animationDirection: "reverse",
              }}
            />
            {/* inner ring */}
            <div
              className={`absolute inset-[20px] rounded-full border-2 ${
                active ? "animate-spin" : ""
              }`}
              style={{
                borderColor: "transparent",
                borderTopColor: "#00e5c0",
                borderRightColor: "#00e5c0",
                animationDuration: "1s",
              }}
            />
            {/* center icon */}
            <div
              className="flex h-[33px] w-[33px] items-center justify-center rounded-full"
              style={{
                background: isFailure
                  ? "rgba(255,146,138,0.12)"
                  : isClaimed
                  ? "rgba(0,225,162,0.12)"
                  : "rgba(155,109,255,0.15)",
              }}
            >
              <ArrowUp
                className="h-[18px] w-[18px]"
                style={{ color: isFailure ? "#ff928a" : isClaimed ? "#00e1a2" : "#9b6dff" }}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* STATUS TEXT */}
        <p
          className="mt-4 text-center text-[16px] font-medium"
          style={{ color: isFailure ? "#ff928a" : isClaimed ? "#00e1a2" : "#9b6dff" }}
        >
          {statusText}
        </p>

        {/* BODY: claimed block OR steps + claim (active) OR failure block */}
        {isClaimed ? (
          <div className="px-[22px] pb-[22px] pt-5">
            <p className="text-center text-[13px] leading-relaxed text-[rgba(255,255,255,0.6)]">
              Your Relics are verified and the{" "}
              <span className="text-white">XP reward has already been claimed</span>.
            </p>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-full border px-[32px] py-[10px] text-[16px] font-semibold tracking-[0.8px] text-white transition hover:bg-[rgba(139,62,254,0.12)]"
              style={{ borderColor: "#8b3efe" }}
            >
              Close
            </button>
          </div>
        ) : !isFailure ? (
          <>
            <div className="mt-6 flex flex-col gap-[9px] px-[22px]">
              {STEPS.map((label, i) => {
                const done = stepDone(i);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="flex h-[18px] w-[18px] items-center justify-center rounded-[9.2px] border-2 text-[10px] font-semibold"
                      style={{
                        borderColor: done ? "#00e1a2" : "#4a4460",
                        color: done ? "#00e1a2" : "#7c7399",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span
                      className="text-[14px]"
                      style={{ color: done ? "#00e1a2" : "#7c7399" }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-[22px] pb-[22px] pt-6">
              <button
                disabled={!claimEnabled}
                onClick={handleClaim}
                className="w-full rounded-full px-[32px] py-[10px] text-[16px] font-semibold tracking-[0.8px] transition"
                style={
                  claimEnabled
                    ? { background: "#8b3efe", color: "#ffffff" }
                    : {
                        background: "rgba(139,62,254,0.2)",
                        color: "rgba(255,255,255,0.3)",
                        cursor: "not-allowed",
                      }
                }
              >
                {claiming ? "Claiming…" : `Claim ${reward.toLocaleString()} XP`}
              </button>
            </div>
          </>
        ) : (
          <div className="px-[22px] pb-[22px] pt-5">
            {/* sub-text */}
            <p className="text-center text-[13px] leading-relaxed text-[rgba(255,255,255,0.5)]">
              Your wallet{" "}
              <span className="text-white">doesn&apos;t hold any Relics</span>. You
              need at least one Relics to complete this task.
            </p>

            {/* divider */}
            <div className="my-4 h-px w-full bg-[rgba(255,255,255,0.08)]" />

            <p className="text-center text-[12px] text-[rgba(255,255,255,0.5)]">
              Acquire a Relics to claim your XP rewards
            </p>

            {/* Browse OpenSea */}
            <div className="mt-3 flex justify-center">
              <a
                href={OPENSEA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[30px] w-[166px] items-center justify-center gap-1.5 rounded-full text-[12px] text-white transition hover:opacity-90"
                style={{ background: "#2081e2" }}
              >
                Browse Opensea
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Recheck */}
            <button
              onClick={handleRecheck}
              className="mt-5 w-full rounded-full border px-[32px] py-[10px] text-[16px] font-semibold tracking-[0.8px] text-white transition hover:bg-[rgba(139,62,254,0.12)]"
              style={{ borderColor: "#8b3efe" }}
            >
              Recheck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
