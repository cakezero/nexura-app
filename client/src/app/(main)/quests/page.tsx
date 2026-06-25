"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Clock, Users, AlertTriangle, Eye } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { apiRequestV2 } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RelicScanModal from "./RelicScanModal";

interface Quest {
  _id: string;
  title: string;
  sub_title: string;
  project_name?: string;
  description?: string;
  done: boolean;
  projectCoverImage?: string;
  starts_at?: string;
  ends_at?: string;
  link?: string;
  category: string;
  joined: boolean;
  reward: string;
  url?: string;
  actionLabel?: string;
  status: string;
  tag?: string;
  taskType?: string;
  taskId?: string;
  taskLink?: string;
  taskStatus?: string;
  taskDone?: boolean;
  isRelicQuest?: boolean;
  participants?: number;
  maxParticipants?: number;
}

const ATLAS_TAGS = ["i-trust", "i-collaborated", "i-interact", "i-follow"];

const MANUAL_PROOF_TAGS = ["comment", "comment-x", "follow", "follow-x", "feedback", "create-post", "twitter", "social"];

const DISCORD_TAGS = ["join", "join-discord", "message", "message-discord", "send-message-discord", "acquire-role-discord", "discord"];

export default function Quests() {
  const { toast } = useToast();
  const router = useRouter()
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

const queryClient = useQueryClient();

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["quests"],
  queryFn: async () => apiRequestV2("GET", "/api/quests"),
  refetchInterval: 30000,
  refetchIntervalInBackground: false,
});

const setLocalTaskStatus = (questId: string, taskStatus: string) => {
  queryClient.setQueryData(["quests"], (old: any) => {
    if (!old?.quests) return old;
    const patch = (arr: any[] = []) => arr.map((q) => (q._id === questId ? { ...q, taskStatus } : q));
    return { ...old, quests: {
      featuredQuests: patch(old.quests.featuredQuests),
      dailyQuests: patch(old.quests.dailyQuests),
      seasonalQuests: patch(old.quests.seasonalQuests),
    }};
  });
};

  const [serverOffset, setServerOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    apiRequestV2("GET", "/api/server-time")
      .then((res: any) => setServerOffset(res.serverTime - Date.now()))
      .catch(() => {});
  }, []);

  // next daily boundary = next UTC midnight, measured against server-corrected time
  const getNextResetTime = (serverNow: number) => {
    const next = new Date(serverNow);
    next.setUTCHours(24, 0, 0, 0);
    return next.getTime();
  };

  const utcDayRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const serverNow = Date.now() + serverOffset;

      // when the UTC day rolls over, daily completions reset server-side — refetch
      const utcDay = Math.floor(serverNow / 86400000);
      if (utcDayRef.current === null) {
        utcDayRef.current = utcDay;
      } else if (utcDay !== utcDayRef.current) {
        utcDayRef.current = utcDay;
        refetch?.();
      }

      const diff = Math.max(0, getNextResetTime(serverNow) - serverNow);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [serverOffset, refetch]);

  const QUEST_FILTERS = {
    SEASONAL: "seasonal",
    FEATURED: "featured",
    DAILY: "daily",
  };

  const [questFilter, setQuestFilter] = useState(QUEST_FILTERS.SEASONAL);

  // Persist the selected tab so a reload keeps the user on their current tab.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexura-quest-tab");
      if (saved === "seasonal" || saved === "featured" || saved === "daily") {
        setQuestFilter(saved);
      }
    } catch {}
  }, []);

const [relicQuest, setRelicQuest] = useState<{ id: string; reward: number } | null>(null);

const [activeQuestId, setActiveQuestId] = useState(null);
const [proofInput, setProofInput] = useState("");
// Quests where the user clicked "Retry" on a rejected submission: the Retry
// button reopens the task link, then the card returns to Submit Proof + eye.
const [retryOpened, setRetryOpened] = useState<string[]>([]);
// Quests the user just clicked "Start Quest" on, so the card flips to Submit
// Proof immediately (optimistic) without waiting for the joined refetch.
const [startedLocal, setStartedLocal] = useState<string[]>([]);

