"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Clock, Users } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { apiRequestV2 } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  participants?: number;
  maxParticipants?: number;
}

export default function Quests() {
  const { toast } = useToast();
  const router = useRouter()
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const getNextResetTime = () => {
  const now = new Date();

  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);

  return next.getTime();
};

  const [timeLeft, setTimeLeft] = useState("");

useEffect(() => {
  const target = getNextResetTime(); // you define this

  const interval = setInterval(() => {
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) {
      setTimeLeft("00:00:00");
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );
  }, 1000);

  return () => clearInterval(interval);
}, []);

const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["quests"],
  queryFn: async () => {
    console.log("➡️ FETCHING QUESTS FROM NEXT API ROUTE");

    const res = await fetch("/api/quest");

    console.log("📡 RESPONSE STATUS:", res.status);

    const json = await res.json();

    console.log("📦 QUEST RESPONSE:", json);

    return json;
  },
  refetchInterval: 300000,
  refetchIntervalInBackground: true,
});

const mockQuests = [
  // DAILY (simple + twitter)
  {
    _id: "q1",
    title: "Like Today's Announcement",
    description: "Engage with the latest update post",
    reward: 25,
    category: "daily",
    taskType: "twitter",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 120,
    isRelicQuest: false,
  },
  {
    _id: "q2",
    title: "Follow Nexura on X",
    description: "Stay updated with official news",
    reward: 20,
    category: "daily",
    taskType: "twitter",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 210,
    isRelicQuest: false,
  },
  {
    _id: "q3",
    title: "Daily Check-in",
    description: "Open app and confirm activity",
    reward: 15,
    category: "daily",
    taskType: "social",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 980,
    isRelicQuest: false,
  },
  
  // FEATURED (normal + ONE relic)
  // 🔥 ONLY RELIC QUEST (STRICTLY ONE)
  {
    _id: "q7",
    title: "Relic: Genesis Key Hunt",
    description: "Find the hidden seasonal artifact",
    reward: 500,
    category: "featured",
    taskType: "relic",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 430,
    isRelicQuest: true,
  },
  
  {
    _id: "q4",
    title: "Retweet Campaign Boost",
    description: "Amplify official campaign post",
    reward: 60,
    category: "featured",
    taskType: "twitter",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 760,
    isRelicQuest: false,
  },
  {
    _id: "q5",
    title: "Invite Friends Challenge",
    description: "Bring 3 active users into the ecosystem",
    reward: 150,
    category: "featured",
    taskType: "social",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 340,
    isRelicQuest: false,
  },
  {
    _id: "q6",
    title: "Discord Power User",
    description: "Engage actively in community channels",
    reward: 90,
    category: "featured",
    taskType: "social",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 540,
    isRelicQuest: false,
  },


  // SEASONAL (NO RELIC LOGIC HERE)
  {
    _id: "q8",
    title: "Season One Launch Quest",
    description: "Complete onboarding journey",
    reward: 300,
    category: "seasonal",
    taskType: "social",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 890,
    starts_at: "2026-06-01",
    ends_at: "2026-06-30",
    isRelicQuest: false,
  },
  {
    _id: "q9",
    title: "Season Engagement Run",
    description: "Participate across ecosystem tasks",
    reward: 420,
    category: "seasonal",
    taskType: "twitter",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 1500,
    starts_at: "2026-06-10",
    ends_at: "2026-07-10",
    isRelicQuest: false,
  },
  {
    _id: "q10",
    title: "Season Finale Completion",
    description: "Finish all seasonal objectives",
    reward: 800,
    category: "seasonal",
    taskType: "social",
    project_image: "/quest-1.png",
    projectCoverImage: "/quest-1.png",
    project_name: "Nexura",
    participants: 2000,
    starts_at: "2026-06-20",
    ends_at: "2026-07-20",
    isRelicQuest: false,
  },
];

// const quests = data?.quests ?? [];
const quests = data?.quests?.length ? data.quests : mockQuests;

  const QUEST_FILTERS = {
    FEATURED: "featured",
    SEASONAL: "seasonal",
    DAILY: "daily",
  };

  const [questFilter, setQuestFilter] = useState(QUEST_FILTERS.FEATURED);

const [showRelicModal, setShowRelicModal] = useState(false);

const [scanStep, setScanStep] = useState(0);

