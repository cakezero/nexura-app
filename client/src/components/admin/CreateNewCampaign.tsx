"use client";

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import React from "react"
// import { Card } from "../../components/ui/card";
import { Card, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Link } from "wouter";
import StudioSidebar from "../../pages/studio/StudioSidebar";
import AnimatedBackground from "../AnimatedBackground";
import {
  Calendar,
  Clock,
  ImageIcon,
  FileText,
  ListChecks,
  Eye,
} from "lucide-react";

export default function CreateNewCampaigns() {
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showTasks, setShowTasks] = useState(false)
  const [showModal, setShowModal] = useState(false);
  const [validationType, setValidationType] = useState("manual");
  const [tasks, setTasks] = useState([]); 
  const [newTask, setNewTask] = useState({
  type: "",
  platform: "",
  handleOrUrl: "",
  description: "",
  evidence: "",
  validation: "Manual Validation",
});
const [editingIndex, setEditingIndex] = useState<number | null>(null);
const [error, setError] = useState("");
const [showPublishModal, setShowPublishModal] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const handlePublish = () => {
  const newCampaign = {
    name: campaignName,
    title: campaignTitle,
    startDate,
    endDate,
    rewardPool,
    participants,
    tasks,
    coverImage,
    isDraft: false,
  };

  const savedCampaigns = JSON.parse(localStorage.getItem("campaigns") || "[]");
  localStorage.setItem("campaigns", JSON.stringify([...savedCampaigns, newCampaign]));

  setShowSuccessModal(true);
};




const handleSaveTask = () => {
  // Check for empty fields
  if (!newTask.type) return setError("Please select a task type.");
  if (!newTask.platform) return setError("Please select a platform.");
  if (!newTask.handleOrUrl) return setError("Please provide a handle or URL.");
  if (!newTask.description) return setError("Please provide a task description.");

  // Add new task (push to array)
  setTasks([...tasks, newTask]);

  // Reset modal state
  setNewTask({
    type: "",
    platform: "",
    handleOrUrl: "",
    description: "",
    evidence: "",
    validation: "Manual Validation",
  });
  setShowModal(false);
  setError(""); // clear error
};



// On component mount, load tasks from localStorage
useEffect(() => {
  const savedTasks = localStorage.getItem("tasks");
  if (savedTasks) setTasks(JSON.parse(savedTasks));
}, []);

// Save tasks to localStorage whenever tasks change
useEffect(() => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}, [tasks]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setLocation("/studio-dashboard");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="relative z-10 flex h-screen">
        <AnimatedBackground />

<StudioSidebar
  activeTab="campaignsTab"
  setActiveTab={(tab) => {
    if (tab === "campaignSubmissions") setLocation("/studio-dashboard");
    if (tab === "campaignsTab") setLocation("/studio-dashboard/create-new-campaign");
    if (tab === "adminManagement") setLocation("/studio-dashboard");
  }}
/>



        <div className="flex-1 flex flex-col overflow-hidden backdrop-blur-xl">
          <main className="flex-1 overflow-y-auto p-8 text-white">
            <div className="max-w-5xl mx-auto space-y-8">

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold">Create New Campaign</h1>
                <p className="text-white/60 mt-2">
                  Launch your next campaign and grow your community with tailored rewards.
                </p>
              </div>

{/* Tabs */}
<div className="flex gap-8 border-b border-white/10">

  {/* Details */}
  <button
    onClick={() => setActiveTab("details")}
    className="flex-1 flex flex-col items-start justify-start gap-2 py-5 text-lg font-semibold transition"
  >
    {/* Underline on top */}
    <span
      className={`block h-[4px] w-full rounded-full transition-colors ${
        activeTab === "details" ? "bg-purple-500" : "bg-white/20"
      }`}
    />
    <div className="flex items-center gap-2 text-white/80 hover:text-white">
      <img src="/details.png" alt="Tasks" className="w-5 h-5" />
      <span className={`${activeTab === "details" ? "text-purple-400" : ""}`}>
        Details
      </span>
    </div>
  </button>


  {/* Tasks */}
  <button
    onClick={() => setActiveTab("tasks")}
    className="flex-1 flex flex-col items-start justify-start gap-2 py-5 text-lg font-semibold transition"
  >
    {/* Underline on top */}
    <span
      className={`block h-[4px] w-full rounded-full transition-colors ${
        activeTab === "tasks" ? "bg-purple-500" : "bg-white/20"
      }`}
    />
    <div className="flex items-center gap-2 text-white/80 hover:text-white">
      <img src="/tasks.png" alt="Tasks" className="w-5 h-5" />
      <span className={`${activeTab === "tasks" ? "text-purple-400" : ""}`}>
        Tasks
      </span>
    </div>
  </button>

  {/* Review */}
  <button
    onClick={() => setActiveTab("review")}
    className="flex-1 flex flex-col items-start justify-start gap-2 py-5 text-lg font-semibold transition"
  >
    {/* Underline on top */}
    <span
      className={`block h-[4px] w-full rounded-full transition-colors ${
        activeTab === "review" ? "bg-purple-500" : "bg-white/20"
      }`}
    />
    <div className="flex items-center gap-2 text-white/80 hover:text-white">
      <img src="/review.png" alt="Review" className="w-5 h-5" />
      <span className={`${activeTab === "review" ? "text-purple-400" : ""}`}>
        Review
      </span>
    </div>
  </button>
          </div>

              <h2 className="text-xl font-semibold">Campaign Details</h2>

              {/* DETAILS TAB */}
              {activeTab === "details" && (
                <Card className="bg-purple/10 backdrop-blur-md p-8 space-y-8">

                  <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Campaign Name */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Campaign Name
                      </label>
                      <Input
                        placeholder="Enter campaign name..."
                        className="bg-white/5 border-white/10"
                        required
                      />
                    </div>

                    {/* Campaign Title */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Campaign Title
                      </label>
                      <Input
                        placeholder="Enter campaign title..."
                        className="bg-white/5 border-white/10"
                        required
                      />
                      <p className="text-xs text-white/50 mt-2">
                        Keep it clear and practical.
                      </p>
                    </div>

                    {/* Dates & Times */}
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm mb-2">
                          <Calendar className="w-4 h-4" />
                          Start Date
                        </label>
                        <Input type="date" className="bg-white/5 border-white/10" />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm mb-2">
                          <Clock className="w-4 h-4" />
                          Start Time
                        </label>
                        <Input type="time" className="bg-white/5 border-white/10" />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm mb-2">
                          <Calendar className="w-4 h-4" />
                          End Date
                        </label>
                        <Input type="date" className="bg-white/5 border-white/10" />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm mb-2">
                          <Clock className="w-4 h-4" />
                          End Time
                        </label>
                        <Input type="time" className="bg-white/5 border-white/10" />
                      </div>
                      <p className="text-xs text-white/50 -mt-2">
                        Set the duration of the campaign in UTC. 
                      </p>
                    </div>

                    {/* Cover Image */}
                    <div>
                      <label className="flex items-center gap-2 text-sm mb-3">
                        <ImageIcon className="w-4 h-4" />
                        Cover Image
                      </label>
<div className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-gray-900 hover:border-purple-400 transition cursor-pointer">
  <div className="flex flex-col items-center justify-center text-center gap-2">
    <img
      src="/upload-icon.png"
      alt="Upload icon"
      className="w-16 h-16"
    />

    <p className="font-medium text-white">
      Click to upload or drag and drop
    </p>

    <p className="text-sm text-white/50">
      SVG, PNG, JPG or GIF (max. 10MB)
    </p>
  </div>
</div>

                    </div>

                    {/* Rewards */}
<div className="grid grid-cols-3 gap-6">
<div>
  <label className="block mb-2 text-sm font-medium">
    Reward Pool (Optional)
  </label>

  <div className="relative">
    {/* Prefix */}
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-semibold">
      $TRUST
    </span>

    <Input
      type="number"
      className="bg-white/5 border-white/10 pl-20"
      placeholder="0"
    />
  </div>
</div>



                      <div className="relative">
  <label className="block mb-2 text-sm font-medium">
    Number of Participants
  </label>
  
  <div className="relative">
    {/* Icon inside input */}
    <img
      src="/ref-icon.png"
      alt="Members Icon"
      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
    />

    <Input
      type="number"
      placeholder="Enter number of participants"
      className="bg-white/5 border-white/10 pl-10" // add padding-left for icon
    />
  </div>
</div>


                      <div>
  <label className="block mb-2 text-sm font-medium">
    XP Rewards
  </label>
  <Input
    type="number"
    placeholder="200 XP per participant"
    className="bg-white/5 border-white/10"
  />
</div>
                    </div>

                    {/* Disclaimer */}
                    
                                <div className="flex items-start gap-3 bg-gray-800 p-4 rounded-lg mt-2">
                      {/* Info icon */}
                      <div className="flex-shrink-0 text-blue-400 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 110-17 8.5 8.5 0 010 17z" />
                        </svg>
                      </div>
                      {/* Text */}
                      <CardDescription className="text-white/60 text-sm">
                        Disclaimer: If you want to provide rewards for this campaign, please reach out to Nexura via Discord.
                      </CardDescription>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between pt-4">
                      <Link href="/studio-dashboard">
                        <Button variant="ghost" className="text-white/60 hover:text-white">
                          Cancel
                        </Button>
                      </Link>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/5"
                        >
                          Save
                        </Button>

                        <Button
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save & Next"}
                        </Button>
                      </div>
                    </div>

                  </form>
                </Card>
              )}

{/* TASKS TAB */}
{activeTab === "tasks" && (
  <>
    {tasks.length === 0 ? (
      <div
        className="w-full border-2 border-dashed border-purple-500 rounded-2xl p-8 bg-gray-900 hover:border-purple-400 transition cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <img src="/upload-icon.png" alt="Upload icon" className="w-16 h-16" />
          <p className="font-medium text-white">Create a Campaign Task</p>
          <p className="text-sm text-white/50">
            To create a campaign, you need to add at least one task.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-1 bg-purple-900 text-purple-400 hover:bg-purple-700 font-semibold rounded-lg transition"
          >
            <span className="flex items-center justify-center w-3 h-3 pb-1 bg-purple-400 text-purple-900 rounded-full text-lg font-bold">
              +
            </span>
            Add Task
          </button>
        </div>
      </div>
    ) : (
      <div className="space-y-4">
  {tasks.map((task, index) => (
    <div
      key={index}
      className="flex items-center justify-between gap-4 rounded-lg border-2 border-purple-500 px-4 py-3 bg-white/5"
    >
      <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full text-white font-semibold">
        {index + 1}
      </div>
      {/* Show task type as description */}
      <p className="flex-1 text-white">{task.type}</p>
      <div className="flex items-center gap-2">
        {/* Edit Button */}
        <button
          className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
          onClick={() => {
            setNewTask(task); // load selected task into modal
            setShowModal(true); // show modal
            // optionally, store index if you want to replace task on save
            setEditingIndex(index);
          }}
        >
          Edit
        </button>

        {/* Delete Button */}
        <button
          className="px-3 py-1 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition"
          onClick={() => {
            const updatedTasks = tasks.filter((_, i) => i !== index);
            setTasks(updatedTasks);
          }}
        >
          <img src="/delete.png" alt="Delete" className="w-4 h-4" />
        </button>
      </div>
    </div>
  ))}
</div>
    )}

    {/* ===== MODAL ===== */}
    {showModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="bg-gray-900 w-[650px] p-6 rounded-2xl relative shadow-xl">

          {/* Close Button */}
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-3 right-4 text-white text-xl"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold text-white mb-6">
            Add New Task
          </h2>

          {/* TOP SECTION */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Task Type */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Task Type</label>
              <select
                className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
              >
                <option value="">Select task</option>
                <option value="Comment on our X post">Comment on X</option>
                <option value="Follow us on X">Follow on X</option>
                <option value="Join Us On Discord">Join Discord</option>
                <option value="Check Out the Portal Claims">Portal Claims</option>
                <option value="others">Others</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="text-sm text-white/70 mb-2 block">Platform</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewTask({ ...newTask, platform: "Twitter" })}
                  className={`flex-1 border py-2 rounded-lg transition ${
                    newTask.platform === "Twitter"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-gray-800 border-gray-700 text-white hover:border-purple-500"
                  }`}
                >
                  Twitter
                </button>
                <button
                  type="button"
                  onClick={() => setNewTask({ ...newTask, platform: "Discord" })}
                  className={`flex-1 border py-2 rounded-lg transition ${
                    newTask.platform === "Discord"
                      ? "bg-purple-500 text-white border-purple-500"
                      : "bg-gray-800 border-gray-700 text-white hover:border-purple-500"
                  }`}
                >
                  Discord
                </button>
              </div>
            </div>
          </div>

{/* TASK DETAILS CARD (Merged) */}
<div className="bg-gray-800 p-5 rounded-xl mb-6 border border-gray-700">

  {/* Handle or URL */}
  <div className="mb-4">
    <label className="text-sm text-white/70 mb-2 block">Handle or URL</label>
    <input
      type="text"
      placeholder="..."
      value={newTask.handleOrUrl}
      onChange={(e) =>
        setNewTask({ ...newTask, handleOrUrl: e.target.value })
      }
      className="w-full p-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
    />
  </div>

  {/* Task Description */}
  <div className="mb-4">
    <label className="text-sm text-white/70 mb-2 block">Task Description</label>
    <input
      type="text"
      placeholder="..."
      value={newTask.description}
      onChange={(e) =>
        setNewTask({ ...newTask, description: e.target.value })
      }
      className="w-full p-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
    />
  </div>

  {/* Evidence + Validation */}
  <div className="grid grid-cols-2 gap-6">
    {/* Evidence Upload */}
    <div>
      <label className="text-sm text-white/70 mb-2 block">Evidence Upload Management</label>
      <select
        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
        value={newTask.evidence}
        onChange={(e) =>
          setNewTask({ ...newTask, evidence: e.target.value })
        }
      >
        <option value="">Select option</option>
      </select>
    </div>

    {/* Validation Type */}
    <div>
      <label className="text-sm text-white/70 mb-2 block">Validation Type</label>
      <div className="relative">
        <input
          type="text"
          value={newTask.validation}
          readOnly
          className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500 pr-10"
        />
        <img
          src="/purple-check.png"
          alt="Verified"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5"
        />
      </div>
    </div>
  </div>

</div>

{error && (
  <p className="text-red-500 text-sm mb-2">{error}</p>
)}
          {/* ACTION BUTTONS */}
          <div className="flex justify-between">
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              Cancel
            </button>

<button
  onClick={handleSaveTask}
  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
>
  Save Task
</button>
          </div>
        </div>
      </div>
    )}
  </>
)}


{activeTab === "review" && (
  <Card className="p-8 space-y-6 bg-white/10 backdrop-blur-md">
    <h2 className="text-2xl font-bold mb-4">Final Campaign Review</h2>

    {/* Campaign Board */}
    <div className="flex gap-6 rounded-lg border-2 border-purple-500 p-6 bg-white/5">
      {/* Left side: image */}
      <div className="w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src="/campaign.jpg"
          alt="Campaign Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right side: title and description */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Tasting Noodles
          </h3>
          <p className="text-white/70 mt-1">
            The noodles tasting onboarding, spicy and hot
          </p>
          <p className="text-white/60 mt-2">
            Project: @indomie_shawarmaproject
          </p>
        </div>

        {/* Bottom info as blocks */}
<div className="flex mt-4 text-white/80 border border-white/10 rounded-lg overflow-hidden">
  {/* Duration */}
  <div className="flex-1 flex flex-col items-center p-4 border-r border-white/10">
    <div className="flex items-center gap-2">
      <img src="/duration.png" alt="Duration Icon" className="w-5 h-5" />
      <span className="font-semibold">Duration</span>
    </div>
    <span className="text-white mt-1">Feb 12 – Feb 28, 2026</span>
  </div>

  {/* Reward Pool */}
  <div className="flex-1 flex flex-col items-center p-4 border-r border-white/10">
    <div className="flex items-center gap-2">
      <img src="/reward-pool.png" alt="Reward Pool Icon" className="w-5 h-5" />
      <span className="font-semibold">Reward Pool</span>
    </div>
    <span className="text-white mt-1">10,000 TRUST</span>
  </div>

  {/* Target Users */}
  <div className="flex-1 flex flex-col items-center p-4">
    <div className="flex items-center gap-2">
      <img src="/target-users.png" alt="Target Users Icon" className="w-5 h-5" />
      <span className="font-semibold">Target Users</span>
    </div>
    <span className="text-white mt-1">Max 10,000 Participants</span>
  </div>
</div>

      </div>
    </div>

    {/* Task Overview */}
<div className="flex items-center justify-between mt-6">
  <h3 className="text-xl font-semibold">Task Overview</h3>
  <button className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
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

        {/* Show task type as description */}
        <p className="flex-1 text-white">{task.type}</p>

        <div className="flex items-center gap-2">
          {/* View button (optional functionality) */}
 <button
            className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
            onClick={() => {
              if (task.handleOrUrl) {
                window.open(task.handleOrUrl, "_blank");
              }
            }}
          >
            View
          </button>

          {/* Edit button */}
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
            onClick={() => {
              setNewTask(task); // load task into modal
              setShowModal(true);
              setEditingIndex(index); // track which task to update
            }}
          >
            Edit
          </button>
        </div>
      </div>
    ))}


    {/* Task counter at bottom-right */}
    <span className="absolute -bottom-8 right-2 text-white/60 text-sm mt-2">
      {[
        "Like and repost on this Twitter post",
        "Join Our Discord Server",
        "Follow our official X account",
        "Turn on post notifications",
        "Comment your wallet addresses on our latest announcements",
        "Like and comment on this Twitter post",
      ].length}/{[
        "Like and repost on this Twitter post",
        "Join Our Discord Server",
        "Follow our official X account",
        "Turn on post notifications",
        "Comment your wallet addresses on our latest announcements",
        "Like and comment on this Twitter post",
      ].length}
    </span>
  </div>
)}

