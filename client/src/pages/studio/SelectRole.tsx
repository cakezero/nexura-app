"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import AnimatedBackground from "../../components/AnimatedBackground";
import { useWallet } from "../../hooks/use-wallet";
import { useToast } from "../../hooks/use-toast";

function getMainAppUsername(): string {
  try {
    const raw = localStorage.getItem("user_profile");
    if (!raw) return "";
    const profile = JSON.parse(raw) as Record<string, unknown>;
    return (profile.name as string) || (profile.username as string) || "";
  } catch {
    return "";
  }
}

export default function SelectRole() {
  const [activeRole, setActiveRole] = useState<"project" | "user" | null>("project");
  const [, setLocation] = useLocation();
  const { isConnected } = useWallet();
  const { toast } = useToast();

  const mainAppUsername = getMainAppUsername();

  const handleUserSelect = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet before creating a user hub.",
        variant: "destructive",
      });
      return;
    }

    if (!mainAppUsername) {
      toast({
        title: "Username required",
        description: "You need to set a username on the main app profile first. Sign in to Nexura and update your profile.",
        variant: "destructive",
      });
      return;
    }

    setActiveRole("user");
  };

  const handleContinue = () => {
    if (!activeRole) return;

    if (activeRole === "user") {
      if (!isConnected) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet before continuing.",
          variant: "destructive",
        });
        return;
      }

      if (!mainAppUsername) {
        toast({
          title: "Username required",
          description: "You need to set a username on the main app profile first. Sign in to Nexura and update your profile.",
          variant: "destructive",
        });
        return;
      }
    }

    if (activeRole === "project") {
      setLocation("/studio/projects/create");
    } else {
      setLocation("/studio/users/create");
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col relative overflow-hidden font-geist">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center items-start opacity-80 z-0">
        <img 
          src="/studio/top-gradient.png" 
          alt="" 
          className="w-full max-w-[1400px] h-auto object-cover opacity-80 mix-blend-screen -mt-[200px] pointer-events-none" 
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-[16px] pb-10 px-4 shrink-0">

        {/* Back Button */}
        <div className="w-full flex justify-start mb-3">
          <button
            onClick={() => setLocation("/studio")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Explore
          </button>
        </div>
        
        {/* ORGANIZATION TOOL Badge */}
        <div className="flex items-center gap-2.5 bg-[#370953] border-2 border-[#572082] rounded-full px-3.5 py-1.5 mb-5">
          <div className="size-2 rounded-full bg-[#B077E8] shrink-0" />
          <span className="text-white text-[10px] font-semibold tracking-wider uppercase">
            ORGANIZATION TOOL
          </span>
        </div>

        {/* Nexura Studio Title */}
        <h1 className="text-2xl font-black leading-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#c287fc] pb-0.5">
          Nexura Studio
        </h1>

        {/* Subtitle */}
        <p className="text-sm font-medium text-white/60 mb-10 text-center leading-relaxed">
          Create a dedicated hub for yourself as a User or Project
        </p>

        {/* "You are?" and Cards container */}
        <div className="flex flex-col items-start w-full max-w-lg">
          <h2 className="text-base font-bold text-white mb-4">
            You are?
          </h2>

          <div className="flex flex-col md:flex-row gap-6 w-full mb-10 justify-center items-center">
            {/* Project Card */}
            <button
              type="button"
              onClick={() => setActiveRole("project")}
              className={`flex-none w-full max-w-[260px] h-[180px] rounded-2xl p-0 flex flex-col items-center justify-center text-center border-2 transition-all duration-200 cursor-pointer overflow-hidden relative
                ${activeRole === "project"
                  ? "bg-[#1C0B32] border-[#A760FF]"
                  : "bg-[#0E061A] border-[rgba(167,96,255,0.1)] hover:border-[#A760FF]/50"
                }`}
            >
              <img
                src="/studio/pro-app-eco.png"
                alt="Project"
                className="size-14 mb-3 object-cover pointer-events-none"
              />
              <span className="text-sm font-bold text-white/90 mb-1">
                a project
              </span>
              <span className="text-[11px] font-medium text-white/60 px-3 max-w-[240px] leading-snug">
                A project or team looking to plan, launch, and grow structured community engagement.
              </span>
            </button>

            {/* User Card */}
            <button
              type="button"
              onClick={handleUserSelect}
              className={`flex-none w-full max-w-[260px] h-[180px] rounded-2xl p-0 flex flex-col items-center justify-center text-center border-2 transition-all duration-200 cursor-pointer overflow-hidden relative
                ${activeRole === "user"
                  ? "bg-[#1C0B32] border-[#A760FF]"
                  : "bg-[#0E061A] border-[rgba(167,96,255,0.1)] hover:border-[#A760FF]/50"
                }`}
            >
              <img
                src="/studio/nexura-user.png"
                alt="User"
                className="size-14 mb-3 object-cover pointer-events-none"
              />
              <span className="text-sm font-bold text-white mb-1">
                a Nexura user
              </span>
              <span className="text-[11px] font-medium text-white/60 px-3 max-w-[240px] leading-snug">
                An individual creator or contributor looking to share ideas or connect
              </span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="w-full max-w-lg flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!activeRole}
            className={`w-[180px] h-[42px] rounded-xl font-semibold text-sm text-white flex items-center justify-center transition-all duration-200
              ${activeRole
                ? "bg-[#8B3EFE] hover:brightness-110 cursor-pointer"
                : "bg-[#8B3EFE]/50 cursor-not-allowed"
              }`}
          >
            Continue
          </button>
        </div>

      </main>
    </div>
  );
}
