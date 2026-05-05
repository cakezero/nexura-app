import React, { useState } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { Card, CardTitle, CardFooter } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ArrowRight, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../../components/ui/input-otp";
import { useLocation } from "wouter";
import { projectApiRequest, storeProjectSession } from "../../../lib/projectApi";
import { useToast } from "../../../hooks/use-toast";

export default function SignInToHub() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "otp" | "success">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await projectApiRequest<{ 
        accessToken?: string; 
        admin?: { _id: string; name: string; email: string; role: string; hub: string };
        message?: string;
      }>({
        method: "POST",
        endpoint: "/hub/sign-in",
        data: { email, password },
      });

      if (response.accessToken) {
        storeProjectSession(response.accessToken, {
          email: response.admin?.email || email,
          role: response.admin?.role || "admin",
          adminId: response.admin?._id || "",
          name: response.admin?.name || "Project",
          hub: response.admin?.hub || "",
        });

        toast({
          title: "Signed in!",
          description: "Welcome back to Nexura Studio.",
        });

        setLocation("/studio-dashboard");
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

  async function handleSendOTP() {
    if (!resetEmail) {
      toast({ title: "Missing email", description: "Please enter your email.", variant: "destructive" });
      return;
    }

    setResetLoading(true);
    try {
      await projectApiRequest({
        method: "POST",
        endpoint: "/hub/forgot-password",
        data: { email: resetEmail },
      });
      toast({ title: "Code sent!", description: `Verification code sent to ${resetEmail}.` });
      setResetStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!resetOTP || !newPassword || !confirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords match", description: "New password and confirm password must match.", variant: "destructive" });
      return;
    }

    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setResetLoading(true);
    try {
      await projectApiRequest({
        method: "POST",
        endpoint: "/hub/reset-password",
        data: { email: resetEmail, code: resetOTP, password: newPassword },
      });
      toast({ title: "Success!", description: "Your password has been reset successfully." });
      setResetStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  }

  function closeResetModal() {
    setShowResetModal(false);
    setResetStep("email");
    setResetEmail("");
    setResetOTP("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/studio/projects/create")}
          className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center py-4 sm:py-6 px-2 sm:px-0 pt-12">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Sign in to Your Project
          </h1>
          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
            Enter your credentials to access your existing project.
          </p>
        </div>

        {/* Sign In Card */}
        <Card className="border-2 border-purple-500 rounded-3xl p-6 space-y-6 bg-gray-900">
          {/* Email */}
          <div>
            <CardTitle className="text-white text-lg sm:text-xl">Email Address</CardTitle>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-2 w-full bg-gray-800 text-white border-purple-500"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg sm:text-xl">Password</CardTitle>
              <button
                type="button"
                className="text-sm text-blue-400 hover:underline"
                onClick={() => setShowResetModal(true)}
              >
                Forgotten password?
              </button>
            </div>
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="*   *   *   *   *   *   *   *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-800 text-white border-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Footer / Button */}
          <CardFooter className="pt-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-[#8B3EFE] border-0 text-white hover:bg-[#8B3EFE] hover:shadow-[0_0_28px_rgba(131,58,253,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-white/30 -mt-8">
          Don't have an account?{" "}
          <a href="/projects/create" className="text-purple-400 hover:underline">
            Create a Project
          </a>
        </p>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d14] border border-purple-500/20 rounded-2xl p-7 w-full max-w-md space-y-6 animate-modal-pop shadow-[0_0_60px_rgba(131,58,253,0.2)]">
            {resetStep === "email" && (
              <>
                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-white">Reset Password</h2>
                  <p className="text-white/50 text-sm">
                    Enter your email address and we'll send you a verification code to reset your password.
                  </p>
                </div>

                <div>
                  <label className="text-white/60 text-sm block mb-2">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-white/5 text-white border-white/10 focus:border-purple-500 placeholder:text-white/30 mt-0"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all"
                    onClick={closeResetModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#8B3EFE] text-white text-sm font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </>
            )}

            {resetStep === "otp" && (
              <>
                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-white">Verify Code</h2>
                  <p className="text-white/50 text-sm">
                    Enter the 6-digit code sent to <b>{resetEmail}</b>.
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={resetOTP}
                    onChange={setResetOTP}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-white/60 text-sm block mb-2">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white/5 text-white border-white/10 focus:border-purple-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm block mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 text-white border-white/10 focus:border-purple-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all"
                    onClick={() => setResetStep("email")}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#8B3EFE] text-white text-sm font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? "Resetting..." : "Update Password"}
                  </button>
                </div>
              </>
            )}

            {resetStep === "success" && (
              <div className="text-center space-y-6 py-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Password Reset Successful!</h2>
                  <p className="text-white/50 text-sm">
                    Your password has been successfully updated. You can now sign in with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="w-full py-3 rounded-xl bg-[#8B3EFE] text-white text-sm font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
