"use client";

import { useEffect, useState } from "react";
import { apiRequestV2 } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { url } from "@/lib/constants";
import { claimReferralReward } from "@/lib/performOnchainAction";
import { InviteIcon, RegisterIcon, EarnIcon, UsersIcon, ActiveIcon, TrustIcon } from "@/svgs/icons";

type Referral = {
  username: string;
  dateJoined: string;
  status: "Active" | "Inactive";
};

const refReward = 16.2;
const rewardPerActiveUser = 1.62;

const dummyReferralData: Referral[] = [
  { username: "Madmoiselle", dateJoined: "Nov 4, 2025", status: "Inactive" },
  { username: "Shallipopi", dateJoined: "Nov 9, 2025", status: "Active" },
  { username: "Blacko", dateJoined: "Nov 15, 2025", status: "Active" },
  { username: "TFK", dateJoined: "Nov 25, 2025", status: "Active" },
  // { username: "Mardocee", dateJoined: "Nov 29, 2025", status: "Active" },
  // { username: "Ownyde", dateJoined: "Nov 29, 2025", status: "Active" },
  // { username: "Emperor", dateJoined: "Nov 29, 2025", status: "Inactive" }
];

export default function ReferralsPage() {
  // const [rewardClaimed, setRewardClaimed] = useState(false);
  const [stage1Claimed, setStage1Claimed] = useState(false);
const [stage2Claimed, setStage2Claimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [totalReferrerls, setTotalReferrals] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [trustEarned, setTrustEarned] = useState<string | number>("0");

  const { user } = useAuth();
  const [referralData, setReferralData] = useState<Referral[]>(dummyReferralData);

  useEffect(() => {
    (async () => {
      const ActiveUsers = usersReferred.filter(
        (u: { status: string }) => u.status === "Active"
      ).length;

      setReferralData(usersReferred);
     setTrustEarned("0");
      setTotalReferrals(usersReferred.length);
      setActiveUsers(ActiveUsers);
    })();
  }, []);

  const referralLink = `${url}/ref/${user ? user.referral.code : "referral-noobmaster"}`;

  const progressBar = Math.round(
    (parseFloat(trustEarned.toString()) / refReward) * 100
  );

  // ---------------- NEW MILESTONE LOGIC (ONLY CHANGE) ----------------
const STAGE_SIZE = 5;

const currentStage =
  activeUsers < 5 ? 1 :
  activeUsers < 10 ? 2 :
  2;


const stageProgress =
  currentStage === 1
    ? Math.min(activeUsers, 5)
    : Math.min(activeUsers - 5, 5);

const progressPercent = (stageProgress / 5) * 100;


  const rewardAmount = currentStage === 1 ? 5.4 : 10.8;

const canClaimStage1 =
  activeUsers >= 5 && !stage1Claimed;

const canClaimStage2 =
  activeUsers >= 10 && stage1Claimed && !stage2Claimed;

  // ------------------------------------------------------------------

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MILESTONE_REWARD = 5.4;

const milestonesReached = Math.floor(activeUsers / 5); // 0, 1, or 2
const milestonesClaimed =
  (stage1Claimed ? 1 : 0) + (stage2Claimed ? 1 : 0);

const milestonesClaimable = milestonesReached - milestonesClaimed;

// const claimableReward = milestonesClaimable * MILESTONE_REWARD;
const claimableReward =
  (!stage1Claimed && milestonesReached >= 1 ? 5.4 : 0) +
  (!stage2Claimed && milestonesReached >= 2 ? 10.8 : 0);


const canClaim = milestonesClaimable > 0;


const handleClaim = async () => {
  if (!canClaim) return;

  // Claim both milestones at once
  if (milestonesClaimable === 2) {
    setStage1Claimed(true);
    setStage2Claimed(true);
    setTrustEarned(prev =>
      (parseFloat(prev.toString()) + 16.2).toFixed(2)
    );
    return;
  }

  // Claim first milestone
  if (milestonesClaimable === 1 && !stage1Claimed) {
    setStage1Claimed(true);
    setTrustEarned(prev =>
      (parseFloat(prev.toString()) + 5.4).toFixed(2)
    );
    return;
  }

  // Claim second milestone only
  if (milestonesClaimable === 1 && stage1Claimed && !stage2Claimed) {
    setStage2Claimed(true);
    setTrustEarned(prev =>
      (parseFloat(prev.toString()) + 10.8).toFixed(2)
    );
  }
};


  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8 space-y-12 max-w-[1200px] mx-auto">

      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Referrals</h1>
        <p className="text-sm opacity-60 mt-1">
          Invite your friends to Nexura and earn up to 10.8 $TRUST
        </p>
      </div>

      {/* STEPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        {[
          { icon: InviteIcon, title: "Send an invitation", desc: "Send your referral links to friends and tell them how cool Nexura is!" },
          { icon: RegisterIcon, title: "Registration", desc: "Let them register to our platform using your referral links" },
          { icon: EarnIcon, title: "Earn", desc: `You can earn up to ${refReward} TRUST referring your friends after they complete a Quest or Campaign` }
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-purple-600/25 flex items-center justify-center">
              <Icon className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs opacity-60 max-w-[240px]">{desc}</p>
          </div>
        ))}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: UsersIcon, label: "Total Referrals", value: totalReferrerls },
          { icon: ActiveIcon, label: "Active", value: activeUsers },
          { icon: TrustIcon, label: "Trust Earned", value: trustEarned }
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between bg-white/5 rounded-2xl px-6 py-5">
            <div>
              <p className="text-sm opacity-60">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-purple-600/25 flex items-center justify-center">
              <Icon className="w-8 h-8 text-purple-300" />
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* HISTORY */}
        <Card className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl px-6 py-6">
          <p className="text-sm font-medium mb-4">Referral History</p>
          <div className="space-y-4">
            {referralData.map(({ username, dateJoined, status }) => (
              <div key={username} className="flex justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback>{username[0]}</AvatarFallback>
                  </Avatar>
                  <span>{username}</span>
                </div>
                <span className="opacity-60">{dateJoined}</span>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  status === "Active"
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : "opacity-40 border border-white/10"
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* MILESTONE WITH TEST BUTTONS */}
<Card className="bg-white/5 border border-white/10 rounded-2xl px-6 py-6 space-y-4">
  <p className="text-sm font-medium">Milestone {currentStage}</p>

  <p className="text-sm text-purple-400">Reward: +{rewardAmount} TRUST</p>

  {/* Test buttons to change active users */}
  <div className="flex items-center gap-2 mb-2">
    <Button
      onClick={() => setActiveUsers(prev => Math.max(prev - 1, 0))}
      className="px-2 py-1 text-xs"
    >
      -
    </Button>
    <span className="text-xs">
      Active referrals: {activeUsers} / 10
    </span>
    <Button
      onClick={() => setActiveUsers(prev => Math.min(prev + 1, 10))}
      className="px-2 py-1 text-xs"
    >
      +
    </Button>
  </div>

  {/* Progress bar */}
  <Progress value={progressPercent} />

  <p className="text-xs text-white/60">
    {currentStage === 1
      ? `${stageProgress} / 5 active referrals`
      : `${stageProgress} / 5 additional active referrals`}
  </p>

  <Button
    onClick={handleClaim}
// disabled={!(canClaimStage1 || canClaimStage2)}
disabled={!canClaim}
    className="w-full rounded-full bg-purple-600 text-sm disabled:opacity-60"
  >

    {canClaim
  ? `Claim ${claimableReward.toFixed(1)} TRUST`
  : stage2Claimed
    ? "Claimed"
    : "Locked"}

  </Button>
</Card>

        {/* IMPORTANT RULE */}
          <Card className="bg-white/5 border border-white/10 rounded-2xl px-6 py-6 space-y-3">
    <p className="text-sm font-medium">Important Rule</p>

    <p className="text-xs text-white/70">
      Referrals only count as <span className="text-white font-medium">“Active”</span> after they
      complete their <span className="text-white font-medium">first quest or campaign</span> on the platform.
    </p>

    <p className="text-xs text-white/70">
      You can refer up to <span className="text-white font-medium">10 people max</span>, and only
      <span className="text-white font-medium"> active referrals</span> qualify for rewards.
    </p>
  </Card>
      </div>
    </div>
  );
}
