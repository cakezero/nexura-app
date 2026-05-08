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
import QuestCard from "../components/QuestCard";

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
  

  const { data } = useQuery({
  queryKey: ["/api/get-analytics"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/get-analytics");
    const json = await res.json();
    return json.analytics ?? json; 
  },
});

const analyticsCards = data
  ? [
      {
        title: "Total Users",
        value: data.user.totalUsers,
      },
      {
        title: "Active Users",
        value: data.user.activeUsersWeekly,
      },
      {
        title: "New Users",
        value: data.user.users24h,
      },
      {
        title: "Quests Created",
        value: data.totalQuests,
      },
      {
        title: "Campaigns Created",
        value: data.totalCampaigns,
      },
    ]
  : [];

  const { data: questsData } = useQuery({
  queryKey: ["/api/quests"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/quests");
    return res.json();
  },
});

const quests = questsData?.quests ?? [];

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
  onClick={() => setLocation("/ecosystem-dapps")}
  className="flex items-center gap-2 text-xs h-7 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-white/5"
>
  <span>View all protocols</span>

  <img
    src="/arrow-right.png"
    alt="arrow right"
    className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 transition"
  />
</Button>
  </div>

<div className="ticker-container">
  <div className="ticker gap-3">
    
    {/* First set */}
    {filteredCards.map((card) => (
      <div key={card.id} className="w-[260px] shrink-0">
        <DiscoverCard card={card} />
      </div>
    ))}

    {/* Duplicate set for seamless loop */}
    {filteredCards.map((card) => (
      <div key={`${card.id}-dup`} className="w-[260px] shrink-0">
        <DiscoverCard card={card} />
      </div>
    ))}

  </div>
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
  onClick={() => setLocation("/campaigns")}
  className="flex items-center gap-2 text-xs h-7 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-white/5"
>
  <span>View all campaigns</span>

  <img
    src="/arrow-right.png"
    alt="arrow right"
    className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 transition"
  />
</Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {trendingCampaigns.length > 0 ? (
  trendingCampaigns.map((campaign: any, index: number) => (
    <div
      key={campaign._id ?? index}
      className={`animate-slide-up delay-${(index + 1) * 100}`}
    >
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <CampaignCard {...campaign} from="explore" />
      </div>
    </div>
  ))
) : (
  <div className="col-span-2 md:col-span-4 rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 text-center text-white/60 text-sm">
    No active campaigns at the moment.
  </div>
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
  onClick={() => setLocation("/learn")}
  className="flex items-center gap-2 text-xs h-7 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-white/5"
>
  <span>View all lessons</span>

  <img
    src="/arrow-right.png"
    alt="arrow right"
    className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100 transition"
  />
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

<div
  className="
    w-full
    flex
    rounded-3xl
    border border-white/10
    bg-[#170F1F]
    overflow-hidden
  "
  style={{
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "inset 0 0 22px rgba(131, 58, 253, 0.12)",
  }}
>
  {analyticsCards.map((card, idx) => (
    <div
      key={idx}
      className="
        flex-1
        flex flex-col items-center justify-center
        py-4 px-3
        text-center
        relative
      "
    >
      {/* VALUE */}
      <div className="text-lg sm:text-xl font-semibold text-white leading-none">
        {typeof card.value === "number"
          ? card.value.toLocaleString()
          : card.value}
      </div>

      {/* LABEL */}
      <div className="text-[10px] tracking-widest uppercase text-white/50 mt-1">
        {card.title}
      </div>

      {/* FULL CELL DIVIDER (REAL BOX SEPARATION) */}
      {idx !== analyticsCards.length - 1 && (
        <div className="absolute right-0 top-0 h-full w-px bg-white/10" />
      )}
    </div>
  ))}
</div>

{(activeFilter === "all" || activeFilter === "quests") && (
  <section className="mb-8">
    <div className="flex items-start justify-between mb-3 mt-8 gap-2">
      <div>
        <h2 className="text-base md:text-lg font-semibold">
          Trending Quests
        </h2>

        <p className="text-xs text-white/60 mt-1 max-w-xl">
          Complete quests and earn ecosystem rewards.
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/quests")}
        className="flex items-center gap-2 text-xs h-7 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-white/5"
      >
        <span>View all quests</span>

        <img
          src="/arrow-right.png"
          alt="arrow right"
          className="w-3.5 h-3.5 opacity-80 transition"
        />
      </Button>
    </div>

    {quests?.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quests.slice(0, 4).map((quest: any) => (
          <QuestCard
            key={quest._id}
            questId={quest._id}
            title={quest.title}
            description={quest.description}
            projectName={quest.projectName}
            projectLogo={quest.projectLogo}
            heroImage={quest.heroImage}
            participants={quest.participants}
            rewards={quest.rewards}
            duration={quest.duration}
          />
        ))}
      </div>
    ) : (
      <div className="col-span-2 md:col-span-4 rounded-2xl border border-white/10 bg-[#170F1F] p-6 text-center text-white/60 text-sm">
        No quests available yet. New quests will appear here soon.
      </div>
    )}
  </section>
)}

          
        </div>
      </div>
    </div>
  );
}