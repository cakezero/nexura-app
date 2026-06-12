"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/use-toast";
import { userApiRequest } from "../../lib/userApi";
import { projectApiRequest, storeProjectSession } from "../../lib/projectApi";
import { storeUserSession } from "../../lib/userSession";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: "user" | "project";
  onResend?: () => void | Promise<void>;
}

const cardClass =
  "max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#27134e] border-none p-0 rounded-[20px] shadow-[-12px_-10px_18px_5px_rgba(0,0,0,0.25),12px_10px_18px_5px_rgba(0,0,0,0.25)] flex flex-col items-center font-[family-name:var(--font-geist-sans)] scale-[0.85]";

function IconBadge() {
  return (
    <div className="mt-[40px] flex items-center justify-center size-[120px] rounded-[100px] bg-[rgba(139,62,254,0.1)] shadow-[0px_6px_67px_-10px_#7f3ae8]">
      <Image src="/activate-studio.png" alt="" width={120} height={120} className="size-[120px] object-contain" priority />
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="absolute right-4 top-4 z-10 text-white/50 hover:text-white transition-colors">
      <X className="w-5 h-5" />
    </button>
  );
}

export default function ResetPasswordModal({ isOpen, onClose, email, type, onResend }: ResetPasswordModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<"otp" | "password">("otp");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setPassword("");
      setConfirmPassword("");
      setError("");
      setResendTimer(60);
      setCanResend(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== "otp") return;
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer, isOpen, step]);

  useEffect(() => {
    if (!resentMessage) return;
    const t = setTimeout(() => setResentMessage(""), 3000);
    return () => clearTimeout(t);
  }, [resentMessage]);

  const code = otp.join("");

  const pwdChecks = {
    length: password.length >= 8,
    number: /\d/.test(password),
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const allPwdValid = Object.values(pwdChecks).every(Boolean);
  const requirements: [boolean, string][] = [
    [pwdChecks.length, "Least 8 characters"],
    [pwdChecks.number, "Least one number (0-9)"],
    [pwdChecks.case, "Lowercase (a-z) and uppercase (A-Z)"],
    [pwdChecks.special, "Least one special character ($, &, @)"],
  ];

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleOtpContinue = () => {
    if (otp.some((d) => d === "")) {
      setError("Enter the full code we sent to your email.");
      return;
    }
    console.log("[ACTION] confirmResetOtp", { email, type });
    setError("");
    setStep("password");
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    console.log("[ACTION] resendResetCode", { email, type });
    setResending(true);
    setError("");
    try {
      await onResend?.();
      setResentMessage("Reset code resent to your email");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      console.error("[ACTION] resendResetCode ✗", err);
      setError(err?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleReset = async () => {
    console.log("[ACTION] resetPassword", { email, type });
    if (!allPwdValid) {
      toast({ title: "Weak password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (type === "user") {
        const res = await userApiRequest<{
          accessToken?: string;
          token?: string;
          admin?: { _id: string; name: string; email: string; role?: string; hub?: string };
        }>({
          method: "POST",
          endpoint: "/user-hub/reset-password",
          data: { email, code, password },
        });

        const accessToken = res.token ?? res.accessToken;
        if (!accessToken || !res.admin) throw new Error("No access token received");

        storeUserSession({
          token: accessToken,
          type: "user",
          role: res.admin.role ?? "user",
          userId: res.admin._id,
          username: res.admin.name,
          name: res.admin.name,
          email: res.admin.email,
          hub: res.admin.hub,
        });

        console.log("[ACTION] resetPassword ✓", { type, redirect: "/user-dashboard" });
        toast({ title: "Password updated", description: "Your password has been reset successfully." });
        onClose();
        router.push("/user-dashboard");
      } else {
        const res = await projectApiRequest<{
          accessToken?: string;
          token?: string;
          admin?: { _id: string; name: string; email: string; role: string; hub?: string };
        }>({
          method: "POST",
          endpoint: "/hub/reset-password",
          data: { email, code, password },
        });

        const accessToken = res.token ?? res.accessToken;
        if (!accessToken || !res.admin) throw new Error("No access token received");

        storeProjectSession(accessToken, {
          email: res.admin.email,
          name: res.admin.name,
          role: res.admin.role,
          adminId: res.admin._id,
        });

        try {
          const { hub } = await projectApiRequest<{ hub: Record<string, any> }>({ method: "GET", endpoint: "/hub/me" });
          storeProjectSession(accessToken, {
            email: res.admin.email,
            name: hub.name ?? res.admin.name,
            logo: hub.logo ?? "",
            role: res.admin.role,
            adminId: res.admin._id,
          });
        } catch {
          // Keep the basic admin session if hub profile fetch fails.
        }

        console.log("[ACTION] resetPassword ✓", { type, redirect: "/studio-dashboard" });
        toast({ title: "Password updated", description: "Your password has been reset successfully." });
        onClose();
        router.push("/studio-dashboard");
      }
    } catch (err: any) {
      console.error("[ACTION] resetPassword ✗", err);
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setError(msg);
      toast({ title: "Reset failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal 1 — OTP entry (figma 4773-595) */}
      <Dialog open={isOpen && step === "otp"} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent hideClose className={cardClass}>
          <CloseButton onClose={onClose} />
          <IconBadge />

          <DialogTitle className="mt-[16px] text-[24px] font-bold text-white text-center">
            Check your email
          </DialogTitle>

          <p className="mt-[10px] max-w-[429px] px-6 text-[16px] font-light text-white text-center">
            Enter the OTP we sent to your email to continue resetting your password.
          </p>

          <div className="mt-[28px] flex gap-[12px] justify-center w-full px-[24px]">
            {otp.map((digit, i) => {
              const isFocused = focusedIndex === i;
              return (
                <div key={i} className="relative">
                  <input
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`size-[65px] text-center text-[30px] font-semibold bg-transparent rounded-[8px] text-white caret-transparent focus:outline-none transition-all ${
                      isFocused
                        ? "border-2 border-[#b65fc8]"
                        : error
                          ? "border border-red-500/50"
                          : "border border-[rgba(255,255,255,0.5)]"
                    }`}
                  />
                  {!digit && (
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[3px] rounded-[12px] bg-[rgba(255,255,255,0.5)]" />
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-red-400 text-xs mt-2 text-center px-4">{error}</p>}
          {resentMessage && <p className="text-green-400 text-xs mt-2 text-center px-4">{resentMessage}</p>}

          <div className="mt-[24px] flex items-center justify-center gap-[18px]">
            <p className="text-[16px] text-[rgba(255,255,255,0.5)] font-light">Didn&apos;t get a code?</p>
            <button
              onClick={handleResend}
              disabled={!canResend || resending}
              className={`text-[16px] font-medium underline underline-offset-4 ${
                canResend ? "text-[#8b3efe] hover:text-[#9b51ff] cursor-pointer" : "text-[#8b3efe]/50 cursor-not-allowed"
              }`}
            >
              {resending ? "Sending..." : canResend ? "Resend" : `Resend (${resendTimer}s)`}
            </button>
          </div>

          <button
            onClick={handleOtpContinue}
            disabled={!otp.every((d) => d !== "")}
            className="mt-[28px] mb-[40px] w-[340px] h-[45px] bg-[#8b3efe] hover:bg-[#9b51ff] disabled:bg-[#8b3efe]/50 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-[30px] flex items-center justify-center transition-colors"
          >
            Reset Password
          </button>
        </DialogContent>
      </Dialog>

      {/* Modal 2 — New password (figma 4773-662) */}
      <Dialog open={isOpen && step === "password"} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent hideClose className={cardClass}>
          <CloseButton onClose={onClose} />
          <IconBadge />

          <DialogTitle className="mt-[16px] text-[24px] font-bold text-white text-center">
            OTP Confirmed
          </DialogTitle>

          <p className="mt-[10px] max-w-[404px] px-6 text-[16px] font-light text-white text-center leading-snug">
            Your verification code was confirmed successfully.
            <br />
            Create a new password for your account.
          </p>

          {error && (
            <div className="mt-4 mx-[35px] rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-[24px] w-full px-[35px]">
            <label className="block text-[18px] font-bold text-white mb-[12px]">New Password</label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password..."
                className="w-full h-[44px] pl-4 pr-[48px] bg-[rgba(6,2,16,0.5)] border border-[#8a3efe] rounded-[16px] text-white text-[16px] font-bold placeholder:text-[rgba(255,255,255,0.4)] placeholder:font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
          </div>

          <div className="mt-[14px] w-full px-[35px] flex flex-col gap-[7px]">
            {requirements.map(([ok, label]) => (
              <div key={label} className="flex items-center gap-[8px] text-[13px] font-bold">
                {ok ? (
                  <Check className="size-[20px] text-[#00e1a2]" strokeWidth={2.5} />
                ) : (
                  <span className="flex size-[20px] items-center justify-center text-[rgba(255,255,255,0.6)]">
                    <span className="size-[4px] rounded-full bg-current" />
                  </span>
                )}
                <span className={ok ? "text-[#00e1a2]" : "text-[rgba(255,255,255,0.6)]"}>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-[24px] w-full px-[35px]">
            <label className="block text-[18px] font-bold text-white mb-[12px]">Confirm New Password</label>
            <div className="relative w-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password..."
                className="w-full h-[44px] pl-4 pr-[48px] bg-[rgba(6,2,16,0.5)] border border-[#8a3efe] rounded-[16px] text-white text-[16px] font-bold placeholder:text-[rgba(255,255,255,0.4)] placeholder:font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.6)] hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="mt-[32px] mb-[40px] w-[340px] max-w-full h-[45px] bg-[#8b3efe] hover:bg-[#9b51ff] disabled:bg-[#8b3efe]/50 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-[30px] flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
