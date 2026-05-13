"use client";

import React, { useState, useEffect } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { useLocation } from "wouter";
import { useToast } from "../../../hooks/use-toast";
import { useWallet } from "../../../hooks/use-wallet";
import { BACKEND_URL } from "../../../lib/constants";
import { apiRequestV2 } from "../../../lib/queryClient";
import { userApiRequest } from "../../../lib/userApi";
import { storeUserSession } from "../../../lib/userSession";
import { Eye, EyeOff, Info, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

export default function UsersCreate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [isLongEnough, setIsLongEnough] = useState(false);

  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [mainAppUsername, setMainAppUsername] = useState("");

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address: walletAddress, isConnected } = useWallet();

  useEffect(() => {
    if (!walletAddress) {
      setProfileLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/api/user-hub/profile-by-wallet?address=${walletAddress}`)
      .then((res) => {
        if (!res.ok) throw new Error("No user found");
        return res.json();
      })
      .then((data: { username: string }) => {
        setMainAppUsername(data.username || "");
      })
      .catch(() => {
        setMainAppUsername("");
      })
      .finally(() => setProfileLoading(false));
  }, [walletAddress]);

  const generatedUsername = walletAddress
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : "";

  const displayUsername = profileLoading ? "Loading..." : mainAppUsername || generatedUsername;

  const handleSubmit = async () => {
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const usernameToUse = mainAppUsername || walletAddress || email.split("@")[0];

      await apiRequestV2("POST", `/api/hub-auth/validate-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(usernameToUse)}&page=user`);

      const res = await userApiRequest<{
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
        hub?: { logo?: string };
      }>({
        method: "POST",
        endpoint: "/user-hub/sign-up",
        data: { name: usernameToUse, email, password },
      });

      if (res.accessToken) {
        storeUserSession({
          token: res.accessToken,
          type: "user",
          role: res.admin?.role || "user",
          userId: res.admin?._id,
          name: res.admin?.name || walletAddress,
          email: res.admin?.email || email,
          hub: res.admin?.hub,
          avatar: res.hub?.logo || "",
        });
        toast({ title: "Account created!", description: "Welcome to Nexura Studio. Please set up your hub profile." });
        setLocation("/studio/users-hub");
      }
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err?.error || err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-4 font-['Geist',sans-serif]">
      <AnimatedBackground />

      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <button
          onClick={() => setLocation("/studio/select-role")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Studio
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[869px] bg-[rgba(139,62,254,0.1)] rounded-[32px] py-12 px-6 sm:px-16 flex flex-col items-center sm:-mt-12 scale-[0.8] origin-center">
        
        {/* Header */}
        <h1 className="text-[30px] font-semibold text-white mb-2 text-center">User Credentials</h1>
        <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)] mb-10 text-center">
          Set up your user profile and secure your account on Nexura Studio.
        </p>

        <div className="w-full max-w-[740px] space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Username</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden relative opacity-70">
              <input
                type="text"
                value={displayUsername}
                readOnly
                placeholder="Connect wallet to see username"
                className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] font-mono"
              />
              {profileLoading && (
                <Loader2 className="absolute right-4 w-4 h-4 text-[#8a3efe] animate-spin" />
              )}
            </div>
            {mainAppUsername ? (
              <p className="text-[11px] text-emerald-400 mt-1">✓ Loaded from your main app profile</p>
            ) : walletAddress && !profileLoading ? (
              <p className="text-[11px] text-white/50 mt-1">Using wallet-derived username — set a username on the main app for your profile name</p>
            ) : !walletAddress ? (
              <p className="text-[11px] text-red-400 mt-1">⚠ Wallet not connected — return and connect your wallet</p>
            ) : null}
          </div>

          {/* Disclaimer */}
          <div className="flex justify-center pt-2 pb-2">
            <div className="bg-[rgba(201,170,255,0.2)] max-w-[740px] w-full py-3 px-4 sm:px-6 rounded-2xl flex items-start gap-3">
              <Info className="w-[15px] h-[15px] text-[#8b3efe] shrink-0 mt-1" />
              <p className="text-[14px] font-semibold leading-[23px]">
                <span className="text-white">Disclaimer:</span>
                <span className="text-[#a3adc2]"> Your username and profile picture are pulled from your main Nexura profile. To update them, edit your profile in the main app settings.</span>
              </p>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Email Address</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Password</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  setHasUppercase(/[A-Z]/.test(val));
                  setHasNumber(/\d/.test(val));
                  setHasSpecialChar(/[!@#$%^&*()_+[\]{};':"\\|,.<>/?]/.test(val));
                  setIsLongEnough(val.length >= 8);
                }}
                placeholder="••••••••••••"
                className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password checklist - Vertical and Always Visible */}
            <div className="flex flex-col gap-1 mt-2 text-[11px] ml-1">
              <div className={`flex items-center gap-2 ${isLongEnough ? "text-emerald-400" : "text-white/40"}`}>
                <div className={`w-1 h-1 rounded-full ${isLongEnough ? "bg-emerald-400" : "bg-white/40"}`} />
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUppercase ? "text-emerald-400" : "text-white/40"}`}>
                <div className={`w-1 h-1 rounded-full ${hasUppercase ? "bg-emerald-400" : "bg-white/40"}`} />
                <span>At least 1 uppercase letter</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-400" : "text-white/40"}`}>
                <div className={`w-1 h-1 rounded-full ${hasNumber ? "bg-emerald-400" : "bg-white/40"}`} />
                <span>At least 1 number</span>
              </div>
              <div className={`flex items-center gap-2 ${hasSpecialChar ? "text-emerald-400" : "text-white/40"}`}>
                <div className={`w-1 h-1 rounded-full ${hasSpecialChar ? "bg-emerald-400" : "bg-white/40"}`} />
                <span>At least 1 special character</span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Confirm Password</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)] tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="w-full h-[50px] rounded-full bg-[#8b3efe] shadow-[0px_2px_3px_#843afd,0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[18px] font-bold text-white hover:bg-[#9b51ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign Up <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <button
              onClick={() => setLocation("/studio/users/user-signin")}
              className="w-full h-[60px] rounded-full border border-[#833bfb] shadow-[0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[20px] font-bold text-white hover:bg-[rgba(131,59,251,0.1)] transition-all"
            >
              Sign In <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
