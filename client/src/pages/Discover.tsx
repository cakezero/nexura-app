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
import EcosystemCard from "../components/EcosystemCard";
// import AnalyticsBackground from "../components/AnalyticsBackground";
import ReusableBackground from "../components/ReusableBackground";


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
    const startTime = campaign.starts_at
      ? new Date(campaign.starts_at).getTime()
      : null;
    const endTime = campaign.ends_at
      ? new Date(campaign.ends_at).getTime()
      : null;
    const status = String(campaign.status ?? "").toLowerCase();

    // If campaign is manually ended or has ended status, it's not active
    if (status === "ended") return false;

    // If campaign has ended based on time, it's not active
    if (endTime && endTime <= currentTime) return false;

    // If campaign hasn't started yet, it's not active
    if (startTime && startTime > currentTime) return false;

    // If we have both start and end times, check if we're in between
    if (startTime && endTime) {
      return startTime <= currentTime && endTime > currentTime;
    }

    // If only start time exists and we're past it, it's active
    if (startTime) {
      return startTime <= currentTime;
    }

    // If only end time exists and we're before it, it's active
    if (endTime) {
      return endTime > currentTime;
    }

    // Fall back to status field if no timestamps
    return status === "active";
  };

  

  const trendingCampaigns = campaigns
    .filter((c: any) => isActiveCampaign(c))
    .slice(0, 3);

  const { data: dappsData } = useQuery({
  queryKey: ["/api/ecosystem-dapps"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/ecosystem-dapps");
    return res.json();
  },
});

const campaignsToRender = campaigns.filter((c: any) => isActiveCampaign(c));

const [dapps, setDapps] = useState<any[]>([]);

useEffect(() => {
  (async () => {
    try {
      const { ecosystemQuests } = await apiRequestV2(
        "GET",
        "/api/ecosystem-quests"
      );

      setDapps(ecosystemQuests || []);
    } catch (err) {
      console.error("Failed to fetch ecosystem dapps", err);
    }
  })();
}, []);

  const filteredDapps =
  activeFilter === "all" || activeFilter === "dapps"
    ? dapps
    : [];

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

const claimsCount = data?.claimsBought ?? 0;
const paymentsCount = data?.payments ?? 0;
const onchainInteractions = data?.totalOnchainInteractions ?? 0;

const nexonsMintedCount = Math.max(
  0,
  onchainInteractions - claimsCount - paymentsCount
);

const othersCount = data?.others ?? 0;

const totalTransactions =
  claimsCount + paymentsCount + nexonsMintedCount + othersCount;

const analyticsCards = data
  ? [
      {
        title: "Total Users",
        value: data.user.totalUsers,
      },
      {
        title: "Active Users",
        value: data.user.activeUsersMonthly,
      },
      {
        title: "New Users",
        value: data.user.users30d,
      },

      // REPLACED 1
      {
        title: "Proof of Action",
        value: data.claimsCreated ?? 0,
      },

      // REPLACED 2
      {
        title: "Total Transactions",
        value: totalTransactions,
      },
    ]
  : [];

const { data: questsData, isLoading, error } = useQuery({
  queryKey: ["quests"],
  queryFn: async () => {
  const res = await apiRequest("GET", "/api/quests");
  return res.json();
  
},
});

const questsRaw =
  questsData?.quests ||
  questsData?.weeklyQuests ||
  questsData?.data ||
  [];

const isActiveQuest = (quest: any) => {
  const start = quest.starts_at ? new Date(quest.starts_at).getTime() : null;
  const end = quest.ends_at ? new Date(quest.ends_at).getTime() : null;
  const status = String(quest.status ?? "").toLowerCase();

  // Exclude if explicitly ended or saved (draft)
  if (status === "ended" || status === "save") return false;
  // Exclude if already past the end time
  if (end && end <= currentTime) return false;
  // Exclude if it hasn't started yet
  if (start && start > currentTime) return false;

  return true;
};

