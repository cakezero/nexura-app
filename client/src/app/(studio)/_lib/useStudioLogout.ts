"use client";

import { useRouter } from "next/navigation";
import { clearProjectSession, getStoredProjectToken, projectApiRequest } from "@/lib/projectApi";

/**
 * Reproduces App.tsx's handleLogout for the studio + user dashboards.
 * Clears the admin/user/project sessions, calls the hub logout endpoint
 * when a project token is present, then redirects to the studio landing page.
 */
export function useStudioLogout() {
  const router = useRouter();

  return () => {
    // Clear admin + user sessions
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexura-admin:token");
      localStorage.removeItem("nexura-admin:info");
      localStorage.removeItem("nexura_user_session");
    }

    // Clear project session and call server logout if project is signed in
    if (getStoredProjectToken()) {
      projectApiRequest({ method: "POST", endpoint: "/hub/logout" }).catch(() => {});
    }

    clearProjectSession();

    router.push("/studio");
  };
}
