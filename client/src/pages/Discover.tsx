import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { useLocation } from "wouter";
import { queryClient } from "../lib/queryClient";
import AnimatedBackground from "../components/AnimatedBackground";
import { apiRequestV2 } from "../lib/queryClient";
import CampaignCard from "../components/CampaignCard";
import LessonCard from "../components/LessonCard";
import AnalyticsCard from "../components/AnalyticsCard";

// Images
import intuitionPortal from "@assets/intuitionPortal.jpg";
// import intuitionBets from "@assets/intuitionBets.jpg";
import Sofia from "/ecosystem/Sofia.jpg"
import intuRank from "@assets/intuRank.jpg";
import tnsLogo from "@assets/tnsLogo.jpg";

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const [serverOffset, setServerOffset] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [, setLocation] = useLocation();

  // Refresh timer
  useEffect(() => {
    apiRequestV2("GET", `/api/server-time`)
      .then((res: any) => setServerOffset(res.serverTime - Date.now()))
      .catch(() => {});

    const ticker = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    const initializeRefreshTimer = () => {
      const lastRefresh = localStorage.getItem("lastTaskRefresh");
      const now = Date.now();

      if (!lastRefresh) {
        localStorage.setItem("lastTaskRefresh", now.toString());
        setRefreshCountdown(86400);
      } else {
        const timeSinceRefresh = Math.floor(
          (now - parseInt(lastRefresh)) / 1000
        );

        setRefreshCountdown(Math.max(0, 86400 - timeSinceRefresh));
      }
    };

    initializeRefreshTimer();

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          queryClient.invalidateQueries();
          localStorage.setItem("lastTaskRefresh", Date.now().toString());

          console.log("Tasks refreshed! Data cache invalidated.");

          return 86400;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(ticker);
    };
  }, []);

  // Fetch campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/campaigns");
      return res.json();
    },
    retry: false,
  });

  const campaigns = Array.isArray(campaignsData?.campaigns)
    ? campaignsData.campaigns
    : [];

  const currentTime = nowMs + serverOffset;

  const isCompletedCampaign = (campaign: any) =>
    !!campaign.ends_at &&
    new Date(campaign.ends_at).getTime() <= currentTime;

  const isActiveCampaign = (campaign: any) => {
    if (isCompletedCampaign(campaign)) return false;

    if (campaign.starts_at) {
      return (
        new Date(campaign.starts_at).getTime() <= currentTime
      );
    }

    return (
      String(campaign.status ?? "").toLowerCase() === "active"
    );
  };

  const trendingCampaigns = campaigns
    .filter((c: any) => isActiveCampaign(c))
    .slice(0, 3);

  // Unified cards
  const discoverCards = [
    {
      id: 1,
      title: "Intuition Portal",
      description:
        "Explore the Intuition ecosystem through the main portal and discover builders across the network.",
      category: "Portal",
      image: intuitionPortal,
      route: "/ecosystem-dapps",
    },

    {
      id: 2,
      title: "Trust Name Service",
      description:
        "Create human-readable identities and simplify interaction across the ecosystem.",
      category: "Domain Name",
      image: tnsLogo,
      route: "/ecosystem-dapps",
    },

    {
      id: 3,
      title: "IntuRank",
      description:
        "Track rankings, influence, and ecosystem reputation inside the Intuition network.",
      category: "Reputation",
      image: intuRank,
      route: "/ecosystem-dapps",
    },

        {
      id: 4,
      title: "Sofia",
      description:
        "Participate in prediction systems powered by social knowledge and onchain intelligence.",
      category: "Reputation",
      image: Sofia,
      route: "/ecosystem-dapps",
    },
  ];

  const filteredCards =
    activeFilter === "all"
      ? discoverCards
      : discoverCards.filter(
          (card) =>
            card.category.toLowerCase() === activeFilter
        );

        //// fetch lessons
        const { data: lessonsData } = useQuery({
  queryKey: ["/api/lesson/get-lessons"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/lesson/get-lessons");
    return res.json();
  },
  retry: false,
});

const lessons = Array.isArray(lessonsData?.lessons)
  ? lessonsData.lessons.filter((l: any) => l.status === "published")
  : [];

  const ranges = ["Last 24 Hrs", "Last 7 days", "Last 30 days", "All Time"] as const;
  type Range = (typeof ranges)[number];

  const formatNumber = (num: number) => {
  if (num >= 1000000)
    return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;

  if (num >= 1000)
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;

  return num.toString();
};

  const { data } = useQuery({
  queryKey: ["/api/analytics"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/analytics");
    return res.json();
  },
});

