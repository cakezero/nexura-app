"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { CardTitle } from "../../../components/ui/card";
import { useLocation } from "wouter";
import { userApiRequest } from "../../../lib/userApi";
import { useToast } from "../../../hooks/use-toast";

function getUserProfile() {
  try {
    const raw = localStorage.getItem("user_profile");
    if (!raw) return { name: "", avatar: "" };
    const profile = JSON.parse(raw) as Record<string, unknown>;
    return {
      name: (profile.name as string) || (profile.username as string) || "",
      avatar: (profile.profilePic as string) || "",
    };
  } catch {
    return { name: "", avatar: "" };
  }
}

export default function UsersHub() {
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { name, avatar } = getUserProfile();

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", "");

      await userApiRequest({
        method: "POST",
        endpoint: "/user-hub/create-user-hub",
        formData: fd,
      });

      toast({ title: "Hub created!", description: "Your user hub has been created successfully." });

      setLocation("/user-dashboard/user-profile");
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-xl mx-auto relative z-10 space-y-6 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-6 text-center">

        <CardTitle className="text-lg">Create User Hub</CardTitle>

        {avatar ? (
          <img src={avatar} alt={name} className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-purple-500" />
        ) : (
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center text-white/40 text-xs">
            No avatar
          </div>
        )}

        <p className="text-white/60 text-sm">
          Your hub will be created using your Nexura profile.
        </p>

        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-white/50 text-xs">Username</span>
            <span className="text-white text-sm font-mono">{name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-xs">Avatar</span>
            <span className="text-white text-sm">{avatar ? "✓ Loaded" : "—"}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !name}
          className="w-full bg-[#8B3EFE] py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Hub"}
        </button>

      </div>
    </div>
  );
}
