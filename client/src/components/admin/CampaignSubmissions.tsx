"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import { TASKS } from "../../types/admin";
import {
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  Clock,
  CheckCircle2,
  ChevronDown
} from "lucide-react";

export const DUMMY_TASKS: TASKS[] = [
  {
    _id: "t1",
    user: "u1",
    username: "Alice",
    taskType: "comment",
    status: "pending",
    validatedBy: "Moderator1",
    submissionLink: "https://example.com/submission/1",
    page: "campaign",
    campaignId: "camp1",
    campaignCompleted: "no",
    createdAt: new Date(Date.now() - 5000).toISOString(),
  },
  {
    _id: "t2",
    user: "u2",
    username: "Bob",
    taskType: "like",
    status: "done",
    validatedBy: "Moderator2",
    submissionLink: "https://example.com/submission/2",
    page: "campaign",
    campaignId: "camp1",
    campaignCompleted: "yes",
    createdAt: new Date(Date.now() - 36000).toISOString(),
  },
  {
    _id: "t3",
    user: "u3",
    username: "Charlie",
    taskType: "retweet",
    status: "retry",
    validatedBy: "Moderator1",
    submissionLink: "https://example.com/submission/3",
    page: "campaign",
    campaignId: "camp2",
    campaignCompleted: "no",
    createdAt: new Date(Date.now() - 6000).toISOString(),
  },
  {
    _id: "t4",
    user: "u4",
    username: "Diana",
    taskType: "custom",
    status: "pending",
    validatedBy: "Moderator3",
    submissionLink: "https://example.com/submission/4",
    page: "campaign",
    campaignId: "camp2",
    campaignCompleted: "no",
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    _id: "t5",
    user: "u5",
    username: "Evan",
    taskType: "like",
    status: "done",
    validatedBy: "Moderator2",
    submissionLink: "https://example.com/submission/5",
    page: "campaign",
    campaignId: "camp3",
    campaignCompleted: "yes",
    createdAt: new Date(Date.now() - 3600).toISOString(),
  },
  {
    _id: "t6",
    user: "u6",
    username: "Fiona",
    taskType: "comment",
    status: "pending",
    validatedBy: "Moderator4",
    submissionLink: "https://example.com/submission/6",
    page: "campaign",
    campaignId: "camp3",
    campaignCompleted: "no",
    createdAt: new Date(Date.now() - 24000).toISOString(),
  },
  {
    _id: "t7",
    user: "u7",
    username: "George",
    taskType: "retweet",
    status: "done",
    validatedBy: "Moderator5",
    submissionLink: "https://example.com/submission/7",
    page: "campaign",
    campaignId: "camp4",
    campaignCompleted: "yes",
    createdAt: new Date(Date.now() - 48000).toISOString(),
  },
];


interface CampaignSubmissionsProps {
  tasks: TASKS[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedUsers: Set<string>;
  viewedSubmissions: Set<string>;
  toggleUserSelection: (userId: string) => void;
  handleView: (id: string, taskType: string, link: string) => void;
  handleAction: (id: string, action: "accept" | "reject") => void;
  onRefresh: () => void;
}

export default function CampaignSubmissions({
  tasks,
  loading,
  searchTerm,
  setSearchTerm,
  selectedUsers,
  viewedSubmissions,
  toggleUserSelection,
  handleView,
  handleAction,
  onRefresh,
}: CampaignSubmissionsProps) {

  const [campaignPendingOpen, setCampaignPendingOpen] = useState(true);
  const [campaignCompletedOpen, setCampaignCompletedOpen] = useState(true);

  const timeAgo = (dateString: string) => {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};


    // Filter tasks by status and search term
    // const pendingTasks = tasks.filter(task => task.status === "pending" && task.username.toLowerCase().includes(searchTerm.toLowerCase()));
    // const pendingTasks = tasks.filter(task => task.status === "pending");

    // const completedTasks = tasks.filter(task => task.status !== "pending" && task.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const pendingTasks = tasks.filter(task => 
  task.status === "pending" &&
  task.username?.toLowerCase().includes(searchTerm.toLowerCase())
);

const completedTasks = tasks.filter(task => 
  task.status !== "pending" &&
  task.username?.toLowerCase().includes(searchTerm.toLowerCase())
);

