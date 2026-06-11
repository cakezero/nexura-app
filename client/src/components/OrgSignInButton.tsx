"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { apiRequest } from "../lib/queryClient";

export default function OrgSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    // setLoading(true);
    // setError(null);
    // try {
    //   // Direct API call to get user/profile info
    //   const meRes = await apiRequest("GET", "/api/project/profile");
    //   const json = await meRes.json().catch(() => ({}));

    //   if (json?.hasProject && json?.projectId) {
    //     router.push(`/project/${json.projectId}/dashboard`);
    //   } else if (json?.hasProfile) {
    //     router.push("/studio");
    //   } else {
    //     router.push("/studio/register");
    //   }
    // } catch (e: any) {
    //   setError(e?.message ?? String(e));
    // } finally {
    //   setLoading(false);
    // }

    alert("Creating an organisation is on its way, in the mean time contact the nexura team with your campaign information. Thank you!")
  };

  return (
    <div className="fixed left-4 bottom-4 z-50 flex flex-col items-start gap-2">
      <p className="text-xs text-white/60">Are you an Organization?</p>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button size="sm" onClick={handleSignIn} disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </div>
  );
}
