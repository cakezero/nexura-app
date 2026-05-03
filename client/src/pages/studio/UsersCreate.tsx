"use client";

import React from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Link } from "wouter";

export default function UsersCreate() {
  const steps: { title: string; description: string; icon: string; borderedIcon?: boolean }[] = [
    {
      title: "Add Details",
      description: "Add your details, upload your identity, and define your presence.",
      icon: "/add-details.png",
    },
    {
      title: "Connect Your Account",
      description: "Link your socials to verify and unlock features",
      icon: "/discord-logo.png",
      borderedIcon: true,
    },
    {
      title: "Explore Studio Features",
      description: "Explore tools to manage your presence inside your hub.",
      icon: "/activate.png",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-1 sm:p-2 relative">
      <AnimatedBackground />

      <div className="max-w-xl mx-auto relative z-10 space-y-8">

        {/* Header */}
        <div className="text-center py-4 px-1 sm:py-2 sm:px-0">
          <h1 className="text-xl font-bold text-white mb-1">
            Nexura Studio
          </h1>
          <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto leading-snug">
            Create a dedicated user presence on Nexura.
          </p>
        </div>

        {/* Outer Card */}
        <div className="mx-auto max-w-lg">
          <Card className="bg-[#0F061E] border-2 border-[#8A3EFE] rounded-2xl p-4">

            {/* Steps */}
            <div className="flex flex-col gap-3">
              {steps.map((step, idx) => (
                <Card
                  key={step.title}
                  className="bg-[#0F061E] border border-[#8A3EFE] rounded-xl p-3 flex items-start gap-3"
                >
                  {step.borderedIcon ? (
                    <div className="w-9 h-9 mt-0.5 flex-shrink-0 rounded-lg border border-[#8A3EFE] bg-[#0F061E] flex items-center justify-center p-1.5">
                      <img src={step.icon} alt={step.title} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <img src={step.icon} alt={step.title} className="w-9 h-9 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="space-y-1">
                    <CardTitle className="text-white text-sm">
                      {step.title}
                    </CardTitle>
                    <CardDescription className="text-white/60 text-xs">
                      {step.description}
                    </CardDescription>
                  </div>
                </Card>
              ))}
            </div>

            <hr className="border-t border-[#8A3EFE]/60 my-3" />

            {/* Buttons */}
            <div className="flex flex-col gap-2">

              <Link href="/studio/users/user-signup">
                <Button className="w-full bg-[#8A3EFE] hover:bg-[#7A2FE0] text-sm py-2">
                  Create Your Hub
                </Button>
              </Link>

              <Link href="/studio/users/user-signin">
                <Button className="w-full bg-transparent border border-[#8A3EFE] hover:bg-[#7A2FE0] hover:border-[#7A2FE0] text-white text-sm py-2">
                  Sign in to Existing Hub
                </Button>
              </Link>

            </div>

          </Card>
        </div>
      </div>
    </div>
  );
}