const quests = questsRaw.filter(isActiveQuest);

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
          <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-[4px] text-[10px] font-medium text-purple-300 uppercase">
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
      {/* <AnalyticsBackground /> */}
      <ReusableBackground />

      <div className="relative z-10 space-y-10 px-2 sm:px-2 md:px-3 py-8">
        <div className="mx-auto w-full max-w-[1100px]">

          {/* Top Label */}
          <div className="mb-4 flex items-center gap-2">
  <div
    className="h-1.5 w-1.5 rounded-full animate-pulse"
    style={{
      background: "#FF8CD9",
      boxShadow: "0 0 10px #FF8CD9, 0 0 20px #B184C4",
    }}
  />

  <span
    className="text-sm font-semibold uppercase tracking-widest bg-clip-text text-transparent"
    style={{
      backgroundImage: "linear-gradient(to right, #B184C4, #FF8CD9)",
      textShadow: "0 0 18px rgba(255, 140, 217, 0.35)",
    }}
  >
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
      key: "dapps",
      label: "Dapps",
      icon: "/ecosystem-dapps.png",
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
      className={`
        flex items-center gap-1.5
        px-3 py-1.5
        rounded-full
        text-xs font-medium
        transition-all duration-200
        border
        ${
          activeFilter === filter.key
            ? "border-[#B65FC8] text-white"
            : "border-[#00E1A233] text-white/60 hover:text-white hover:border-[#00E1A266]"
        }
      `}
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
{(activeFilter === "all" || activeFilter === "dapps") && (
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
        className="flex items-center gap-2 text-xs h-7 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-[#00E1A24D] transition"
      >
        <span>View all protocols</span>

        <img
          src="/arrow-right.png"
          alt="arrow right"
          className="w-3.5 h-3.5 opacity-80 transition"
        />
      </Button>
    </div>

<>
{/* MOBILE VERSION */}
<div className="block sm:hidden relative w-[93vw] overflow-hidden">
  <div className="flex gap-3 w-max animate-dapps-marquee will-change-transform">

    {filteredDapps.map((dapp: any, index: number) => (
      <div
        key={dapp._id}
        className="w-[190px] shrink-0"
      >
        <EcosystemCard dapp={dapp} index={index} />
      </div>
    ))}

    {filteredDapps.map((dapp: any, index: number) => (
      <div
        key={`${dapp._id}-dup`}
        className="w-[190px] shrink-0"
      >
        <EcosystemCard dapp={dapp} index={index} />
      </div>
    ))}

  </div>
</div>

  {/* DESKTOP VERSION */}
  <div className="hidden sm:block w-full overflow-hidden">
    <div className="flex gap-3 w-max animate-dapps-marquee will-change-transform">

      {filteredDapps.map((dapp: any, index: number) => (
        <div
          key={dapp._id}
          className="w-[220px] md:w-[260px] shrink-0"
        >
          <EcosystemCard dapp={dapp} index={index} />
        </div>
      ))}

      {filteredDapps.map((dapp: any, index: number) => (
        <div
          key={`${dapp._id}-dup`}
          className="w-[220px] md:w-[260px] shrink-0"
        >
          <EcosystemCard dapp={dapp} index={index} />
        </div>
      ))}

    </div>
  </div>
</>
  </section>
)}

{/* CAMPAIGNS */}
{(activeFilter === "all" || activeFilter === "campaigns") && (
  <section className="mb-8">

    <div className="flex items-start justify-between mb-3 mt-8 gap-3">
      <div className="min-w-0">
        <h2 className="text-base md:text-lg font-semibold">
          Active Campaigns
        </h2>

        <p className="text-xs text-white/60 mt-1 max-w-xl">
          Explore and participate in active campaigns
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation("/campaigns")}
        className="flex items-center justify-center gap-2 text-xs h-8 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-[#00E1A24D] transition shrink-0"
      >
        <span>View all campaigns</span>
        <img src="/arrow-right.png" className="w-3.5 h-3.5" />
      </Button>
    </div>

    {campaignsToRender.length === 0 ? (
      /* EMPTY STATE */
      <div className="w-full sm:w-auto -mx-3 sm:mx-0 rounded-none sm:rounded-2xl border border-white/10 bg-[#170F1F] p-6 text-center text-white/60 text-sm">
        No active campaigns at the moment.
      </div>

    ) : (
      /* CAROUSEL */
      <div className="overflow-hidden">

        <div
          className={`flex gap-3 w-max ${
            campaignsToRender.length <= 3 ? "" : "animate-quest-scroll"
          }`}
        >

          {(campaignsToRender.length <= 3
            ? campaignsToRender
            : [...campaignsToRender, ...campaignsToRender]
          ).map((campaign: any, i: number) => (
            <div
              key={`${campaign._id}-${i}`}
              className="
                w-[280px]
                sm:w-[320px]
                md:w-[360px]
                shrink-0
              "
            >
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <CampaignCard {...campaign} from="explore" />
              </div>
            </div>
          ))}

        </div>

      </div>
    )}

  </section>
)}

