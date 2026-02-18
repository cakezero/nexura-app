"use client";

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { TASKS } from "../../types/admin";

export const StatsOverview = ({ tasks }: { tasks: TASKS[] }) => {
    // Calculate stats from the provided tasks
    const totalPending = tasks.filter(task => task.status === "pending").length;
    const approvedToday = tasks.filter(task => task.status === "done").length;
    const rejectedToday = tasks.filter(task => task.status === "retry").length;
    const totalProcessed = approvedToday + rejectedToday;
    const totalSubmissions = tasks.length;

    // Calculate percentages based on processed tasks
    const pendingChange = totalProcessed > 0 ? `${Math.round((totalPending / (totalPending + totalProcessed)) * 100)}%` : "0%";
    const approvedChange = totalProcessed > 0 ? `${Math.round((approvedToday / totalProcessed) * 100)}%` : "0%";
    const rejectedChange = totalProcessed > 0 ? `${Math.round((rejectedToday / totalProcessed) * 100)}%` : "0%";

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
<Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
  <div className="flex flex-col relative z-10">
    <span className="text-white/60 text-sm font-medium">Total Pending Today</span>
    <div className="flex items-baseline gap-2 mt-2">
      <span className="text-3xl font-bold text-white">{totalPending}</span>
      <span className="text-yellow-400 text-xs font-medium">{pendingChange} pending</span>
    </div>
  </div>

  {/* Replacing Clock with your icon */}
  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16">
    <img
      src="/total-pending.png"
      alt="Total Pending Icon"
      className="w-full h-full object-contain transition-opacity"
    />
  </div>
</Card>

<Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
  <div className="flex flex-col relative z-10">
    <span className="text-white/60 text-sm font-medium">Total Approved Today</span>
    <div className="flex items-baseline gap-2 mt-2">
      <span className="text-3xl font-bold text-white">{approvedToday}</span>
      <span className="text-green-400 text-xs font-medium">{approvedChange} approval rate</span>
    </div>
  </div>

  {/* Replace CheckCircle2 with approved.png */}
  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16">
    <img
      src="/approved.png"
      alt="Approved Icon"
      className="w-full h-full object-contain"
    />
  </div>
</Card>


        <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
  <div className="flex flex-col relative z-10">
    <span className="text-white/60 text-sm font-medium">Total Rejected Today</span>
    <div className="flex items-baseline gap-2 mt-2">
      <span className="text-3xl font-bold text-white">{rejectedToday}</span>
      <span className="text-red-400 text-xs font-medium">{rejectedChange} rejection rate</span>
    </div>
  </div>

  {/* Replace XCircle with rejected.png */}
  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16">
    <img
      src="/rejected.png"
      alt="Rejected Icon"
      className="w-full h-full object-contain"
    />
  </div>
</Card>

        {/* <Card className="bg-white/5 border-white/10 backdrop-blur-md p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
          <div className="flex flex-col relative z-10">
            <span className="text-white/60 text-sm font-medium">Total Submissions</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{totalSubmissions}</span>
              <span className="text-blue-400 text-xs font-medium">All time submissions</span>
            </div>
          </div>
          <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-blue-500/10 group-hover:text-blue-500/20 transition-colors" />
        </Card> */}
      </div>
    );
  };