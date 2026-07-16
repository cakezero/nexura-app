"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequestV2, getStoredAccessToken } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import AnimatedBackground from "@/components/AnimatedBackground";


type LeaderboardEntry = {
  username: string;
  totalReferrals: number;
  activeReferrals: number;
  xpEarned: number;
  profilePic?: string;
};


export default function ReferralLeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) return;

    (async () => {
      try {
        const res = await apiRequestV2("GET", "/api/referral-leaderboard");
        if (res && res.referralLeaderboardInfo) {
          setLeaderboardData(res.referralLeaderboardInfo);
        }
      } catch (err) {
        console.error("Failed to fetch referral leaderboard:", err);
      }
    })();
  }, []);


  return (
    <div className="min-h-screen w-full bg-transparent text-white relative overflow-hidden font-geist">
      <AnimatedBackground />

      {/* Ambient purple glow overlays */}
      <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full pointer-events-none opacity-30 blur-[180px]"
        style={{ background: "radial-gradient(circle, rgba(139,62,254,0.5) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[150px]"
        style={{ background: "radial-gradient(circle, rgba(139,62,254,0.4) 0%, transparent 70%)" }} />

      <div className="w-full max-w-[1282px] mx-auto px-6 md:px-0 py-10 space-y-[30px] relative z-10">

        {/* ─── HEADER ─── */}
        <div className="space-y-3 pb-[10px]">
          {/* Purple badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(139,62,254,0.12)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, rgba(174,89,209,1), rgba(89,45,107,1))" }} />
            <span className="text-xs font-semibold tracking-wide uppercase"
              style={{
                background: "linear-gradient(90deg, rgba(177,132,196,1), rgba(255,139,216,1))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Referrals
            </span>
          </div>

          <h1 className="text-[35px] font-semibold text-white leading-tight">
            Referrals
          </h1>
          <p className="text-[14px] font-normal" style={{ color: "rgba(163,173,194,1)" }}>
            Climb the leaderboard, complete milestones, and earn rewards with every successful referral.
          </p>
        </div>

        {/* ─── VIEW TOGGLE ─── */}
        <div
          className="inline-flex items-center rounded-full"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "3px",
            gap: "2px",
          }}
        >
          {/* Overview — inactive */}
          <button
            onClick={() => router.push("/referrals")}
            className="rounded-full transition-all duration-200 cursor-pointer"
            style={{
              padding: "8px 20px",
              background: "transparent",
              border: "none",
            }}
          >
            <span
              className="text-[14px] font-semibold"
              style={{
                fontFamily: "Geist, sans-serif",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Overview
            </span>
          </button>

          {/* Leaderboard — active */}
          <button
            className="rounded-full transition-all duration-200"
            style={{
              padding: "8px 20px",
              background: "rgba(139,62,254,1)",
              border: "none",
              boxShadow: "0 2px 8px rgba(139,62,254,0.4)",
            }}
          >
            <span
              className="text-[14px] font-semibold"
              style={{
                fontFamily: "Geist, sans-serif",
                color: "rgba(255,255,255,1)",
              }}
            >
              Leaderboard
            </span>
          </button>
        </div>

        {/* ─── REFERRAL LEADERBOARD ─── */}
        <div className="space-y-5 pb-[40px]">
          <h3 className="text-[20px] font-semibold text-white">Referral Leaderboard</h3>

          {/* Table headers wrapper */}
          <div 
            className="rounded-2xl p-[1px] mb-2"
            style={{
              background: "linear-gradient(to right, rgba(255,105,180,0.35), rgba(139,62,254,0.35), rgba(0,225,162,0.35), rgba(52,152,219,0.35), rgba(255,180,0,0.35), rgba(255,95,109,0.35))"
            }}
          >
            <div className="rounded-[calc(1rem-1px)] bg-black p-1 sm:p-2">
              {/* Column headers - Desktop only */}
              <div className="hidden sm:grid grid-cols-[40px_2fr_1fr_1fr_1fr_1.2fr] gap-2 font-bold text-[#FFFFFF99] text-xs px-2 py-1.5">
              <div className="ml-5">RANK</div>
              <div className="ml-10">USER</div>
              <div className="text-center">TOTAL REFERRALS</div>
              <div className="text-center">ACTIVE REFERRALS</div>
              <div className="text-center">INACTIVE REFERRALS</div>
              <div className="flex items-center justify-center gap-1">
                <span>XP</span>
                <img src="/nexura-xp.png" alt="XP" className="w-4 h-4 shrink-0" />
              </div>
            </div>

            {/* Column headers - Mobile only */}
            <div className="grid sm:hidden grid-cols-[42px_minmax(0,1fr)_48px] items-center px-2 py-1 text-[10px] font-bold text-[#FFFFFF99]">
              <div className="text-left">RANK</div>
              <div className="truncate pl-1 text-left">USER</div>
              <div className="flex items-center justify-end gap-[2px] text-right">
                <span>XP</span>
                <img src="/nexura-xp.png" alt="XP" className="w-3 h-3 shrink-0" />
              </div>
            </div>
          </div>
        </div>

          {/* Leaderboard rows */}
          <div className="space-y-2">
            {leaderboardData.length > 0 ? (
              leaderboardData.map((item, idx) => {
                const rank = idx + 1;
                const isCurrentUser = user && item.username === user.username;
                const inactiveCount = item.totalReferrals - item.activeReferrals;

                let rankBg = "";
                if (rank === 1) rankBg = "bg-yellow-400 text-white border border-white";
                else if (rank === 2) rankBg = "bg-gray-300 text-white border border-white";
                else if (rank === 3) rankBg = "bg-orange-400 text-white border border-white";

                const borderColors = ["#FF69B4", "#8B3EFE", "#00E1A2", "#3498DB", "#FFB400", "#FF5F6D"];
                const borderColor = borderColors[idx % borderColors.length];

                return (
                  <Card
                    key={item.username}
                    className="relative w-full rounded-2xl hover:brightness-110 overflow-hidden"
                    style={{
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: borderColor,
                      borderRadius: "1rem",
                      boxShadow: isCurrentUser
                        ? "0 0 10px #f5c54266, 0 0 12px #f5c54244"
                        : "0 0 6px rgba(255,255,255,0.1)",
                      background: isCurrentUser
                        ? "linear-gradient(to right, rgba(245,197,66,0.06), rgba(0,0,0,0.2))"
                        : "linear-gradient(to right, rgba(255,255,255,0.02), rgba(0,0,0,0.1))",
                    }}
                  >
                    {/* -------------------- Desktop Layout -------------------- */}
                    <div className="hidden sm:grid grid-cols-[40px_2fr_1fr_1fr_1fr_1.2fr] items-center gap-2 p-1">
                      {/* RANK */}
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${rankBg}`}>
                        {rank <= 3 ? `#${rank}` : rank}
                      </div>

                      {/* USER */}
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="w-10 h-10 rounded-full overflow-hidden">
                          <AvatarImage
                            src={
                              item.profilePic ||
                              `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(item.username)}`
                            }
                            className="w-full h-full object-cover rounded-full"
                          />
                          <AvatarFallback className="bg-white/10 text-white font-bold">
                            {item.username ? item.username[0].toUpperCase() : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-white font-semibold">{item.username}</span>
                      </div>

                      {/* TOTAL REFERRALS */}
                      <div className="flex flex-col items-center text-center">
                        <span className="font-bold text-white">{item.totalReferrals}</span>
                        <span className="text-[#8B3EFEE5] bg-[#8B3EFE33] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0">REFERRED</span>
                      </div>

                      {/* ACTIVE REFERRALS */}
                      <div className="flex flex-col items-center text-center">
                        <span className="font-bold text-white">{item.activeReferrals}</span>
                        <span className="text-[#00E1A2E5] bg-[#00E1A233] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0">ACTIVE</span>
                      </div>

                      {/* INACTIVE REFERRALS */}
                      <div className="flex flex-col items-center text-center">
                        <span className="font-bold text-white">{inactiveCount}</span>
                        <span className="text-[#FF928Ae5] bg-[#FF928A33] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0">INACTIVE</span>
                      </div>

                      {/* XP */}
                      <div className="flex items-center justify-center h-full">
                        <span className="font-bold text-white text-xl">{(item.xpEarned ?? 0).toLocaleString()}</span>
                        <img src="/nexura-xp.png" alt="XP" className="w-5 h-5 ml-1" />
                      </div>
                    </div>

                    {/* -------------------- Mobile Layout -------------------- */}
                    <div className="sm:hidden flex items-center gap-1.5 p-2 min-w-0">
                      {/* Rank */}
                      <div className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${rankBg}`}>
                        {rank <= 3 ? `#${rank}` : rank}
                      </div>

                      {/* Avatar */}
                      <Avatar className="shrink-0 w-6 h-6 rounded-full overflow-hidden">
                        <AvatarImage
                          src={
                            item.profilePic ||
                            `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(item.username)}`
                          }
                          className="w-full h-full object-cover rounded-full"
                        />
                        <AvatarFallback className="bg-white/10 text-white font-bold text-xs">
                          {item.username ? item.username[0].toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name + badges */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
                        <span className="truncate text-xs font-semibold leading-none text-white">
                          {item.username}
                        </span>

                        <div className="flex items-center gap-[4px] overflow-x-auto whitespace-nowrap pr-1 scrollbar-hide">
                          <div className="flex items-center gap-[1px]">
                            <span className="text-[8px] font-bold text-white">{item.totalReferrals}</span>
                            <div className="shrink-0 flex items-center rounded-2xl bg-[#8B3EFE33] px-[4px] py-[4px]">
                              <span className="text-[6px] font-medium text-[#8B3EFEE5] leading-none">REFERRED</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-[1px]">
                            <span className="text-[8px] font-bold text-white">{item.activeReferrals}</span>
                            <div className="shrink-0 flex items-center rounded-2xl bg-[#00E1A233] px-[4px] py-[4px]">
                              <span className="text-[6px] font-medium text-[#00E1A2E5] leading-none">ACTIVE</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-[1px]">
                            <span className="text-[8px] font-bold text-white">{inactiveCount}</span>
                            <div className="shrink-0 flex items-center rounded-2xl bg-[#FF928A33] px-[4px] py-[4px]">
                              <span className="text-[6px] font-medium text-[#FF928Ae5] leading-none">INACTIVE</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="shrink-0 flex items-center gap-[2px]">
                        <span className="text-[10px] font-bold text-white">
                          {(item.xpEarned ?? 0).toLocaleString()}
                        </span>
                        <img src="/nexura-xp.png" alt="XP" className="w-3 h-3 shrink-0" />
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="rounded-[40px] px-6 py-10 text-center text-[14px]"
                style={{ background: "rgba(255,255,255,0.03)", color: "rgba(107,100,128,1)" }}>
                No leaderboard entries yet
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
