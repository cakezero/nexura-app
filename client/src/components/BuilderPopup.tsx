"use client";

import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useWallet } from "../hooks/use-wallet";
import { createUserFromWallet, createProjectAccount } from "../lib/remoteDb";
import { apiRequest } from "../lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { KeyRound, AlertTriangle } from "lucide-react";

export default function SignUpPopup({ mode = "user" as "user" | "project", action = "signup" as "signup" | "signin", triggerLabel, }: { mode?: "user" | "project"; action?: "signup" | "signin"; triggerLabel?: string; }) {
  const { connectWallet, address, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleConnectAndCreate() {
    setError(null);
    setLoading(true);
    try {
      const connectedAddress = await connectWallet({ noReload: true });
      if (!connectedAddress) throw new Error("Wallet connection failed");

      // Do not auto-open AppKit/Wagmi modal during signup/connect flows.
      // The app exposes explicit UI for opening AppKit when desired.

      if (mode === "user") {
        try {
          const meRes = await apiRequest('GET', '/api/user/profile').catch(() => null);
          if (meRes) {
            const json = await meRes.json().catch(() => ({}));
            setOpen(false);
            if (json?.user) {
              window.location.reload();
            } else {
              alert("Account created — please complete your profile");
              window.location.href = "/profile/edit";
            }
            return;
          }
        } catch (e) {
          // fall back to remote upsert
        }
        await createUserFromWallet({
          address: connectedAddress,
          metadata: { createdAt: new Date().toISOString() },
        } as any);
        setOpen(false);
        window.location.reload();
      } else {
        try {
          await createProjectAccount({
            address: connectedAddress,
            metadata: { createdAt: new Date().toISOString() },
          } as any);
        } catch (e) {
          // ignore
        }
        try {
          const res = await apiRequest('GET', '/projects').catch(() => null);
          if (res) {
            const list = await res.json();
            const my = list.find((p: any) => p.ownerAddress && p.ownerAddress.toLowerCase() === (connectedAddress || "").toLowerCase());
            setOpen(false);
            if (my) {
              window.location.href = `/project/${my.id}/dashboard`;
            } else {
              window.location.href = `/projects/create`;
            }
            return;
          }
        } catch (e) {
          // fall back
        }
        setOpen(false);
        window.location.href = "/projects/create";
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  const label = triggerLabel ?? (action === "signin" ? (mode === "project" ? "Project Sign In" : "Sign In") : (mode === "project" ? "Project Sign Up" : "Sign Up"));

  return (
<Dialog open={open} onOpenChange={(v) => setOpen(v)}>
  <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} className="border border-white/80 text-white bg-transparent hover:bg-purple-600 hover:border-purple-600 transition-all">{label}</Button>
      </DialogTrigger>
  <DialogContent className="border-2 border-purple-500 rounded-2xl p-6 sm:p-8">
    <DialogHeader>
      <DialogTitle>Are you a builder?</DialogTitle>
      <DialogDescription>
        Connect your wallet to start launching and managing your campaign.
      </DialogDescription>
    </DialogHeader>

    {/* Inner Card with purple border */}
    <div className="my-6 mx-4 sm:mx-0">
      <Card className="border-2 border-purple-500 rounded-2xl p-4 sm:p-6">
        <CardHeader>
          <CardTitle>{mode === "project" ? "Project Wallet" : "User Wallet"}</CardTitle>
          <CardDescription>Sign in as a builder</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <p className="text-sm text-muted-foreground">
              Use your crypto wallet to {action === "signin" ? "sign in" : "sign up"}.
            </p>
            <Button onClick={handleConnectAndCreate} size="lg" className="flex items-center gap-2 border border-white/80 text-white bg-transparent hover:bg-purple-600 hover:border-purple-600 transition-all">
              <KeyRound className="h-5 w-5" />
              {loading ? "Working..." : isConnected ? "Use connected wallet" : "Connect Wallet"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>Exit</Button>
        </CardFooter>
      </Card>
    </div>

    {error && (
      <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    )}
  </DialogContent>
</Dialog>
  );
}
