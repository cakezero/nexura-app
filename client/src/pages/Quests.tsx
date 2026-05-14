"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Clock, Users } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import { apiRequestV2 } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../lib/auth";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const userId = user?._id || "";

  const [serverOffset, setServerOffset] = useState(0);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const now = Date.now() + serverOffset;

  const isEndedQuest = (quest: Quest) =>
    quest.status === "Ended" || (!!quest.ends_at && new Date(quest.ends_at).getTime() <= now);
  const isScheduledQuest = (quest: Quest) =>
    !isEndedQuest(quest) && !!quest.starts_at && new Date(quest.starts_at).getTime() > now;
  const isActiveQuest = (quest: Quest) =>
    !isScheduledQuest(quest) && !isEndedQuest(quest) && quest.status !== "Save";

  // SERVER TIME SYNC
  useEffect(() => {
    const getServerTime = async () => {
      try {
        const res = await apiRequestV2("GET", "/api/server-time");
        setServerOffset(res.serverTime - Date.now());
      } catch {
        // fallback
      }
    };
    getServerTime();
  }, []);

  const { data, isLoading, refetch } = useQuery<{
    oneTimeQuests: Quest[];
    quests: Quest[];
    featuredQuests: Quest[];
  }>({
    queryKey: ["/api/quests"],
    queryFn: async () => {
      const res = await apiRequestV2("GET", "/api/quests");
      return res;
    },
    refetchInterval: 300000,
    refetchIntervalInBackground: true,
  });

  const allQuests: Quest[] = data?.quests ?? [];

  const activeQuests = allQuests.filter(isActiveQuest);
  const upcomingQuests = allQuests.filter(isScheduledQuest);
  const endedQuests = allQuests.filter(isEndedQuest);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (upcomingQuests.length === 0) return;

    const tick = () => {
      const n = Date.now() + serverOffset;
      const newCountdowns: Record<string, string> = {};
      let anyExpired = false;

      for (const q of upcomingQuests) {
        const diff = new Date(q.starts_at!).getTime() - n;

        if (diff <= 0) {
          anyExpired = true;
          newCountdowns[q._id] = "Starting...";
        } else {
          const d = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);

          newCountdowns[q._id] = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
        }
      }

      setCountdowns(newCountdowns);
      if (anyExpired) refetch();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [upcomingQuests, serverOffset, refetch]);

  const [isStartingQuest, setIsStartingQuest] = useState<string | null>(null);

  const startQuest = async (quest: Quest) => {
    if (isEndedQuest(quest)) return;
    if (isStartingQuest === quest._id) return;

    if (!quest.joined) {
      setIsStartingQuest(quest._id);
      try {
        await apiRequestV2("POST", "/api/quest/start-quest", {
          questId: quest._id,
        });

        // Refetch to update joined status
        await refetch();

      } catch (error: any) {
        // If the error is "quest already started", we can ignore it and just proceed
        const errorData = error.info || {};
        if (errorData.error !== "quest already started") {
          toast({
            title: "Error",
            description: errorData.error || "Failed to start the quest. Please try again.",
            variant: "destructive",
          });
          setIsStartingQuest(null);
          return;
        }
      } finally {
        setIsStartingQuest(null);
      }
    }

    setLocation(`/quest/${quest._id}`);
  };

  const renderQuestCard = (
    quest: Quest,
    state: "active" | "upcoming" | "ended",
    index: number = 0
  ) => {
    const isActive = state === "active";
    const isUpcoming = state === "upcoming";

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });
    };

    const starts_atFormatted = quest.starts_at ? formatDate(quest.starts_at) : "";
    const ends_atFormatted = quest.ends_at ? formatDate(quest.ends_at) : "TBA";

    const participantCount = quest.participants || 0;

    return (
      <motion.div
        key={quest._id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: index * 0.08,
          ease: "easeOut",
        }}
      >
        <Card className="bg-[#170f1f] h-full border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition flex flex-col">
          {/* Quest Banner */}
          <div className="relative h-36 bg-black w-full">
            {quest.projectCoverImage && (
              <img
                src={quest.projectCoverImage}
                alt={quest.title}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Status Badge / Countdown */}
            <div className="absolute top-2 right-2">
              {isActive ? (
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[0.65rem] sm:text-xs">
                  Active
                </Badge>
              ) : isUpcoming ? (
                <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-purple-300 text-[0.6rem] sm:text-xs font-mono font-semibold">
                    {countdowns[quest._id] || "Loading..."}
                  </span>
                </div>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-200 border border-gray-500/30 text-[0.65rem] sm:text-xs">
                  Ended
                </Badge>
              )}
            </div>

            {/* Category */}
            {quest.category && (
              <div className="absolute top-2 left-2 text-[0.65rem] sm:text-xs text-white/80 font-medium">
                {quest.category}
              </div>
            )}
          </div>

          {/* Quest Details */}
          <div className="p-3 sm:p-4 flex flex-1 flex-col space-y-1.5">
            <h2
              className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.25rem] break-words"
              title={quest.title}
            >
              {quest.title}
            </h2>

            <div className="flex flex-row justify-between text-xs gap-1 items-center">
              <span className="text-gray-500">Creator:</span>
              <span className="text-white line-clamp-1 break-all max-w-[65%] text-right">
                {quest.project_name || "Nexura Ecosystem"}
              </span>
            </div>

            <div className="flex flex-row justify-between text-xs gap-1 items-center">
              <span className="text-gray-500">Participants:</span>
              <span className="text-white flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participantCount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-row justify-between text-xs items-center">
              <span className="text-gray-500">Reward:</span>
              <span className="text-white flex items-center gap-1 text-right">
                {quest.reward} XP
              </span>
            </div>

            {quest.starts_at && (
              <div className="flex flex-row justify-between text-xs items-center">
                <span className="text-gray-500">Duration:</span>
                <span className="text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {starts_atFormatted} – {ends_atFormatted}
                </span>
              </div>
            )}

            <Button
              className={`w-full mt-auto pt-2 py-2 text-xs font-medium rounded-2xl ${
                isActive
                  ? "bg-[#8b3efe] hover:bg-[#B65FC8] text-white"
                  : "bg-gray-600 cursor-not-allowed text-gray-300"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) startQuest(quest);
              }}
              disabled={!isActive || isStartingQuest === quest._id}
            >
              {isActive ? (
                <>
                  {isStartingQuest === quest._id ? (
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  )}
                  {isStartingQuest === quest._id ? "Joining..." : (quest.joined ? "Continue Quest" : "Start Quest")}
                </>
              ) : isUpcoming ? (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Starts in {countdowns[quest._id] || "..."}
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Quest Ended
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
      <AnimatedBackground />

      <div className="max-w-4xl sm:max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        {/* HEADER */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8B3EFE] animate-pulse" />
            <span className="text-[#8B3EFE] text-[11px] font-semibold uppercase tracking-widest">
              Quests
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
            Quests
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete these quests to earn rewards
          </p>
        </div>

        {/* ACTIVE QUESTS */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-2xl font-semibold text-white">Active Quests</h2>
          {isLoading ? (
            <div className="text-center py-6 sm:py-12 text-muted-foreground">Loading quests...</div>
          ) : activeQuests.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-6 sm:p-8 text-center">
              <p className="text-white/60">No active quests at the moment. Check back soon.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {activeQuests.map((quest, i) => renderQuestCard(quest, "active", i))}
            </div>
          )}
        </div>

        {/* UPCOMING QUESTS */}
        <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-2xl font-semibold text-white">Upcoming Quests</h2>
          {isLoading ? (
            <div className="text-center py-6 sm:py-12 text-muted-foreground">Loading quests...</div>
          ) : upcomingQuests.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-6 sm:p-8 text-center">
              <p className="text-white/60">No upcoming quests.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {upcomingQuests.map((quest, i) => renderQuestCard(quest, "upcoming", i))}
            </div>
          )}
        </div>

        {/* ENDED QUESTS */}
        <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-2xl font-semibold text-white">Ended Quests</h2>
          {isLoading ? (
            <div className="text-center py-6 sm:py-12 text-muted-foreground">Loading quests...</div>
          ) : endedQuests.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-6 sm:p-8 text-center">
              <p className="text-white/60">No ended quests yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {endedQuests.map((quest, i) => renderQuestCard(quest, "ended", i))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}