useEffect(() => {
  if (!showRelicModal) return;

  setScanStep(0);

  const t1 = setTimeout(() => setScanStep(1), 2000);
  const t2 = setTimeout(() => setScanStep(2), 4000);
  const t3 = setTimeout(() => setScanStep(3), 6000);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
}, [showRelicModal]);

const [activeQuestId, setActiveQuestId] = useState(null);
const [proofInput, setProofInput] = useState("");

  const filteredQuests = quests.filter(
    (quest: any) => quest.category === questFilter
  );

  const seasonalQuests = quests.filter(
  (quest: Quest) => quest.category === "seasonal"
);

const normalQuests = filteredQuests.filter(
  (quest: any) => quest.category !== "seasonal"
);

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
      description: data?.message || "Quest started successfully",
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

const handleSubmitQuest = async (questId: string, proof: string) => {
  console.log("[ACTION] handleSubmitQuest", { questId, proof });

  try {
    const res = await fetch("/api/quest/submit-quest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questId,
        proof,
      }),
    });

    const data = await res.json();

    console.log("STATUS:", res.status);
    console.log("DATA:", data);

    if (!res.ok) {
      throw new Error(data?.error || "Failed to submit quest");
    }

    toast({
      title: "Submitted",
      description: data?.message || "Proof submitted",
    });

    setActiveQuestId(null);
    setProofInput("");

    await refetch?.();
  } catch (err) {
    console.error("[ACTION] handleSubmitQuest ✗", err);
    console.error("❌ Submit quest failed:", err);

    toast({
      title: "Error",
      description: "Failed to submit quest",
      variant: "destructive",
    });
  }
};

const renderDefaultQuestCard = (quest: any, index: number = 0) => {
  return (
        <div
          // key={quest._id}
          className="grid grid-cols-[1fr_120px_auto] items-center gap-4 p-3 rounded-xl bg-[#0A0E13B2] border border-[#8B3EFE33] hover:border-[#8B3EFE] transition"
        >
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={quest.project_image || "/fallback.png"}
              alt={quest.title}
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#8B3EFE33]"
            />

            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {quest.title}
              </h3>

              <p className="text-[11px] text-gray-400 truncate">
                {quest.description}
              </p>
            </div>
          </div>

          {/* REWARD */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-[8px] uppercase tracking-[0.35em] text-gray-500">
              Reward
            </p>

            <p className="text-[13px] text-white/90 tracking-[2px] leading-none">
              {quest.reward} XP
            </p>
          </div>

<button
  disabled={isStartingQuest === quest._id}
  onClick={() => {
    if (quest.taskType === "twitter") {
      setActiveQuestId(quest._id);
      handleStartQuest(quest);
    } else if (quest.isRelicQuest) {
      setShowRelicModal(true);
      setScanStep(0);
    } else {
      handleStartQuest(quest);
    }
  }}
  className={`px-3 py-1 text-[12px] rounded-full text-white whitespace-nowrap transition ${
    isStartingQuest === quest._id
      ? "bg-gray-500 cursor-not-allowed"
      : "bg-[#8B3EFE] hover:opacity-90"
  }`}
>
  {quest.taskType === "twitter" && activeQuestId === quest._id
    ? "Submit Proof"
    : "Start Quest"}
</button>

                    {/* TWITTER EXPANDED CARD */}
          {quest.taskType === "twitter" &&
            activeQuestId === quest._id && (
              <div className="col-span-3 mt-3">
                <div className="bg-[#0A0A0A] border border-[#8B3EFE33] rounded-xl p-3 space-y-3">

                  <div className="flex items-start gap-2 text-yellow-400 text-[11px]">
                    <span>⚠️</span>
                    <p>
                      It may take 10 minutes to 10 hours to validate your submission.
                    </p>
                  </div>

                  <input
                    value={proofInput}
                    onChange={(e) => setProofInput(e.target.value)}
                    placeholder="Paste your comment link or twitter username here..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060210] border border-[#8B3EFE33] text-white outline-none"
                  />

                  <button
                    onClick={() => {
                      setActiveQuestId(null);
                      setProofInput("");
                    }}
                    className="w-full py-2 text-xs rounded-lg bg-[#8B3EFE] text-white hover:opacity-90 transition"
                  >
                    Submit Proof
                  </button>
                </div>
              </div>
            )}
        </div>
      )
}          

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
        <div className="absolute top-2 left-2 text-[0.65rem] sm:text-xs text-white/80 font-medium">
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
        className="w-full py-2 mb-2 mt-4 text-xs font-medium rounded-xl bg-[#8b3efe] hover:bg-[#B65FC8] text-white transition -translate-y-2"
      >
        Start Quest
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
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8B3EFE] animate-pulse" />

            <div
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{
                background: "linear-gradient(135deg, #B184C4, #FF8CD9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Quests
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
            Quests
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete these quests to earn rewards
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2">
          {Object.values(QUEST_FILTERS).map((filter) => {
            const isActive = questFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => setQuestFilter(filter)}
                className="px-3 py-1 text-xs capitalize border rounded-2xl transition"
                style={{
                  backgroundColor: isActive ? "#8B3EFE" : "transparent",
                  borderColor: "#8B3EFE",
                  color: "#fff",
                }}
              >
                {filter} Quests
              </button>
            );
          })}
        </div>