const featuredQuests: Quest[] = data?.quests?.featuredQuests ?? [];
const dailyQuests: Quest[] = data?.quests?.dailyQuests ?? [];
const seasonalQuests: Quest[] = data?.quests?.seasonalQuests ?? [];

const filteredQuests =
  questFilter === "seasonal"
    ? seasonalQuests
    : questFilter === "daily"
    ? dailyQuests
    : featuredQuests;

const [isStartingQuest, setIsStartingQuest] = useState<string | null>(null);

const handleStartQuest = async (quest: Quest) => {
  if (isStartingQuest === quest._id) return;

  setIsStartingQuest(quest._id);

  try {
    const data = await apiRequestV2(
      "POST",
      "/api/quest/start-quest",
      { questId: quest._id }
    );

    toast({
      title: "Quest Started",
      description: data?.message || "Quest started successfully.",
    });

    await refetch?.();

    router.push(`/quest/${quest._id}`);
  } catch (error: any) {
    const errorData = error?.info || {};

    if (errorData.error === "quest already started") {
      router.push(`/quest/${quest._id}`);
      return;
    }

    toast({
      title: "Error",
      description:
        errorData.error || "Failed to start the quest. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsStartingQuest(null);
  }
};

// Opens the task's external link in a new tab. Used by Start Quest, the eye
// (reopen), and Retry. The quest-completion record is created by the actual
// actions (submit / verify / claim), NOT here — so opening the link for a relic
// task doesn't pre-create a record that would short-circuit the relic scan.
const handleReopenTask = (quest: any) => {
  const link = quest.taskLink || quest.link;
  if (link && link !== "#") window.open(link, "_blank", "noopener,noreferrer");
};

const [isVerifyingTask, setIsVerifyingTask] = useState<string | null>(null);

const handleAtlasTask = async (quest: Quest) => {
  if (isVerifyingTask === quest._id) return;

  if (!quest.taskId) {
    toast({
      title: "Error",
      description: "Task is not configured correctly.",
      variant: "destructive",
    });
    return;
  }

  setIsVerifyingTask(quest._id);

  try {
    // Make sure a quest-completion record exists so the reward can be claimed.
    await apiRequestV2("POST", "/api/quest/start-quest", { questId: quest._id }).catch(() => {});

    await apiRequestV2("POST", "/api/quest/check-atlas-task", {
      tag: quest.taskType,
      id: quest.taskId,
      questId: quest._id,
      page: "quest",
    });

    toast({
      title: "Task Verified",
      description: "Press Claim XP to collect your reward.",
    });

    // Optimistically flip the card to the "Claim XP" state; refetch reconciles.
    setLocalTaskStatus(quest._id, "approved");

    await refetch?.();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error?.message || "Could not verify the task. Please complete it and try again.",
      variant: "destructive",
    });
  } finally {
    setIsVerifyingTask(null);
  }
};

const handleAutoVerify = async (quest: Quest) => {
  if (isVerifyingTask === quest._id) return;

  setIsVerifyingTask(quest._id);

  try {
    await apiRequestV2("POST", "/api/quest/start-quest", { questId: quest._id }).catch(() => {});

    const tag = quest.taskType || "";

    if (DISCORD_TAGS.includes(tag)) {
      await apiRequestV2("POST", "/api/check-discord", { questId: quest._id, id: quest.taskId, tag });
    } else if (tag === "portal") {
      await apiRequestV2("POST", "/api/quest/check-portal-task", { id: quest.taskId, questId: quest._id, page: "quest" });
    } else if (tag === "trust-name") {
      await apiRequestV2("POST", "/api/quest/check-trust-name", { id: quest.taskId, questId: quest._id });
    }

    toast({
      title: "Task Verified",
      description: "Press Claim XP to collect your reward.",
    });

    setLocalTaskStatus(quest._id, "approved");

    await refetch?.();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error?.message || "Could not verify the task. Please complete it and try again.",
      variant: "destructive",
    });
  } finally {
    setIsVerifyingTask(null);
  }
};

