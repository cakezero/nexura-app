"use client";

import React, { useState, useEffect } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Card, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { BACKEND_URL } from "@/lib/constants";
import { apiRequestV2 } from "@/lib/queryClient";
import OTPModal from "@/components/studio/OTPModal";

export default function UserSignup() {
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

  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);

  const router = useRouter();
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
    console.log("[ACTION] UserSignup.handleSubmit — sign up");
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

    const isWallet = /^(0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]+\.\.\.[a-fA-F0-9]+)$/.test(displayUsername);
    if (isWallet) {
      toast({
        title: "Identity incomplete",
        description: "Please set a custom username and profile picture in your main profile before signing up for Studio.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const usernameToUse = mainAppUsername || walletAddress || email.split("@")[0];

      // Validate email & username, and send OTP
      await apiRequestV2("POST", `/api/hub-auth/validate-email?email=${encodeURIComponent(email)}&name=${encodeURIComponent(usernameToUse)}&page=user`);

      sessionStorage.setItem("nexura:pending-signup", JSON.stringify({
        email,
        password,
        name: usernameToUse,
        page: "user",
        walletAddress,
        mainAppUsername: mainAppUsername || ""
      }));

      setIsOTPModalOpen(true);
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
    <div className="min-h-screen bg-[#f7f5ff] text-[#1c2533] overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="w-full flex justify-start mb-4">
        <button
          onClick={() => router.push("/studio/users/create")}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[rgba(28,37,51,0.12)] bg-white hover:bg-[#f4f1fc] text-[#1c2533] text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Studio
        </button>
      </div>

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        <div className="text-center py-2 px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl font-bold mb-1">
            User Credentials
          </h1>
          <p className="text-xs text-[#69728a] leading-relaxed">
            Set up your user profile and secure your account on Nexura Studio
          </p>
        </div>

        <Card className="border-2 border-purple-500 rounded-3xl p-5 space-y-4 bg-white">
          <div className="space-y-4">
            <div>
              <CardTitle className="text-[#1c2533] text-base">Username</CardTitle>
              <div className="relative mt-1">
                <Input
                  value={displayUsername}
                  readOnly
                  placeholder="Connect wallet to see username"
                  className="w-full rounded-lg bg-white text-[#1c2533] border-purple-500 opacity-70 cursor-not-allowed font-mono text-xs h-9"
                />
                {profileLoading && (
                  <Loader2 className="absolute right-2.5 top-2 w-4 h-4 text-[#8a3ffc] animate-spin" />
                )}
              </div>
              {mainAppUsername && !/^(0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]+\.\.\.[a-fA-F0-9]+)$/.test(mainAppUsername) ? (
                <p className="text-[10px] text-[#00a87c] mt-0.5">
                  ✓ Synced from Nexura app profile
                </p>
              ) : (walletAddress || mainAppUsername) && !profileLoading ? (
                <p className="text-[10px] text-[#e4545b] mt-0.5">
                  ⚠ Please set a username and profile picture in your main profile
                </p>
              ) : !walletAddress ? (
                <p className="text-[10px] text-[#e4545b] mt-0.5">
                  ⚠ Wallet not connected — return and connect your wallet
                </p>
              ) : null}

            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <p className="text-[11px] text-[#3d485c] leading-relaxed">
                <span className="font-semibold text-[#8a3ffc]">ℹ Your Nexura profile powers your hub.</span><br />
                Your username and profile picture are pulled from your main Nexura app profile. To update them, edit your profile in the main app settings.
              </p>
            </div>

            <div>
              <CardTitle className="text-[#1c2533] text-base">Email Address</CardTitle>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="mt-1 w-full rounded-lg bg-white text-[#1c2533] border-purple-500 h-9"
              />
            </div>

            <div>
              <CardTitle className="text-[#1c2533] text-base">Password</CardTitle>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    setHasUppercase(/[A-Z]/.test(value));
                    setHasNumber(/\d/.test(value));
                    setHasSpecialChar(/[!@#$%^&*()_+[\]{};':"\\|,.<>/?]/.test(value));
                    setIsLongEnough(value.length >= 8);
                  }}
                  className="w-full rounded-lg bg-white text-[#1c2533] border-purple-500 pr-10 h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1.5 text-[#69728a] hover:text-[#1c2533]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[11px] bg-white p-2 rounded-xl">
                <p className={isLongEnough ? "text-[#00a87c]" : "text-[#e4545b]"}>• 8+ characters</p>
                <p className={hasUppercase ? "text-[#00a87c]" : "text-[#e4545b]"}>• 1 uppercase</p>
                <p className={hasNumber ? "text-[#00a87c]" : "text-[#e4545b]"}>• 1 number</p>
                <p className={hasSpecialChar ? "text-[#00a87c]" : "text-[#e4545b]"}>• 1 special character</p>
              </div>
            </div>

            <div>
              <CardTitle className="text-[#1c2533] text-base">Confirm Password</CardTitle>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-white text-[#1c2533] border-purple-500 pr-10 h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1.5 text-[#69728a] hover:text-[#1c2533]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <CardFooter className="pt-1">
            <Button
              onClick={handleSubmit}
              disabled={creating}
              className="w-full rounded-full bg-[#8B3EFE] text-white hover:opacity-90 flex items-center justify-center gap-2 text-sm h-10"
            >
              {creating ? "Creating Account..." : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        email={email}
        page="user"
      />
    </div>
  );
}
