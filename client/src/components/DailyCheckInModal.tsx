import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Check, Flame, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

interface DailyCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInSuccess: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DailyCheckInModal({ open, onOpenChange, onCheckInSuccess }: DailyCheckInModalProps) {
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [serverDate, setServerDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchHistory();
      const now = new Date();
      setViewMonth(now.getMonth());
      setViewYear(now.getFullYear());
    }
  }, [open]);

  useEffect(() => {
    if (justClaimed) {
      const timer = setTimeout(() => setJustClaimed(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [justClaimed]);

  const fetchHistory = async () => {
    setIsFetching(true);
    try {
      const response = await apiRequest("GET", "/api/user/profile");
      const data = await response.json();

      console.log("FULL PROFILE RESPONSE:", data);
    console.log("CHECKIN DATES:", data.user?.checkInDates);
    
      const user = data.user;
      setStreak(user?.streak || 0);
      setLongestStreak(user?.longestStreak || 0);
      // openDailySignIn is true when user has NOT signed in today
      setAlreadyCheckedIn(!data.openDailySignIn);
      const todayStr = new Date().toISOString().split("T")[0];
      setServerDate(todayStr);
      setCheckInDates(user?.checkInDates || []);
    } catch {
      // silently fail
    } finally {
      setIsFetching(false);
    }
  };

  const handleCheckIn = async () => {
    if (alreadyCheckedIn || isLoading) return;
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/user/perform-daily-sign-in");
      setAlreadyCheckedIn(true);
      setJustClaimed(true);
      setStreak((s) => s + 1);
      const today = serverDate || new Date().toISOString().split("T")[0];
      setCheckInDates((prev) => [...prev, today]);
      toast({ title: "Check-in complete!", description: "+20 XP earned" });
      onCheckInSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const today = serverDate || new Date().toISOString().split("T")[0];
  const checkInSet = useMemo(() => new Set(checkInDates), [checkInDates]);

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isCurrentMonth = viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear();

  const canGoNext = !isCurrentMonth;

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (canGoNext) {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  /////////////// NEW MILESTONE PROGRESSION
  

  
  const MILESTONES = [
    { day: 7, xp: 500, label: "7" },
    { day: 15, xp: 1000, label: "15" },
    { day: 30, xp: 2500, label: "30" },
    { day: 45, xp: 5000, label: "45" },
    { day: 60, xp: 10000, label: "60" },
    { day: 90, xp: 20000, label: "90" },
  ];
  
  const nextMilestone = MILESTONES.find(m => m.day > streak);
  const previousMilestone = [...MILESTONES].reverse().find(m => m.day <= streak);
  
  const daysUntilNext = nextMilestone ? nextMilestone.day - streak : 0;
  const nextXP = nextMilestone?.xp || previousMilestone?.xp || 0;


const currentMilestone = [...MILESTONES]
  .slice()
  .reverse()
  .find(m => m.day <= streak);

const progressStart = currentMilestone?.day || 0;
const progressEnd = nextMilestone?.day || progressStart;

const progress =
  nextMilestone
    ? ((streak - progressStart) / (progressEnd - progressStart)) * 100
    : 100;

const daysRemaining = nextMilestone ? nextMilestone.day - streak : 0;

// const totalCheckIns = checkInDates?.length || 0;
const totalCheckIns = useMemo(() => {
  return Array.isArray(checkInDates) ? checkInDates.length : 0;
}, [checkInDates]);

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const checkInsThisMonth = checkInDates.filter((date) => {
  const d = new Date(date);
  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
});

// ⚠️ placeholder ONLY if backend doesn't provide XP
const xpThisMonth = checkInsThisMonth.length * 20; // temporary fallback

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#100721] backdrop-blur-3xl border border-[#FFFFFF4D] rounded-2xl w-[92vw] max-w-xl p-0 overflow-hidden">
        {/* Header */}
<div className="px-3 pt-2 pb-3 text-center">
  <DialogHeader>
    <DialogTitle className="text-base font-bold text-white flex items-center justify-center gap-2">
      <img src="/daily.png" alt="" className="w-5 h-5" />
      Daily Check-In
    </DialogTitle>

    <DialogDescription className="text-white/50 text-xs mt-1">
      Build your streak, earn XP, and grow your Nexon progression.
    </DialogDescription>
  </DialogHeader>

  {/* Streak Circle */}
  <div className="mt-2 flex justify-center">
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
  width: "120px",
  height: "120px",
  background: "linear-gradient(135deg, #1E123CE5, #0F0A1EF2)",
  border: "4px solid #8B5CF6",
}}
    >
      {/* inner thin border */}
      <div
        className="absolute inset-[3px] rounded-full"
        style={{
          border: "1px solid #8B5CF633",
        }}
      />

      {/* content */}
      <div className="relative flex flex-col items-center justify-center text-center">
        <img src="/fire.png" alt="" className="w-8 h-8 mb-1" />

        <div className="text-2xl font-bold text-white">{streak}</div>

        <div className="text-[10px] text-white/50 tracking-widest mt-0.5">
          DAYS STREAK
        </div>
      </div>
    </div>
  </div>

  {/* Below Circle Text */}
  <div className="mt-1 text-center">
    <div className="text-sm font-medium text-white">Current Streak</div>
    <div className="text-xs text-white/40 mt-1">
  {nextMilestone
    ? `${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"} until your next milestone`
    : "All milestones completed"}
</div>
  </div>
</div>

{/* Stats Cards */}
<div className="px-3 grid grid-cols-2 gap-2 -mt-3">

{/* LEFT CARD - NEXT MILESTONE */}
<div
  className="rounded-2xl p-2 flex flex-col justify-between"
  style={{
    background: "linear-gradient(135deg, #8B5CF614, #581CDC0D)",
    border: "1px solid #8B5CF633",
  }}
>
  <div>
    <div className="text-[10px] font-semibold text-[#8B5CF6B2] tracking-wider">
      NEXT MILESTONE
    </div>

    <div className="text-lg font-bold text-white mt-1">
      {nextMilestone ? `${nextMilestone.day} days` : "Completed"}
    </div>

    <button
      className="mt-2 px-3 py-1.5 rounded-full text-[10px] font-medium text-white"
      style={{
        background: "#200D4F33",
        border: "1px solid #8B5CF64D",
      }}
    >
      {nextMilestone
        ? `Claim ${new Intl.NumberFormat().format(nextMilestone.xp || 0)} XP`
        : "All rewards claimed"}
    </button>
  </div>

  {/* progress */}
  <div className="mt-3">
    <div className="w-full h-1.5 rounded-full bg-[#FFFFFF14] overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(progress, 100)}%`,
          background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
        }}
      />
    </div>

    <div className="text-[10px] text-white/40 mt-1">
      {nextMilestone ? (
        <>
          <span className="text-white/60">{Math.floor(progress)}%</span>{" "}
          complete ·{" "}
          <span className="text-white/60">{daysRemaining}</span> days remaining
        </>
      ) : (
        "100% complete · All milestones reached"
      )}
    </div>
  </div>
</div>

{/* RIGHT CARD - YOUR STATS */}
<div
  className="rounded-2xl p-3 flex flex-col"
  style={{
    background: "linear-gradient(135deg, #8B5CF614, #581CDC0D)",
    border: "1px solid #8B5CF633",
  }}
>
  <div className="text-[10px] font-semibold text-[#8B5CF6B2] tracking-wider mb-2">
    YOUR STATS
  </div>

  {/* XP */}
  <div className="flex justify-between items-center">
    <span className="text-[11px] text-white/60">
      XP claimed this month
    </span>
    <span className="text-white font-semibold">
      {new Intl.NumberFormat().format(xpThisMonth)}
    </span>
  </div>

  <div className="h-[1px] bg-[#8B5CF61A] my-2" />

  {/* Longest Streak */}
  <div className="flex justify-between items-center">
    <span className="text-[11px] text-white/60">
      Highest Streak
    </span>
    <span className="text-white font-semibold">
      {longestStreak} days
    </span>
  </div>

  <div className="h-[1px] bg-[#8B5CF61A] my-2" />

  {/* Check-ins */}
  <div className="flex justify-between items-center">
    <span className="text-[11px] text-white/60">
      Total Check-Ins
    </span>
    <span className="text-white font-semibold">
      {totalCheckIns}
    </span>
  </div>
</div>
</div>

{/* Milestone Title */}
<div className="px-3 pt-1 -mt-3">
  <div className="text-[10px] font-semibold text-[#8B5CF6B2] tracking-wider mb-2">
    MILESTONE PROGRESSIONS
  </div>

  {/* Card */}
  <div
    className="rounded-2xl p-2"
    style={{
      background: "linear-gradient(135deg, #8B5CF614, #581CDC0D)",
      border: "1px solid #8B5CF633",
    }}
  >
    {/* LINE TRACK */}
    <div className="relative flex items-center justify-between">

      {MILESTONES.map((m, i, arr) => {
        const isLast = i === arr.length - 1;

        // ✅ REAL LOGIC
        const reached = streak >= m.day;
        const isCurrent = streak === m.day;

        return (
          <div
            key={m.day}
            className="flex flex-col items-center flex-1 relative"
          >
            {/* Connector Line */}
            {!isLast && (
              <div
                className="absolute top-4 left-1/2 w-full h-[2px] -z-10"
                style={{
                  background: "rgba(255,255,255,0.2)",
                }}
              />
            )}

            {/* Circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
              style={{
                background: reached
                  ? "linear-gradient(135deg, #6D28D9, #7C3AED)"
                  : "transparent",
                border: "1px solid #8B5CF64D",
              }}
            >
              {reached ? (
                isCurrent ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white text-[11px] font-semibold">
                    {m.day}
                  </span>
                )
              ) : (
                <img
                  src="/padlock.png"
                  className="w-4 h-4 opacity-80"
                />
              )}
            </div>

            {/* XP pill */}
            <div
              className="mt-1 px-2 py-0.5 rounded-full text-[10px] text-white"
              style={{
                background: "#6D28D94D",
                border: "1px solid #8B5CF64D",
              }}
            >
              {new Intl.NumberFormat().format(m.xp)} XP
            </div>

            {/* Days label */}
            <div className="text-[10px] mt-1 text-[#A78BFAB2]">
              {m.label} Days
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>

        {/* Check-in button */}
        <div className="px-5 pb-3">
          <button
            onClick={handleCheckIn}
            disabled={alreadyCheckedIn || isLoading || isFetching}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              alreadyCheckedIn
                ? "bg-white/5 border border-white/10 text-white/40 cursor-default"
                : "bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(131,58,253,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            }`}
          >
            {isFetching
              ? "Loading..."
              : isLoading
                ? "Checking in..."
                : alreadyCheckedIn
                  ? "Checked In"
                  : "Check In  (+20 XP)"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