const handleSubmitQuest = async (quest: any, proof: string) => {
  if (!proof.trim()) {
    toast({
      title: "Add your proof",
      description: "Paste your link or username first.",
      variant: "destructive",
    });
    return;
  }

  try {
    let data: any;

    if (quest.taskStatus === "retry") {
      // A rejected submission already exists, so submit-quest would 409
      // ("quest already submitted"). update-submission replaces the proof instead.
      data = await apiRequestV2("POST", "/api/quest/update-submission", {
        submissionLink: proof,
        miniQuestId: quest.taskId,
      });
    } else {
      // Mark the quest started so the reward is claimable after approval
      // (claimQuest requires a quest-completion record to exist).
      await apiRequestV2("POST", "/api/quest/start-quest", { questId: quest._id }).catch(() => {});

      data = await apiRequestV2("POST", "/api/quest/submit-quest", {
        submissionLink: proof,
        questId: quest._id,
        page: "quest",
        id: quest.taskId,
        tag: quest.taskType,
      });
    }

    toast({
      title: "Submitted",
      description: data?.message || "Proof submitted for review.",
    });

    setActiveQuestId(null);
    setProofInput("");

    // Optimistically flip the card to "Pending Verification" so it updates
    // instantly; the refetch below reconciles with the server.
    setLocalTaskStatus(quest._id, "pending");
    setRetryOpened((prev) => prev.filter((id) => id !== quest._id));

    await refetch?.();
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.info?.error || err?.message || "Failed to submit quest.",
      variant: "destructive",
    });
  }
};

const [isClaimingQuest, setIsClaimingQuest] = useState<string | null>(null);

const handleClaimQuest = async (quest: Quest) => {
  if (isClaimingQuest === quest._id) return;

  setIsClaimingQuest(quest._id);

  try {
    // Ensure the quest is marked started before claiming, so a quest approved
    // before it was ever started (claimQuest requires the record) still claims.
    await apiRequestV2("POST", "/api/quest/start-quest", { questId: quest._id }).catch(() => {});

    const data = await apiRequestV2("POST", "/api/quest/claim-quest", { questId: quest._id });

    toast({
      title: "Reward Claimed",
      description: data?.message || "Reward claimed successfully.",
    });

    await refetch?.();
  } catch (err: any) {
    toast({
      title: "Error",
      description: err?.info?.error || err?.message || "Failed to claim reward.",
      variant: "destructive",
    });
  } finally {
    setIsClaimingQuest(null);
  }
};

const getTaskIcon = (quest: any) => {
  if (quest.isRelicQuest || quest.taskType === "relic") return "/relic.png";
  if (quest.taskType === "discord") return "/discordd.png";
  if (quest.taskType === "twitter") return "/x-icon.png";
  if (quest.taskType === "social") return "/explore-icon.png";
  return quest.project_image || "/x-icon.png";
};

const getCustomIcon = (quest: any): string | null => {
  // i-* (atlas) tasks keep their dedicated icons via getTaskIcon.
  if (typeof quest.taskType === "string" && quest.taskType.startsWith("i-")) return null;
  const candidate = quest.projectCoverImage || quest.image;
  if (!candidate || candidate === "pending") return null;
  return candidate;
};