<div className="flex items-center justify-between mt-4">
  <h2 className="text-lg font-semibold text-white">
    {questFilter === "featured" && "Featured Quests"}
    {questFilter === "seasonal" && "Seasonal Quests"}
    {questFilter === "daily" && "Daily Quests"}
  </h2>

  {questFilter === "daily" && (
    <div className="flex items-center gap-2 bg-[#8B3EFE1A] px-3 py-2 rounded-xl">
      <Clock className="w-4 h-4 text-[#8B3EFE] shrink-0" />

      <div className="flex flex-col items-start leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-gray-400">
          Daily Reset
        </span>

        <span className="text-xs font-medium text-white">
          {timeLeft || "00:00:00"} remaining
        </span>
      </div>
    </div>
  )}
</div>

{/* QUEST CARDS */}
<div className="mt-4 px-2 sm:px-2 lg:px-5">
  <div
    className={
      questFilter === "seasonal"
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        : "grid grid-cols-1 gap-3"
    }
  >
    {filteredQuests.map((quest: Quest, i: number) =>
  quest.category === "seasonal" ? (
    <div key={quest._id}>
      {renderSeasonalQuestCard(quest, i)}
    </div>
  ) : (
    <div key={quest._id}>
      {renderDefaultQuestCard(quest, i)}
    </div>
  )
)}
  </div>
</div>

      </div>

{showRelicModal && (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      className="relative w-full max-w-sm rounded-3xl border border-[#8B3EFE33] p-5"
      style={{
        background: "linear-gradient(180deg, #0F0C1E 0%, #16102A 100%)",
      }}
    >
      {/* CLOSE */}
      <button
        onClick={() => setShowRelicModal(false)}
        className="absolute top-3 right-3 text-[#7C7399] hover:text-white transition text-sm"
      >
        ✕
      </button>

      {/* HEADER (LEFT ALIGNED) */}
      <h2 className="text-lg font-bold text-white text-left">
        Scanning Wallet
      </h2>

      <p className="text-xs text-[#A5A0B8] text-left mt-1">
        Discovering your Relics...
      </p>

      {/* SPINNING RELIC */}
      <div className="flex justify-center mt-4">
        <img
          src="/relicc.png"
          alt="Relic"
          className="w-20 h-20 animate-spin"
          style={{
            animationDuration: "4s",
          }}
        />
      </div>

      {/* STATUS */}
      <p className="text-center text-xs text-white mt-3">
  {scanStep === 0 && "Verifying Wallet Connection..."}
  {scanStep === 1 && "Scanning for Relics..."}
  {scanStep === 2 && "Preparing XP Rewards..."}
  {scanStep >= 3 && "52 Relics Ready"}
</p>

      {/* STEPS */}
      <div className="space-y-3 mt-5">
        {[
          "Verifying Wallet Connection",
          "Scanning for Relics",
          "Preparing XP Rewards",
        ].map((label, index) => {
          const completed = scanStep > index;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border"
                style={{
                  color: completed ? "#00E1A2" : "#7C7399",
                  borderColor: completed ? "#00E1A2" : "#7C7399",
                }}
              >
                {index + 1}
              </div>

              <span
                style={{
                  color: completed ? "#00E1A2" : "#7C7399",
                }}
                className="text-xs"
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* CLAIM BUTTON */}
      <button
        disabled={scanStep < 3}
        className={`w-full mt-6 py-2.5 rounded-2xl text-sm font-medium transition ${
          scanStep >= 3
            ? "bg-[#8B3EFE] text-white"
            : "bg-[#8B3EFE] text-white opacity-50 cursor-not-allowed"
        }`}
      >
        Claim 500 XP
      </button>
    </div>
  </div>
)}

    </div>
  );
}