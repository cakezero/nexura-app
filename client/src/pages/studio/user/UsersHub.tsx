"use client";

import React, { useState, useEffect } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { CardTitle } from "../../../components/ui/card";
import { Textarea } from "../../../components/ui/textarea";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { userApiRequest } from "../../../lib/userApi";
import { useToast } from "../../../hooks/use-toast";
import { useWallet } from "../../../hooks/use-wallet";
import { BACKEND_URL } from "../../../lib/constants";

export default function UsersHub() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileError, setProfileError] = useState("");
  const [description, setDescription] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address } = useWallet();

  useEffect(() => {
    if (!address) {
      setProfileLoading(false);
      setProfileError("Connect your wallet to continue.");
      return;
    }

    fetch(`${BACKEND_URL}/api/user-hub/profile-by-wallet?address=${address}`)
      .then((res) => {
        if (!res.ok) throw new Error("No user found");
        return res.json();
      })
      .then((data: { username: string; profilePic: string }) => {
        setName(data.username || "");
        setAvatar(data.profilePic || "");
        if (!data.username || !data.profilePic) {
          setProfileError("You need a username and profile picture on the main app before creating your hub.");
        }
      })
      .catch(() => {
        setProfileError("No Nexura profile found for this wallet. Sign in to the main app and set up your profile first.");
      })
      .finally(() => setProfileLoading(false));
  }, [address]);

  const canCreate = name && avatar && !profileError;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);

      await userApiRequest({
        method: "POST",
        endpoint: "/user-hub/create-user-hub",
        formData: fd,
      });

      toast({ title: "Hub created!", description: "Your user hub has been created successfully." });

      setLocation("/user-dashboard/quests-tab");
    } catch (err: any) {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 relative">
      <AnimatedBackground />

      {/* Back Button */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={() => setLocation("/studio/select-role")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Studio
        </button>
      </div>

      <div className="max-w-xl mx-auto relative z-10 space-y-6 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-6 text-center">

        <CardTitle className="text-lg">Create User Hub</CardTitle>

        {profileLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <p className="text-white/50 text-sm">Fetching your profile...</p>
          </div>
        ) : avatar ? (
          <img src={avatar} alt={name} className="w-24 h-24 mx-auto rounded-full object-cover border-2 border-purple-500" />
        ) : (
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center text-white/40 text-xs">
            No avatar
          </div>
        )}

        <p className="text-white/60 text-sm">
          Your hub will be created using your Nexura profile.
        </p>

        {profileError && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{profileError}</p>
          </div>
        )}

        {!profileLoading && !profileError && (
          <>
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

          <div className="text-left space-y-1">
            <span className="text-white/60 text-xs">Short Bio</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about yourself... (this will be your hub description)"
              maxLength={300}
              className="bg-gray-800 border-purple-500 text-white h-24"
            />
          </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !canCreate}
          className="w-full bg-[#8B3EFE] py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Hub"}
        </button>

      </div>
    </div>
  );
}
