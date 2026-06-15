"use client";

import React, { useState, useEffect } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { userApiRequest } from "@/lib/userApi";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { BACKEND_URL } from "@/lib/constants";
import { getStoredUserToken } from "@/lib/userSession";

export default function UsersHub() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileError, setProfileError] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
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
    console.log("[ACTION] UsersHub.handleSubmit — finalize user hub (post sign-up)");
    setLoading(true);

    try {
      // Small delay to ensure session is fully stored after sign-up
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      // Verify token is available before making request
      const token = getStoredUserToken();
      console.log("[UsersHub] Token available:", !!token);
      if (!token) {
        throw new Error("Authentication token not found. Please sign in again.");
      }

      const payload = {
        name,
        description,
      };

      await userApiRequest({
        method: "POST",
        endpoint: "/user-hub/create-user-hub",
        data: payload,
      });

      toast({ title: "Hub created!", description: "Your user hub has been created successfully." });

      router.push("/user-dashboard/quests-tab");
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
          onClick={() => router.push("/studio/select-role")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Studio
        </button>
      </div>

      <div className="max-w-md mx-auto relative z-10 space-y-4 bg-white/[0.03] border border-[#A760FF] rounded-2xl p-5 text-center">

        <CardTitle className="text-base">Create User Hub</CardTitle>

        {profileLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <p className="text-white/50 text-xs">Fetching your profile...</p>
          </div>
        ) : avatar ? (
          <img src={avatar} alt={name} className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-purple-500" />
        ) : (
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 border-2 border-purple-500 flex items-center justify-center text-white/40 text-xs">
            No avatar
          </div>
        )}

        <p className="text-white/60 text-xs">
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
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs">Short Bio</span>
              <span className={`text-[10px] ${description.length < 50 || description.length > 100 ? "text-red-400" : "text-white/40"}`}>
                {description.length}/100
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people about yourself... (50-100 characters)"
              maxLength={100}
              className={`bg-gray-800 border-purple-500 text-white h-24 ${description.length > 0 && (description.length < 50 || description.length > 100) ? "border-red-500/50" : ""}`}
            />
            {description.length > 0 && description.length < 50 && (
              <p className="text-[10px] text-red-400">
                Minimum 50 characters required. {50 - description.length} more needed.
              </p>
            )}
          </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !canCreate || description.length < 50 || description.length > 100}
          className="w-full bg-[#8B3EFE] py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Hub"}
        </button>

      </div>
    </div>
  );
}