const HaloButton = ({
  label,
  onClick,
  disabled,
  fullWidth,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "outline" | "amber";
}) => (
  <div className={`relative ${fullWidth ? "w-full" : "inline-flex"}`}>
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative ${
        fullWidth ? "w-full" : ""
      } px-5 py-1.5 rounded-full ${
        variant === "outline"
          ? "border border-[#8b3efe] bg-transparent text-[#8b3efe] hover:bg-[rgba(139,62,254,0.12)]"
          : variant === "amber"
          ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
          : "bg-[#8b3efe] text-white hover:bg-[#7b35e6]"
      } text-[11px] font-semibold tracking-[0.3px] whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed`}
      style={
        variant === "outline"
          ? undefined
          : variant === "amber"
          ? {
              boxShadow:
                "0px 6px 14px -4px rgba(239,68,68,0.35), 0px 3px 6px -4px rgba(239,68,68,0.35)",
            }
          : {
              boxShadow:
                "0px 6px 14px -4px rgba(139,62,254,0.35), 0px 3px 6px -4px rgba(139,62,254,0.35)",
            }
      }
    >
      {label}
    </button>
  </div>
);

const renderDefaultQuestCard = (quest: any, index: number = 0) => {
  const isAtlasTask = ATLAS_TAGS.includes(quest.taskType);

  // Featured/daily proof tasks (anything that needs manual proof submission)
  // complete inline on this page via the proof box.
  const isInlineProofTask = MANUAL_PROOF_TAGS.includes(quest.taskType);

  // Auto-verified tasks (Discord, Portal, TNS) — not atlas, not relic, not manual proof.
  const isAutoVerify = !quest.isRelicQuest && !isAtlasTask && !isInlineProofTask;

  // This user's submission state for the single task, mirroring the seasonal
  // state machine inline on the card (only meaningful for inline-proof tasks).
  // A relic quest reads as completed once its XP reward has been claimed.
  const completed = quest.taskDone || quest.taskStatus === "done" || (quest.isRelicQuest && quest.done === true);
  const approved = !completed && quest.taskStatus === "approved";
  const pending = isInlineProofTask && !completed && !approved && quest.taskStatus === "pending";
  // An admin rejected this user's submission; they must review and resubmit.
  // Show "Retry" even if they've retried before (in case of repeated rejections).
  const retry = isInlineProofTask && !completed && !approved && !pending && quest.taskStatus === "retry";
  // A task is "started" once the user clicked Start Quest (opening the link) or
  // the server already has a completion record (joined). New tasks show Start
  // Quest first; started ones show Submit Proof + eye.
  const started = quest.joined || startedLocal.includes(quest._id);

  const isExpanded = isInlineProofTask && !completed && !approved && !pending && activeQuestId === quest._id;

  return (
    <div
      className="w-full rounded-[12px] border border-white/10 bg-[rgba(10,14,19,0.7)] backdrop-blur-[6px] transition hover:border-[#8b3efe]/60"
    >
      {/* COLLAPSED ROW */}
      <div className="flex items-center py-2">
        {/* LEFT */}
        <div className="flex items-center gap-3 pl-3.5 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
            style={{
              background:
                "linear-gradient(135deg, rgba(120,93,200,0.4) 0%, rgba(138,63,252,0.4) 100%)",
            }}
          >
            {getCustomIcon(quest) ? (
              <img
                src={getCustomIcon(quest) as string}
                alt={quest.title || quest.taskType}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={getTaskIcon(quest)}
                alt={quest.taskType || quest.title}
                className="h-4 w-4 object-contain"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[#e0e2ea] leading-tight">
              {quest.title}
            </h3>
            <p className="text-[11px] font-normal text-[#cdc2d8] mt-0.5">
              {quest.description}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ml-auto flex items-center gap-3 pr-3.5">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-medium uppercase tracking-[0.6px] text-[rgba(205,194,216,0.5)]">
              Reward
            </span>
            <span className="text-[12px] font-semibold text-white">
              {Number(quest.reward).toLocaleString()} XP
            </span>
          </div>

          {completed ? (
            <span className="text-[11px] font-semibold text-green-400">Completed</span>
          ) : approved ? (
            <HaloButton
              label={isClaimingQuest === quest._id ? "Claiming…" : "Claim XP"}
              disabled={isClaimingQuest === quest._id}
              onClick={() => handleClaimQuest(quest)}
            />
          ) : pending ? (
            <HaloButton label="Pending Verification" disabled onClick={() => {}} />
          ) : retry ? (
            <HaloButton
              variant="amber"
              label="Retry"
              onClick={() => {
                handleReopenTask(quest);
                setRetryOpened((prev) => (prev.includes(quest._id) ? prev : [...prev, quest._id]));
              }}
            />
          ) : quest.isRelicQuest ? (
            <HaloButton
              label="Check Relic"
              onClick={() => setRelicQuest({ id: quest._id, reward: Number(quest.reward) || 0 })}
            />
          ) : !started ? (
            <HaloButton
              label="Start Quest"
              onClick={() => {
                handleReopenTask(quest);
                setStartedLocal((prev) => (prev.includes(quest._id) ? prev : [...prev, quest._id]));
              }}
            />
          ) : isAutoVerify ? (
            <div className="flex items-center gap-2">
              <HaloButton
                label={isVerifyingTask === quest._id ? "Verifying…" : "Verify"}
                disabled={isVerifyingTask === quest._id}
                onClick={() => handleAutoVerify(quest)}
              />
              <button
                type="button"
                onClick={() => handleReopenTask(quest)}
                title="Reopen task link"
                aria-label="Reopen task link"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#8b3efe] text-[#8b3efe] transition hover:bg-[rgba(139,62,254,0.12)]"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ) : isAtlasTask ? (
            <div className="flex items-center gap-2">
              <HaloButton
                label={isVerifyingTask === quest._id ? "Verifying…" : "Verify"}
                disabled={isVerifyingTask === quest._id}
                onClick={() => handleAtlasTask(quest)}
              />
              <button
                type="button"
                onClick={() => handleReopenTask(quest)}
                title="Reopen task link"
                aria-label="Reopen task link"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#8b3efe] text-[#8b3efe] transition hover:bg-[rgba(139,62,254,0.12)]"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <HaloButton
                label="Submit Proof"
                onClick={() => setActiveQuestId(activeQuestId === quest._id ? null : quest._id)}
              />
              <button
                type="button"
                onClick={() => handleReopenTask(quest)}
                title="Reopen task link"
                aria-label="Reopen task link"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[#8b3efe] text-[#8b3efe] transition hover:bg-[rgba(139,62,254,0.12)]"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EXPANDED PROOF PANEL */}
      {isExpanded && (
        <div className="mx-4 mb-3.5">
          <div className="rounded-[12px] border border-[rgba(139,62,254,0.3)] bg-[#0a0a0a] p-3.5 space-y-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              {retry ? (
                <p className="text-[11px] font-bold text-amber-400">
                  Your submission was rejected — please review and resubmit.
                </p>
              ) : (
                <p className="text-[11px] font-bold text-[rgba(255,255,255,0.8)]">
                  It may take 10 minutes to 10 hours to validate your submission.
                </p>
              )}
            </div>

            <input
              value={proofInput}
              onChange={(e) => setProofInput(e.target.value)}
              placeholder="Paste your comment link or Twitter username here"
              className="h-9 w-full rounded-[10px] border border-[rgba(138,62,254,0.3)] bg-[#060210] px-3 text-[11px] font-bold text-white outline-none placeholder:text-[11px] placeholder:font-bold placeholder:text-[rgba(255,255,255,0.4)]"
            />

            <HaloButton
              fullWidth
              label="Submit For Review"
              onClick={() => handleSubmitQuest(quest, proofInput)}
            />
          </div>
        </div>
      )}
    </div>
  );
};


const renderSeasonalQuestCard = (quest: Quest, index: number = 0) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });
  };

  const starts_atFormatted = quest.starts_at
    ? formatDate(quest.starts_at)
    : "";
  const ends_atFormatted = quest.ends_at ? formatDate(quest.ends_at) : "TBA";

  const participantCount = quest.participants || 0;

  return (
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.45,
    delay: index * 0.08,
    ease: "easeOut",
  }}
  className="h-[360px] w-full"
>
  <Card className="h-full w-full bg-[#170f1f] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition flex flex-col">

    {/* QUEST BANNER */}
    <div className="relative h-[140px] w-full shrink-0 bg-black">
      {quest.projectCoverImage && (
        <img
          src={quest.projectCoverImage}
          alt={quest.title}
          className="w-full h-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {quest.category && (
        <div className="absolute top-2 left-2 text-[0.65rem] sm:text-xs text-white/80 font-medium capitalize">
          {quest.category}
        </div>
      )}

      <div className="absolute bottom-3 left-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-[#1D1526] backdrop-blur-md shadow-lg">
          <img
            src={(quest as any).project_image || "/quest-1.png"}
            alt={quest.project_name || "Project"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>

    {/* DETAILS */}
    <div className="flex flex-col flex-1 p-4">

      {/* FIXED CONTENT AREA */}
      <div className="flex-1">

        {/* FIXED TITLE HEIGHT */}
        <h2
          className="text-sm font-semibold text-white leading-snug line-clamp-2 h-[40px]"
          title={quest.title}
        >
          {quest.title}
        </h2>

        <div className="mt-3 space-y-2">

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Creator:</span>
            <span className="text-white truncate max-w-[60%] text-right">
              {quest.project_name || "Nexura Ecosystem"}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Participants:</span>
            <span className="text-white flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participantCount.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Reward:</span>
            <span className="text-white">
              {quest.reward} XP
            </span>
          </div>

          <div className="flex justify-between text-xs min-h-[32px]">
            <span className="text-gray-500">Duration:</span>

            <span className="text-white flex items-center gap-1 text-right">
              <Clock className="w-3 h-3 shrink-0" />
              {starts_atFormatted} – {ends_atFormatted}
            </span>
          </div>

        </div>
      </div>

      {/* BUTTON ALWAYS STICKS TO BOTTOM */}
      <button
        onClick={() => handleStartQuest(quest)}
        className="w-full py-2 mb-2 mt-4 text-xs font-medium rounded-xl bg-[#8b3efe] hover:bg-[#7b35e6] text-white transition -translate-y-2"
      >
        Start Task
      </button>

    </div>
  </Card>
</motion.div>
  );
};

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
      <AnimatedBackground />

      <div className="max-w-4xl sm:max-w-6xl mx-auto space-y-6 relative z-10">

        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: "linear-gradient(90deg, #8b3efe, #b388ff)" }}
            />
            <span className="text-[16px] font-semibold bg-gradient-to-r from-[#8b3efe] to-[#b388ff] bg-clip-text text-transparent">
              QUESTS
            </span>
          </div>

          <h1 className="text-[30px] font-bold text-white leading-none">
            Quests
          </h1>

          <p className="text-[14px] font-semibold text-[rgba(255,255,255,0.7)]">
            Complete these quests to earn rewards.
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap" style={{ gap: 17 }}>
          {Object.values(QUEST_FILTERS).map((filter) => {
            const isActive = questFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => { setQuestFilter(filter); try { localStorage.setItem("nexura-quest-tab", filter); } catch {} }}
                className={`rounded-[20px] border border-[#8b3efe] px-4 py-1.5 text-[14px] capitalize text-white transition ${
                  isActive ? "bg-[#8b3efe] font-semibold" : "bg-transparent font-medium"
                }`}
              >
                {filter} Quests
              </button>
            );
          })}
        </div>

        {/* SECTION HEADING + DAILY RESET */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-semibold text-white">
            {questFilter === "featured" && "Featured Quests"}
            {questFilter === "seasonal" && "Seasonal Quests"}
            {questFilter === "daily" && "Daily Quest"}
          </h2>

          {questFilter === "daily" && (
            <div className="flex items-center gap-4 rounded-[12px] bg-[rgba(139,62,254,0.1)] px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)]">
                <Clock className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-[1px] text-[rgba(255,255,255,0.6)]">
                  Daily Reset
                </span>
                <span className="text-[16px] text-[#e0e2ea]">
                  {timeLeft || "0h 0m 0s"}{" "}
                  <span className="text-[rgba(255,255,255,0.6)]">remaining</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* QUEST CARDS */}
        {filteredQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/50">
            <p className="text-[14px]">No {questFilter} quests yet.</p>
          </div>
        ) : questFilter === "seasonal" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredQuests.map((quest: Quest, i: number) => (
              <div key={quest._id}>{renderSeasonalQuestCard(quest, i)}</div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQuests.map((quest: any, i: number) => (
              <div key={quest._id}>{renderDefaultQuestCard(quest, i)}</div>
            ))}
          </div>
        )}

      </div>

<AnimatePresence>
{relicQuest && (
  <RelicScanModal
    key="relic-scan-modal"
    questId={relicQuest.id}
    reward={relicQuest.reward}
    onClose={() => setRelicQuest(null)}
    onClaimed={() => {
      toast({
        title: "Reward Claimed",
        description: "Relic XP reward claimed successfully.",
      });
      refetch?.();
    }}
  />
)}
</AnimatePresence>

    </div>
  );
}