    // Helper function to render individual task cards
    const renderTaskCard = (submission: TASKS) => (
      <Card key={submission._id} className="bg-white border-[0.833px] border-[rgba(28,37,51,0.09)] rounded-[40px] shadow-none p-4 text-[#1c2533]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#98a0b4]">User</p>
            <p className="text-[#1c2533] font-semibold cursor-pointer hover:text-[#8a3ffc] flex items-center gap-2" onClick={() => toggleUserSelection(submission.user)}>
              {submission.username}
              {selectedUsers.has(submission.user) && <Check className="w-4 h-4 text-[#00a87c]" />}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              submission.status === "pending" ? "bg-[rgba(245,158,11,0.14)] text-[#c27c00] border-[rgba(194,124,0,0.3)]" :
                submission.status === "done" ? "bg-[rgba(0,225,162,0.16)] text-[#00a87c] border-[rgba(0,168,124,0.3)]" :
                  submission.status === "retry" ? "bg-[rgba(248,113,113,0.16)] text-[#e4545b] border-[rgba(228,84,91,0.3)]" :
                    "bg-[#f7f4fe] text-[#3d485c] border-[rgba(28,37,51,0.15)]"
            }
          >
            {submission.status}
          </Badge>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[#69728a]">Task</span>
            <span className="text-[#1c2533] text-right">{submission.taskType}</span>
          </div>
          {submission.taskType?.toLowerCase() === "feedback" && (
            <div className="mt-2 bg-[#f4f1fc] border border-[rgba(28,37,51,0.09)] rounded-[20px] p-3 max-h-24 overflow-y-auto">
              <p className="text-[#3d485c] text-xs whitespace-pre-wrap leading-relaxed">
                {submission.submissionLink.length > 150 ? submission.submissionLink.slice(0, 150) + "…" : submission.submissionLink}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[#69728a]">Validated By</span>
            <span className="text-[#1c2533]">{submission.validatedBy}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {submission.status === "pending" ? (
            <>
              <Button
                size="sm"
                onClick={() => handleView(submission._id, submission.taskType, submission.submissionLink)}
                className="w-full bg-gradient-to-r from-[#8a3ffc] to-[#522696] shadow-[0px_4px_3px_-3px_#7e39e6] rounded-full text-white hover:opacity-90 transition-opacity"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              {viewedSubmissions.has(submission._id) && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(submission._id, "accept")}
                    className="bg-[rgba(0,225,162,0.16)] text-[#00a87c] hover:bg-[rgba(0,225,162,0.24)] hover:text-[#00a87c] border border-[rgba(0,168,124,0.3)] rounded-full p-2"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(submission._id, "reject")}
                    className="bg-[rgba(248,113,113,0.16)] text-[#e4545b] hover:bg-[rgba(248,113,113,0.24)] hover:text-[#e4545b] border border-[rgba(228,84,91,0.3)] rounded-full p-2"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleView(submission._id, submission.taskType, submission.submissionLink)}
                    className="bg-[rgba(90,168,255,0.14)] text-[#2f7fe0] hover:bg-[rgba(90,168,255,0.22)] hover:text-[#2f7fe0] border border-[rgba(90,168,255,0.35)] rounded-full p-2"
                    title="Review"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => handleView(submission._id, submission.taskType, submission.submissionLink)}
              className="w-full bg-[rgba(245,158,11,0.14)] text-[#c27c00] hover:bg-[rgba(245,158,11,0.22)] hover:text-[#c27c00] border border-[rgba(194,124,0,0.3)] rounded-full"
              title="Review & Change Status"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Review
            </Button>
          )}
        </div>
      </Card>
    );

