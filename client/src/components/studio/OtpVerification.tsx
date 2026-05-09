import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequestV2 } from "../../lib/queryClient";

interface OtpVerificationProps {
  email: string;
  page: "user" | "project";
  onVerified: () => void;
  onBack: () => void;
}

export default function OtpVerification({ email, page, onVerified, onBack }: OtpVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resentMessage, setResentMessage] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const resendOtp = useCallback(async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      await apiRequestV2(
        "POST",
        `/hub-auth/validate-email?email=${encodeURIComponent(email)}&page=${page}`,
      );
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

  useEffect(() => {
    const filled = otp.every((d) => d !== "");
    if (!filled) return;
    setLoading(true);
    setError("");
    apiRequestV2("POST", "/auth/confirm-hub-email-validation", { code: otp.join(""), email })
      .then(() => onVerified())
      .catch((err: any) => {
        setError(err?.error || err?.message || "Invalid or expired OTP");
        setOtp(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
      })
      .finally(() => setLoading(false));
  }, [otp, email, onVerified]);

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
    <div className="w-full">
      <h2 className="text-xl font-semibold text-white text-center mb-2">Verify Your Email</h2>
      <p className="text-white/60 text-center text-sm mb-8">
        We sent a 6-digit code to <span className="text-white">{email}</span>
      </p>

      <div className="flex justify-center gap-3 mb-6">
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
            className={`w-12 h-14 text-center text-xl font-semibold rounded-lg bg-white/5 border text-white focus:outline-none focus:border-purple-500 transition-all ${
              error ? "border-red-500/50" : "border-white/10"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}
      {resentMessage && (
        <p className="text-green-400 text-sm text-center mb-4">{resentMessage}</p>
      )}

      <div className="flex flex-col items-center gap-4">
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

        <button
          onClick={onBack}
          className="text-white/50 hover:text-white/80 text-sm transition-all"
        >
          Change email
        </button>
      </div>
    </div>
  );
}