// Derive range-specific values from API data
  const totalUsersForRange: Record<Range, number> = {
    "Last 24 Hrs": data?.user.users24h ?? 0,
    "Last 7 days": data?.user.users7d ?? 0,
    "Last 30 days": data?.user.users30d ?? 0,
    "All Time": data?.user.totalUsers ?? 0,
  };

  const activeUsersForRange: Record<Range, number> = {
    "Last 24 Hrs": data?.user.users24h ?? 0,
    "Last 7 days": data?.user.activeUsersWeekly ?? 0,
    "Last 30 days": data?.user.activeUsersMonthly ?? 0,
    "All Time": data?.user.totalUsers ?? 0,
  };

  const [activeRange, setActiveRange] = useState<Range>("Last 24 Hrs");

  const analyticsCards = [
  {
    title: "Total Users",
    value: data?.user?.totalUsers ?? 0,
    icon: "referrals.png",
  },
  {
    title: "Active Users",
    value: formatNumber(activeUsersForRange[activeRange] ?? 0),
    icon: "approved.png",
  },
  {
    title: "New Users",
    value: formatNumber(totalUsersForRange[activeRange] ?? 0),
    icon: "new-users.png",
  },
  {
    title: "Quests Created",
    value: data?.totalQuests ?? 0,
    icon: "quest-iconx.png",
  },
  {
    title: "Campaigns Created",
    value: data?.totalCampaigns ?? 0,
    icon: "campaign_icon.png",
  },
];

  const DiscoverCard = ({ card }: any) => {
  return (
    <div
      onClick={() => setLocation(card.route)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#080808] transition-all duration-300 hover:border-white/20 hover:bg-[#0d0d0d]"
    >
      {/* Image */}
      <div className="relative h-[110px] md:h-[120px] overflow-hidden">
        <img
          src={card.image}
          alt={card.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-3">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">
            {card.title}
          </h3>

          <p className="mt-1 text-[11px] md:text-xs leading-relaxed text-white/60 line-clamp-2">
            {card.description}
          </p>
        </div>

        {/* Category */}
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-[4px] text-[10px] font-medium text-purple-300">
            {card.category}
          </span>
        </div>
      </div>
    </div>
  );
};

  return (
    <div
      className="min-h-screen bg-black text-white relative"
      data-testid="discover-page"
    >
      <AnimatedBackground />

      <div className="relative z-10 space-y-10 px-3 sm:px-4 md:px-6 py-8">
        <div className="mx-auto w-full max-w-[1100px]">

          {/* Top Label */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />

            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
              Explore
            </span>
          </div>

          {/* Filters */}
<div className="mb-5 flex flex-wrap items-center gap-2">
  {[
    {
      key: "all",
      label: "All",
      icon: null,
    },
    {
      key: "campaigns",
      label: "Campaigns",
      icon: "/campaign-icon.png",
    },
    {
      key: "learning",
      label: "Learning",
      icon: "/learn-iconn.png",
    },
    {
      key: "quests",
      label: "Quests",
      icon: "/quest-iconx.png",
    },
  ].map((filter) => (
    <button
      key={filter.key}
      onClick={() => setActiveFilter(filter.key)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
        ${
          activeFilter === filter.key
            ? "bg-purple-500 border-purple-500 text-white"
            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20"
        }`}
    >
      {filter.icon && (
        <img
          src={filter.icon}
          alt={filter.label}
          className="w-3.5 h-3.5 object-contain"
        />
      )}

      <span>{filter.label}</span>
    </button>
  ))}
</div>

          {/* Apps & Projects */}
          <section className="mb-8">
  <div className="flex items-start justify-between mb-3 gap-2">
    <div>
      <h2 className="text-base md:text-lg font-semibold">
        Apps and Projects
      </h2>

      <p className="text-[11px] md:text-xs text-white/60 mt-1 max-w-xl">
        Discover projects building on the Intuition knowledge network.
      </p>
    </div>

    <Button
      variant="ghost"
      size="sm"
      className="text-xs h-7 px-2"
      onClick={() => setLocation("/ecosystem-dapps")}
    >
      Show all
    </Button>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {filteredCards.map((card) => (
      <DiscoverCard
        key={card.id}
        card={card}
      />
    ))}
  </div>
</section>

{/* Campaigns */}
{(activeFilter === "all" ||
  activeFilter === "campaigns") && (
  <section className="mb-8">
    <div className="flex items-start justify-between mb-3 gap-2">
      <div>
        <h2 className="text-base md:text-lg font-semibold">
          Trending Campaigns
        </h2>

        <p className="text-[11px] md:text-xs text-white/60 mt-1 max-w-xl">
          Complete campaigns, earn rewards, and participate in the growing Intuition ecosystem.
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 px-2"
        onClick={() => setLocation("/campaigns")}
      >
        Show all
      </Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {trendingCampaigns.map(
        (campaign: any, index: number) => (
          <div
            key={campaign._id ?? index}
            className={`animate-slide-up delay-${
              (index + 1) * 100
            }`}
          >
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <CampaignCard
                {...campaign}
                from="explore"
              />
            </div>
          </div>
        )
      )}
    </div>
  </section>
)}

{/* Learning */}
{(activeFilter === "all" || activeFilter === "learning") && (
  <section className="pb-10">
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h2 className="text-base md:text-lg font-semibold">
          Learning
        </h2>

        <p className="text-[11px] md:text-xs text-white/60 mt-1 max-w-xl">
          Learn how Intuition works through guides, tutorials, and ecosystem walkthroughs.
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 px-2"
      >
        Coming soon
      </Button>
    </div>

    {/* GRID */}
    {lessons?.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {lessons.map((lesson: any) => (
          <LessonCard key={lesson._id} lesson={lesson} />
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 text-center">
        <h3 className="text-sm font-semibold text-white mb-1">
          Learning Hub
        </h3>

        <p className="text-[11px] text-white/60 max-w-md mx-auto">
          Educational content, onboarding guides, tutorials, and walkthroughs will appear here soon.
        </p>
      </div>
    )}
  </section>
)}

{/* Analytics */}
<section className="mb-8">
  <div className="flex items-start justify-between mb-3 gap-2">
    <div>
      <h2 className="text-base md:text-lg font-semibold">
        Analytics
      </h2>

      <p className="text-[11px] md:text-xs text-white/60 mt-1 max-w-xl">
        Live ecosystem metrics across users, quests, and campaigns.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
    {analyticsCards.map((card, index) => (
      <div
        key={index}
        className="rounded-2xl border border-white/10 bg-[#080808] p-3 flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 text-[11px] text-white/60">
          <img src={`/${card.icon}`} className="w-4 h-4" />
          <span>{card.title}</span>
        </div>

        <div className="text-lg font-bold text-white">
          {card.value}
        </div>
      </div>
    ))}
  </div>
</section>

          
        </div>
      </div>
    </div>
  );
}