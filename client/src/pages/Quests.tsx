"use client";

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );
    };

    const durationText = isActive
      ? quest.starts_at && quest.ends_at
        ? `${formatDate(
            quest.starts_at
          )} - ${formatDate(quest.ends_at)}`
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
        <Card className="bg-[#0B0B0F] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#8B3EFE66] hover:shadow-[0_0_30px_rgba(139,62,254,0.12)] flex flex-col h-full">

          {/* IMAGE */}
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={
                quest.project_image || "/quest-1.png"
              }
              alt={quest.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-black/20 to-transparent" />

            {/* STATUS */}
            <div className="absolute top-3 right-3">
              <Badge
                className={`border text-[10px] px-2 py-1 rounded-full backdrop-blur-md ${
                  isActive
                    ? "bg-[#00E1A21A] text-[#00E1A2] border-[#00E1A233]"
                    : "bg-[#8B3EFE1A] text-[#B388FF] border-[#8B3EFE33]"
                }`}
              >
                {isActive
                  ? "Active"
                  : "Scheduled"}
              </Badge>
            </div>

            {/* CATEGORY */}
            {quest.category && (
              <div className="absolute top-3 left-3">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-[10px] px-2 py-1 rounded-full">
                  {quest.category}
                </div>
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-4 flex flex-col flex-1">

            {/* PROJECT */}
            <div className="flex items-center gap-2 mb-3">
              <img
                src={
                  quest.project_image ||
                  "/quest-1.png"
                }
                alt={quest.project_name}
                className="w-5 h-5 rounded-full object-cover"
              />

              <span className="text-xs text-white/60 truncate">
                {quest.project_name ||
                  "Intuition Ecosystem"}
              </span>
            </div>

            {/* TITLE */}
            <h2 className="text-lg font-semibold text-white leading-tight line-clamp-2">
              {quest.title}
            </h2>

            {/* DESCRIPTION */}
            <p className="text-sm text-white/55 mt-2 line-clamp-2">
              {quest.sub_title ||
                "No description available"}
            </p>

            {/* META */}
            <div className="mt-4 space-y-2">

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">
                  Reward
                </span>

                <span className="font-semibold text-[#00E1A2]">
                  {quest.reward} XP
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">
                  Duration
                </span>

                <span className="text-white/75 text-xs">
                  {durationText}
                </span>
              </div>

            </div>

            {/* CTA */}
            <Button
              onClick={() => startQuest(quest)}
              disabled={!isActive}
              className={`mt-5 h-11 rounded-xl font-medium transition-all ${
                isActive
                  ? "bg-[#8B3EFE] hover:bg-[#7A32E0] text-white"
                  : "bg-white/5 text-white/40 cursor-not-allowed"
              }`}
            >
              {isActive
                ? quest.joined
                  ? "Continue Quest"
                  : "Start Quest"
                : "Coming Soon"}
            </Button>

          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050507] via-[#08060D] to-black text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* HEADER */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8B3EFE] animate-pulse" />

            <span className="text-[#8B3EFE] text-[11px] font-semibold uppercase tracking-[0.2em]">
              Quests
            </span>
          </div>

          <h2 className="text-3xl sm:text-3xl font-bold tracking-tight">
            Quests
          </h2>

          <p className="text-sm sm:text-base text-white/50 mt-3 max-w-2xl">
            Complete these quests to earn rewards
          </p>
        </div>

        {/* ACTIVE QUESTS */}
        {isLoading ? (
          <div className="text-center py-16 text-white/50">
            Loading quests...
          </div>
        ) : activeQuests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111114] p-10 text-center">
            <p className="text-white/60">
              No active quests at the moment.
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeQuests.map((quest, i) =>
              renderQuestCard(quest, true, i)
            )}
          </div>
        )}

        {/* SCHEDULED QUESTS */}
        {scheduledQuests.length > 0 && (
          <div className="mt-14">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                Scheduled Quests
              </h2>

              <p className="text-sm text-white/45 mt-1">
                Upcoming quests launching soon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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