{/* Footer Buttons */}
<div className="flex items-center justify-between mt-8">
  {/* Back button on the left */}
  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition">
    Back
  </button>

  {/* Right buttons */}
  <div className="flex items-center gap-2 mt-4">
    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
      Save
    </button>
<button
  onClick={() => setShowPublishModal(true)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
>
  Publish Campaign
</button>
  </div>
</div>
  </Card>
  
    )}

<>
  {/* ========================= */}
  {/* PUBLISH MODAL */}
  {/* ========================= */}
  {showPublishModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-gray-900 w-[500px] p-6 rounded-2xl relative shadow-xl">

        {/* Close Icon */}
        <button
          onClick={() => setShowPublishModal(false)}
          className="absolute top-3 right-4 text-white text-xl"
        >
          ×
        </button>

        {/* Top Activate Image */}
        <div className="flex justify-center mb-4">
          <img
            src="/activate-studio.png"
            alt=""
            className="w-48 h-40"
          />
        </div>

        {/* Title + Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            Activate your Studio Hub
          </h2>
          <p className="text-white/70 mt-2">
            Activate your studio hub to publish and manage campaigns.
          </p>
        </div>

        {/* Subscription Card */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white">
            Yearly Subscription
          </h3>
          <p className="text-white/70 mt-1">
            1000 TRUST / year
          </p>

<button
  className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
  onClick={() => {
    // Example campaign data from modal
    const newCampaign: Campaign = {
      title: "Activate your Studio Hub",
      name: "Studio Hub Activation",
      startDate: new Date().toLocaleDateString(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString(),
      rewardPool: "1000", // TRUST
      isDraft: false,
    };

    // Save to localStorage
    const savedCampaigns = JSON.parse(localStorage.getItem("campaigns") || "[]");
    localStorage.setItem("campaigns", JSON.stringify([...savedCampaigns, newCampaign]));

    // Update state so Active tab reflects it immediately
    setCampaigns((prev) => [...prev, newCampaign]);

    // Close modal and show success
    setShowPublishModal(false);
    setShowSuccessModal(true);
  }}
>
  Pay 1000 TRUST
</button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => setShowPublishModal(false)}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition"
        >
          Cancel
        </button>

      </div>
    </div>
  )}

  {/* ========================= */}
  {/* SUCCESS MODAL */}
  {/* ========================= */}
  {showSuccessModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-gray-900 w-[600px] p-6 rounded-2xl relative shadow-xl">

        {/* Close Icon */}
        <button
          onClick={() => setShowSuccessModal(false)}
          className="absolute top-3 right-4 text-white text-xl"
        >
          ×
        </button>

        {/* Activate Icon */}
        <div className="flex justify-center mb-4">
          <img
            src="/activate-studio.png"
            alt="Activate Icon"
            className="w-40 h-32"
          />
        </div>

        {/* Title + Subtitle */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            Payment Successfully Completed
          </h2>
          <p className="text-white/70 mt-2">
            Your 1000 TRUST payment was confirmed and your project is ready to go live.
          </p>
        </div>

        {/* Campaign Snapshot Card */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-purple-500 p-5">

          <h3 className="text-sm font-semibold text-white/80 mb-4">
            CAMPAIGN SNAPSHOT
          </h3>

          <div className="flex gap-4">

            {/* Left Image */}
            <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src="/campaign.jpg"
                alt="Campaign Cover"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col justify-between">

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Tasting Noodles
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  The noodles tasting onboarding, spicy and hot
                </p>
                <p className="text-white/60 text-sm mt-2">
                  Project: @indomie_shawarmaproject
                </p>
              </div>

              {/* Bottom Info Blocks */}
              <div className="flex mt-4 text-white/80 border border-white/10 rounded-lg overflow-hidden">

                <div className="flex-1 flex flex-col items-center p-3 border-r border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Total Reward Pool
                  </span>
                  <span className="text-white mt-1 text-sm font-semibold">
                    50,000 TRUST
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Status
                  </span>
                  <span className="text-green-400 mt-1 text-sm font-semibold">
                    READY
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Launch Button */}
<Button
  onClick={() => {
    setActiveTab("campaignsTab"); // highlight sidebar tab
    setLocation("/studio-dashboard/campaigns-tab"); // update URL
  }}
  className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition"
>
  <span>Launch Campaign Now</span>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h14M13 6l6 6-6 6"
    />
  </svg>
</Button>

      </div>
    </div>
  )}
</>


        </div>
        </main>
        </div>
    </div>
    </div>
  );
}
