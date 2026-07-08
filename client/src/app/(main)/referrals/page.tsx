"use client";

import { useEffect, useState } from "react";
import { apiRequestV2, getStoredAccessToken } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { url } from "@/lib/constants";
import AnimatedBackground from "@/components/AnimatedBackground";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  Copy, 
  Share2, 
  ChevronRight, 
  HelpCircle,
  Trophy,
  Info
} from "lucide-react";

type Referral = {
  username: string;
  signedUp: string;
  status: "Active" | "Inactive";
};

type LeaderboardEntry = {
  username: string;
  totalReferrals: number;
  activeReferrals: number;
  xpEarned: number;
  profilePic?: string;
};

const MILESTONES = [
  { tier: 1, target: 10, reward: 2000, label: "Milestone 1" },
  { tier: 2, target: 20, reward: 3000, label: "Milestone 2" },
  { tier: 3, target: 30, reward: 5000, label: "Milestone 3" },
];
const TOTAL_XP = 10000;

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [claimedTier, setClaimedTier] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<Referral[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!getStoredAccessToken()) return; // not signed in — skip fetch instead of throwing 401
    
    // Fetch Referral Info
    (async () => {
      try {
        const { usersReferred } = await apiRequestV2("GET", "/api/user/referral-info");
        const active = usersReferred.filter((u: { status: string }) => u.status === "Active").length;
        setReferralData(usersReferred);
        setTotalReferrals(usersReferred.length);
        setActiveUsers(active);
      } catch (err) {
        console.error("Failed to fetch referral info:", err);
      }
    })();

    // Fetch Leaderboard
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

  useEffect(() => {
    if (user?.tier != null) setClaimedTier(user.tier);
  }, [user]);
 
  const referralLink = user?.referral?.code
    ? `${url}/ref/${user.referral.code}`
    : "";
 
  const allTiersClaimed = claimedTier >= 3;
  const milestone = MILESTONES[Math.min(claimedTier, MILESTONES.length - 1)];
  const prevTarget = claimedTier > 0 ? MILESTONES[claimedTier - 1].target : 0;
  const progressInMilestone = allTiersClaimed ? 10 : Math.min(Math.max(activeUsers - prevTarget, 0), 10);
  const progressPercent = (progressInMilestone / 10) * 100;
  const xpEarned = MILESTONES.slice(0, claimedTier).reduce((sum, m) => sum + m.reward, 0);
  const canClaimCurrent = !allTiersClaimed && activeUsers >= milestone.target;
 
  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };
 
  const handleShareX = () => {
    if (!referralLink) return;
    const text = encodeURIComponent(
      `Entering a new ecosystem comes with little clarity on where to begin or how to participate meaningfully.\n\n@NexuraXYZ changes that. It helps users discover, understand, and contribute meaningfully on @0xIntuition while learning about Web3.\n\nJoin here 👇\n${referralLink}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleClaim = async () => {
    const nextTier = claimedTier + 1;
    try {
      await apiRequestV2("POST", "/api/user/claim-referral-reward", { tier: nextTier });
      setClaimedTier(nextTier);
      toast({ title: "Success", description: `Milestone ${nextTier} reward claimed! +${MILESTONES[claimedTier].reward.toLocaleString()} XP.` });
    } catch (error: unknown) {
      console.error("[ACTION] handleClaim ✗", error);
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  /* ── helper: rank badge gradient ── */
  const rankGradient = (rank: number) => {
    if (rank === 1) return "radial-gradient(circle, rgba(245,189,70,1) 0%, rgba(160,42,36,1) 100%)";
    if (rank === 2) return "radial-gradient(circle, rgba(236,235,236,1) 0%, rgba(64,67,67,1) 100%)";
    if (rank === 3) return "radial-gradient(circle, rgba(215,82,44,1) 0%, rgba(142,66,35,1) 100%)";
    return "radial-gradient(circle, rgba(60,60,80,1) 0%, rgba(30,30,50,1) 100%)";
  };

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

        {/* ─── SECTION 1: STAT CARDS ─── */}
        <div className="rounded-[40px] px-[27px] py-[30px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
            {/* Total Referrals */}
            <div className="rounded-[26px] p-5 flex items-center justify-between min-h-[98px] border border-[#00E1A2]/30 bg-[#00E1A2]/10 backdrop-blur-md">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "rgba(163,173,194,1)" }}>Total Referrals</p>
                <p className="text-[24px] font-semibold text-white mt-1">{totalReferrals}</p>
              </div>
              <div className="opacity-80">
                <img src="/referral-icons/referral-icon.png" alt="Total Referrals" className="w-10 h-10 object-contain" />
              </div>
            </div>
            {/* Active Referrals */}
            <div className="rounded-[26px] p-5 flex items-center justify-between min-h-[98px] border border-[#00E1A2]/30 bg-[#00E1A2]/10 backdrop-blur-md">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "rgba(163,173,194,1)" }}>Active Referrals</p>
                <p className="text-[24px] font-semibold text-white mt-1">{activeUsers}</p>
              </div>
              <div className="opacity-80">
                <img src="/referral-icons/active-icon.png" alt="Active Referrals" className="w-10 h-10 object-contain" />
              </div>
            </div>
            {/* Pending Referrals */}
            <div className="rounded-[26px] p-5 flex items-center justify-between min-h-[98px] border border-[#00E1A2]/30 bg-[#00E1A2]/10 backdrop-blur-md">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "rgba(163,173,194,1)" }}>Pending Referrals</p>
                <p className="text-[24px] font-semibold text-white mt-1">{totalReferrals - activeUsers}</p>
              </div>
              <div className="opacity-80">
                <img src="/referral-icons/active-icon.png" alt="Pending Referrals" className="w-10 h-10 object-contain opacity-50" />
              </div>
            </div>
            {/* XP Earned */}
            <div className="rounded-[26px] p-5 flex items-center justify-between min-h-[98px] border border-[#00E1A2]/30 bg-[#00E1A2]/10 backdrop-blur-md">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "rgba(163,173,194,1)" }}>XP Earned</p>
                <p className="text-[24px] font-semibold text-white mt-1">{xpEarned.toLocaleString()}</p>
              </div>
              <div className="opacity-80">
                <img src="/referral-icons/xp-icon.png" alt="XP Earned" className="w-10 h-10 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: REFERRAL JOURNEY ─── */}
        <div className="rounded-[40px] px-[30px] py-[30px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl">
          <div className="mb-5">
            <h3 className="text-[20px] font-semibold" style={{ color: "rgba(240,238,255,1)" }}>Referral Journey</h3>
            <p className="text-[14px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>The path from invite to rewards</p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 relative px-3 py-2">
            {[
              { icon: <img src="/referral-icons/referral-icon.png" alt="Invite Friend" className="w-6 h-6 object-contain" />, title: "Invite Friend", desc: "Share your unique link or code" },
              { icon: <img src="/referral-icons/registration-icon.png" alt="Friend Registers" className="w-6 h-6 object-contain" />, title: "Friend Registers", desc: "They sign up using your link" },
              { icon: <img src="/referral-icons/quest-icon.png" alt="First Quest" className="w-6 h-6 object-contain" />, title: "First Quest", desc: "Friend completes first quest" },
              { icon: <img src="/referral-icons/activate-icon.png" alt="Activated" className="w-6 h-6 object-contain" />, title: "Activated", desc: "Referral status turns Active" },
              { icon: <img src="/referral-icons/reward-icon.png" alt="Rewards Earned" className="w-6 h-6 object-contain" />, title: "Rewards Earned", desc: "Both users receive full rewards" },
            ].map((step, i, arr) => (
              <div key={i} className="flex md:flex-1 items-center md:items-center gap-4 md:gap-0 md:flex-col md:text-center w-full relative z-10">
                <div className="flex items-center md:justify-center w-full relative">
                  {/* Connector line (desktop only) */}
                  {i < arr.length - 1 && (
                    <div className="hidden md:block absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-[27px] h-[2px] z-0"
                      style={{ background: "linear-gradient(90deg, rgba(139,62,254,1) 0%, rgba(255,255,255,0.07) 100%)" }} />
                  )}
                  {/* Icon circle */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: "rgba(139,62,254,0.15)", border: "1px solid rgba(139,62,254,0.3)" }}>
                    <div className="flex items-center justify-center w-6 h-6">{step.icon}</div>
                  </div>
                </div>
                <div className="md:mt-3">
                  <h4 className="text-[12px] font-bold" style={{ color: "rgba(240,238,255,1)" }}>{step.title}</h4>
                  <p className="text-[11px] font-normal mt-0.5" style={{ color: "rgba(163,173,194,1)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SECTION 3: SHARE & MILESTONES (vertical stacked design) ─── */}
        <div className="rounded-[40px] px-[30px] py-[30px] space-y-6 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl">
          {/* Share Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[20px] font-semibold text-white">Share your referral link</h3>
              <p className="text-[14px] font-normal mt-2" style={{ color: "rgba(163,173,194,1)" }}>
                You can share your referral link by copying and sending it or sharing it on your social media
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Referral link bar */}
              <div className="flex-1 rounded-[26px] px-5 h-[42px] flex items-center w-full"
                style={{ background: "rgba(139,62,254,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span className="text-[16px] font-semibold text-white truncate">
                  {referralLink || "Connect wallet to view your referral link"}
                </span>
              </div>
 
              {/* Action buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleCopy}
                  disabled={!referralLink}
                  className={`rounded-[27px] px-6 h-[42px] text-[16px] font-bold text-white transition-all flex items-center gap-2 border border-[rgba(255,255,255,0.12)] ${
                    referralLink ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "rgba(139,62,254,1)" }}>
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Link"}
                </button>
 
                {/* Discord */}
                <button
                  disabled={!referralLink}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-[rgba(255,255,255,0.12)] ${
                    referralLink ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "rgba(139,62,254,0.2)" }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </button>
 
                {/* Telegram */}
                <button
                  disabled={!referralLink}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-[rgba(255,255,255,0.12)] ${
                    referralLink ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "rgba(139,62,254,0.2)" }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </button>
 
                {/* X (Twitter) */}
                <button
                  onClick={handleShareX}
                  disabled={!referralLink}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-[rgba(255,255,255,0.12)] ${
                    referralLink ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{ background: "rgba(139,62,254,0.2)" }}>
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full" style={{ background: "rgba(139,62,254,0.19)" }} />

          {/* Milestone Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[18px] font-semibold text-white">Milestone Progress</h3>
              {/* Count badge */}
              <div className="rounded-[40px] px-3 py-0.5 text-[14px] font-semibold border border-[rgba(255,255,255,0.1)]"
                style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>
                {progressInMilestone}/10
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-medium" style={{ color: "rgba(163,173,194,1)" }}>
                  {allTiersClaimed ? "All rewards claimed!" : `Next Reward: ${milestone.reward.toLocaleString()} XP`}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full rounded-full h-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, background: "rgba(138,63,252,1)" }}
                />
              </div>
            </div>

            {/* Claim button & explanation */}
            <div className="flex flex-col items-center gap-4 pt-2">
              <button
                onClick={handleClaim}
                disabled={!canClaimCurrent}
                className="rounded-[33px] w-[439px] h-[42px] text-[14px] font-bold text-white transition-all shrink-0 border flex items-center justify-center"
                style={{
                  background: canClaimCurrent ? "rgba(138,63,252,0.2)" : "rgba(255,255,255,0.02)",
                  borderColor: canClaimCurrent ? "rgba(138,63,252,1)" : "rgba(255,255,255,0.08)",
                  color: canClaimCurrent ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.3)",
                  cursor: canClaimCurrent ? "pointer" : "not-allowed",
                }}>
                {allTiersClaimed ? "All Claimed" : "Claim Reward"}
              </button>
              <p className="text-[12px] font-normal" style={{ color: "rgba(107,100,128,1)" }}>
                {allTiersClaimed
                  ? "You have completed all milestone referrals!"
                  : `Refer ${milestone.target - activeUsers > 0 ? milestone.target - activeUsers : 0} more active friends to unlock`}
              </p>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: REFERRAL HISTORY ─── */}
        <div className="rounded-[40px] px-[30px] py-[30px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-[20px] font-semibold text-white">Referral History</h3>
              <p className="text-[12px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>
                {totalReferrals} referrals · {activeUsers} active · {totalReferrals - activeUsers} inactive
              </p>
            </div>
            {referralData.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[12px] font-bold hover:underline"
                style={{ color: "rgba(139,62,254,1)" }}>
                {showAll ? "Show Less" : "View All"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)", height: "34px" }}>
                  <th className="py-2 px-4 text-[14px] font-bold" style={{ color: "rgba(163,173,194,1)" }}>User</th>
                  <th className="py-2 px-4 text-center text-[14px] font-bold" style={{ color: "rgba(163,173,194,1)" }}>Joined</th>
                  <th className="py-2 px-4 text-right text-[14px] font-bold" style={{ color: "rgba(163,173,194,1)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {referralData.length > 0 ? (
                  (showAll ? referralData : referralData.slice(0, 5)).map((ref) => (
                    <tr key={ref.username} className="border-b" style={{ borderColor: "rgba(255,255,255,0.04)", height: "60px" }}>
                      <td className="py-2 px-4 flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
                          <AvatarFallback className="bg-purple-600/30 text-purple-200 text-xs rounded-full flex items-center justify-center w-full h-full">
                            {ref.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-white text-[14px]">{ref.username}</span>
                      </td>
                      <td className="py-2 px-4 text-center text-[12px]" style={{ color: "rgba(163,173,194,1)" }}>
                        {ref.signedUp}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[20px] text-[11px] font-bold uppercase"
                           style={{
                             background: ref.status === "Active" ? "rgba(34,211,164,0.12)" : "rgba(255,146,138,0.12)",
                             color: ref.status === "Active" ? "rgba(0,225,162,1)" : "rgba(255,146,138,1)",
                           }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: ref.status === "Active" ? "rgba(0,225,162,1)" : "rgba(255,146,138,1)" }} />
                          {ref.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[14px]" style={{ color: "rgba(163,173,194,1)" }}>
                      No referrals yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── SECTION 5: RULES & REQUIREMENTS (stacked vertically) ─── */}
        <div className="rounded-[40px] px-[30px] py-[30px] space-y-[30px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl">
          <div>
            <h3 className="text-[22px] font-semibold" style={{ color: "rgba(240,238,255,1)" }}>Rules &amp; Requirements</h3>
            <p className="text-[12px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>How the referral system works</p>
          </div>
          <div className="space-y-[14px]">
            {/* Rule 1 */}
            <div className="rounded-[40px] px-[25px] py-[15px] flex items-center gap-3 min-h-[74px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
              <Info className="w-5 h-5 shrink-0" style={{ color: "rgba(139,62,254,1)" }} />
              <div>
                <h4 className="text-[14px] font-semibold" style={{ color: "rgba(240,238,255,1)" }}>Quest activation required</h4>
                <p className="text-[12px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>
                  A referral only becomes Active after your friend completes their first quest or campaign on Nexura. Pending referrals do not count toward milestones.
                </p>
              </div>
            </div>
            {/* Rule 2 */}
            <div className="rounded-[40px] px-[25px] py-[15px] flex items-center gap-3 min-h-[74px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
              <Info className="w-5 h-5 shrink-0" style={{ color: "rgba(139,62,254,1)" }} />
              <div>
                <h4 className="text-[14px] font-semibold" style={{ color: "rgba(240,238,255,1)" }}>Reward eligibility</h4>
                <p className="text-[12px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>
                  Milestone rewards are claimable immediately once the threshold is reached. XP is credited instantly to your account.
                </p>
              </div>
            </div>
            {/* Rule 3 */}
            <div className="rounded-[40px] px-[25px] py-[15px] flex items-center gap-3 min-h-[74px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-md">
              <Info className="w-5 h-5 shrink-0" style={{ color: "rgba(139,62,254,1)" }} />
              <div>
                <h4 className="text-[14px] font-semibold" style={{ color: "rgba(240,238,255,1)" }}>10 referral maximum</h4>
                <p className="text-[12px] font-normal mt-1" style={{ color: "rgba(163,173,194,1)" }}>
                  You can refer up to 10 people total. Only active referrals qualify for XP rewards. Choose your invites wisely.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 6: REFERRAL LEADERBOARD (no outer card) ─── */}
        <div className="space-y-5 pb-[40px]">
          <h3 className="text-[20px] font-semibold text-white">Referral Leaderboard</h3>

          {/* Table headers wrapper */}
          <div className="space-y-2">
            {/* Column headers - Desktop only */}
            <div className="hidden sm:grid grid-cols-[40px_2fr_1fr_1fr_1fr_1.2fr] gap-2 font-bold text-[#FFFFFF99] text-sm px-1 mb-2">
              <div className="ml-5">RANK</div>
              <div className="ml-10">USER</div>
              <div className="text-center">TOTAL REFERRALS</div>
              <div className="text-center">ACTIVE REFERRALS</div>
              <div className="text-center">INACTIVE REFERRALS</div>
              <div className="flex items-center justify-center gap-1">
                <span>XP</span>
                <img src="/nexura-xp.png" alt="XP" className="w-5 h-5 shrink-0" />
              </div>
            </div>

            {/* Column headers - Mobile only */}
            <div className="grid sm:hidden grid-cols-[42px_minmax(0,1fr)_48px] items-center px-3 mb-2 text-[10px] font-bold text-[#FFFFFF99]">
              <div className="text-left">RANK</div>
              <div className="truncate pl-1 text-left">USER</div>
              <div className="flex items-center justify-end gap-[2px] text-right">
                <span>XP</span>
                <img src="/nexura-xp.png" alt="XP" className="w-3 h-3 shrink-0" />
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