{/* LEARNING */}
{(activeFilter === "all" || activeFilter === "learning") && (
  <section className="mb-8">
<div className="flex items-start justify-between mb-3 mt-8 gap-3">
  <div className="min-w-0">
    <h2 className="text-base md:text-lg font-semibold">
      Active Lessons
    </h2>

    <p className="text-xs text-white/60 mt-1 max-w-xl">
      Explore and participate in active lessons
    </p>
  </div>

  <Button
    variant="ghost"
    size="sm"
    onClick={() => setLocation("/learn")}
    className="flex items-center justify-center gap-2 text-xs h-8 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-[#00E1A24D] transition shrink-0"
  >
    <span>View all lessons</span>
    <img src="/arrow-right.png" className="w-3.5 h-3.5" />
  </Button>
</div>

    {/* EMPTY STATE */}
    {!lessons || lessons.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-[#170F1F] p-6 text-center text-white/60 text-sm">
        Lessons coming soon...
      </div>
    ) : (
      <>
        {/* MOBILE VERSION */}
{/* MOBILE VERSION */}
<div className="block sm:hidden relative w-[93vw] overflow-hidden">
  <div className="flex gap-3 w-max animate-lesson-scroll will-change-transform">

    {/* TRACK 1 */}
    <div className="flex gap-3">
      {lessons.map((lesson: any, i: number) => {
        const title = lesson.title || "Untitled Lesson";

        const description =
          lesson.description ||
          lesson.sub_title ||
          "No description available";

        const project =
          lesson.projectName ||
          lesson.project_name ||
          "Unknown";

        return (
          <div
            key={`${lesson._id}-a-${i}`}
            className="w-[190px] shrink-0"
          >
            <LessonCard
              lesson={lesson}
              title={title}
              description={description}
              heroImage={
                lesson.coverImage ||
                lesson.project_image ||
                "/lesson-1.png"
              }
            />
          </div>
        );
      })}
    </div>

    {/* TRACK 2 (IDENTICAL CLONE) */}
    <div className="flex gap-3">
      {lessons.map((lesson: any, i: number) => {
        const title = lesson.title || "Untitled Lesson";

        const description =
          lesson.description ||
          lesson.sub_title ||
          "No description available";

        const project =
          lesson.projectName ||
          lesson.project_name ||
          "Unknown";

        return (
          <div
            key={`${lesson._id}-b-${i}`}
            className="w-[190px] shrink-0"
          >
            <LessonCard
              lesson={lesson}
              title={title}
              description={description}
              heroImage={
                lesson.coverImage ||
                lesson.project_image ||
                "/lesson-1.png"
              }
            />
          </div>
        );
      })}
    </div>

  </div>
</div>

        {/* DESKTOP VERSION */}
        <div className="hidden sm:block overflow-hidden">
          <div
            className={`flex gap-3 w-max ${
              lessons.length <= 3 ? "" : "animate-lesson-scroll"
            }`}
          >
            {(lessons.length <= 3 ? lessons : [...lessons, ...lessons]).map(
              (lesson: any, i: number) => {
                const title = lesson.title || "Untitled Lesson";

                const description =
                  lesson.description ||
                  lesson.sub_title ||
                  "No description available";

                const project =
                  lesson.projectName ||
                  lesson.project_name ||
                  "Unknown";

                return (
                  <div
                    key={`${lesson._id}-${i}`}
                    className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0"
                  >
                    <LessonCard
                      lesson={lesson}
                      title={title}
                      description={description}
                      heroImage={
                        lesson.coverImage ||
                        lesson.project_image ||
                        "/lesson-1.png"
                      }
                    />
                  </div>
                );
              }
            )}
          </div>
        </div>
      </>
    )}
  </section>
)}

