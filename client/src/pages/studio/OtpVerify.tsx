import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { apiRequestV2 } from "../../lib/queryClient";
import { projectApiRequest, storeProjectSession } from "../../lib/projectApi";
import { userApiRequest } from "../../lib/userApi";
import { storeUserSession } from "../../lib/userSession";
import AnimatedBackground from "../../components/AnimatedBackground";
import { ArrowLeft } from "lucide-react";

const SIGNUP_DATA_KEY = "nexura:pending-signup";

interface PendingSignup {
  email: string;
  password: string;
  name: string;
  page: "user" | "project";
  walletAddress?: string;
  mainAppUsername?: string;
}

export default function OtpVerify() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resentMessage, setResentMessage] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";
  const page = (params.get("page") as "user" | "project") || "project";

  const resendOtp = useCallback(async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      await apiRequestV2("POST", `/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=${page}`);
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
      setError("Signup session expired. Please go back and try again.");
      return;
    }

    const pending: PendingSignup = JSON.parse(raw);

    if (pending.page === "project") {
      const res = await projectApiRequest<{
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
      }>({
        method: "POST",
        endpoint: "/hub/sign-up",
        data: { name: pending.name, email: pending.email, password: pending.password },
      });

      if (res.accessToken) {
        storeProjectSession(res.accessToken, {
          email: res.admin?.email || pending.email,
          name: res.admin?.name || pending.name,
          role: res.admin?.role || "superadmin",
          adminId: res.admin?._id || "",
          hub: res.admin?.hub || "",
        });
        sessionStorage.removeItem(SIGNUP_DATA_KEY);
        toast({ title: "Account created!", description: "Welcome to Nexura Studio." });
        setLocation("/connect-discord");
      }
    } else {
      const usernameToUse = pending.mainAppUsername || pending.walletAddress || pending.name;
      const res = await userApiRequest<{
        accessToken?: string;
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
        hub?: { logo?: string };
      }>({
        method: "POST",
        endpoint: "/user-hub/sign-up",
        data: { name: usernameToUse, email: pending.email, password: pending.password },
      });

      if (res.accessToken) {
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
        setLocation("/user-dashboard/quests-tab");
      }
    }
  }, [setLocation, toast]);

  useEffect(() => {
    const filled = otp.every((d) => d !== "");
    if (!filled) return;

    setLoading(true);
    setError("");

    apiRequestV2("POST", "/auth/confirm-hub-email-validation", { code: otp.join(""), email })
      .then(() => completeSignup())
      .catch((err: any) => {
        setError(err?.error || err?.message || "Invalid or expired OTP");
        setOtp(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
      })
      .finally(() => setLoading(false));
  }, [otp, email, completeSignup]);

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
    <div className="min-h-screen bg-black text-white overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-md mx-auto relative z-10 space-y-6 pt-16">
        <button
          onClick={() => {
            sessionStorage.removeItem(SIGNUP_DATA_KEY);
            window.history.back();
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="text-center py-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-sm text-white/60">
            We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="border-2 border-purple-500 rounded-3xl p-8 bg-gray-900 space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                autoFocus={i === 0}
                className={`w-12 h-14 text-center text-xl font-semibold rounded-lg bg-gray-800 border text-white focus:outline-none focus:border-purple-500 transition-all ${
                  error ? "border-red-500/50" : "border-gray-600"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {resentMessage && <p className="text-green-400 text-sm text-center">{resentMessage}</p>}

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={resendOtp}
              disabled={!canResend || loading}
              className={`text-sm transition-all ${
                canResend
                  ? "text-purple-400 hover:text-purple-300 cursor-pointer"
                  : "text-white/40 cursor-not-allowed"
              }`}
            >
              {loading ? "Sending..." : canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
