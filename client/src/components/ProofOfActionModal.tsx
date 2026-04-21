import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2, Coins, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { createProofOfAction } from "../services/web3";
import { useToast } from "../hooks/use-toast";

interface ProofOfActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  object: string;
  xpReward?: number | string;
  stakeTrust?: string;
  stakeUsd?: string;
  onSuccess: (txHash: string) => Promise<void> | void;
  sourceLabel?: string;
}

const PREDICATE = "Completed";

export default function ProofOfActionModal({
  open,
  onOpenChange,
  subject,
  object,
  xpReward,
  stakeTrust = "0.10",
  stakeUsd,
  onSuccess,
  sourceLabel,
}: ProofOfActionModalProps) {
  const { toast } = useToast();
  const [staking, setStaking] = useState(false);
  const [staked, setStaked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStaking(false);
      setStaked(false);
      setError(null);
    }
  }, [open]);

  const subjectLabel = subject?.trim() || "I";
  const objectLabel = object?.trim() || "this action";

  const handleStake = async () => {
    if (staking || staked) return;
    if (!subject?.trim()) {
      setError("Wallet username not found. Please reconnect your wallet.");
      return;
    }
    if (!object?.trim()) {
      setError("Missing action context. Please try again.");
      return;
    }

    setStaking(true);
    setError(null);

    try {
      const txHash = await createProofOfAction({
        username: subject,
        objectString: objectLabel,
      });
      setStaked(true);
      await onSuccess(txHash);
      toast({
        title: "Proof of Action staked",
        description: "Your XP has been claimed.",
      });
      setTimeout(() => onOpenChange(false), 900);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to stake Proof of Action.";
      setError(message);
      toast({
        title: "Stake failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setStaking(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && staking) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative rounded-2xl bg-[#110a2b] border border-purple-500/30 shadow-[0_0_80px_rgba(139,62,254,0.35)] overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(139,62,254,0.35), transparent 70%)",
            }}
          />
          <div
            className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(182,95,200,0.5), transparent 70%)",
            }}
          />

          <div className="relative px-6 pt-6 pb-5">
            <DialogHeader className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b3efe] to-[#b65fc8] flex items-center justify-center shadow-lg shadow-purple-500/40">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <DialogTitle className="text-base font-bold text-white">
                  Proof of Action
                </DialogTitle>
              </div>
              <DialogDescription className="text-white/60 text-xs leading-relaxed">
                Stake a triple on-chain to record your action and unlock your XP.
                {sourceLabel ? ` (${sourceLabel})` : ""}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="relative px-6 pb-4 space-y-2.5">
            <TripleCell label="Subject" value={subjectLabel} accent="purple" />
            <TripleCell label="Predicate" value={PREDICATE} accent="pink" />
            <TripleCell label="Object" value={objectLabel} accent="teal" />
          </div>

          <div className="relative mx-6 mb-4 rounded-xl bg-[#1a0f3d] border border-purple-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00e1a2]/15 border border-[#00e1a2]/30 flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-[#00e1a2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                    Stake amount
                  </span>
                  {typeof xpReward !== "undefined" && (
                    <span className="text-[10px] font-semibold text-[#00e1a2]">
                      +{xpReward} XP
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white">{stakeTrust}</span>
                  <span className="text-xs font-medium text-white/60">TRUST</span>
                  {stakeUsd && (
                    <span className="text-[11px] text-white/40">
                      &asymp; {stakeUsd}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 mt-1 leading-snug">
                  Funds go to the triple vault. You can redeem your stake later.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="relative mx-6 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 leading-snug break-words">{error}</p>
            </div>
          )}

          <div className="relative px-6 pb-6 pt-1">
            <button
              onClick={handleStake}
              disabled={staking || staked}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                staked
                  ? "bg-[#00e1a2]/20 border border-[#00e1a2]/40 text-[#00e1a2] cursor-default"
                  : staking
                    ? "bg-white/5 border border-white/10 text-white/50 cursor-wait"
                    : "bg-gradient-to-r from-[#8b3efe] to-[#b65fc8] text-white hover:shadow-[0_0_24px_rgba(139,62,254,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              }`}
            >
              {staked ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Claimed
                </>
              ) : staking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Staking on-chain...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Stake &amp; Claim XP
                </>
              )}
            </button>
            {!staking && !staked && (
              <button
                onClick={() => onOpenChange(false)}
                className="w-full mt-2 py-2 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
              >
                Not now
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TripleCellProps {
  label: string;
  value: string;
  accent: "purple" | "pink" | "teal";
}

function TripleCell({ label, value, accent }: TripleCellProps) {
  const accentMap: Record<TripleCellProps["accent"], { bar: string; text: string }> = {
    purple: { bar: "bg-[#8b3efe]", text: "text-[#c8a8ff]" },
    pink: { bar: "bg-[#b65fc8]", text: "text-[#e5b5f0]" },
    teal: { bar: "bg-[#00e1a2]", text: "text-[#7affd5]" },
  };
  const { bar, text } = accentMap[accent];
  return (
    <div className="flex items-stretch rounded-lg bg-white/[0.03] border border-white/5 overflow-hidden">
      <div className={`w-1 ${bar}`} />
      <div className="flex-1 px-3 py-2.5 min-w-0">
        <div className={`text-[9px] uppercase tracking-[0.14em] font-semibold ${text} mb-0.5`}>
          {label}
        </div>
        <div className="text-sm font-medium text-white truncate">{value}</div>
      </div>
    </div>
  );
}
