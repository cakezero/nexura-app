"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECT_SESSION_EVENT, getStoredProjectToken, isProjectSessionActive, projectApiRequest } from "@/lib/projectApi";

const POLL_MS = 30_000;

export type ProjectNotice = {
  id: string; kind: "project"; actorName: string; changes: string[]; tab: "project" | "accounts";
  createdAt: string; readByMe: boolean;
};

/** Event fired after this tab saves project settings, so the bell refreshes straight away. */
export const PROJECT_SETTINGS_EVENT = "nexura-project-settings-changed";

/** Notices that another Owner/Super Admin changed the project settings (they don't go through proposals). */
export function useProjectNotifications() {
  const [items, setItems] = useState<ProjectNotice[]>([]);
  const unavailable = useRef(false);

  const refresh = useCallback(async () => {
    if (!getStoredProjectToken() || unavailable.current) return;
    if (!isProjectSessionActive()) { setItems([]); return; }
    try {
      const res = await projectApiRequest<{ items: ProjectNotice[] }>({ method: "GET", endpoint: "/hub/notifications" });
      setItems(res.items ?? []);
    } catch (err) {
      // An API without this endpoint yet: stop asking
      if ((err as { status?: number })?.status === 404) { unavailable.current = true; setItems([]); }
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    const onChange = () => { refresh(); };
    const onFocus = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener(PROJECT_SESSION_EVENT, onChange);
    window.addEventListener(PROJECT_SETTINGS_EVENT, onChange);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener(PROJECT_SESSION_EVENT, onChange);
      window.removeEventListener(PROJECT_SETTINGS_EVENT, onChange);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const markRead = useCallback(async (ids?: string[]) => {
    const target = ids ? new Set(ids) : null;
    setItems(prev => prev.map(n => (!target || target.has(n.id) ? { ...n, readByMe: true } : n)));
    try { await projectApiRequest({ method: "POST", endpoint: "/hub/notifications/read", data: ids ? { ids } : {} }); }
    catch { refresh(); }
  }, [refresh]);

  return { items, unread: items.filter(n => !n.readByMe).length, markRead };
}

/** "Ada changed the website and description." */
export function describeNotice(n: ProjectNotice) {
  const list = n.changes.length <= 1 ? n.changes.join("")
    : `${n.changes.slice(0, -1).join(", ")} and ${n.changes[n.changes.length - 1]}`;
  return { who: n.actorName || "An admin", what: `changed the ${list || "project settings"}` };
}
