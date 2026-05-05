"use client";

import React, { useState } from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { Card, CardTitle, CardFooter } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "../../../hooks/use-toast";
import { storeUserSession } from "../../../lib/userSession";
import { userApiRequest } from "../../../lib/userApi";

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
    <div className="min-h-screen bg-black text-white overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setLocation("/studio/users/create")}
          className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center py-4 sm:py-6 px-2 sm:px-0 pt-12">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            User Sign In
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Access your Nexura user account
          </p>
        </div>

        {/* Card */}
        <Card className="border-2 border-purple-500 rounded-3xl p-6 space-y-6 bg-gray-900">
          {/* Email */}
          <div>
            <CardTitle className="text-white text-lg">Email Address</CardTitle>
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
              <CardTitle className="text-white text-lg">Password</CardTitle>
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
                placeholder="* * * * * * * *"
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
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Button */}
          <CardFooter className="pt-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-[#8B3EFE] text-white hover:opacity-90 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d14] border border-purple-500/20 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-white">Reset Password</h2>

            <Input
              type="email"
              placeholder="Enter email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="bg-gray-800 text-white border-purple-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-white/60"
              >
                Cancel
              </button>

              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="px-4 py-2 bg-[#8B3EFE] rounded-lg"
              >
                {resetLoading ? "Sending..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
