"use client";

import React from "react";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function UsersCreate() {
  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-4 sm:p-6 relative">
      <AnimatedBackground />

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center py-4 sm:py-6 px-2 sm:px-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            Nexura Studio
          </h1>
          <p className="text-sm text-white/60 leading-relaxed">
            Create a dedicated user presence on Nexura.
          </p>
        </div>

        {/* Card */}
        <Card className="border-2 border-purple-500 rounded-3xl p-6 space-y-6 bg-gray-900">
          <div className="space-y-4">
            {/* Create User */}
            <div>
              <CardTitle className="text-white text-lg">Create Your Hub</CardTitle>
              <CardDescription className="text-white/60 text-sm mt-1">
                Set up your user profile and secure your account on Nexura Studio.
              </CardDescription>
            </div>
            <Link href="/studio/users/user-signup">
              <Button className="w-full rounded-full bg-[#8B3EFE] text-white hover:opacity-90 flex items-center justify-center gap-2">
                Create Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-t border-purple-500/30" />
              <span className="text-xs text-white/40">or</span>
              <hr className="flex-1 border-t border-purple-500/30" />
            </div>

            {/* Sign In */}
            <div>
              <CardTitle className="text-white text-lg">Sign In to Existing Hub</CardTitle>
              <CardDescription className="text-white/60 text-sm mt-1">
                Already have a user account? Access your existing hub.
              </CardDescription>
            </div>
            <Link href="/studio/users/user-signin">
              <Button className="w-full rounded-full bg-transparent border border-[#8B3EFE] text-white hover:bg-[#8B3EFE] hover:opacity-90 flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
