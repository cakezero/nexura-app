"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { useLocation } from "wouter";
import { useToast } from "../../../hooks/use-toast";
import { storeUserSession } from "../../../lib/userSession";
import { userApiRequest } from "../../../lib/userApi";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";

export default function UserSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await userApiRequest<{
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
      }>({
        method: "POST",
        endpoint: "/user-hub/sign-in",
        data: { email, password },
      });

      if (res.accessToken) {
        const userSession = {
          token: res.accessToken,
          type: "user",
          role: res.admin?.role || "user",
          userId: res.admin?._id,
          username: res.admin?.name,
          name: res.admin?.name,
          email: res.admin?.email,
          hub: res.admin?.hub,
        };

        storeUserSession(userSession);

        toast({
          title: "Signed in!",
          description: "Welcome back to Nexura Studio.",
        });

        setLocation("/user-dashboard");
      } else {
        throw new Error("Authentication failed - no token received");
      }
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err?.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!resetEmail) {
      toast({
        title: "Missing email",
        description: "Please enter your email.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      await userApiRequest({
        method: "POST",
        endpoint: "/user-hub/forgot-password",
        data: { email: resetEmail },
      });

      toast({
        title: "Email sent!",
        description: `Reset instructions sent to ${resetEmail}.`,
      });

      setShowResetModal(false);
      setResetEmail("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send reset email.";

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-4 font-['Geist',sans-serif]">
      <AnimatedBackground />

      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <button
          onClick={() => setLocation("/studio/users/create")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Create
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[869px] bg-[rgba(139,62,254,0.1)] rounded-[32px] py-12 px-6 sm:px-16 flex flex-col items-center scale-[0.8] origin-center -mt-16 sm:-mt-24">
        
        {/* Header */}
        <h1 className="text-[30px] font-semibold text-white mb-2 text-center">Sign in</h1>
        <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)] mb-10 text-center">
          Enter your credentials to access your user hub
        </p>

        <div className="w-full max-w-[740px] space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <label className="block text-[18px] sm:text-[20px] font-bold text-white">Email Address</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[50px] rounded-full px-5 flex items-center overflow-hidden">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address..."
                className="w-full bg-transparent border-none outline-none text-[16px] text-white placeholder-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="block text-[18px] sm:text-[20px] font-bold text-white">Password</label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-[14px] font-bold text-[#843afd] hover:text-[#9b51ff] transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="bg-[#060210] border border-[#8a3efe] h-[50px] rounded-full px-5 flex items-center overflow-hidden relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••••••"
                className="w-full bg-transparent border-none outline-none text-[16px] text-white placeholder-[rgba(255,255,255,0.4)] tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-8">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full h-[60px] rounded-full bg-[#8b3efe] shadow-[0px_2px_6px_2px_#843afd,0px_1px_2px_0px_#843afd] flex items-center justify-center gap-2 text-[20px] font-bold text-white hover:bg-[#9b51ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d14] border border-[#8a3efe] rounded-[32px] p-8 w-full max-w-[500px] space-y-6 shadow-[0_0_60px_rgba(131,58,253,0.2)]">
            <div className="space-y-2 text-center">
              <h2 className="text-[24px] font-bold text-white">Reset Password</h2>
              <p className="text-white/50 text-[15px]">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[16px] font-bold text-white">Email Address</label>
              <div className="bg-[#060210] border border-[#8a3efe] h-[50px] rounded-full px-5 flex items-center overflow-hidden">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[16px] text-white placeholder-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                className="h-[50px] px-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[16px] font-bold transition-all w-full sm:w-auto"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="h-[50px] px-8 rounded-full bg-[#8B3EFE] text-white text-[16px] font-bold hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {resetLoading ? "Sending..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
