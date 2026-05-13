"use client";

import React, { useState, useMemo } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { useLocation } from "wouter";
import { projectApiRequest, storeProjectSession } from "../../../lib/projectApi";
import { useToast } from "../../../hooks/use-toast";
import { Eye, EyeOff, Info, ArrowRight } from "lucide-react";

export default function ProjectCreate() {
  const [name, setName] = useState("");
  const emailFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "";
  }, []);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const pwdChecks = {
    length:  password.length >= 8,
    number:  /\d/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    upper:   /[A-Z]/.test(password),
  };
  const allPwdValid = Object.values(pwdChecks).every(Boolean);
  const canSubmit = allPwdValid && !!name && !!email && !loading;

  async function handleSignUp() {
    if (!name || !email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await projectApiRequest<{
        message?: string;
        accessToken?: string;
        token?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub?: string };
      }>({
        method: "POST",
        endpoint: "/hub/admin/sign-up",
        data: { name, email, password },
      });

      const token = (res.token ?? res.accessToken) as string | undefined;
      if (!token) throw new Error("No access token received");

      storeProjectSession(token, { email, name, role: res.admin?.role ?? "admin", adminId: res.admin?._id ?? "" });
      toast({
        title: "Account created!",
        description: "Welcome to Nexura Studio. You now have admin access.",
      });
      setLocation("/studio-dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Sign up failed. Check your details and try again.";
      toast({ title: "Sign up failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-4 font-['Geist',sans-serif]">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-[869px] bg-[rgba(139,62,254,0.1)] rounded-[32px] py-12 px-6 sm:px-16 flex flex-col items-center scale-[0.8] origin-center -mt-16 sm:-mt-24">
        
        {/* Header */}
        <h1 className="text-[30px] font-semibold text-white mb-2 text-center">Shared Access Credentials</h1>
        <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)] mb-10 text-center">
          Anyone with these credentials can access and control your hub.
        </p>

        <div className="w-full max-w-[740px] space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Full Name</label>
            <div className="bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name..."
                className="w-full bg-transparent border-none outline-none text-[14px] text-white placeholder-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label className="block text-[18px] font-bold text-white">Email Address</label>
            <div className={`bg-[#060210] border border-[#8a3efe] h-[40px] rounded-full px-4 flex items-center overflow-hidden ${emailFromUrl ? "opacity-60" : ""}`}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                readOnly={!!emailFromUrl}
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
                onChange={(e) => setPassword(e.target.value)}
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
            {/* Password checklist */}
            {password.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px]">
                <span className={pwdChecks.length ? "text-emerald-400" : "text-white/40"}>• 8+ chars</span>
                <span className={pwdChecks.upper ? "text-emerald-400" : "text-white/40"}>• 1 uppercase</span>
                <span className={pwdChecks.number ? "text-emerald-400" : "text-white/40"}>• 1 number</span>
                <span className={pwdChecks.special ? "text-emerald-400" : "text-white/40"}>• 1 special</span>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="bg-[rgba(201,170,255,0.2)] max-w-[637px] w-full py-3 px-4 sm:px-6 rounded-full flex items-center justify-center sm:justify-start gap-2">
              <Info className="w-[15px] h-[15px] text-white shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-[13px] sm:text-[14px]">
                <span className="font-semibold text-white">Disclaimer:</span>
                <span className="font-semibold text-[#a3adc2]">Anyone with these credentials can manage your quests and hub settings</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={handleSignUp}
              disabled={!canSubmit}
              className="w-full h-[50px] rounded-full bg-[#8b3efe] shadow-[0px_2px_3px_#843afd,0px_1px_1px_#843afd] flex items-center justify-center gap-2 text-[18px] font-bold text-white hover:bg-[#9b51ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign Up <ArrowRight className="w-5 h-5" /></>
              )}
            </button>

            <button
              onClick={() => setLocation("/projects/create/signin-to-hub")}
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
