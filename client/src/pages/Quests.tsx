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

const QUESTS = [
  {
    id: 1,
    title: "Complete 3 Tasks",
    description: "Finish any 3 tasks today to earn XP.",
    xp: 100,
    type: "daily",
  },
  {
    id: 2,
    title: "Login Streak",
    description: "Log in for 2 consecutive days.",
    xp: 150,
    type: "daily",
  },
  {
    id: 3,
    title: "Daily Challenge Run",
    description: "Complete one challenge run.",
    xp: 120,
    type: "daily",
  },

  {
    id: 4,
    title: "Winter Event Quest",
    description: "Complete seasonal winter missions.",
    xp: 500,
    type: "seasonal",
  },
  {
    id: 5,
    title: "Festival Participation",
    description: "Join the ongoing festival event.",
    xp: 600,
    type: "seasonal",
  },
  {
    id: 6,
    title: "Limited Time Hunt",
    description: "Find hidden items in the event map.",
    xp: 700,
    type: "seasonal",
  },

  {
    id: 7,
    title: "Featured Boss Battle",
    description: "Defeat the featured boss for big rewards.",
    xp: 1000,
    type: "featured",
  },
  {
    id: 8,
    title: "Elite Mission",
    description: "Complete the elite featured mission chain.",
    xp: 900,
    type: "featured",
  },
  {
    id: 9,
    title: "Legendary Drop",
    description: "Secure a rare legendary drop.",
    xp: 1200,
    type: "featured",
  },
  {
    id: 10,
    title: "Community Goal",
    description: "Contribute to the global quest objective.",
    xp: 800,
    type: "featured",
  },
];

export default function Quests() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const QUEST_FILTERS = {
    DAILY: "daily",
    SEASONAL: "seasonal",
    FEATURED: "featured",
  };

  const [questFilter, setQuestFilter] = useState(QUEST_FILTERS.DAILY);

const QUESTS = [
  {
    id: 0,
    title: "Relic Checker",
    description: "Verify relic ownership and earn XP.",
    xp: 500,
    type: "featured",
    isRelicQuest: true,
    buttonText: "Check Relic",
  },

  {
    id: 1,
    title: "Follow Us on Twitter",
    description: "Follow our official account and submit proof.",
    xp: 200,
    type: "daily",
    taskType: "twitter",
    buttonText: "Start Quest",
  },

  {
    id: 2,
    title: "Complete 3 Tasks",
    description: "Finish any 3 tasks today to earn XP.",
    xp: 100,
    type: "daily",
    buttonText: "Start Quest",
  },

  {
    id: 3,
    title: "Login Streak",
    description: "Log in for 2 consecutive days.",
    xp: 150,
    type: "daily",
    buttonText: "Start Quest",
  },

  {
    id: 4,
    title: "Daily Challenge Run",
    description: "Complete one challenge run.",
    xp: 120,
    type: "daily",
    buttonText: "Start Quest",
  },

  {
    id: 5,
    title: "Winter Event Quest",
    description: "Complete seasonal winter missions.",
    xp: 500,
    type: "seasonal",
    buttonText: "Start Quest",
  },

  {
    id: 6,
    title: "Festival Participation",
    description: "Join the ongoing festival event.",
    xp: 600,
    type: "seasonal",
    buttonText: "Start Quest",
  },

  {
    id: 7,
    title: "Limited Time Hunt",
    description: "Find hidden items in the event map.",
    xp: 700,
    type: "seasonal",
    buttonText: "Start Quest",
  },

  {
    id: 8,
    title: "Featured Boss Battle",
    description: "Defeat the featured boss for big rewards.",
    xp: 1000,
    type: "featured",
    buttonText: "Start Quest",
  },

  {
    id: 9,
    title: "Elite Mission",
    description: "Complete the elite featured mission chain.",
    xp: 900,
    type: "featured",
    buttonText: "Start Quest",
  },

  {
    id: 10,
    title: "Legendary Drop",
    description: "Secure a rare legendary drop.",
    xp: 1200,
    type: "featured",
    buttonText: "Start Quest",
  },

  {
    id: 11,
    title: "Community Goal",
    description: "Contribute to the global quest objective.",
    xp: 800,
    type: "featured",
    buttonText: "Start Quest",
  },
];

const [showRelicModal, setShowRelicModal] = useState(false);

const [scanStep, setScanStep] = useState(0);
// 0 = scanning
// 1 = relics found
// 2 = preparing rewards
// 3 = complete

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

  const filteredQuests = QUESTS.filter(
    (quest) => quest.type === questFilter
  );

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


        {/* FILTERED HEADINGS */}
        <h2 className="text-lg font-semibold text-white mt-4">
  {questFilter === "daily" && "Daily Quests"}
  {questFilter === "seasonal" && "Seasonal Quests"}
  {questFilter === "featured" && "Featured Quests"}
</h2>

        {/* QUEST CARDS */}
<div className="grid grid-cols-1 gap-3 mt-4">
  {filteredQuests.map((quest) => (
<div
  key={quest.id}
  className="grid grid-cols-[1fr_120px_auto] items-center gap-4 p-3 rounded-xl bg-[#0A0E13B2] border border-[#8B3EFE33] hover:border-[#8B3EFE] transition"
>
  {/* LEFT */}
  <div className="flex items-center gap-3 min-w-0">
    <div className="w-8 h-8 rounded-lg bg-[#8B3EFE22] flex items-center justify-center text-[#8B3EFE] text-[10px] font-bold shrink-0">
      Q
    </div>

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
      {quest.xp} XP
    </p>
  </div>

  {/* BUTTON */}
  <button
    onClick={() => {
      if (quest.taskType === "twitter") {
        setActiveQuestId(quest.id);
      } else if (quest.isRelicQuest) {
        setShowRelicModal(true);
        setScanStep(0);
      }
    }}
    className="px-3 py-1 text-[12px] rounded-full bg-[#8B3EFE] text-white whitespace-nowrap hover:opacity-90 transition"
  >
    {quest.taskType === "twitter" && activeQuestId === quest.id
      ? "Submit Proof"
      : quest.buttonText}
  </button>

  {/* TWITTER EXPANDED CARD (FULL WIDTH) */}
  {quest.taskType === "twitter" && activeQuestId === quest.id && (
    <div className="col-span-3 mt-3">
      <div className="bg-[#0A0A0A] border border-[#8B3EFE33] rounded-xl p-3 space-y-3">

        {/* WARNING HEADER */}
        <div className="flex items-start gap-2 text-yellow-400 text-[11px]">
          <span>⚠️</span>
          <p>
            It may take 10 minutes to 10 hours to validate your submission.
          </p>
        </div>

        {/* INPUT */}
        <input
          value={proofInput}
          onChange={(e) => setProofInput(e.target.value)}
          placeholder="Paste your comment link or twitter username here..."
          className="w-full px-3 py-2 text-xs rounded-lg bg-[#060210] border border-[#8B3EFE33] text-white outline-none"
        />

        {/* SUBMIT BUTTON */}
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
  ))}
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