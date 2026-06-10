"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { KeyRound } from "lucide-react";
import { useWallet } from "../hooks/use-wallet";

export default function WalletAuthCard({ mode = "user", action = "signin" }: { mode?: "user" | "project"; action?: "signin" | "signup" }) {
  const { connectWallet, isConnected } = useWallet();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "project" ? "Project Wallet" : "User Wallet"}</CardTitle>
        <CardDescription>{mode === "project" ? "Sign in as a project account" : "Sign in with your wallet"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-6 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Use your crypto wallet to {action === "signin" ? "sign in" : "sign up"}.</p>
          <Button
            onClick={() => connectWallet({ purpose: mode === "project" ? "org-signin" : undefined })}
            size="lg"
            className="flex items-center gap-2"
          >
            <KeyRound className="h-5 w-5" />
            {isConnected ? "Use connected wallet" : "Connect Wallet"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
      </CardFooter>
    </Card>
  );
}

export { WalletAuthCard };
