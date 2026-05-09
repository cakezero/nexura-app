import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "../lib/config";

export function useAnalytics() {
  const [activeRange, setActiveRange] = useState<Range>("Last 24 Hrs");

  const { data } = useQuery({
    queryKey: ["/api/get-analytics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/get-analytics");
      return res.json();
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000)
      return `${(num / 1000000).toFixed(1)}M`;

    if (num >= 1000)
      return `${(num / 1000).toFixed(1)}k`;

    return num.toString();
  };

  const totalUsersForRange = {
    "Last 24 Hrs": data?.user?.users24h ?? 0,
    "Last 7 days": data?.user?.users7d ?? 0,
    "Last 30 days": data?.user?.users30d ?? 0,
    "All Time": data?.user?.totalUsers ?? 0,
  };

  const activeUsersForRange = {
    "Last 24 Hrs": data?.user?.users24h ?? 0,
    "Last 7 days": data?.user?.activeUsersWeekly ?? 0,
    "Last 30 days": data?.user?.activeUsersMonthly ?? 0,
    "All Time": data?.user?.totalUsers ?? 0,
  };

  const cards = [
    {
      title: "Total Users",
      value: data?.user?.totalUsers ?? 0,
      icon: "referrals.png",
      fullNumber: true,
      rate: null,
      description: "total users",
    },
    {
      title: "Active Users",
      value: formatNumber(activeUsersForRange[activeRange]),
      icon: "approved.png",
      fullNumber: false,
    },
    {
      title: "New Users",
      value: formatNumber(totalUsersForRange[activeRange]),
      icon: "new-users.png",
      fullNumber: false,
    },
    {
      title: "Quests Created",
      value: data?.totalQuests ?? 0,
      icon: "quest-iconx.png",
      fullNumber: false,
    },
    {
      title: "Campaigns Created",
      value: data?.totalCampaigns ?? 0,
      icon: "campaign_icon.png",
      fullNumber: false,
    },
  ];

  return {
    cards,
    activeRange,
    setActiveRange,
    data,
  };
}