import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AnimatedBackground from "../components/AnimatedBackground";
import { apiRequestV2 } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../lib/auth";
import { motion } from "framer-motion";
import QuestCard from "../components/QuestCard";

interface Quest {
  _id: string;
  title: string;
  sub_title: string;
  project_name?: string;
  description?: string;
  done: boolean;
  project_image?: string;
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
}

export default function Quests() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const userId = user?._id || "";

  const [visitedTasks, setVisitedTasks] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('nexura:one-time-quest:visited') || '[]')[userId] || [];
  });
  const [serverOffset, setServerOffset] = useState(0);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // Server time sync
  useEffect(() => {
    const getServerTime = async () => {
      try {
        const res = await fetch("https://nexura-app.onrender.com/api/server-time");
        const data = await res.json();
        setServerOffset(data.serverTime - Date.now());
      } catch { /* ignore */ }
    };
    getServerTime();
  }, []);

  const [claimedTasks, setClaimedTasks] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('nexura:one-time-quest:claimed') || '[]')[userId] || [];
  });

  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    oneTimeQuests: Quest[];
    quests: Quest[];
    featuredQuests: Quest[];
  }>({
    queryKey: ["/api/quests"],
    queryFn: async () => {
      const res = await apiRequestV2("GET", "/api/quests");
      return res;
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const value: Record<string, string[]> = {};
    value[userId] = visitedTasks;
    localStorage.setItem('nexura:one-time-quest:visited', JSON.stringify(value));
  }, [visitedTasks]);

  useEffect(() => {
    const value: Record<string, string[]> = {};
    value[userId] = claimedTasks;
    localStorage.setItem('nexura:one-time-quest:claimed', JSON.stringify(value));
  }, [claimedTasks]);

  const allQuests: Quest[] = data?.quests ?? [];

    const isScheduled = (q: Quest) => {
    const nowMs = Date.now() + serverOffset;
    return q.status === "Scheduled" || (!!q.starts_at && new Date(q.starts_at).getTime() > nowMs && q.status !== "Ended" && q.status !== "Save");
  };

  const activeQuests = allQuests.filter((q) => q.status === "Active" || (!isScheduled(q) && q.status !== "Ended" && q.status !== "Save"));
  const scheduledQuests = allQuests.filter(isScheduled);

  // Countdown timer
  useEffect(() => {
    if (scheduledQuests.length === 0) return;
    const tick = () => {
      const n = Date.now() + serverOffset;
      const newCountdowns: Record<string, string> = {};
      for (const q of scheduledQuests) {
        const diff = new Date(q.starts_at!).getTime() - n;
        if (diff <= 0) {
          newCountdowns[q._id] = "Starting...";
        } else {
          const d = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          newCountdowns[q._id] = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
        }
      }
      setCountdowns(newCountdowns);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledQuests.length, serverOffset]);

  const startQuest = async (quest: Quest) => {
    if (!quest.joined) {
      try {
        await apiRequestV2("POST", "/api/quest/start-quest", {
          questId: quest._id,
        });
        toast({
          title: "Quest Started",
          description: `You have started the quest: ${quest.title}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start the quest. Please try again.",
          variant: "destructive",
        });

        return;
      }
    }

    setLocation(`/quest/${quest._id}`);
  }

  const renderQuestCard = (quest: Quest, isActive: boolean = true, index: number = 0) => {
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const durationText = isActive 
      ? (quest.starts_at && quest.ends_at ? `${formatDate(quest.starts_at)} - ${formatDate(quest.ends_at)}` : "Ongoing")
      : (countdowns[quest._id] ? `Starts in ${countdowns[quest._id]}` : "Coming Soon");

    return (
      <motion.div
        key={quest._id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      >
        <QuestCard
          title={quest.title}
          description={quest.sub_title}
          projectName={quest.project_name || "Intuition Ecosystem"}
          projectLogo={quest.project_image || "/quest-1.png"}
          heroImage={quest.project_image || "/quest-1.png"}
          rewards={`${quest.reward} XP`}
          duration={durationText}
          questId={quest._id}
          isLocked={!isActive}
          lockLevel={1}
        />
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0718] via-[#0a0615] to-black text-white p-6 relative">
      <AnimatedBackground />

      <div className="mx-auto space-y-6 relative z-10 max-w-full sm:max-w-6xl px-1 sm:px-0">
        {/* Heading */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">Quests</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Quests</h1>
          <p className="text-sm text-white/50 mt-1">
            Complete these quests to earn rewards
          </p>
        </div>

        {/* Active Quests */}
        {isLoading ? (
          <div className="text-center py-12 text-white/60">Loading quests...</div>
        ) : activeQuests.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md">
            <p className="text-white/60">No active quests at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeQuests.map((quest, i) => renderQuestCard(quest, true, i))}
          </div>
        )}

        {/* Upcoming Quests */}
        {scheduledQuests.length > 0 && (
          <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
            <h2 className="text-lg sm:text-2xl font-semibold text-white">Scheduled Quests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {scheduledQuests.map((quest, i) => renderQuestCard(quest, false, i))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
