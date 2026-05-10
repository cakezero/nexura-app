"use client";

import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useLocation } from "wouter";
import { RefreshCw, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { projectApiRequest } from "../../lib/projectApi";
import { userApiRequest } from "../../lib/userApi";
import { useToast } from "../../hooks/use-toast";
import { getStoredUserSession } from "../../lib/userSession";

import QuestCard from "../QuestCard";

interface Quest {
  _id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  projectCoverImage?: string;
  reward?: { pool?: number };
  status?: string;
}

type PendingAction = { type: "delete" | "close"; id: string; title: string } | null;

function getApiConfig() {
  const session = getStoredUserSession();
  return {
    apiPrefix: session?.type === "user" ? "user-hub" : "hub",
    apiRequest: session?.type === "user" ? userApiRequest : projectApiRequest,
  };
}

export default function QuestsTab() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "drafts" | "completed">("all");
  const [serverOffset, setServerOffset] = useState(0);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const { apiPrefix, apiRequest } = getApiConfig();
      const res = await apiRequest<{ quests?: Quest[]; hubQuests?: Quest[] }>({
        method: "GET",
        endpoint: `/${apiPrefix}/get-quests`,
      });
      setQuests(res.quests ?? res.hubQuests ?? []);
    } catch (err: any) {
      toast({
        title: "Fetch failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  // Server time sync for accurate Scheduled/Active switching
  useEffect(() => {
    const getServerTime = async () => {
      try {
        const res = await fetch("https://nexura-app.onrender.com/api/server-time");
        const data = await res.json();
        setServerOffset(data.serverTime - Date.now());
      } catch { /* ignore */ }
    };
    getServerTime();
  }, []);

  const isScheduled = (c: Quest) => {
    const nowMs = Date.now() + serverOffset;
    return c.status !== "Ended" && c.status !== "Save" && !!c.starts_at && new Date(c.starts_at).getTime() > nowMs;
  };

  const isDraft = (c: Quest) => c.status === "Save";

const isCompleted = (c: Quest) =>
  c.status === "Ended" || new Date(c.ends_at).getTime() <= Date.now() + serverOffset;

const isActive = (c: Quest) =>
  !isDraft(c) && !isCompleted(c) && !isScheduled(c);

  // Countdown timer for scheduled quests — auto-reloads when countdown expires
  useEffect(() => {
    const scheduled = quests.filter(isScheduled);
    if (scheduled.length === 0) return;
    const tick = () => {
      const n = Date.now() + serverOffset;
      const newCountdowns: Record<string, string> = {};
      let anyExpired = false;
      for (const q of scheduled) {
        const diff = new Date(q.starts_at!).getTime() - n;
        if (diff <= 0) {
          anyExpired = true;
          newCountdowns[q._id] = "Starting...";
        } else {
          const d = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          newCountdowns[q._id] = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
        }
      }
      setCountdowns(newCountdowns);
      if (anyExpired) fetchQuests();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quests.filter(isScheduled).length, serverOffset]);

const filteredQuests = quests.filter((c) => {
  if (activeTab === "all") return true;
  if (activeTab === "active") return isActive(c);
  if (activeTab === "scheduled") return isScheduled(c);
  if (activeTab === "drafts") return isDraft(c);
  if (activeTab === "completed") return isCompleted(c);
  return true;
});

const tabs = [
  { id: "all", label: "All Quests", count: quests.length },
  { id: "active", label: "Active", count: quests.filter(isActive).length },
  { id: "scheduled", label: "Scheduled", count: quests.filter(isScheduled).length },
  { id: "drafts", label: "Drafts", count: quests.filter(isDraft).length },
  { id: "completed", label: "Completed", count: quests.filter(isCompleted).length },
];

  const confirmAction = async () => {
    if (!pendingAction) return;
    try {
      const { apiPrefix, apiRequest } = getApiConfig();
      await apiRequest({
        method: "DELETE",
        endpoint: `/${apiPrefix}/delete-quest`,
        params: { id: pendingAction.id },
      });
      setQuests((prev) => prev.filter((q) => q._id !== pendingAction.id));
      toast({ title: "Quest closed", description: `"${pendingAction.title}" has been removed.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setPendingAction(null);
    }
  };

  const renderQuestCard = (quest: Quest) => {
    const draft = isDraft(quest);
    const scheduled = isScheduled(quest);
    const completed = isCompleted(quest);

    let status = "Published";
    let statusColor = "bg-green-500";

    if (draft) {
      status = "Draft";
      statusColor = "bg-yellow-500";
    } else if (scheduled) {
      status = "Upcoming";
      statusColor = "bg-blue-500";
    } else if (completed) {
      status = "Completed";
      statusColor = "bg-gray-500";
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    };

    const durationText = scheduled && countdowns[quest._id] 
      ? `Starts in ${countdowns[quest._id]}`
      : `${formatDate(quest.starts_at)} - ${formatDate(quest.ends_at)}`;

    return (
      <QuestCard
        key={quest._id}
        questId={quest._id}
        title={quest.title}
        description={quest.description || "Quest"}
        projectName="My Project"
        projectLogo={quest.projectCoverImage || "/quest-1.png"}
        heroImage={quest.projectCoverImage || "/quest-1.png"}
        rewards={quest.reward?.pool ? `${quest.reward.pool} TRUST` : "XP Rewards"}
        duration={durationText}
        status={status}
        statusColor={statusColor}
        showClose={!draft && !completed}
        onClose={(id) => setPendingAction({ type: "close", id, title: quest.description || quest.title })}
        onDelete={(id) => setPendingAction({ type: "delete", id, title: quest.description || quest.title })}
        showDelete={draft || completed}
        onView={(id) => setLocation(`/user-dashboard/create-new-quest?edit=${id}`)}
        from="dashboard"
      />
    );
  };

  return (
    <>
      <div className="space-y-6 text-white">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Quests</h1>
            <p className="text-white/60">Manage your quests</p>
          </div>

          <Button variant="ghost" onClick={fetchQuests} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin w-5 h-5" : "w-5 h-5"} />
          </Button>
        </div>

{/* TABS */}
<div className="flex gap-4 border-b border-white/20 pb-2">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      className={`text-sm pb-2 transition ${
        activeTab === tab.id
          ? "text-white border-b-2 border-purple-500"
          : "text-white/60 hover:text-white"
      }`}
    >
      {tab.label} ({tab.count})
    </button>
  ))}
</div>




<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">

  {/* CREATE CARD (only on ALL tab) */}
  {activeTab === "all" && (
    <div onClick={() => setLocation("/user-dashboard/create-new-quest")}>
      <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-purple-500 rounded-xl bg-black/20 hover:bg-black/30 transition cursor-pointer p-6 min-h-[200px]">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-xl font-bold">
          +
        </div>

        <p className="mt-2 text-sm font-semibold text-white text-center">
          Create New Quests
        </p>

        <p className="text-white/50 text-xs text-center">
          Launch new quest
        </p>
      </div>
    </div>
  )}

  {/* QUEST CARDS */}
  {filteredQuests.map((q) => renderQuestCard(q))}

</div>
</div>

      {/* CONFIRM MODAL */}
      <Dialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>{pendingAction?.type === "close" ? "Close Quest" : "Action"}</DialogTitle>
            <DialogDescription>
              {pendingAction?.title}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setPendingAction(null)} variant="ghost">
              Cancel
            </Button>
            <Button onClick={confirmAction} className="bg-yellow-600">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
