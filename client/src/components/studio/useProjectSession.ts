"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_SESSION_EVENT, clearProjectSession, getStoredProjectToken, isProjectSessionActive } from "@/lib/projectApi";
import { useToast } from "@/hooks/use-toast";

// How often to check whether the token has run out while the page sits open
const CHECK_MS = 30_000;

/** Whether the studio session is still valid. Turns false as soon as the token expires or the server refuses it. */
export function useProjectSession() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const check = () => setActive(isProjectSessionActive());
    check();
    const id = setInterval(check, CHECK_MS);
    window.addEventListener(PROJECT_SESSION_EVENT, check);
    window.addEventListener("focus", check);
    window.addEventListener("storage", check); // signed in or out in another tab
    return () => {
      clearInterval(id);
      window.removeEventListener(PROJECT_SESSION_EVENT, check);
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  return active;
}

export function useSessionExpiryRedirect() {
  const active = useProjectSession();
  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    if (active || !getStoredProjectToken()) return;
    clearProjectSession();
    toast({ title: "Session expired", description: "Sign in again to continue." });
    router.replace("/studio");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

/** Where an admin signs in to the studio again. */
export const STUDIO_SIGN_IN_URL = "/studio/sign-in";
