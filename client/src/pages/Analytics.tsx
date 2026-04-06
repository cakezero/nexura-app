import { useState, useEffect, useMemo } from "react";
import Chart from "react-apexcharts";
import { ResponsivePie } from "@nivo/pie";
import { apiRequestV2 } from "../lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsUser {
  totalUsers: number;
  activeUsersWeekly: number;
  activeUsersMonthly: number;
  users24h: number;
  users7d: number;
  users30d: number;
  prevUsers24h: number;
  prevUsers7d: number;
  prevUsers30d: number;
  prevActiveWeekly: number;
  prevActiveMonthly: number;
  totalUsersYesterday: number;
}

interface DayBucket { day: string; date: string; count: number }
interface HourBucket { hour: number; label: string; count: number }

interface AnalyticsData {
  totalOnchainInteractions: number;
  totalOnchainClaims: number;
  totalCampaigns: number;
  user: AnalyticsUser;
  totalReferrals: number;
  totalQuests: number;
  totalQuestsCompleted: number;
  totalCampaignsCompleted: number;
  joinRatio: number;
  totalTrustDistributed: number;
  totalXpInCirculation: number;
  usersByDay: DayBucket[];
  usersByHour: HourBucket[];
  tomorrowName: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const RANGES = ["Last 24hrs", "Last 7 Days", "Last 30 Days", "Last 3 Months", "All time"] as const;
type Range = typeof RANGES[number];

const TRANSACTION_COLORS: Record<string, string> = {
  Claims:   "#00E1A2",
  Nexons:   "#B65FC8",
  Payments: "#8A3FFD",
  Others:   "#FFFFFF",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function rate(curr: number, prev: number): string | null {
  if (!prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

// ── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string;
  rateLabel: string | null;
  icon: string;
  periodLabel: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className ?? ""}`} />;
}

function MetricCard({ title, value, rateLabel, icon, periodLabel, loading }: MetricCardProps & { loading: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-[30px] border-2 flex-shrink-0 w-full md:w-[200px]"
      style={{ background: "#170f1f", borderColor: "rgba(212,187,255,0.1)", minHeight: 109 }}
    >
      {/* purple glow */}
      <div className="absolute bg-[#833afd] blur-[30px] h-8 w-40 -top-4 right-8 pointer-events-none" />
      <div className="absolute bg-[#833afd] blur-[30px] h-8 w-40 top-28 -left-24 pointer-events-none" />

      {/* Mobile: icon + title inline */}
      <div className="flex items-center gap-3 px-3 pt-3 md:hidden">
        <img src={icon} alt="" className="w-[30px] h-[30px] object-cover flex-shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-[1px] text-white/80 leading-tight">{title}</p>
      </div>
      {/* Large bg ghost icon (mobile) */}
      <img src={icon} alt="" className="absolute right-0 top-3 w-[99px] h-[99px] object-cover opacity-10 pointer-events-none md:hidden" />

      {/* Desktop: icon top-right, title top-left */}
      <img src={icon} alt="" className="hidden md:block absolute right-3 top-3 w-[30px] h-[30px] object-cover" />
      <p className="hidden md:block absolute left-3 top-[18px] text-[10px] font-semibold uppercase tracking-[1px] text-white/80">{title}</p>

      {/* Value + rate */}
      <div className="px-3 pt-2 pb-3 md:absolute md:bottom-0 md:left-0 md:pb-2 md:pt-0">
        {loading ? (
          <>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <p className="text-[24px] font-bold text-white tracking-[-0.6px] leading-none mb-2">{value}</p>
            {rateLabel ? (
              <div className="flex items-center gap-1">
                <img src="/rate.png" alt="" className="w-[10px] h-[6px]" />
                <span className="text-[10px] font-semibold text-[#00e1a2]">{rateLabel} {periodLabel}</span>
              </div>
            ) : (
              <span className="text-[10px] text-white/40">{periodLabel}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [activeRange, setActiveRange] = useState<Range>("Last 24hrs");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiRequestV2("GET", "/api/get-analytics");
        setAnalytics(res.analytics);
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derive per-range metric values ──────────────────────────────────────
  const metrics = useMemo(() => {
    if (!analytics) return null;
    const u = analytics.user;

    const totalUsers   = fmt(u.totalUsers);
    const totalRate    = rate(u.totalUsers, u.totalUsersYesterday);

    const newByRange: Record<Range, [number, number]> = {
      "Last 24hrs":      [u.users24h,    u.prevUsers24h],
      "Last 7 Days":     [u.users7d,     u.prevUsers7d],
      "Last 30 Days":    [u.users30d,    u.prevUsers30d],
      "Last 3 Months":   [u.users30d,    u.prevUsers30d],
      "All time":        [u.totalUsers,  u.totalUsersYesterday],
    };
    const activeByRange: Record<Range, [number, number]> = {
      "Last 24hrs":      [u.users24h,         u.prevUsers24h],
      "Last 7 Days":     [u.activeUsersWeekly, u.prevActiveWeekly],
      "Last 30 Days":    [u.activeUsersMonthly,u.prevActiveMonthly],
      "Last 3 Months":   [u.activeUsersMonthly,u.prevActiveMonthly],
      "All time":        [u.totalUsers,         u.totalUsersYesterday],
    };

    const [newCurr, newPrev]       = newByRange[activeRange];
    const [activeCurr, activePrev] = activeByRange[activeRange];
    const periodLabel = activeRange === "All time" ? "overall" : `vs prev ${activeRange.toLowerCase()}`;

    return [
      { title: "Total Users",       value: totalUsers,          rateLabel: totalRate,                   icon: "/referrals.png",   periodLabel },
      { title: "Active Users",      value: fmt(activeCurr),     rateLabel: rate(activeCurr, activePrev), icon: "/approved.png",    periodLabel },
      { title: "New Users",         value: fmt(newCurr),        rateLabel: rate(newCurr, newPrev),       icon: "/new-users.png",   periodLabel },
      { title: "Quests Created",    value: fmt(analytics.totalQuests),    rateLabel: null,               icon: "/quest-iconx.png", periodLabel: "total" },
      { title: "Campaigns Created", value: fmt(analytics.totalCampaigns), rateLabel: null,               icon: "/campaign_icon.png", periodLabel: "total" },
    ];
  }, [analytics, activeRange]);

  // ── Chart data ──────────────────────────────────────────────────────────
  const chartConfig = useMemo(() => {
    if (!analytics) return { categories: [] as string[], data: [] as number[] };

    if (activeRange === "Last 24hrs") {
      return {
        categories: analytics.usersByHour.map((h) => h.label),
        data: analytics.usersByHour.map((h) => h.count),
      };
    }
    if (activeRange === "Last 7 Days") {
      const last7 = analytics.usersByDay.slice(-7);
      return { categories: last7.map((d) => d.day), data: last7.map((d) => d.count) };
    }
    if (activeRange === "Last 30 Days") {
      return {
        categories: analytics.usersByDay.map((d) => d.date),
        data: analytics.usersByDay.map((d) => d.count),
      };
    }
    // Last 3 Months / All time — group into weeks
    const byWeek: number[] = [];
    const weekLabels: string[] = [];
    for (let i = 0; i < analytics.usersByDay.length; i += 7) {
      const chunk = analytics.usersByDay.slice(i, i + 7);
      byWeek.push(chunk.reduce((s, d) => s + d.count, 0));
      weekLabels.push(`W${Math.floor(i / 7) + 1}`);
    }
    return { categories: weekLabels, data: byWeek };
  }, [analytics, activeRange]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false } },
    xaxis: {
      categories: chartConfig.categories,
      labels: { style: { colors: "#ffffff88", fontSize: "10px" }, rotate: -45 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#ffffff88", fontSize: "10px" } } },
    grid: { borderColor: "#ffffff11", strokeDashArray: 4 },
    stroke: { curve: "smooth", width: 2, colors: ["#00E1A2"] },
    fill: {
      type: "gradient",
      gradient: { shade: "dark", type: "vertical", gradientToColors: ["#00E1A200"], opacityFrom: 0.55, opacityTo: 0.05 },
    },
    markers: { size: 0 },
    tooltip: { theme: "dark" },
    dataLabels: { enabled: false },
  }), [chartConfig.categories]);

  // ── On-chain breakdown ──────────────────────────────────────────────────
  const onChainData = useMemo(() => {
    if (!analytics) return [];
    const claims   = analytics.totalOnchainClaims;
    const others   = Math.max(analytics.totalOnchainInteractions - claims, 0);
    return [
      { id: "Claims", value: claims,  color: TRANSACTION_COLORS.Claims  },
      { id: "Others", value: others,  color: TRANSACTION_COLORS.Others  },
    ].filter((d) => d.value > 0);
  }, [analytics]);

  const totalTxns = analytics?.totalOnchainInteractions ?? 0;

  // ── Join vs Completion ──────────────────────────────────────────────────
  const joinCompletion = useMemo(() => {
    if (!analytics) return { joined: 0, completed: 0, pct: 0, dropPct: 0, dropCount: 0 };
    const completed = analytics.totalCampaignsCompleted;
    const ratio     = analytics.joinRatio || 0;
    const joined    = ratio > 0 ? Math.round(completed / (ratio / 100)) : completed;
    const pct       = Math.round(ratio);
    const dropCount = Math.max(joined - completed, 0);
    const dropPct   = joined > 0 ? Math.round((dropCount / joined) * 100) : 0;
    return { joined, completed, pct, dropPct, dropCount };
  }, [analytics]);

  const donutData = useMemo(() => [
    { id: "Completed", value: joinCompletion.pct,        color: "#00E1A2" },
    { id: "Remaining", value: 100 - joinCompletion.pct,  color: "rgba(255,255,255,0.2)" },
  ], [joinCompletion.pct]);

  return (
    <div className="min-h-screen w-full text-white pb-24 md:pb-10 overflow-x-hidden font-geist">
      <div className="px-4 md:px-8 py-6 max-w-[1200px] mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-[5px]">
            <div className="w-[5px] h-[5px] rounded-full bg-[#b184c4]" />
            <span
              className="text-[12px] font-normal"
              style={{ background: "linear-gradient(90deg,#b184c4,#ff8cd9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              ANALYTICS
            </span>
          </div>
          <h1 className="text-[24px] md:text-[30px] font-semibold text-white leading-tight">
            Platform Performance Metrics
          </h1>
          <p className="text-[14px] md:text-[18px] text-[#a3adc2]">
            Track live platform activity and growth metrics on Nexura
          </p>
        </div>

        {/* ── Range Filter ── */}
        {/* Mobile: dropdown-style single button */}
        <div className="md:hidden">
          <select
            value={activeRange}
            onChange={(e) => setActiveRange(e.target.value as Range)}
            className="h-[30px] pl-3 pr-8 rounded-full border text-[14px] font-semibold text-white appearance-none"
            style={{ background: "transparent", borderColor: "rgba(139,62,254,0.5)", color: "white" }}
          >
            {RANGES.map((r) => (
              <option key={r} value={r} style={{ background: "#170f1f" }}>{r}</option>
            ))}
          </select>
        </div>
        {/* Desktop: pill tabs */}
        <div className="hidden md:flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              className="h-[40px] px-5 rounded-full border text-[14px] transition-all"
              style={{
                borderColor: "#8b3efe",
                background: activeRange === r ? "#8b3efe" : "transparent",
                color: "white",
                fontWeight: activeRange === r ? 600 : 500,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* ── Metric Cards ── */}
        <div className="flex flex-col md:flex-row gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <MetricCard
                  key={i}
                  title=""
                  value=""
                  rateLabel={null}
                  icon="/referrals.png"
                  periodLabel=""
                  loading={true}
                />
              ))
            : metrics?.map((card) => <MetricCard key={card.title} {...card} loading={false} />)
          }
        </div>

        {/* ── Growth Trend Chart ── */}
        <div
          className="w-full rounded-[30px] overflow-hidden"
          style={{ background: "#170f1f", boxShadow: "inset 0px 4px 5px 0px rgba(0,225,162,0.4)" }}
        >
          <div className="p-5 pb-0">
            <h2 className="text-[18px] md:text-[20px] font-bold text-white">New User Growth Trend</h2>
            <p className="text-[12px] text-[#a3adc2] mt-0.5">Monitor daily new user activity and growth patterns</p>
          </div>
          <div className="h-[240px] md:h-[290px] px-4 pb-4">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <Chart
                options={chartOptions}
                series={[{ name: "New Users", data: chartConfig.data }]}
                type="area"
                height="100%"
                width="100%"
              />
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Join vs Completion — purple card */}
          <div
            className="flex-shrink-0 rounded-[30px] overflow-hidden border-2 w-full md:w-[250px] p-5 flex flex-col gap-3"
            style={{ background: "#833afd", borderColor: "rgba(212,187,255,0.1)" }}
          >
            <h3 className="text-[16px] font-bold text-white">Join vs Completion ratio</h3>

            <div className="flex flex-col gap-2">
              <div
                className="flex items-center justify-between px-3 py-1.5 rounded-full border"
                style={{ background: "rgba(23,15,31,0.3)", borderColor: "rgba(255,255,255,0.4)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-[8px] font-semibold text-white uppercase">Joined</span>
                </div>
                {loading ? <Skeleton className="h-3 w-8" /> : <span className="text-[10px] font-bold text-white">{fmt(joinCompletion.joined)}</span>}
              </div>
              <div
                className="flex items-center justify-between px-3 py-1.5 rounded-full border"
                style={{ background: "#632dbb", borderColor: "rgba(255,255,255,0.4)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00e1a2]" />
                  <span className="text-[8px] font-semibold text-white uppercase">Completed</span>
                </div>
                {loading ? <Skeleton className="h-3 w-8" /> : <span className="text-[10px] font-bold text-white">{fmt(joinCompletion.completed)}</span>}
              </div>
            </div>

            <div className="relative h-[110px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
                <>
                  <ResponsivePie
                    data={donutData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    innerRadius={0.72}
                    padAngle={0}
                    cornerRadius={0}
                    colors={(d: { data: { color: string } }) => d.data.color}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    isInteractive={false}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[20px] font-bold text-white leading-none">{joinCompletion.pct}%</span>
                    <span className="text-[8px] text-white/80 uppercase">Completion</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-[10px] text-white/70">
              {loading ? (
                <Skeleton className="h-3 w-40" />
              ) : (
                <><span className="text-white font-semibold">{joinCompletion.dropCount} ({joinCompletion.dropPct}%)</span> users drop before completion</>
              )}
            </p>

            <div
              className="rounded-[20px] border p-3 flex flex-col gap-2"
              style={{ background: "#632dbb", borderColor: "rgba(212,187,255,0.3)" }}
            >
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-white mt-0.5 flex-shrink-0" />
                <p className="text-[8px] text-white leading-tight">JOINED: Total users who joined a quest, campaign &amp; lesson</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00e1a2] mt-0.5 flex-shrink-0" />
                <p className="text-[8px] text-white leading-tight">COMPLETED: Total users who completed a quest, campaign &amp; lesson</p>
              </div>
            </div>
          </div>

          {/* On-Chain Activity */}
          <div
            className="flex-1 rounded-[30px] overflow-hidden border p-5 flex flex-col gap-3"
            style={{ background: "#170f1f", borderColor: "rgba(212,187,255,0.4)" }}
          >
            <div className="text-center">
              <h3 className="text-[16px] font-bold text-white">On-Chain Activity</h3>
              <p className="text-[10px] text-white/50 mt-0.5">Overview of transaction distribution across all on-chain activities</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="relative h-[160px] w-full sm:w-[160px] flex-shrink-0">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : onChainData.length > 0 ? (
                  <ResponsivePie
                    data={onChainData}
                    margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                    innerRadius={0}
                    padAngle={0.7}
                    cornerRadius={3}
                    colors={(d: { data: { color: string } }) => d.data.color}
                    enableArcLabels={false}
                    enableArcLinkLabels={true}
                    arcLinkLabelsSkipAngle={5}
                    arcLinkLabelsTextColor="#ffffff"
                    arcLinkLabelsThickness={1}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLinkLabel={(d) => `${totalTxns > 0 ? Math.round((d.value / totalTxns) * 100) : 0}%`}
                    isInteractive={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/30 text-xs">No data</div>
                )}
              </div>
              <div className="flex-1 w-full flex flex-col gap-3">
                <div className="text-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-7 w-16 mx-auto" />
                      <Skeleton className="h-3 w-24 mx-auto" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[24px] font-bold text-white leading-none">{fmt(totalTxns)}</p>
                      <p className="text-[10px] text-white/50 uppercase">Transactions</p>
                    </>
                  )}
                </div>
                <div
                  className="rounded-[20px] border overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(212,187,255,0.3)" }}
                >
                  {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 h-[28px] border-b border-white/5 last:border-0">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                      ))
                    : onChainData.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-4 h-[28px] border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                            <span className="text-[10px] text-white">{item.id}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-white">{fmt(item.value)}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Right — Trust + Claims + Lessons */}
          <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-[332px]">
            {/* Trust Distributed */}
            <div
              className="relative overflow-hidden rounded-[30px] border h-[121px] p-4 flex flex-col justify-between"
              style={{ background: "#170f1f", borderColor: "#170f1f" }}
            >
              <div className="absolute bg-[#833afd] blur-[15px] h-8 w-40 -top-2 right-12 pointer-events-none" />
              <div className="absolute bg-[#833afd] blur-[20px] h-8 w-40 top-24 -left-8 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[1px] text-white">Total Trust Distributed</p>
                <img src="/campaign_icon.png" alt="" className="w-[30px] h-[30px] object-cover" />
              </div>
              <div className="flex items-center gap-2 relative z-10">
                {loading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                <p className="text-[24px] font-bold text-white tracking-[-0.6px] leading-none">
                  {fmt(Math.round(analytics?.totalTrustDistributed ?? 0))}
                </p>
                )}
                <div
                  className="h-[14px] px-2 rounded-[4px] border flex items-center"
                  style={{ background: "rgba(130,57,253,0.1)", borderColor: "rgba(131,58,253,0.5)" }}
                >
                  <span className="text-[8px] font-semibold text-white tracking-[0.4px] uppercase">Trust</span>
                </div>
              </div>
            </div>

            {/* Claims + Lessons */}
            <div className="flex gap-3">
              <div
                className="relative overflow-hidden rounded-[30px] border flex-1 h-[121px] p-3 flex flex-col justify-between"
                style={{ background: "#170f1f", borderColor: "rgba(212,187,255,0.1)" }}
              >
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[1px] text-[#968da1] leading-tight w-[90px]">Total Claims Created</p>
                  <img src="/campaign_icon.png" alt="" className="w-[30px] h-[30px] object-cover flex-shrink-0" />
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-[24px] font-bold text-white tracking-[-0.6px] leading-none">
                    {fmt(analytics?.totalOnchainClaims ?? 0)}
                  </p>
                )}
              </div>
              <div
                className="relative overflow-hidden rounded-[30px] border flex-1 h-[121px] p-3 flex flex-col justify-between"
                style={{ background: "#170f1f", borderColor: "rgba(212,187,255,0.1)" }}
              >
                <div className="flex items-start justify-between">
                  <p className="text-[10px] uppercase tracking-[1px] text-[#968da1] leading-tight w-[80px]">Total Lessons Created</p>
                  <img src="/campaign_icon.png" alt="" className="w-[30px] h-[30px] object-cover flex-shrink-0" />
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-[24px] font-bold text-white tracking-[-0.6px] leading-none">
                    {fmt(analytics?.totalQuests ?? 0)}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
