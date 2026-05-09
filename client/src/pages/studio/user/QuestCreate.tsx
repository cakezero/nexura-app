"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import React from "react";
import { Card, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { projectApiRequest } from "../../../lib/projectApi";
import { userApiRequest } from "../../../lib/userApi";
import { payStudioHubFee } from "../../../lib/performOnchainAction";
import { useToast } from "../../../hooks/use-toast";
import { getStoredUserSession } from "../../../lib/userSession";
import {
  Calendar,
  ImageIcon,
} from "lucide-react";

type Task = {
  _id: string | undefined;
  type: string;
  platform: string;
  handleOrUrl: string;
  description: string;
  validation: string;
  verificationMode?: string;
  roleId: string;
  channelId: string;
};

interface QuestCreateProps {
  isUserMode?: boolean;
}

export default function QuestCreate({ isUserMode = false }: QuestCreateProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const session = getStoredUserSession();
  const apiPrefix = isUserMode ? "/user-hub" : (session?.type === "user" ? "/user-hub" : "/hub");
  const apiRequest = isUserMode ? userApiRequest : (session?.type === "user" ? userApiRequest : projectApiRequest);

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [questId, setQuestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showModal, setShowModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    _id: undefined,
    type: "",
    platform: "",
    handleOrUrl: "",
    description: "",
    validation: "Manual Validation",
    verificationMode: "",
    roleId: "",
    channelId: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [descError, setDescError] = useState("");

  const [questName, setQuestName] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  // Constants
  const XP_REWARDS = "200";

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) return;

    (async () => {
      try {
        const res = await apiRequest<{ quests?: any[]; hubQuests?: any[] }>({
          method: "GET",
          endpoint: `${apiPrefix}/get-quests`,
        });
        const allQuests = res.quests ?? res.hubQuests ?? [];
        const found = allQuests.find((q: any) => q._id === editId);
        if (!found) return;

        setQuestId(editId);
        setQuestName(found.title ?? "");
        setQuestDescription(found.description ?? "");
        
        if (found.starts_at) {
          const s = new Date(found.starts_at);
          setStartDate(s.toISOString().split('T')[0]);
          setStartTime(s.toISOString().split('T')[1].slice(0, 5));
        }
        if (found.ends_at) {
          const e = new Date(found.ends_at);
          setEndDate(e.toISOString().split('T')[0]);
          setEndTime(e.toISOString().split('T')[1].slice(0, 5));
        }
        
        if (found.projectCoverImage) setCoverImagePreview(found.projectCoverImage);

        // Load mini quests (tasks) from separate collection
          const miniRes = await fetch(`${(import.meta as any).env.VITE_BACKEND_URL || ""}/api/quest/fetch-mini-quests?id=${editId}`, {
            headers: { Authorization: `Bearer ${session?.token}` },
          });
          const miniData = await miniRes.json();
          setTasks((miniData.miniQuests || []).map((q: any) => ({
            _id: q._id,
            type: tagToType(q.tag),
            platform: q.category === "twitter" ? "Twitter" : (q.category || "Other"),
            handleOrUrl: q.link ?? "",
            description: q.quest || q.text || "",
            evidence: "",
            validation: "Manual Validation",
            verificationMode: q.verificationMode ?? "",
            roleId: q.roleId ?? "",
            channelId: q.channelId ?? "",
          })));
      } catch (err) {
        console.error("Failed to load quest", err);
      }
    })();
  }, [apiPrefix]);



  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    const reader = new FileReader();
    reader.onload = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toIsoDateTime = (date: string, time: string) => {
    if (!date) return "";
    return `${date}T${time || "00:00"}:00.000Z`;
  };

  const tagToType = (tag: string) => {
    if (tag === "comment-x") return "Comment on X";
    if (tag === "follow-x") return "Follow on X";
    if (tag === "portal") return "Portal Claims";
    if (tag === "feedback") return "Give Feedback";
    if (tag === "trust-name") return "Own a TNS";
    if (tag === "create-post") return "Create a Post";
    return "";
  };

  const typeToTag = (type: string) => {
    if (type === "Comment on X") return "comment-x";
    if (type === "Follow on X") return "follow-x";
    if (type === "Portal Claims") return "portal";
    if (type === "Give Feedback") return "feedback";
    if (type === "Create a Post") return "create-post";
    if (type === "Own a TNS") return "trust-name";
    return "";
  };

  const buildQuestFormData = (isDraft: boolean): FormData => {
    const fd = new FormData();
    fd.append("title", questName);
    fd.append("description", questDescription);
    fd.append("starts_at", toIsoDateTime(startDate, startTime));
    fd.append("ends_at", toIsoDateTime(endDate, endTime));
    fd.append("xp", XP_REWARDS);
    fd.append("page", "user"); // Important for controller logic
    if (coverImage) fd.append("coverImage", coverImage);
    if (isDraft) fd.append("status", "Save");

    const miniQuests = tasks.map(t => ({
      _id: t._id,
      quest: t.description,
      link: t.handleOrUrl || "#",
      tag: typeToTag(t.type),
      category: t.platform.toLowerCase(),
      verificationMode: t.verificationMode || "",
      roleId: t.roleId,
      channelId: t.channelId,

    }));
    fd.append("miniQuests", JSON.stringify(miniQuests));

    return fd;
  };

  const handleSaveDraft = async (thenNavigate?: string) => {
    if (!questName) {
      toast({ title: "Missing Name", description: "Please enter a quest name.", variant: "destructive" });
      return null;
    }

    // Check minimum tasks requirement when navigating to review
    if (thenNavigate === "review" && tasks.length < 3) {
      toast({ title: "Incomplete", description: "Please add at least 3 tasks before reviewing.", variant: "destructive" });
      return null;
    }

    setSaveLoading(true);
    try {
      const fd = buildQuestFormData(true);
      const endpoint = questId ? `${apiPrefix}/save-quest` : `${apiPrefix}/create-quest`;
      const res = await apiRequest<{ questId?: string }>({
        method: "POST",
        endpoint,
        formData: fd,
        params: questId ? { id: questId } : {},
      });
      if (res.questId) setQuestId(res.questId);
      toast({ title: "Draft Saved", description: "Your progress has been saved." });
      if (thenNavigate) setActiveTab(thenNavigate);
      return res.questId || questId;
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!questName || tasks.length < 3) {
      toast({ title: "Incomplete", description: "Please provide a name and at least 3 tasks.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const fd = buildQuestFormData(false);
      const endpoint = questId ? `${apiPrefix}/save-quest` : `${apiPrefix}/create-quest`;
      await apiRequest({
        method: "POST",
        endpoint,
        formData: fd,
        params: questId ? { id: questId } : {},
      });
      toast({ title: "Quest Published!", description: "Your quest is now live." });
      setLocation("/user-dashboard/quests-tab");
    } catch (err: any) {
      toast({ title: "Publish Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = () => {
    if (!newTask.type || !newTask.description) {
      toast({ title: "Incomplete", description: "Task type and description are required.", variant: "destructive" });
      return;
    }

    // Validate URL for Twitter/X tasks
    if (newTask.type === "Comment on X" || newTask.type === "Follow on X" || newTask.type === "Create a Post") {
      if (!newTask.handleOrUrl) {
        setUrlError("URL is required for this task type.");
        return;
      }
      if (newTask.handleOrUrl) {
        const twitterRegex = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/.+/i;
        if (!twitterRegex.test(newTask.handleOrUrl)) {
          setUrlError("Only x.com URLs are allowed.");
          return;
        }
      }
    }

    if (editingIndex !== null) {
      const updated = [...tasks];
      updated[editingIndex] = newTask;
      setTasks(updated);
      setEditingIndex(null);
    } else {
      setTasks([...tasks, newTask]);
    }

    setShowModal(false);
    setNewTask({
      _id: undefined,
      type: "",
      platform: "",
      handleOrUrl: "",
      description: "",
      validation: "Manual Validation",
      roleId: "",
      channelId: "",
    });
    setUrlError(""); setDescError("");
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8 text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{questId ? "Edit Quest" : "Create New Quest"}</h1>
          <p className="text-white/60 mt-2">
            Set up your community quest and reward participants with XP.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/10">
          {[
            { id: "details", label: "Details", icon: "/details.png" },
            { id: "tasks", label: "Tasks", icon: "/tasks.png" },
            { id: "review", label: "Review", icon: "/review.png" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === "review" && tasks.length < 3) {
                  toast({ title: "Incomplete", description: "Please add at least 3 tasks before reviewing.", variant: "destructive" });
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-start justify-start gap-2 py-5 text-lg font-semibold transition ${
                tab.id === "review" && tasks.length < 3 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span
                className={`block h-[4px] w-full rounded-full transition-colors ${
                  activeTab === tab.id ? "bg-[#8B3EFE]" : "bg-white/20"
                }`}
              />
              <div className="flex items-center gap-2 text-white/80 hover:text-white">
                <img src={tab.icon} alt={tab.label} className="w-5 h-5" />
                <span className={activeTab === tab.id ? "text-purple-400" : ""}>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <Card className="bg-purple/10 backdrop-blur-md p-8 space-y-8 border-white/10">
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium">Quest Name</label>
                <Input
                  placeholder="Enter quest name..."
                  className="bg-white/5 border-white/10"
                  value={questName}
                  onChange={(e) => setQuestName(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Quest Description</label>
                <Input
                  placeholder="Enter quest description..."
                  className="bg-white/5 border-white/10"
                  value={questDescription}
                  onChange={(e) => setQuestDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4" /> Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                    value={startDate && startTime ? `${startDate}T${startTime}` : ""}
                    onChange={(e) => {
                      const [d, t] = e.target.value.split("T");
                      setStartDate(d || "");
                      setStartTime(t ? t.slice(0, 5) : "");
                    }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4" /> End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                    value={endDate && endTime ? `${endDate}T${endTime}` : ""}
                    onChange={(e) => {
                      const [d, t] = e.target.value.split("T");
                      setEndDate(d || "");
                      setEndTime(t ? t.slice(0, 5) : "");
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm mb-3">
                  <ImageIcon className="w-4 h-4" /> Cover Image
                </label>
                <label className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-black hover:border-[#8B3EFE] cursor-pointer transition block">
                  <input type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
                  {coverImagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={coverImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl" />
                      <p className="text-sm text-white/60">Click to change image</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                      <img src="/upload-icon.png" alt="Upload" className="w-16 h-16" />
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-white/50">SVG, PNG, JPG or GIF (max. 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={() => setLocation("/user-dashboard")}>← Back</Button>
                <Button type="button" className="bg-[#8B3EFE] hover:bg-[#7b35e6]" onClick={() => handleSaveDraft("tasks")}>Next →</Button>
              </div>
            </div>
          </Card>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null);
                setNewTask({ _id: undefined, type: "", platform: "", handleOrUrl: "", description: "", validation: "Manual Validation", roleId: "", channelId: "" });
                setShowModal(true);
              }}
              className="absolute -top-10 right-0 px-3 py-1 bg-[#8B3EFE] text-white hover:bg-[#7b35e6] rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              Add Task
            </button>

            {tasks.length === 0 ? (
              <div className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-gray-900 text-center mt-8">
                <p className="text-white">Create a Quest Task</p>
                <p className="text-white/50 text-sm mt-1">Add at least 3 tasks to continue.</p>
                <Button type="button" className="mt-4 bg-[#8B3EFE]" onClick={() => setShowModal(true)}>Add Task</Button>
              </div>
            ) : (
              <div className="space-y-4 mt-8">
                {tasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 rounded-lg border-2 border-purple-500 px-4 py-3 bg-white/5">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full font-semibold">{index + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm text-white/70">{task.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingIndex(index); setNewTask(task); setShowModal(true); }}>Edit</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setTasks(tasks.filter((_, i) => i !== index))}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button type="button" variant="ghost" onClick={() => setActiveTab("details")}>← Back</Button>
              <Button type="button" className="bg-[#8B3EFE]" disabled={tasks.length < 3} onClick={() => handleSaveDraft("review")}>Next →</Button>
            </div>
          </div>
        )}

        {/* REVIEW TAB */}
        {activeTab === "review" && (
          <Card className="p-8 space-y-6 bg-black">
            <h2 className="text-2xl font-bold">Final Quest Review</h2>

            {/* Quest Board */}
            <div className="rounded-xl border border-purple-500/60 bg-white/5 overflow-hidden">

              {/* Top: image + title */}
              <div className="flex gap-6 p-6">
                {/* Cover image */}
                <div className="w-36 h-36 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      alt="Quest Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/40 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                {/* Title + description */}
                <div className="flex flex-col justify-center gap-1 min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">
                    {questName || "Untitled Quest"}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {questDescription || "No description provided"}
                  </p>
                  {startDate && endDate && (
                    <p className="text-white/40 text-xs mt-1">
                      {startDate} {startTime} → {endDate} {endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 divide-y md:divide-y-0 divide-x-0 md:divide-x divide-white/10">
                {/* XP Reward */}
                <div className="flex flex-col gap-1 p-5">
                  <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wide">
                    <span className="text-purple-400 font-bold text-sm leading-none">XP</span>
                    XP Reward
                  </div>
                  <span className="text-white text-lg font-semibold">{XP_REWARDS} XP</span>
                </div>

                {/* Number of Tasks */}
                <div className="flex flex-col gap-1 p-5 border-t md:border-t-0 border-l md:border-l border-white/10">
                  <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wide">
                    <img src="/tasks.png" alt="" className="w-4 h-4 opacity-60" />
                    Tasks
                  </div>
                  <span className="text-white text-lg font-semibold">{tasks.length}</span>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1 p-5 border-t border-white/10 md:border-l">
                  <div className="flex items-center gap-2 text-white/50 text-xs font-medium uppercase tracking-wide">
                    <img src="/status.png" alt="" className="w-4 h-4 opacity-60" />
                    Status
                  </div>
                  <span className="text-white text-lg font-semibold">Draft</span>
                </div>
              </div>
            </div>

            {/* Task Overview */}
            <div className="flex items-center justify-between mt-6">
              <h3 className="text-xl font-semibold">Task Overview</h3>
              <button 
                type="button"
                className="px-3 py-1 bg-[#8B3EFE] text-white rounded-lg text-sm hover:bg-[#7b35e6] transition"
                onClick={() => setActiveTab("tasks")}
              >
                Manage Tasks
              </button>
            </div>

            {tasks.length > 0 && (
              <div className="relative mt-2 space-y-4">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-lg border-2 border-purple-500 px-4 py-3 bg-white/5"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full text-white font-semibold">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-sm">{task.description || task.type}</p>
                      {task.verificationMode && (
                        <p className="text-xs text-white/50 truncate">
                          {task.verificationMode === "image_upload" ? "📷 Image proof" : 
                           task.verificationMode === "submit_link" ? "🔗 Link submission" : 
                           task.verificationMode === "auto" ? "⚡ Auto" : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 bg-[#8B3EFE] text-white rounded-lg text-sm hover:bg-[#7b35e6] transition"
                        onClick={() => {
                          if (!task.handleOrUrl) return;
                          let url = task.handleOrUrl.trim();
                          if (!/^https?:\/\//i.test(url)) {
                            url = `https://${url}`;
                          }
                          window.open(url, "_blank");
                        }}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
                        onClick={() => {
                          setEditingIndex(index);
                          setNewTask(task);
                          setShowModal(true);
                          setActiveTab("tasks");
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-800 rounded-lg text-white hover:bg-red-800 transition"
                        onClick={() => setTasks(tasks.filter((_, i) => i !== index))}
                      >
                        <img src="/delete.png" alt="Delete" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Task counter at bottom-right */}
                <span className="absolute -bottom-8 right-2 text-white/60 text-sm mt-2">
                  {tasks.length}/{tasks.length}
                </span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between mt-8">
              {/* Back button on the left */}
              <button 
                type="button"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
                onClick={() => setActiveTab("tasks")}
              >
                Back
              </button>

              {/* Publish button on the right */}
              <button
                type="button"
                className="px-6 py-2 bg-[#8B3EFE] text-white rounded-lg text-sm font-semibold hover:bg-[#7b35e6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || tasks.length < 3}
                onClick={() => setShowPublishModal(true)}
              >
                {loading ? "Publishing..." : "Publish Quest"}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#070315]/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#070315] w-full max-w-[910px] border border-[#8b3efe] rounded-[10px] relative shadow-[0_0_60px_rgba(139,62,254,0.1)] overflow-hidden">
            
            {/* Header */}
            <div className="bg-[#1b113c] h-[80px] flex items-center justify-between px-10 relative">
              <div className="flex flex-col justify-center">
                <h2 className="text-[20px] font-bold text-white font-['Geist',sans-serif] leading-[20px]">Configure Tasks</h2>
                <p className="text-[15px] font-semibold text-white/70 font-['Geist',sans-serif] leading-[20px] mt-1">Define the specifics for your quest tasks</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all"
              >
                <img src="https://www.figma.com/api/mcp/asset/0c1a04f9-e18d-4dfc-9aa9-fd9beeebae82" alt="Close" className="w-5 h-5" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {/* TOP SECTION: TYPE & PLATFORM */}
              <div className="flex gap-[114px]">
                {/* Task Type */}
                <div className="w-[405px] space-y-[14px]">
                  <label className="text-[15px] font-bold text-white/70 uppercase font-['Geist',sans-serif] leading-[18.2px]">TASK TYPE</label>
                  <div className="relative">
                    <select
                      className="w-full h-[40px] px-5 rounded-[16px] bg-[#060210] text-[14px] text-white/60 border border-[#833afd] focus:outline-none appearance-none font-medium font-['Geist',sans-serif]"
                      value={newTask.type}
                      onChange={(e) => {
                        const type = e.target.value;
                        const isTwitter = type === "Comment on X" || type === "Follow on X" || type === "Create a Post";
                        const validationLabel =
                          type === "Own a TNS" ? "Verified by TNS" :
                          type === "Portal Claims" ? "Verified by Intuition Portal" :
                          "Manual Validation";
                        setNewTask({
                          ...newTask,
                          type,
                          platform: isTwitter ? "Twitter" : "Other",
                          validation: validationLabel,
                        });
                      }}
                    >
                      <option value="" disabled>Select Task Type</option>
                      <option value="Comment on X">Comment on X</option>
                      <option value="Follow on X">Follow on X</option>
                      <option value="Create a Post">Create a Post</option>
                      <option value="Own a TNS">Own a TNS</option>
                      <option value="Portal Claims">Portal Claims</option>
                      <option value="Give Feedback">Give Feedback</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90">
                      <img src="https://www.figma.com/api/mcp/asset/13e665cc-77c8-45d0-8f14-25dd7fa6f060" alt="" className="w-[9px] h-[9px]" />
                    </div>
                  </div>
                </div>

                {/* Platform */}
                <div className="w-[311px] space-y-[14px]">
                  <label className="text-[15px] font-bold text-white/70 uppercase font-['Geist',sans-serif] leading-[18.2px]">PLATFORM</label>
                  <div className="h-[40px] rounded-[8px] flex items-center px-[15px] gap-[5px] bg-[#1d0d3d] border border-white/5 text-white/60 text-[12px] font-medium font-['Geist',sans-serif]">
                    <img src="https://www.figma.com/api/mcp/asset/7c040d25-e34c-42b8-8ee9-10bddba75bba" alt="" className="w-[14px] h-[14px]" />
                    <span>{newTask.platform || "—"}</span>
                  </div>
                </div>
              </div>

              {/* TASK DETAILS SECTION */}
              <div className="space-y-[16px]">
                <label className="text-[15px] font-bold text-white/70 uppercase font-['Geist',sans-serif] leading-[18.2px]">TASK DETAILS</label>
                <div className="bg-[#060210] border border-[#833afd] rounded-[16px] h-[180px] p-5 flex flex-col justify-center gap-[6px]">
                  <div className="space-y-2 relative">
                    <label className="text-[14px] font-medium text-white/80 font-['Geist',sans-serif] leading-[18.2px]">Task Description</label>
                    <input
                      type="text"
                      placeholder="Explain what the user needs to do"
                      className="w-full h-[37px] px-[15px] rounded-[8px] bg-[#1d0d3d] text-[12px] text-white/80 placeholder:text-white/50 border-none focus:ring-1 focus:ring-[#8b3efe] outline-none font-['Geist',sans-serif]"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[14px] font-medium text-white/80 font-['Geist',sans-serif] leading-[18.2px]">Task URL</label>
                    <input
                      type="text"
                      placeholder="Input URL"
                      className="w-full h-[37px] px-[15px] rounded-[8px] bg-[#1d0d3d] text-[12px] text-white/80 placeholder:text-white/50 border-none focus:ring-1 focus:ring-[#8b3efe] outline-none font-['Geist',sans-serif]"
                      value={newTask.handleOrUrl}
                      onChange={(e) => {
                        setUrlError("");
                        setNewTask({...newTask, handleOrUrl: e.target.value});
                      }}
                    />
                    {urlError && <p className="text-red-400 text-[10px] absolute mt-1">{urlError}</p>}
                  </div>
                </div>
              </div>

              {/* Validation pill */}
              {newTask.validation && (
                <div className="flex justify-start mt-[12px]">
                  <div className="inline-flex items-center gap-[6px] px-[12px] py-[6px] rounded-full bg-[#1d0d3d] border border-[#833afd]/30">
                    <svg className="w-[14px] h-[14px] text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-[12px] font-medium text-white/60 font-['Geist',sans-serif]">{newTask.validation}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Bar */}
            <div className="bg-[#1b113c] h-[80px] flex items-center justify-between px-10">
              <button
                type="button"
                className="text-[15px] font-semibold text-white/70 hover:text-white transition-all font-['Geist',sans-serif] leading-[20px]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-[146px] h-[35px] bg-[#8b3efe] rounded-[15px] text-[14px] font-bold text-white hover:bg-[#7b35e6] transition-all font-['Geist',sans-serif] leading-[20px]"
                onClick={handleSaveTask}
              >
                {editingIndex !== null ? "Update Task" : "Save Task"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Publish Payment Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d14] w-full max-w-md border border-purple-500/20 p-6 rounded-2xl relative shadow-[0_0_60px_rgba(131,58,253,0.2)] animate-modal-pop">

            <button
              onClick={() => setShowPublishModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-lg leading-none"
            >
              &times;
            </button>

            <div className="flex justify-center mb-4">
              <img
                src="/activate-studio.png"
                alt=""
                className="w-48 h-40"
              />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                Quest Launch Fee
              </h2>
              <p className="text-white/70 mt-2">
                Pay the quest launch fee to publish this quest and make it available for participants.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold text-sm">Quest Launch Fee</span>
                <span className="text-purple-400 font-bold text-sm">1 $TRUST</span>
              </div>
              <p className="text-white/60 text-xs mb-3">
                A one-time fee of 1 $TRUST is required to launch and publish this quest.
              </p>

              {paymentTxHash ? (
                <div className="flex items-center gap-2 bg-green-900/40 border border-green-600/50 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-green-400 text-xs font-semibold">Payment confirmed</p>
                    <p className="text-white/40 text-[10px] truncate">{paymentTxHash}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={async () => {
                    setPaymentLoading(true);
                    try {
                      const hash = await payStudioHubFee(1);
                      setPaymentTxHash(hash);
                      await apiRequest({ method: "PATCH", endpoint: `/hub/save-payment-hash`, data: { txHash: hash } });
                      toast({ title: "Payment successful", description: "1 $TRUST sent. You can now publish your quest." });
                    } catch (err: any) {
                      toast({ title: "Payment failed", description: err.message ?? "Transaction was rejected.", variant: "destructive" });
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#8B3EFE] hover:bg-[#7b35e6] disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2 transition"
                >
                  {paymentLoading ? (
                    <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Waiting for wallet…</>
                  ) : (
                    <>Pay 1 $TRUST</>
                  )}
                </button>
              )}
            </div>

            <button
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#8B3EFE] text-white text-sm font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
              onClick={async () => {
                if (!paymentTxHash?.trim()) {
                  toast({ title: "Payment required", description: "Please complete the 1 $TRUST payment before publishing.", variant: "destructive" });
                  return;
                }
                setShowPublishModal(false);
                await handlePublish();
              }}
              disabled={!paymentTxHash}
            >
              Publish
            </button>

            <button
              onClick={() => setShowPublishModal(false)}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </main>
  );
}
