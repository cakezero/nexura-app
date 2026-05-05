"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import AnimatedBackground from "../../components/AnimatedBackground";

export default function SelectRole() {
  const [activeRole, setActiveRole] = useState<"project" | "user" | null>("project");
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    if (!activeRole) return;
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

      {/* Header Container */}
      <div className="w-full flex justify-center sticky top-0 z-50">
        <header className="w-full max-w-[1354px] h-[110px] shrink-0 backdrop-blur-[125px] bg-[rgba(255,255,255,0.03)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-between px-8 md:px-[60px]">
          <div className="flex items-center gap-6">
            {/* Back Button */}
            <button
              onClick={() => setLocation("/studio")}
              className="inline-flex items-center justify-center p-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <img src="/studio/logo.png" alt="Nexura" className="h-[33px] w-auto pointer-events-none" />
          </div>
          
          <img src="/studio/user-profile.png" alt="Profile" className="size-[50px] md:size-[70px] pointer-events-none" />
        </header>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-[54px] pb-10 px-4 shrink-0">
        
        {/* ORGANIZATION TOOL Badge */}
        <div className="flex items-center gap-[15px] bg-[#370953] border-2 border-[#572082] rounded-[21px] px-[18px] py-[8px] mb-[30px] h-[35px]">
          <div className="size-[10px] rounded-full bg-[#B077E8] shrink-0" />
          <span className="text-white text-[12px] font-semibold tracking-[0.48px] leading-[18.2px] uppercase">
            ORGANIZATION TOOL
          </span>
        </div>

        {/* Nexura Studio Title */}
        <h1 className="text-[35px] font-black leading-tight mb-[26.5px] bg-clip-text text-transparent bg-gradient-to-r from-white to-[#c287fc] pb-1">
          Nexura Studio
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)] mb-[58px] text-center leading-[28px]">
          Create a dedicated hub for yourself as a User or Project
        </p>

        {/* "You are?" and Cards container */}
        <div className="flex flex-col items-start w-full max-w-[700px]">
          <h2 className="text-[20.5px] font-bold text-white mb-[22px] leading-normal">
            You are?
          </h2>

          <div className="flex flex-col md:flex-row gap-[46px] w-full mb-[50px] justify-center items-center">
            {/* Project Card */}
            <button
              type="button"
              onClick={() => setActiveRole("project")}
              className={`flex-none w-full max-w-[327px] h-[236px] rounded-[25.67px] p-0 flex flex-col items-center justify-center text-center border-[2.19px] transition-all duration-200 cursor-pointer overflow-hidden relative
                ${activeRole === "project"
                  ? "bg-[#1C0B32] border-[#A760FF]"
                  : "bg-[#0E061A] border-[rgba(167,96,255,0.1)] hover:border-[#A760FF]/50"
                }`}
            >
              <img
                src="/studio/pro-app-eco.png"
                alt="Project"
                className="size-[73px] mb-[15px] object-cover pointer-events-none"
              />
              <span className="text-[14.6px] font-bold text-[rgba(255,255,255,0.9)] mb-[7px] leading-[13.28px]">
                a project
              </span>
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)] tracking-[0.96px] leading-[20.6px] px-[13px] max-w-[300px]">
                A project or team looking to plan, launch, and grow structured community engagement.
              </span>
            </button>

            {/* User Card */}
            <button
              type="button"
              onClick={() => setActiveRole("user")}
              className={`flex-none w-full max-w-[327px] h-[236px] rounded-[25.67px] p-0 flex flex-col items-center justify-center text-center border-[2.19px] transition-all duration-200 cursor-pointer overflow-hidden relative
                ${activeRole === "user"
                  ? "bg-[#1C0B32] border-[#A760FF]"
                  : "bg-[#0E061A] border-[rgba(167,96,255,0.1)] hover:border-[#A760FF]/50"
                }`}
            >
              <img
                src="/studio/nexura-user.png"
                alt="User"
                className="size-[73px] mb-[15px] object-cover pointer-events-none"
              />
              <span className="text-[14.6px] font-bold text-white mb-[7px] leading-[13.28px]">
                a Nexura user
              </span>
              <span className="text-[12px] font-medium text-[rgba(255,255,255,0.6)] tracking-[0.96px] leading-[20px] px-[14px] max-w-[299px]">
                An individual creator or contributor looking to share ideas or connect
              </span>
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="w-full max-w-[700px] flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!activeRole}
            className={`w-[238px] h-[50px] rounded-[15px] font-semibold text-[18px] text-white flex items-center justify-center leading-[20px] transition-all duration-200
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
