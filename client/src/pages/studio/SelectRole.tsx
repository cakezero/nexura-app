"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { CardTitle, CardDescription } from "../../components/ui/card";
import { useLocation } from "wouter";

export default function SelectRole() {
  const [activeRole, setActiveRole] = useState<"project" | "user" | null>(null);
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
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-xl mx-auto relative z-10 space-y-6 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-6">

        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">
            Nexura Studio
          </h1>
          <p className="text-white/60">
            Create a dedicated hub for yourself as a User or Project
          </p>
        </div>

        <div>
          <CardTitle className="text-sm mb-4">
            You are ...
          </CardTitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Project */}
          <button
            type="button"
            onClick={() => setActiveRole("project")}
            className={`rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition border
            ${
              activeRole === "project"
                ? "bg-[#1C0B32] border-[#A760FF] scale-[1.02]"
                : "bg-[#0E061A] border-[#A760FF1A]"
            }`}
          >
            <img src="/project-icon.png" alt="Project icon" className="w-10 h-10" />

            <CardTitle className="text-lg">
              a project
            </CardTitle>

            <CardDescription className="text-white/60">
              A project or team looking to plan, launch, and grow structured community engagement.
            </CardDescription>
          </button>

          {/* User */}
          <button
            type="button"
            onClick={() => setActiveRole("user")}
            className={`rounded-2xl p-6 flex flex-col items-center text-center gap-3 transition border
            ${
              activeRole === "user"
                ? "bg-[#1C0B32] border-[#A760FF] scale-[1.02]"
                : "bg-[#0E061A] border-[#A760FF1A]"
            }`}
          >
            <img src="/single-user.png" alt="User icon" className="w-10 h-10" />

            <CardTitle className="text-lg">
              a Nexura user
            </CardTitle>

            <CardDescription className="text-white/60">
              An individual creator or contributor looking to share ideas or connect
            </CardDescription>
          </button>

        </div>

        {/* Bottom-right button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleContinue}
            disabled={!activeRole}
            className={`px-6 py-3 rounded-xl font-semibold transition
            ${
              activeRole
                ? "bg-[#8B3EFE] hover:opacity-90"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>

      </div>
    </div>
  );
}