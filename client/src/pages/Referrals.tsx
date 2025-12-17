import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequestV2, queryClient } from "@/lib/queryClient";
import { emitSessionChange } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";
import AnimatedBackground from "@/components/AnimatedBackground";
import type { ReferralStats } from "@shared/schema";

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const userId = user ? (user.id ?? user._id ?? user.userId ?? null) : null;
  const appUrl = (typeof window !== "undefined" && (window as any).__APP_URL__) || (typeof window !== "undefined" ? window.location.origin : "");

  const { data: referralStats, isLoading, error } = useQuery({
    queryKey: userId ? ['/api/referrals/stats', userId] : ['referrals', 'none'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiRequestV2("GET", `/api/user/referral-info`);
      return res;
    },
    retry: 1,
  });

  // fetch list of referral events (enriched with referred-user info when available)
  const { data: referralListData, isLoading: listLoading } = useQuery<any>({
    queryKey: userId ? ['/api/referrals/list', userId] : ['referrals-list', 'none'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return { events: [] };
      const res = await apiRequestV2('GET', `/api/referrals/list/${userId}`);
      return res;
    },
    retry: 1,
  });

  const totalReferrals = referralStats?.usersReferred.length ?? 0;

  // Note: Reward claiming functionality will be added later

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${appUrl}/${referralStats.referralCode}`);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link with friends",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Claim functionality will be added later

  // Calculate progress to next milestone
  const nextMilestone = !referralStats ? 3 : 
    totalReferrals >= 10 ? Math.ceil((totalReferrals + 1) / 10) * 10 : 
    (totalReferrals >= 3 ? 10 : 3);
  const progress = !referralStats ? 0 : (totalReferrals / nextMilestone) * 100;

  if (!userId) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-black text-white overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60">Please log in to view your referrals</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-black text-white overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-white/60">Loading referral data...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !referralStats) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-black text-white overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500">Unable to load referral data. {error?.message || 'Please try again.'}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Normalize referral link for display (server may return relative paths)
  const displayReferralLink = (() => {
    return `${appUrl}/${referralStats.referralCode}`;
  })();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white overflow-auto p-6 relative" data-testid="referrals-page">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">Referral Program</h1>
          <p className="text-white/60">
            Invite friends to Nexura and grow together
          </p>
        </div>

        {/* Referral Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass glass-hover rounded-3xl" data-testid="total-referrals">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <div className="text-2xl font-bold text-white">{totalReferrals}</div>
              </div>
              <p className="text-xs text-white/50 mt-1">Friends joined</p>
            </CardContent>
          </Card>

            {/* Referral List */}
            <Card className="glass glass-hover rounded-3xl" data-testid="referral-list">
              <CardHeader>
                <CardTitle className="text-white">Your Referrals</CardTitle>
                <p className="text-sm text-white/60">People who joined using your referral link</p>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <div className="text-white/60">Loading referred users...</div>
                ) : (
                  <div className="space-y-3">
                    {Array.isArray(referralListData?.events) && referralListData.events.length > 0 ? (
                      referralListData.events.map((ev: any) => (
                        <div key={ev.id} className="flex items-center gap-3 p-2 bg-white/2 rounded-lg">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center text-sm font-semibold text-white">
                            {ev.referredUser?.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={ev.referredUser.avatar} alt={ev.referredUser.displayName || ev.referredUser.username || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="uppercase">{(ev.referredUser?.displayName || ev.referredUser?.username || String(ev.referredUserId || '').slice(0,6) || 'U').charAt(0)}</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{ev.referredUser?.displayName || ev.referredUser?.username || ev.referredUserId}</div>
                            <div className="text-xs text-white/60">Joined: {new Date(ev.createdAt || ev.created_at || Date.now()).toLocaleString()}</div>
                          </div>
                          <div className="text-sm text-white/50">{ev.referredUser?.xp ? `${ev.referredUser.xp} XP` : ''}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-white/60">No referred users yet. Share your link above to invite friends.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          <Card className="glass glass-hover rounded-3xl" data-testid="active-referrals">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Active Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <div className="text-2xl font-bold text-white">{totalReferrals}</div>
              </div>
              <p className="text-xs text-white/50 mt-1">Friends joined</p>
            </CardContent>
          </Card>

          <Card className="glass glass-hover rounded-3xl" data-testid="coming-soon">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/60">Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-green-400" />
                <div className="text-2xl font-bold text-white">Coming Soon</div>
              </div>
              <p className="text-xs text-white/50 mt-1">Referral rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="glass glass-hover rounded-3xl" data-testid="referral-link-card">
          <CardHeader>
            <CardTitle className="text-white">Your Referral Link</CardTitle>
            <p className="text-sm text-white/60">
              Share this link with friends to start earning rewards
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                value={displayReferralLink} 
                readOnly 
                className="flex-1 glass border-white/10 text-white"
                data-testid="input-referral-link"
              />
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Progress */}
        <Card className="glass glass-hover rounded-3xl" data-testid="referral-progress">
          <CardHeader>
            <CardTitle className="text-white">Referral Progress</CardTitle>
            <p className="text-sm text-white/60">
              Track your referral milestones
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white">
                <span className="text-white/60">Progress to {nextMilestone} referrals</span>
                <span>{totalReferrals} / {nextMilestone}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Milestone List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">3 Referrals</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-white">Milestone 1</span>
                  </div>
                </div>
                <p className="text-sm text-white/60">
                  {totalReferrals >= 3 ? "✅ Completed" : "First milestone"}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">10 Referrals</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-white">Milestone 2</span>
                  </div>
                </div>
                <p className="text-sm text-white/60">
                  {totalReferrals >= 10 ? "✅ Completed" : "Bonus tier"}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-white/60">Rewards system coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="glass glass-hover rounded-3xl" data-testid="how-it-works">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-blue-400">1</span>
                </div>
                <h4 className="font-semibold text-white">Share Your Link</h4>
                <p className="text-sm text-white/60">
                  Send your unique referral link to friends and family
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-green-400">2</span>
                </div>
                <h4 className="font-semibold text-white">They Join</h4>
                <p className="text-sm text-white/60">
                  Your friends sign up and start their Nexura journey
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-purple-400">3</span>
                </div>
                <h4 className="font-semibold text-white">Grow Together</h4>
                <p className="text-sm text-white/60">
                  Build your network and reach milestones together
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </AuthGuard>
  );
}