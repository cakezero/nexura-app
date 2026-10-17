"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/use-toast";
import { apiRequestV2, getStoredAccessToken } from "../../lib/queryClient";
import { projectApiRequest, storeProjectSession, base64ToBlob } from "../../lib/projectApi";
import { storeUserSession, getStoredUserSession } from "../../lib/userSession";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

const SIGNUP_DATA_KEY = "nexura:pending-signup";

interface PendingSignup {
  email: string;
  password: string;
  name: string;
  page: "user" | "project";
  bio?: string;
  walletAddress?: string;
  mainAppUsername?: string;
  hubDetails?: {
    hubName: string;
    description: string;
    website: string;
    xAccount: string;
    imagePreview: string;
  };
}

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  page: "user" | "project";
}

export default function OTPModal({ isOpen, onClose, email, page }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resentMessage, setResentMessage] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const resendOtp = useCallback(async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      await apiRequestV2("POST", `/api/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=${page}`);
      setResentMessage("OTP resent to your email");
      setCanResend(false);
      setResendTimer(60);
    } catch (err: any) {
      setError(err?.error || err?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }, [email, page, canResend]);

  useEffect(() => {
    if (resentMessage) {
      const t = setTimeout(() => setResentMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [resentMessage]);

  useEffect(() => {
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
  }, [resendTimer]);

  const completeSignup = useCallback(async () => {
    const raw = sessionStorage.getItem(SIGNUP_DATA_KEY);
    if (!raw) {
      setError("Signup session expired. Please close and try again.");
      return;
    }

    const pending: PendingSignup = JSON.parse(raw);
    const authToken = getStoredAccessToken();

    if (pending.page === "project") {
      const res = await projectApiRequest<{
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
      }>({
        method: "POST",
        endpoint: "/hub/sign-up",
        data: {
          name: pending.name,
          email: pending.email,
          password: pending.password,
          authToken
        },
      });

      if (res.accessToken) {
        storeProjectSession(res.accessToken, {
          email: res.admin?.email || pending.email,
          name: res.admin?.name || pending.name,
          role: res.admin?.role || "superadmin",
          adminId: res.admin?._id || "",
          hub: res.admin?.hub || "",
        });

        if (pending.hubDetails) {
          try {
            const fd = new FormData();
            fd.append("name", pending.hubDetails.hubName);
            fd.append("description", pending.hubDetails.description);
            fd.append("website", pending.hubDetails.website);
            fd.append("xAccount", pending.hubDetails.xAccount);
            if (pending.hubDetails.imagePreview) {
              const blob = base64ToBlob(pending.hubDetails.imagePreview);
              fd.append("logo", blob, "logo.png");
            }
            await projectApiRequest({ method: "POST", endpoint: "/hub/create-hub", formData: fd });
          } catch (e) {
            console.error("Hub creation failed after signup:", e);
          }
        }

        sessionStorage.removeItem(SIGNUP_DATA_KEY);
        toast({ title: "Account created!", description: "Welcome to Nexura Studio." });
        onClose();
        router.push("/studio-dashboard/connect-discord");
      }
    } else {
      const usernameToUse = pending.mainAppUsername || pending.walletAddress || pending.name || pending.email.split("@")[0];

      // Use apiRequestV2 which properly handles the nexura:token from wallet connection
      const res: {
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
        hub?: { logo?: string };
      } = await apiRequestV2("POST", "/api/user-hub/sign-up", {
        name: usernameToUse,
        email: pending.email,
        password: pending.password,
      });

      if (res.accessToken) {
        console.log("[OTPModal] Sign-up response:", res);
        console.log("[OTPModal] Admin hub ID:", res.admin?.hub);
        storeUserSession({
          token: res.accessToken,
          type: "user",
          role: res.admin?.role || "user",
          userId: res.admin?._id,
          name: res.admin?.name || pending.walletAddress || pending.name,
          email: res.admin?.email || pending.email,
          hub: res.admin?.hub,
          avatar: res.hub?.logo || "",
        });
        sessionStorage.removeItem(SIGNUP_DATA_KEY);
        toast({ title: "Account created!", description: "Welcome to Nexura Studio." });
        onClose();
        // Ensure session is stored before redirect
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Verify session is stored before redirecting
        const session = getStoredUserSession();
        console.log("[OTPModal] Stored session:", session);
        if (session && session.token) {
          router.push("/studio/users-hub");
        } else {
          console.error("Session not stored properly, redirecting anyway");
          router.push("/studio/users-hub");
        }
      }
    }
  }, [router, toast, onClose]);

  const verifyOtp = useCallback(async () => {
    const filled = otp.every((d) => d !== "");
    if (!filled) return;

    setLoading(true);
    setError("");

    try {
      await apiRequestV2("POST", "/api/auth/confirm-hub-email-validation", { code: otp.join(""), email });
      await completeSignup();
    } catch (err: any) {
      setError(err?.error || err?.message || "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      setLoading(false);
    }
  }, [otp, email, completeSignup]);

  useEffect(() => {
    if (isOpen) {
      const filled = otp.every((d) => d !== "");
      if (filled) {
        verifyOtp();
      }
    }
  }, [otp, isOpen, verifyOtp]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIdx = Math.min(pasted.length, 5);
    inputsRef.current[nextIdx]?.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="max-w-[480px] bg-[#27134e] border-none p-0 overflow-hidden rounded-[20px] shadow-[-12px_-10px_18px_5px_rgba(0,0,0,0.25),12px_10px_18px_5px_rgba(0,0,0,0.25)] flex flex-col items-center font-[family-name:var(--font-geist-sans)]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <DialogTitle className="sr-only">Check your email</DialogTitle>

        {/* Top Icon Badge */}
        <div className="mt-[40px] flex items-center justify-center size-[120px] rounded-[100px] bg-[rgba(139,62,254,0.1)] shadow-[0px_6px_67px_-10px_#7f3ae8]">
          <Image
            src="/activate-studio.png"
            alt=""
            width={120}
            height={120}
            className="size-[120px] object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h2 className="mt-[16px] text-[24px] font-bold text-white text-center">
          Check your email
        </h2>

        {/* Subtitle */}
        <p className="mt-[10px] max-w-[429px] px-6 text-[16px] font-light text-white text-center">
          Enter the OTP we sent to your email to complete your sign-up.
        </p>

        {/* OTP Inputs */}
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

        {/* Resend Action */}
        <div className="mt-[24px] flex items-center justify-center gap-[18px]">
          <p className="text-[16px] text-[rgba(255,255,255,0.5)] font-light">
            Didn&apos;t get a code?
          </p>
          <button
            onClick={resendOtp}
            disabled={!canResend || loading}
            className={`text-[16px] font-medium underline underline-offset-4 ${
              canResend
                ? "text-[#8b3efe] hover:text-[#9b51ff] cursor-pointer"
                : "text-[#8b3efe]/50 cursor-not-allowed"
            }`}
          >
            {loading ? "Sending..." : canResend ? "Resend" : `Resend (${resendTimer}s)`}
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={verifyOtp}
          disabled={loading || !otp.every((d) => d !== "")}
          className="mt-[28px] mb-[40px] w-[340px] h-[45px] bg-[#8b3efe] hover:bg-[#9b51ff] disabled:bg-[#8b3efe]/50 disabled:cursor-not-allowed text-white text-[16px] font-semibold rounded-[30px] flex items-center justify-center transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Email"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
