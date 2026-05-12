"use client";

import { useEffect, useState } from "react";
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
}

export default function Quests() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const userId = user?._id || "";

  const [visitedTasks, setVisitedTasks] = useState<string[]>(() => {
    return (
      JSON.parse(
        localStorage.getItem(
          "nexura:one-time-quest:visited"
        ) || "{}"
      )[userId] || []
    );
  });

  const [claimedTasks, setClaimedTasks] = useState<string[]>(() => {
    return (
      JSON.parse(
        localStorage.getItem(
          "nexura:one-time-quest:claimed"
        ) || "{}"
      )[userId] || []
    );
  });

  const [serverOffset, setServerOffset] = useState(0);
  const [countdowns, setCountdowns] = useState<
    Record<string, string>
  >({});

  const { toast } = useToast();

  // SERVER TIME SYNC
  useEffect(() => {
    const getServerTime = async () => {
      try {
        const res = await fetch(
          "https://nexura-app.onrender.com/api/server-time"
        );

        const data = await res.json();

        setServerOffset(data.serverTime - Date.now());
      } catch {
        //
      }
    };

    getServerTime();
  }, []);

  const { data, isLoading } = useQuery<{
    oneTimeQuests: Quest[];
    quests: Quest[];
    featuredQuests: Quest[];
  }>({
    queryKey: ["/api/quests"],
    queryFn: async () => {
      const res = await apiRequestV2(
        "GET",
        "/api/quests"
      );

      return res;
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const value: Record<string, string[]> = {};

    value[userId] = visitedTasks;

    localStorage.setItem(
      "nexura:one-time-quest:visited",
      JSON.stringify(value)
    );
  }, [visitedTasks]);

  useEffect(() => {
    const value: Record<string, string[]> = {};

    value[userId] = claimedTasks;

    localStorage.setItem(
      "nexura:one-time-quest:claimed",
      JSON.stringify(value)
    );
  }, [claimedTasks]);

  const allQuests: Quest[] = data?.quests ?? [];

  const isScheduled = (q: Quest) => {
    const nowMs = Date.now() + serverOffset;

    return (
      q.status === "Scheduled" ||
      (!!q.starts_at &&
        new Date(q.starts_at).getTime() > nowMs &&
        q.status !== "Ended" &&
        q.status !== "Save")
    );
  };

  const activeQuests = allQuests.filter(
    (q) =>
      q.status === "Active" ||
      (!isScheduled(q) &&
        q.status !== "Ended" &&
        q.status !== "Save")
  );

  const scheduledQuests = allQuests.filter(isScheduled);

  // COUNTDOWN TIMER
  useEffect(() => {
    if (scheduledQuests.length === 0) return;

    const tick = () => {
      const n = Date.now() + serverOffset;

      const newCountdowns: Record<string, string> = {};

      for (const q of scheduledQuests) {
        const diff =
          new Date(q.starts_at!).getTime() - n;

        if (diff <= 0) {
          newCountdowns[q._id] = "Starting...";
        } else {
          const d = Math.floor(diff / 86400000);
          const h = Math.floor(
            (diff % 86400000) / 3600000
          );

          const m = Math.floor(
            (diff % 3600000) / 60000
          );

          const s = Math.floor(
            (diff % 60000) / 1000
          );

          newCountdowns[q._id] =
            d > 0
              ? `${d}d ${h}h ${m}m ${s}s`
              : `${h}h ${m}m ${s}s`;
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
        await apiRequestV2(
          "POST",
          "/api/quest/start-quest",
          {
            questId: quest._id,
          }
        );

        toast({
          title: "Quest Started",
          description: `You have started the quest: ${quest.title}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            "Failed to start the quest. Please try again.",
          variant: "destructive",
        });

        return;
      }
    }

    setLocation(`/quest/${quest._id}`);
  };

  const renderQuestCard = (
    quest: Quest,
    isActive: boolean = true,
    index: number = 0
  ) => {
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "N/A";

      return new Date(dateStr).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "long",
        }
      );
    };

    const durationText = isActive
      ? quest.starts_at && quest.ends_at
        ? `${formatDate(quest.starts_at)} – ${formatDate(quest.ends_at)}`
        : "Ongoing"
      : countdowns[quest._id]
      ? `Starts in ${countdowns[quest._id]}`
      : "Coming Soon";

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
        <Card className="bg-[#0d1117] h-full border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition flex flex-col">
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
              ) : (
                <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span className="text-purple-300 text-[0.6rem] sm:text-xs font-mono font-semibold">
                    {countdowns[quest._id] || "Coming Soon"}
                  </span>
                </div>
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

            <div className="flex flex-row justify-between text-xs items-center">
              <span className="text-gray-500">Reward:</span>
              <span className="text-white flex items-center gap-1 text-right">
                {quest.reward} XP
              </span>
            </div>

            <div className="flex flex-row justify-between text-xs items-center">
              <span className="text-gray-500">Duration:</span>
              <span className="text-white flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {durationText}
              </span>
            </div>

            <Button
              className={`w-full mt-auto pt-2 py-2 text-xs font-medium rounded-xl ${
                isActive
                  ? "bg-[#1f6feb] hover:bg-[#388bfd] text-white"
                  : "bg-gray-600 cursor-not-allowed text-gray-300"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                startQuest(quest);
              }}
              disabled={!isActive}
            >
              {isActive ? (
                <>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {quest.joined ? "Continue Quest" : "Start Quest"}
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Coming Soon
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
            <div className="text-center py-6 sm:py-12 text-muted-foreground">
              Loading quests...
            </div>
          ) : activeQuests.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-6 sm:p-8 text-center">
              <p className="text-white/60">
                No active quests at the moment. Check back soon.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {activeQuests.map((quest, i) =>
                renderQuestCard(quest, true, i)
              )}
            </div>
          )}
        </div>

        {/* SCHEDULED QUESTS */}
        {scheduledQuests.length > 0 && (
          <div className="space-y-4 sm:space-y-6 mt-8 sm:mt-12">
            <h2 className="text-lg sm:text-2xl font-semibold text-white">
              Scheduled Quests
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {scheduledQuests.map((quest, i) =>
                renderQuestCard(
                  quest,
                  false,
                  i
                )
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}