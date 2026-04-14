"use client";

import { useEffect, useState } from "react";
import { apiRequestV2 } from "../lib/queryClient";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from "../lib/auth";
import { useToast } from "../hooks/use-toast";
import { url } from "../lib/constants";
import { claimReferralReward } from "../lib/performOnchainAction";
import AnimatedBackground from "../components/AnimatedBackground";

type Referral = {
  username: string;
  signedUp: string;
  status: "Active" | "Inactive";
};

const MILESTONES = [
  { tier: 1, target: 10, reward: 1500, label: "Milestone 1" },
  { tier: 2, target: 20, reward: 2000, label: "Milestone 2" },
  { tier: 3, target: 30, reward: 2500, label: "Milestone 3" },
];
const TOTAL_XP = 6000;
const MAX_REFERRALS = 30;

export default function ReferralsPage() {
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<Referral[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    (async () => {
      const { usersReferred, refRewardClaimed } = await apiRequestV2("GET", "/api/user/referral-info");
      const active = usersReferred.filter((u: { status: string }) => u.status === "Active").length;
      setReferralData(usersReferred);
      setRewardClaimed(refRewardClaimed);
      setTotalReferrals(usersReferred.length);
      setActiveUsers(active);
    })();
  }, []);

  const referralLink = `${url}/ref/${user ? user.referral.code : "referral-noobmaster"}`;

  const currentMilestoneIdx = MILESTONES.findIndex(m => activeUsers < m.target);
  const allMilestonesComplete = currentMilestoneIdx === -1;
  const milestone = allMilestonesComplete ? MILESTONES[MILESTONES.length - 1] : MILESTONES[currentMilestoneIdx];
  const prevTarget = currentMilestoneIdx > 0 ? MILESTONES[currentMilestoneIdx - 1].target : 0;
  const progressInMilestone = allMilestonesComplete ? 10 : Math.min(activeUsers - prevTarget, 10);
  const progressPercent = (progressInMilestone / 10) * 100;
  const xpEarned = MILESTONES.reduce((sum, m) => activeUsers >= m.target ? sum + m.reward : sum, 0);
  const canClaimCurrent = !allMilestonesComplete && activeUsers >= milestone.target;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareX = () => {
    const text = encodeURIComponent(`Join me on Nexura! ${referralLink}`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleClaim = async () => {
    try {
      await claimReferralReward(user?._id || "");
      await apiRequestV2("POST", "/api/user/claim-referral-reward");
      setRewardClaimed(true);
      toast({ title: "Success", description: "Referral Reward Claimed" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const displayedReferrals = showAll ? referralData : referralData.slice(0, 7);

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-x-hidden">
      <AnimatedBackground />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10">

        {/* HEADER */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">Referrals</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Referrals
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Invite your friends to Nexura and you can earn up to {TOTAL_XP.toLocaleString()} XP
          </p>
        </div>

        {/* 3 STEPS */}
        <div className="flex flex-col sm:flex-row justify-between relative items-start">
          {/* Arc connectors */}
          <img
            src="/referral-icons/arc-right.png"
            alt=""
            className="absolute hidden sm:block pointer-events-none"
            style={{ top: 22, left: '19%', width: '17%', transform: 'scaleX(-1)' }}
          />
          <img
            src="/referral-icons/arc-left.png"
            alt=""
            className="absolute hidden sm:block pointer-events-none"
            style={{ top: 22, left: '57%', width: '17%', transform: 'rotate(180deg)' }}
          />

          {/* Step 1: Send an invitation */}
          <div className="flex flex-col items-center w-full sm:w-[207px] gap-5">
            <div className="w-[100px] h-[100px] rounded-full bg-[#0d0719] flex items-center justify-center overflow-hidden shrink-0">
              <img src="/referral-icons/referral-icon.png" alt="" className="w-[60px] h-[60px] object-cover" />
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <p className="text-[24px] font-semibold text-white/70 leading-[18.2px]">Send an invitation</p>
              <p className="text-[14px] font-normal text-[#a3adc2] text-center leading-[23px]">
                Send your referral link to friends and tell them how cool Nexura is!
              </p>
            </div>
          </div>

          {/* Step 2: Registration */}
          <div className="flex flex-col items-center w-full sm:w-[207px] gap-[17px] mt-6 sm:mt-0">
            <div className="w-[100px] h-[100px] rounded-full bg-[#0d0719] flex items-center justify-center overflow-hidden shrink-0">
              <img src="/referral-icons/registration-icon.png" alt="" className="w-[60px] h-[60px] object-cover" />
            </div>
            <div className="flex flex-col items-center gap-5 w-full">
              <p className="text-[24px] font-semibold text-white/70 leading-[18.2px]">Registration</p>
              <p className="text-[14px] font-normal text-[#a3adc2] text-center leading-[23px]">
                Let them register to our platform using your referral link.
              </p>
            </div>
          </div>

          {/* Step 3: Earn */}
          <div className="flex flex-col items-center w-full sm:w-[207px] gap-4 mt-6 sm:mt-0">
            <div className="w-[100px] h-[100px] rounded-full bg-[#0d0719] flex items-center justify-center overflow-hidden shrink-0">
              <img src="/referral-icons/reward-icon.png" alt="" className="w-[60px] h-[60px] object-cover" />
            </div>
            <div className="flex flex-col items-center justify-between w-full">
              <p className="text-[24px] font-semibold text-white/70 leading-[18.2px]">Earn</p>
              <p className="text-[14px] font-normal text-[#a3adc2] text-center leading-[23px] mt-5">
                You can earn up to {TOTAL_XP.toLocaleString()} XP referring your friends after they complete a Quest or Campaign
              </p>
            </div>
          </div>
        </div>

        {/* SHARE REFERRAL LINK */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="whitespace-nowrap text-lg sm:text-2xl font-semibold text-white">
              Share your referral link
            </h2>
            <div className="h-[1px] flex-1 bg-[#FFFFFF33]" />
          </div>
          <p className="text-sm text-white/50 leading-relaxed">
            You can share your referral link by copying and sending it or sharing it on your social media
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-between glass rounded-2xl h-[57px] flex-1 px-[27px]">
              <span className="text-[14px] font-semibold text-white/60 truncate">
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="text-[16px] font-bold text-[#8a3ffc] shrink-0 ml-4 hover:opacity-80 transition-opacity"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <button
              onClick={handleShareX}
              className="w-[57px] h-[57px] rounded-full glass flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Total Referrals */}
          <div className="glass glass-hover rounded-2xl h-[108px] flex-1 relative overflow-hidden">
            <p className="absolute left-[30px] top-[18px] text-[18px] font-medium text-[#a3adc2] leading-[23px]">
              Total Referrals
            </p>
            <p className="absolute left-[30px] top-[57px] text-[30px] font-medium text-white leading-[23px]">
              {totalReferrals}
            </p>
            <img
              src="/referral-icons/referral-icon.png"
              alt=""
              className="absolute top-1/2 -translate-y-1/2 w-[60px] h-[60px] object-cover right-[27px]"
            />
          </div>

          {/* Active */}
          <div className="glass glass-hover rounded-2xl h-[108px] flex-1 relative overflow-hidden">
            <p className="absolute left-[30px] top-[18px] text-[18px] font-medium text-[#a3adc2] leading-[23px]">
              Active
            </p>
            <p className="absolute left-[30px] top-[57px] text-[30px] font-medium text-white leading-[23px]">
              {activeUsers}
            </p>
            <img
              src="/referral-icons/active-icon.png"
              alt=""
              className="absolute top-1/2 -translate-y-1/2 w-[60px] h-[60px] object-cover right-[27px]"
            />
          </div>

          {/* XP Earned */}
          <div className="glass glass-hover rounded-2xl h-[108px] flex-1 relative overflow-hidden">
            <p className="absolute left-[30px] top-[18px] text-[18px] font-medium text-[#a3adc2] leading-[23px]">
              XP Earned
            </p>
            <p className="absolute left-[30px] top-[57px] text-[30px] font-medium text-white leading-[23px]">
              {xpEarned.toLocaleString()}
            </p>
            <img
              src="/nexura-xp.png"
              alt=""
              className="absolute top-1/2 -translate-y-1/2 w-[60px] h-[60px] object-contain right-[27px]"
            />
          </div>
        </div>

        {/* REFERRAL HISTORY */}
        <div className="glass rounded-2xl overflow-hidden w-full">
          <div className="flex items-center justify-between px-[23px] py-5">
            <h3 className="text-[20px] font-semibold text-white leading-[18.2px]">
              Referral History
            </h3>
            {referralData.length > 7 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-[20px] font-semibold text-[#8a3ffc] leading-[18.2px] hover:opacity-80 transition-opacity"
              >
                {showAll ? "Show less" : "View all"}
              </button>
            )}
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between px-[55px] py-[13px] bg-[#100923] border border-white/[0.16] text-[14px] font-semibold text-white/85 leading-[18.2px]">
            <span>User</span>
            <span>Signed Up</span>
            <span>Status</span>
          </div>

          {/* Table Rows */}
          {referralData.length > 0 ? (
            displayedReferrals.map(({ username, signedUp, status }) => (
              <div
                key={username}
                className="flex items-center justify-between bg-[#2a223d] border border-white/[0.2] h-[62px] px-[23px]"
              >
                <div className="flex items-center gap-[13px] min-w-[180px]">
                  <Avatar className="w-[34px] h-[34px] ring-1 ring-black rounded-full shrink-0">
                    <AvatarFallback className="bg-purple-800/60 text-purple-200 text-xs rounded-full">
                      {username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[18px] font-semibold text-white/85 leading-[18.2px]">
                    {username}
                  </span>
                </div>
                <span className="text-[18px] font-semibold text-white/85 leading-[18.2px]">
                  {signedUp}
                </span>
                <span className="text-[18px] font-semibold text-white/85 leading-[18.2px]">
                  {status}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-white/50 bg-[#2a223d]">
              No referrals yet
            </div>
          )}
        </div>

        {/* BOTTOM CARDS */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Milestone Progress */}
          <div className="glass glass-hover rounded-2xl h-[222px] flex-1 relative overflow-hidden">
            <h3 className="absolute left-[26px] top-[31px] text-[20px] font-semibold text-white leading-[18.2px]">
              Milestone Progress
            </h3>
            <p className="absolute left-[26px] top-[66px] text-[18px] font-medium text-[#a3adc2] leading-[23px]">
              {allMilestonesComplete ? (
                <span className="font-bold text-[#8a3ffc]">{TOTAL_XP.toLocaleString()} XP Earned</span>
              ) : (
                <>
                  Next Reward:{" "}
                  <span className="font-bold text-[#8a3ffc]">
                    +{milestone.reward.toLocaleString()} XP
                  </span>
                </>
              )}
            </p>
            <div className="absolute right-[27px] top-[63px] bg-white/20 rounded-[6px] w-[52px] h-[26px] flex items-center justify-center">
              <span className="text-[16px] font-semibold text-white/85 leading-[23px]">
                {progressInMilestone}/10
              </span>
            </div>
            <div className="absolute left-[26px] top-[95px] right-[23px] h-[20px] bg-white/[0.23] rounded-[6px] overflow-hidden">
              <div
                className="h-full bg-[#8a3ffc] rounded-r-[6px] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="absolute left-[26px] top-[125px] text-[14px] font-normal text-[#a3adc2] leading-[18px] right-[26px]">
              {allMilestonesComplete
                ? "You've completed all referral milestones. Thank you!"
                : `Refer ${10 - progressInMilestone} more friends who complete a quest or campaign to unlock remaining bonus`}
            </p>
            <button
              onClick={handleClaim}
              disabled={!canClaimCurrent || rewardClaimed}
              className="absolute left-1/2 -translate-x-1/2 top-[171px] border border-[#8a3ffc] rounded-[33px] w-[217px] h-[30px] text-[14px] font-bold text-white leading-[18px] hover:bg-[#8a3ffc]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allMilestonesComplete && rewardClaimed ? "All Claimed" : rewardClaimed ? "Claimed" : "Claim Reward"}
            </button>
          </div>

          {/* Important Rule */}
          <div className="glass glass-hover rounded-2xl h-[222px] flex-1 relative overflow-hidden">
            <div className="absolute left-[12px] top-[25px] flex items-center gap-[5px]">
              <img src="/referral-icons/info-icon.svg" alt="" className="w-[40px] h-[40px]" />
              <span className="text-[20px] font-semibold text-white leading-[18.2px]">
                Important Rule
              </span>
            </div>
            <p className="absolute left-[57px] top-[75px] text-[16px] font-medium text-[#a3adc2] leading-[23px] right-[20px]">
              Referrals only count as &ldquo;Active&rdquo; after they{" "}
              <span className="font-bold text-white/85">
                complete their first quest or campaign
              </span>{" "}
              on the platform
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