{activeFilter === "all" && (
  <>
    {/* MOBILE VERSION */}
    <div className="block sm:hidden w-full">
      <div className="grid grid-cols-2 gap-[1px] rounded-3xl overflow-hidden bg-[rgba(131,58,253,0.18)]">

        {analyticsCards.map((card, idx) => (
          <div
            key={idx}
            className="
              relative
              overflow-hidden
              flex flex-col items-center justify-center
              py-4 px-3
              text-center
              min-h-[85px]
              bg-[#170F1F]
              border border-[rgba(131,58,253,0.18)]
              backdrop-blur-md
            "
            style={{
              boxShadow: "inset 0 0 22px rgba(131, 58, 253, 0.12)",
            }}
          >
            <div
              className="absolute w-56 h-56 rounded-full"
              style={{
                background: "#833AFD",
                top: "-80px",
                right: "-80px",
                filter: "blur(65px)",
                opacity: 0.5,
              }}
            />

            <div className="relative z-10 text-base font-semibold text-white leading-none soft-rise">
              {typeof card.value === "number"
                ? card.value.toLocaleString()
                : card.value}
            </div>

            <div className="relative z-10 text-[9px] tracking-widest uppercase text-white/50 mt-1">
              {card.title}
            </div>
          </div>
        ))}

      </div>
    </div>

    {/* DESKTOP VERSION (UNCHANGED) */}
    <div className="hidden sm:block w-full">
      <div
        className="
          w-full
          flex
          rounded-3xl
          overflow-hidden
          gap-[1px]
          bg-[rgba(131,58,253,0.18)]
        "
      >
        {analyticsCards.map((card, idx) => (
          <div
            key={idx}
            className="
              relative
              overflow-hidden
              flex-1
              flex flex-col items-center justify-center
              py-4 px-3
              text-center
            "
            style={{
              background: "#170F1F",
              border: "1px solid rgba(131, 58, 253, 0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "inset 0 0 22px rgba(131, 58, 253, 0.12)",
            }}
          >
            <div
              className="absolute w-56 h-56 rounded-full"
              style={{
                background: "#833AFD",
                top: "-80px",
                right: "-80px",
                filter: "blur(65px)",
                opacity: 0.5,
              }}
            />

            <div className="relative z-10 text-lg sm:text-xl font-semibold text-white leading-none soft-rise">
              {typeof card.value === "number"
                ? card.value.toLocaleString()
                : card.value}
            </div>

            <div className="relative z-10 text-[10px] tracking-widest uppercase text-white/50 mt-1">
              {card.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}

{activeFilter === "all" && (
  <div className="mt-3 text-[11px] sm:text-xs text-white/50 leading-relaxed">
    Track deeper engagement insights.{" "}
    <span
      onClick={() => setLocation("/analytics")}
      className="inline-flex items-center gap-1 text-[#00E1A2] cursor-pointer hover:opacity-80 transition"
    >
      View detailed Analytics
      <img
        src="/color-arrow-right.png"
        alt="arrow"
        className="w-3.5 h-3.5"
      />
    </span>
  </div>
)}

{/* QUESTS */}
{(activeFilter === "all" || activeFilter === "quests") && (
  <section className="mb-8">
    <div className="flex items-start justify-between mb-3 mt-8 gap-3">
  <div className="min-w-0">
    <h2 className="text-base md:text-lg font-semibold">
      Active Quests
    </h2>

    <p className="text-xs text-white/60 mt-1 max-w-xl">
      Explore and participate in active quests
    </p>
  </div>

  <Button
    variant="ghost"
    size="sm"
    onClick={() => setLocation("/quests")}
    className="flex items-center justify-center gap-2 text-xs h-8 px-3 border border-[#00E1A299] text-white/80 hover:text-white hover:bg-[#00E1A24D] transition shrink-0"
  >
    <span>View all quests</span>
    <img src="/arrow-right.png" className="w-3.5 h-3.5" />
  </Button>
</div>

    {/* EMPTY STATE */}
    {!quests || quests.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-[#170F1F] p-6 text-center text-white/60 text-sm">
        Quests coming soon...
      </div>
    ) : (
      /* WIDE TICKER (3 cards visible) */
      <div className="overflow-hidden">
        <div
          className={`flex gap-3 w-max ${
            quests.length <= 3 ? "" : "animate-quest-scroll"
          }`}
        >

          {(quests.length <= 3 ? quests : [...quests, ...quests]).map(
            (quest: any, i: number) => {
              const title = quest.title || "Untitled Quest";

              const description =
                quest.description ||
                quest.sub_title ||
                "No description available";

              const project =
                quest.projectName ||
                quest.project_name ||
                "Unknown";

              return (
                <div
                  key={`${quest._id}-${i}`}
                  className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0"
                >
                  <QuestCard
                    questId={quest._id}
                    title={title}
                    description={description}
                    creatorName={project}
                    creatorLogo={quest.project_image || "/quest-1.png"}
                    heroImage={quest.projectCoverImage || "/quest-1.png"}
                    rewards={`${quest.reward || quest.rewards || 0} XP`}
                    starts_at={quest.starts_at}
                    ends_at={quest.ends_at}
                    participants={quest.participants}
                  />
                </div>
              );
            }
          )}

        </div>
      </div>
    )}
  </section>
)}

        </div>
      </div>
    </div>
    // </div>
  );
}