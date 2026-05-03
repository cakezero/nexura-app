"use client";

import React, { useState, useEffect } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { Card, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { useWallet } from "../../hooks/use-wallet";
import { storeUserSession } from "../../lib/userSession";

export default function UserSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [isLongEnough, setIsLongEnough] = useState(false);

  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { address: walletAddress, isConnected } = useWallet();

  useEffect(() => {
    if (walletAddress) setAddress(walletAddress);
  }, [walletAddress]);

  const handleSignUp = async () => {
  setCreating(true);

  try {
    const fakeUserSession = {
      type: "user",
      role: "user",
      sessionId: crypto.randomUUID(),
      name: name || "Test User",
      email: email || "test@nexura.dev",
      wallet: address || "0xTESTWALLET",
    };

    storeUserSession(fakeUserSession);

    setLocation("/studio/users-hub");
  } catch (err: any) {
    toast({
      title: "Signup failed",
      description: err?.message || "Something went wrong.",
      variant: "destructive",
    });
  } finally {
    setCreating(false);
  }
};

  return (
    <div className="min-h-screen bg-[#8B3EFE1A] text-white overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      {/* WIDER WRAPPER */}
      <div className="max-w-2xl mx-auto relative z-10 space-y-6">

        {/* Header */}
        <div className="text-center py-4 sm:py-6 px-2 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            User Credentials
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Set up your user profile and secure your account on Nexura Studio
          </p>
        </div>

        {/* Card */}
        <Card className="border-2 border-purple-500 rounded-3xl p-6 space-y-6 bg-gray-900">

          <div className="space-y-6">

            {/* Name */}
            <div>
              <CardTitle className="text-white text-lg">Full Name</CardTitle>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2 w-full rounded-lg bg-gray-800 text-white border-purple-500"
              />
            </div>

            {/* Email */}
            <div>
              <CardTitle className="text-white text-lg">Email Address</CardTitle>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="mt-2 w-full rounded-lg bg-gray-800 text-white border-purple-500"
              />
            </div>

            {/* Wallet */}
            <div>
              <CardTitle className="text-white text-lg">Wallet Address</CardTitle>
              <Input
                value={address}
                onChange={(e) => !isConnected && setAddress(e.target.value)}
                readOnly={isConnected}
                placeholder="0x..."
                className={`mt-2 w-full rounded-lg bg-gray-800 text-white border-purple-500 ${
                  isConnected ? "opacity-70 cursor-not-allowed font-mono text-sm" : ""
                }`}
              />
              {isConnected && (
                <p className="text-xs text-white/30 mt-1">
                  Auto-filled from connected wallet
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <CardTitle className="text-white text-lg">Password</CardTitle>
              <div className="relative mt-2">
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
                  className="w-full rounded-lg bg-gray-800 text-white border-purple-500 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <div className="mt-2 space-y-1 text-xs bg-gray-800/60 p-3 rounded-2xl">
                <p className={isLongEnough ? "text-green-400" : "text-red-400"}>• 8+ characters</p>
                <p className={hasUppercase ? "text-green-400" : "text-red-400"}>• 1 uppercase</p>
                <p className={hasNumber ? "text-green-400" : "text-red-400"}>• 1 number</p>
                <p className={hasSpecialChar ? "text-green-400" : "text-red-400"}>• 1 special character</p>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <CardTitle className="text-white text-lg">Confirm Password</CardTitle>
              <div className="relative mt-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-gray-800 text-white border-purple-500 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

          </div>

          <CardFooter className="pt-2">
            <Button
              onClick={handleSignUp}
              disabled={creating}
              className="w-full rounded-full bg-[#8B3EFE] text-white hover:opacity-90 flex items-center justify-center gap-2"
            >
              {creating ? "Creating Account..." : "Create Account"}
              <ArrowRight />
            </Button>
          </CardFooter>

        </Card>
      </div>
    </div>
  );
}