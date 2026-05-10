"use client";

import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { projectApiRequest } from "../../lib/projectApi";
import { userApiRequest } from "../../lib/userApi";
import { useToast } from "../../hooks/use-toast";
import { getStoredUserSession } from "../../lib/userSession";
import { apiRequestV2 } from "../../lib/queryClient";
import { Button } from "../ui/button";

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
  project_name?: string;
  project_image?: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const session = getStoredUserSession();
  const isUser = session?.type === "user";

  const fetchQuests = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // Server time sync
  useEffect(() => {
    apiRequestV2("GET", `/api/server-time`)
      .then((res: any) => setServerOffset(res.serverTime - Date.now()))
      .catch(() => {});
  }, []);

  const nowMs = Date.now() + serverOffset;

  const isDraft = (c: Quest) => c.status === "Save";
  const isCompleted = (c: Quest) =>
    c.status === "Ended" || (!!c.ends_at && new Date(c.ends_at).getTime() <= nowMs);
  const isScheduled = (c: Quest) => {
    if (c.status === "Scheduled") return true;
    if (isDraft(c) || isCompleted(c)) return false;
    return !!c.starts_at && new Date(c.starts_at).getTime() > nowMs;
  };
  const isActive = (c: Quest) =>
    !isDraft(c) && !isCompleted(c) && !isScheduled(c);

  // Countdown timer
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
          newCountdowns[q._id] = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
        }
      }
      setCountdowns(newCountdowns);
      if (anyExpired) fetchQuests();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quests, serverOffset, fetchQuests]);

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
    { id: "scheduled", label: "Upcoming", count: quests.filter(isScheduled).length },
    { id: "drafts", label: "Drafts", count: quests.filter(isDraft).length },
    { id: "completed", label: "Completed", count: quests.filter(isCompleted).length },
  ];

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setPendingAction(null);
    try {
      const { apiPrefix, apiRequest } = getApiConfig();
      await apiRequest({ method: "DELETE", endpoint: `/${apiPrefix}/delete-quest`, params: { id } });
      setQuests((prev) => prev.filter((q) => q._id !== id));
      toast({ title: "Quest deleted", description: "The quest has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = async (id: string) => {
    setClosingId(id);
    setPendingAction(null);
    try {
      const { apiPrefix, apiRequest } = getApiConfig();
      await apiRequest({ 
        method: "PATCH", 
        endpoint: `/${apiPrefix}/publish-quest`,
        data: { questId: id, status: "Ended" } 
      });
      toast({ title: "Quest closed", description: "The quest has been closed successfully." });
      fetchQuests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setClosingId(null);
    }
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === "delete") {
      handleDelete(pendingAction.id);
      return;
    }
    if (pendingAction.type === "close") {
      handleClose(pendingAction.id);
      return;
    }
  };

  const renderQuestCard = (quest: Quest) => {
    const draft = isDraft(quest);
    const scheduled = isScheduled(quest);
    const completed = isCompleted(quest);

    let status = "Published";
    let statusColor = "text-[#00E1A2] bg-[#00E1A24D]";

    if (draft) {
      status = "Draft";
      statusColor = "text-yellow-400 bg-yellow-400/20";
    } else if (scheduled) {
      status = "Upcoming";
      statusColor = "text-blue-400 bg-blue-400/20";
    } else if (completed) {
      status = "Completed";
      statusColor = "text-gray-400 bg-gray-400/20";
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    };

    const durationText = scheduled && countdowns[quest._id] 
      ? `Starts in ${countdowns[quest._id]}`
      : `${formatDate(quest.starts_at)} - ${formatDate(quest.ends_at)}`;

    const createUrl = isUser ? "/user-dashboard/create-new-quest" : "/studio-dashboard/create-new-quest";

    return (
      <QuestCard
        key={quest._id}
        questId={quest._id}
        title={quest.title}
        description={quest.description || "Quest"}
        projectName={quest.project_name || session?.name || "My Project"}
        projectLogo={quest.project_image || quest.projectCoverImage || "/quest-1.png"}
        heroImage={quest.projectCoverImage || "/quest-1.png"}
        rewards={quest.reward?.pool ? `${quest.reward.pool} TRUST` : "XP Rewards"}
        duration={durationText}
        status={status}
        statusColor={statusColor}
        showClose={!draft && !completed}
        showDelete={draft || completed}
        isClosing={closingId === quest._id}
        isDeleting={deletingId === quest._id}
        onClose={(id) => setPendingAction({ type: "close", id, title: quest.description || quest.title })}
        onDelete={(id) => setPendingAction({ type: "delete", id, title: quest.description || quest.title })}
        onView={(id) => setLocation(`${createUrl}?edit=${id}`)}
        rewardPoolLabel="REWARD POOL:"
        from="studio"
      />
    );
  };

  const createUrl = isUser ? "/user-dashboard/create-new-quest" : "/studio-dashboard/create-new-quest";

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Quests</h1>
            <p className="text-white/60 text-lg">Manage and track your community quests</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            onClick={fetchQuests}
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex border-b border-white/20 gap-4 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "border-b-2 border-purple-500 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/60">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading quests...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeTab === "all" && (
              <Link
                href={createUrl}
                className="w-full p-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-purple-500 rounded-2xl bg-black hover:bg-black/80 hover:border-[#8B3EFE] transition cursor-pointer no-underline"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-2xl font-bold">+</div>
                <p className="font-semibold text-white text-center text-lg">Create New Quest</p>
                <p className="text-white/60 text-center text-sm">Launch a New Quest now</p>
              </Link>
            )}

            {filteredQuests.length === 0 ? (
              <p className="text-white/60 col-span-full">No quests found.</p>
            ) : (
              filteredQuests.map((q) => renderQuestCard(q))
            )}
          </div>
        )}
      </div>

      <Dialog open={!!pendingAction} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle
              className={
                pendingAction?.type === "delete"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {pendingAction?.type === "delete" ? "Delete Quest" : "Close Quest"}
            </DialogTitle>
            <DialogDescription className="text-white/60 pt-1">
              {pendingAction?.type === "delete"
                ? (<>This will <span className="text-red-400 font-semibold">permanently delete</span> <span className="text-white font-medium">"{pendingAction?.title}"</span>. This action cannot be undone.</>)
                : (<>This will close <span className="text-white font-medium">\"{pendingAction?.title}\"</span>. It will no longer accept submissions.</>)
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="ghost" className="text-white/60 hover:text-white" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              className={
                pendingAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
              }
              onClick={confirmAction}
            >
              {pendingAction?.type === "delete" ? "Delete" : "Close Quest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
