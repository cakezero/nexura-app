"use client";

import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Zap, Calendar, Users, Shield, LayoutDashboard } from "lucide-react";
import { cn } from "../lib/utils";

// Mock data for quest submissions
const MOCK_QUEST_SUBMISSIONS = [
  {
    id: "q1",
    questName: "Social Media Engagement",
    username: "Rchris",
    submissionLink: "https://twitter.com/example/status/123",
    dateSubmitted: "2026-01-19",
    status: "pending",
  },
  {
    id: "q2",
    questName: "Discord Community Task",
    username: "Nuel",
    submissionLink: "https://discord.gg/verification",
    dateSubmitted: "2026-01-18",
    status: "pending",
  },
  {
    id: "q3",
    questName: "Content Creation Challenge",
    username: "Orion",
    submissionLink: "https://medium.com/@user/article",
    dateSubmitted: "2026-01-17",
    status: "pending",
  },
];

// Mock data for campaign submissions
const MOCK_CAMPAIGN_SUBMISSIONS = [
  {
    id: "c1",
    campaignName: "Launch Campaign Q1",
    username: "Promise",
    submissionLink: "https://github.com/user/project",
    dateSubmitted: "2026-01-19",
    status: "pending",
  },
  {
    id: "c2",
    campaignName: "NFT Minting Event",
    username: "Beardless",
    submissionLink: "https://opensea.io/collection/example",
    dateSubmitted: "2026-01-18",
    status: "pending",
  },
  {
    id: "c3",
    campaignName: "DeFi Integration Challenge",
    username: "Shebah",
    submissionLink: "https://etherscan.io/tx/0x123",
    dateSubmitted: "2026-01-17",
    status: "pending",
  },
];

// Mock data for administrators
const MOCK_ADMINS = [
  {
    id: "a1",
    name: "John Doe",
    role: "Super Admin",
    lastActivity: "2026-01-20 14:30",
    status: "active",
  },
  {
    id: "a2",
    name: "Jane Smith",
    role: "Moderator",
    lastActivity: "2026-01-20 12:15",
    status: "active",
  },
  {
    id: "a3",
    name: "Mike Johnson",
    role: "Reviewer",
    lastActivity: "2026-01-19 18:45",
    status: "inactive",
  },
  {
    id: "a4",
    name: "Sarah Williams",
    role: "Content Manager",
    lastActivity: "2026-01-20 09:00",
    status: "active",
  },
];

type TabType = "questSubmissions" | "campaignSubmissions" | "adminManagement";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("questSubmissions");

  const renderQuestSubmissions = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Quest Submissions</h2>
      <Card className="bg-white/5 border-white/10 backdrop-blur-[125px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white/70">Quest Name</TableHead>
              <TableHead className="text-white/70">Username</TableHead>
              <TableHead className="text-white/70">Submission</TableHead>
              <TableHead className="text-white/70">Date</TableHead>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_QUEST_SUBMISSIONS.map((submission) => (
              <TableRow key={submission.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">
                  {submission.questName}
                </TableCell>
                <TableCell className="text-white/80">{submission.username}</TableCell>
                <TableCell className="text-white/80">
                  <a
                    href={submission.submissionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    View Link
                  </a>
                </TableCell>
                <TableCell className="text-white/80">{submission.dateSubmitted}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  >
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#8a3ffc] to-[#522696] shadow-[0px_4px_3px_-3px_#7e39e6] rounded-full text-white px-6 hover:opacity-90 transition-opacity"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderCampaignSubmissions = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Campaign Submissions</h2>
      <Card className="bg-white/5 border-white/10 backdrop-blur-[125px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white/70">Campaign Name</TableHead>
              <TableHead className="text-white/70">Username</TableHead>
              <TableHead className="text-white/70">Submission</TableHead>
              <TableHead className="text-white/70">Date</TableHead>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CAMPAIGN_SUBMISSIONS.map((submission) => (
              <TableRow key={submission.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">
                  {submission.campaignName}
                </TableCell>
                <TableCell className="text-white/80">{submission.username}</TableCell>
                <TableCell className="text-white/80">
                  <a
                    href={submission.submissionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    View Link
                  </a>
                </TableCell>
                <TableCell className="text-white/80">{submission.dateSubmitted}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  >
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#8a3ffc] to-[#522696] shadow-[0px_4px_3px_-3px_#7e39e6] rounded-full text-white px-6 hover:opacity-90 transition-opacity"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const renderAdminManagement = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6 text-white">Administrator Management</h2>
      <Card className="bg-white/5 border-white/10 backdrop-blur-[125px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-white/70">Administrator</TableHead>
              <TableHead className="text-white/70">Role</TableHead>
              <TableHead className="text-white/70">Last Activity</TableHead>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ADMINS.map((admin) => (
              <TableRow key={admin.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-medium text-white">{admin.name}</TableCell>
                <TableCell className="text-white/80">{admin.role}</TableCell>
                <TableCell className="text-white/80">{admin.lastActivity}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      admin.status === "active"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                    }
                  >
                    {admin.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );

  const sidebarItems = [
    { title: "Quest Tasks", icon: Zap, id: "questSubmissions" as TabType },
    { title: "Campaign Tasks", icon: Calendar, id: "campaignSubmissions" as TabType },
    { title: "Admin Management", icon: Shield, id: "adminManagement" as TabType },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      <div className="relative z-10 flex h-screen">
        {/* Left Navigation Sidebar - Styled to match Figma/QuestflowSidebar */}
        <div className="w-[18rem] border-r border-white/10 bg-black/55 backdrop-blur-sm flex flex-col z-20">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
               {/* Replace with Logo if available, or text */}
               <LayoutDashboard className="w-6 h-6 text-[#8a3ffc]" />
               <h1 className="text-xl font-bold text-white tracking-tight">Admin Console</h1>
            </div>
            <p className="text-xs text-white/50 mt-2">Administrator Access</p>
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1">
             {sidebarItems.map((item) => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={cn(
                   "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                   activeTab === item.id 
                     ? "text-[#8a3ffc] bg-white/5" 
                     : "text-white/70 hover:bg-white/5 hover:text-white"
                 )}
               >
                 <item.icon className={cn(
                   "w-5 h-5 transition-colors",
                   activeTab === item.id ? "text-[#8a3ffc]" : "text-white/70 group-hover:text-white"
                 )} />
                 {item.title}
               </button>
             ))}
          </nav>
          
          <div className="p-4 border-t border-white/10">
             <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold">
                   A
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-medium text-white">Administrator</span>
                   <span className="text-xs text-white/50">Online</span>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-sm bg-black/20">
               <h2 className="text-lg font-semibold text-white">
                  {activeTab === "questSubmissions" && "Quest Task Overview"}
                  {activeTab === "campaignSubmissions" && "Campaign Task Overview"}
                  {activeTab === "adminManagement" && "User Administration"}
               </h2>
               <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">Help</Button>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">Settings</Button>
               </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-7xl mx-auto">
                    {activeTab === "questSubmissions" && renderQuestSubmissions()}
                    {activeTab === "campaignSubmissions" && renderCampaignSubmissions()}
                    {activeTab === "adminManagement" && renderAdminManagement()}
                </div>
            </main>
        </div>
      </div>
    </div>
  );
}
