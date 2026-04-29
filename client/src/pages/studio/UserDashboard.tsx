import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import AnimatedBackground from "../../components/AnimatedBackground.tsx";
import UserSidebar from "./UserSidebar.tsx";
import { projectApiRequest, isProjectSignedIn } from "../../lib/projectApi";
import { apiRequest } from "../../lib/config.ts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

import { Button } from "../../components/ui/button";
import { Check, X } from "lucide-react";
import { TASKSS } from "../../types/admin";

interface StudioDashboardProps {
  onLogout: () => void;
}

type TabType = "profile" | "quests" | "questSubmissions";

type BannedUser = {
  _id: string;
  walletAddress: string;
  username: string;
  bannedAt: string;
};

export default function userDashboard({ onLogout }: StudioDashboardProps) {
  const [location, setLocation] = useLocation();

  // ---------------- AUTH GUARD ----------------
  useEffect(() => {
    if (!isProjectSignedIn()) {
      setLocation("/studio");
    }
  }, []);

  // ---------------- TAB DERIVATION (SOURCE: URL ONLY) ----------------
const activeTab: TabType =
  location.includes("/user-dashboard/user-profile")
    ? "profile"
    : location.includes("/user-dashboard/quests-tab")
    ? "quests"
    : "questSubmissions";

  // ---------------- STATE ----------------
  const [viewedSubmissions, setViewedSubmissions] = useState<Set<string>>(new Set());
  const [questTasks, setQuestTasks] = useState<TASKSS[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TASKSS | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------- FETCH QUESTS ----------------
  const fetchQuests = async () => {
    try {
      setLoading(true);

      const res = await projectApiRequest<{
        pendingTasks?: TASKSS[];
      }>({
        endpoint: "/hub/quest-submissions",
        method: "GET",
      });

      const pendingTasks = res?.pendingTasks ?? [];

      setQuestTasks(
        pendingTasks.filter((task) => task.page === "quest")
      );
    } catch (err) {
      console.error("Failed to fetch quests:", err);
      setQuestTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH ON DASHBOARD ONLY ----------------
  useEffect(() => {
    if (location.includes("/user-dashboard")) {
      fetchQuests();
    }
  }, [location]);

  // ---------------- VIEW ----------------
  const handleView = (id: string) => {
    const task = questTasks.find((t) => t._id === id);
    if (!task) return;

    setSelectedTask(task);
    setViewModalOpen(true);

    setViewedSubmissions((prev) => new Set(prev).add(id));
  };

  // ---------------- ACTION ----------------
  const handleAction = async (
    id: string,
    action: "accept" | "reject"
  ) => {
    try {
      setLoading(true);

      await projectApiRequest({
        method: "POST",
        endpoint: "/hub/validate-quest-submissions",
        data: { submissionId: id, action },
      });

      await fetchQuests();

      setViewedSubmissions((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- NAVIGATION ----------------
const navigate = (tab: TabType) => {
  if (tab === "profile") setLocation("/user-dashboard/user-profile");
  if (tab === "quests") setLocation("/user-dashboard/quests-tab");
  if (tab === "questSubmissions") setLocation("/user-dashboard/quest-submissions");
};

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex h-screen flex-col md:flex-row">

        {/* SIDEBAR */}
        <UserSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* HEADER */}
          <header className="hidden md:flex h-16 border-b border-white/10 items-center px-6">
            <h2 className="text-white font-semibold">
              {activeTab === "profile" && "User Profile"}
              {activeTab === "quests" && "Quests"}
              {activeTab === "questSubmissions" && "Quest Submissions"}
            </h2>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto px-6 py-6">

{/* {activeTab === "questSubmissions" && (
  <div className="text-white text-2xl">
    TEST STAT OVERVIEW
  </div>
)} */}

            {activeTab === "quests" && (
              <div className="text-white">Quests Page</div>
            )}

            {activeTab === "profile" && (
              <div className="text-white">User Profile Page</div>
            )}

          </main>
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submission</DialogTitle>
            <DialogDescription>
              {selectedTask?.taskType}
            </DialogDescription>
          </DialogHeader>

          <div className="text-white">
            {selectedTask?.submissionLink}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              disabled={!selectedTask}
              onClick={() =>
                selectedTask && handleAction(selectedTask._id, "accept")
              }
            >
              <Check className="w-4 h-4" />
            </Button>

            <Button
              disabled={!selectedTask}
              onClick={() =>
                selectedTask && handleAction(selectedTask._id, "reject")
              }
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}