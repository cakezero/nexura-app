"use client";

import React from "react";
import { Button } from "./ui/button";
import { useWallet } from "../hooks/use-wallet";

export default function SignUpPopup({ mode = "user" as "user" | "project", action = "signup" as "signup" | "signin", triggerLabel, }: { mode?: "user" | "project"; action?: "signup" | "signin"; triggerLabel?: string; }) {
  const { connectWallet } = useWallet();

  const label = triggerLabel ?? (action === "signin" ? (mode === "project" ? "Project Sign In" : "Sign In") : (mode === "project" ? "Project Sign Up" : "Sign Up"));

  return (
    <Button onClick={() => connectWallet({ purpose: mode === "project" ? "org-signin" : undefined })}>
      {label}
    </Button>
  );
}