    // Helper function to render table rows
    const renderTaskRow = (submission: TASKS) => (
  <TableRow key={submission._id} className="border-[rgba(28,37,51,0.09)] hover:bg-[#fbfaff]">
    
    {/* User */}
    <TableCell className="text-[#3d485c]">
      <button
        className="flex items-center gap-2 hover:text-[#8a3ffc] cursor-pointer"
        onClick={() => toggleUserSelection(submission.user)}
      >
        {submission.username}
        {selectedUsers.has(submission.user) && (
          <Check className="w-4 h-4 text-[#00a87c]" />
        )}
      </button>
    </TableCell>

    {/* Task Type */}
    <TableCell className="font-semibold text-[#1c2533]">
      {submission.taskType}
    </TableCell>

    {/* Submitted */}
    <TableCell className="text-[#3d485c]">
  {timeAgo(submission.createdAt ?? new Date().toISOString())}
</TableCell>

    {/* Status */}
    <TableCell>
      <Badge
        variant="outline"
        className={
          submission.status === "pending"
            ? "bg-[rgba(245,158,11,0.14)] text-[#c27c00] border-[rgba(194,124,0,0.3)]"
            : submission.status === "done"
            ? "bg-[rgba(0,225,162,0.16)] text-[#00a87c] border-[rgba(0,168,124,0.3)]"
            : submission.status === "retry"
            ? "bg-[rgba(248,113,113,0.16)] text-[#e4545b] border-[rgba(228,84,91,0.3)]"
            : "bg-[#f7f4fe] text-[#3d485c] border-[rgba(28,37,51,0.15)]"
        }
      >
        {submission.status}
      </Badge>
    </TableCell>

    {/* Validated By */}
    <TableCell className="text-[#3d485c]">
      {submission.validatedBy}
    </TableCell>

    {/* Actions */}
    <TableCell className="text-right">
      {submission.status === "pending" ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            onClick={() =>
              handleView(
                submission._id,
                submission.taskType,
                submission.submissionLink
              )
            }
            className="bg-gradient-to-r from-[#8a3ffc] to-[#522696] rounded-full text-white px-6 hover:opacity-90 transition-opacity"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>

          {viewedSubmissions.has(submission._id) && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction(submission._id, "accept")}
                className="bg-[rgba(0,225,162,0.16)] text-[#00a87c] border border-[rgba(0,168,124,0.3)] rounded-full p-2"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction(submission._id, "reject")}
                className="bg-[rgba(248,113,113,0.16)] text-[#e4545b] border border-[rgba(228,84,91,0.3)] rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() =>
            handleView(
              submission._id,
              submission.taskType,
              submission.submissionLink
            )
          }
          className="bg-[rgba(245,158,11,0.14)] text-[#c27c00] border border-[rgba(194,124,0,0.3)] rounded-full px-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Review
        </Button>
      )}
    </TableCell>
  </TableRow>
);


    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-y-3 mb-6">
          <h2 className="text-[26px] font-semibold leading-[40.3px] tracking-[-0.65px] text-[#1c2533]">Campaigns Submissions</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98a0b4]" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border-[rgba(28,37,51,0.15)] text-[#1c2533] pl-9 placeholder:text-[#98a0b4] rounded-[40px] focus-visible:ring-[#8a3ffc] w-full sm:w-48"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-[#69728a] hover:text-[#1c2533] hover:bg-[rgba(138,63,252,0.06)]"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Pending Tasks Section */}
        <Collapsible open={campaignPendingOpen} onOpenChange={setCampaignPendingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-[#1c2533] bg-white border-[0.833px] border-[rgba(28,37,51,0.09)] rounded-[40px] hover:bg-[#fbfaff] p-4">
              <span className="text-lg font-semibold">Pending Tasks ({pendingTasks.length})</span>
              <ChevronDown className={cn("w-5 h-5 transition-transform", campaignPendingOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#98a0b4]" />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[#98a0b4]">
                <Clock className="w-12 h-12 mb-4 opacity-50" />
                <p>No pending tasks</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {pendingTasks.map(renderTaskCard)}
                </div>
                <Card className="bg-white border-[0.833px] border-[rgba(28,37,51,0.09)] rounded-[40px] shadow-none overflow-hidden hidden md:block">

                  <Table>
<TableHeader>
  <TableRow className="border-[rgba(28,37,51,0.09)] hover:bg-transparent">
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">USER</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">TASK TYPE</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">SUBMITTED</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">STATUS</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">VALIDATED BY</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a] text-right">ACTIONS</TableHead>
  </TableRow>
</TableHeader>

                    <TableBody>
                      {pendingTasks.map(renderTaskRow)}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Completed Tasks Section */}
        <Collapsible open={campaignCompletedOpen} onOpenChange={setCampaignCompletedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-[#1c2533] bg-white border-[0.833px] border-[rgba(28,37,51,0.09)] rounded-[40px] hover:bg-[#fbfaff] p-4">
              <span className="text-lg font-semibold">Completed Tasks ({completedTasks.length})</span>
              <ChevronDown className={cn("w-5 h-5 transition-transform", campaignCompletedOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[#98a0b4]">
                <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                <p>No completed tasks yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {completedTasks.map(renderTaskCard)}
                </div>
                <Card className="bg-white border-[0.833px] border-[rgba(28,37,51,0.09)] rounded-[40px] shadow-none overflow-hidden hidden md:block">
                  <Table>
                    <TableHeader>
  <TableRow className="border-[rgba(28,37,51,0.09)] hover:bg-transparent">
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">USER</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">TASK TYPE</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">SUBMITTED</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">STATUS</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a]">VALIDATED BY</TableHead>
    <TableHead className="text-[12px] font-semibold tracking-[0.36px] text-[#69728a] text-right">ACTIONS</TableHead>
  </TableRow>
</TableHeader>
                    <TableBody>
                      {completedTasks.map(renderTaskRow)}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };
