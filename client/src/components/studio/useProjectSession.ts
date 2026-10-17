"use client";

import { useEffect, useState } from "react";
import { PROJECT_SESSION_EVENT, isProjectSessionActive } from "@/lib/projectApi";

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

/** Where an admin signs in to the studio again. */
export const STUDIO_SIGN_IN_URL = "/projects/create/signin-to-hub";
