"use client";

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle2, Play, RotateCcw } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import { apiRequestV2, apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../lib/auth";
import { claimCampaignOnchainReward } from "../lib/performOnchainAction";

type Quest = {
  _id: string;
  quest: string;
  reward: number;
  tag: "like" | "follow" | "join" | "repost" | "comment";
  link: string;
  done: boolean;
};

const campaignQuestsInitial: Quest[] = [
  { _id: "quest-id", tag: "like", done: false, quest: "Follow Nexura on X", reward: 100, link: "https://x.com/NexuraXYZ" },
  { _id: "quest-id", tag: "like", done: false, quest: "Join Nexura Discord", reward: 100, link: "https://discord.gg/caK9kATBya" },
  { _id: "quest-id", tag: "like", done: false, quest: "Drop a message on Discord", reward: 100, link: "https://discord.gg/caK9kATBya" },
  { _id: "quest-id", tag: "like", done: false, quest: "Support or Oppose the #Intuitionbilly Claim on Intuition Portal", reward: 100, link: "#" },
  { _id: "quest-id", tag: "like", done: false, quest: "Support or oppose the Nexura claim on Intuition Portal", reward: 100, link: "#" },
  { _id: "quest-id", tag: "like", done: false, quest: "Like and Comment on Nexura Pinned post", reward: 100, link: "#" },
];

export default function CampaignEnvironment() {
  const { user } = useAuth();
  const userId = user?._id || "";
  const { campaignId } = useParams();
  const { toast } = useToast();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [visitedQuests, setVisitedQuests] = useState<string[]>(() => {
    const stored = JSON.parse(localStorage.getItem("nexura:campaign:visited") || "{}");
    return stored[userId] || [];
  });
  const [claimedQuests, setClaimedQuests] = useState<string[]>(() => {
    const stored = JSON.parse(localStorage.getItem("nexura:campaign:claimed") || "{}");
    return stored[userId] || [];
  });
  const [failedQuests, setFailedQuests] = useState<string[]>([]);
  const [campaignCompleted, setCampaignCompleted] = useState<boolean>();

  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [trustClaimed, setTrustClaimed] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [campaignNumber, setCampaignNumber] = useState("000");
  const [reward, setReward] = useState<{ trustTokens: number; xp: number }>({ trustTokens: 0, xp: 0 });
  const [campaignAddress, setCampaignAddress] = useState("");

  const [questsCompleted, setQuestsCompleted] = useState(false);
  const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  // Fetch campaign quests
  useEffect(() => {
    (async () => {
      const res = await apiRequestV2("GET", `/api/campaign/quests?id=${campaignId}`);

      // Ensure every quest has a tag to prevent undefined errors
      const safeQuests = (res.campaignQuests || []).map((q: any) => ({
        _id: q._id,
        quest: q.quest,
        reward: q.reward ?? 0,
        tag: q.tag ?? "like", // default to "like" if missing
        link: q.link ?? "#",
        done: q.done ?? false,
      }));

      setQuests(safeQuests);
      setCampaignCompleted(res.campaignCompleted?.campaignCompleted || false);
      setCampaignAddress(res.address || "");
      setDescription(res.description || "");
      setTitle(res.title || "");
      setSubTitle(res.sub_title || "");
      setProjectName(res.project_name || "");
      setCampaignNumber(res.campaignNumber || "000");
      setReward(res.reward || { trustTokens: 0, xp: 0 });
      setTrustClaimed(res.trustClaimed || 0);
      setQuestsCompleted(res.campaignCompleted?.questsCompleted || false);

    })();
  }, [claimedQuests, userId]);

  // Sync localStorage for visited, claimed, completed, discordJoined
  useEffect(() => {
    const visited: any = JSON.parse(localStorage.getItem("nexura:campaign:visited") || "{}");
    visited[userId] = visitedQuests;
    localStorage.setItem("nexura:campaign:visited", JSON.stringify(visited));
  }, [visitedQuests, userId]);

  useEffect(() => {
    const claimed: any = JSON.parse(localStorage.getItem("nexura:campaign:claimed") || "{}");
    claimed[userId] = claimedQuests;
    localStorage.setItem("nexura:campaign:claimed", JSON.stringify(claimed));
  }, [claimedQuests, userId]);

  useEffect(() => {
    const completed: any = JSON.parse(localStorage.getItem("nexura:campaign:completed") || "{}");
    completed[userId] = campaignCompleted;
    localStorage.setItem("nexura:campaign:completed", JSON.stringify(completed));
  }, [campaignCompleted, userId]);

  // Open quest links
  const markQuestAsVisited = (quest: Quest) => {
    window.open(quest.link, "_blank");

    if (!visitedQuests.includes(quest._id)) setVisitedQuests([...visitedQuests, quest._id]);
  };

  const retryQuest = async (quest: Quest) => {
    window.open(quest.link, "_blank");

    if (!visitedQuests.includes(quest._id)) setVisitedQuests([...visitedQuests, quest._id]);

    await apiRequestV2("POST", "/api/quest/update-submission?questId=" + quest._id);
  };

  const submitCommentProof = async (quest: Quest) => {
    const link = proofLinks[quest._id];
    if (!link) {
      toast({
        title: "Missing link",
        description: "Please paste your comment link.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequestV2("POST", "/api/quest/submit-quest", {
        questId: campaignId,
        id: quest._id,
        submissionLink: link,
        page: "campaign",
        tag: quest.tag,
      });

      toast({
        title: "Submitted",
        description: "Your proof has been submitted for review.",
      });

      // Mark as claimed
      setClaimedQuests([...claimedQuests, quest._id]);
      setExpandedQuestId(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Claim quest
  const getId = (url: string) => {
    return url.split("/").pop(); // return the last item in the array
  };

  const claimQuest = async (quest: Quest) => {
    try {
      const id = getId(quest.link);

      try {
        const id = getId(quest.link);
        if (trustClaimed < 4000) {
          // if (["follow", "comment", "repost"].includes(quest.tag)) {
          //   if (!user?.socialProfiles.x.connected) {
          //     throw new Error("x not connected yet, go to profile to connect.");
          //   }

          //   const { success } = await apiRequestV2("POST", "/api/check-x", { id, tag: quest.tag, questId: quest._id, page: "campaign" });
          //   if (!success) {
          //     throw new Error(`Kindly ${quest.tag !== "follow" ? quest.tag + " the post" : "follow the account"}`);
          //   }
          // } else 
          if (["join", "message"].includes(quest.tag)) {
            if (!user?.socialProfiles.discord.connected) {
              throw new Error("discord not connected yet, go to profile to connect");
            }

            const { success } = await apiRequestV2("POST", "/api/check-discord", { channelId: id, tag: quest.tag });
            if (!success) {
              throw new Error(`Kindly ${quest.tag} the discord channel`);
            }
          }
        }
      } catch (error: any) {
        console.error(error);
        throw new Error(error.message);
      }

      const res = await apiRequest(
        "POST",
        `/api/quest/perform-campaign-quest`,
        { id: quest._id, campaignId }
      );
      if (!res.ok) return;

      setClaimedQuests([...claimedQuests, quest._id]);
      setFailedQuests((prev) => prev.filter((id) => id !== quest._id));
      setQuests((prev) =>
        prev.map((q) => (q._id === quest._id ? { ...q, done: true } : q))
      );
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });

      if (!failedQuests.includes(quest._id)) {
        setFailedQuests((prev) => [...prev, quest._id]);
      }
    };
  };

  // Claim campaign reward
  const claimCampaignReward = async () => {
    try {
      if (trustClaimed < 4000) {
        await claimCampaignOnchainReward({ campaignAddress, userId });
      }

      await apiRequestV2("POST", `/api/campaign/complete-campaign?id=${campaignId}`);

      setCampaignCompleted(true);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {quests.length > 0 ? (
        quests.map((quest) => {
          const isCommentQuest = quest.tag === "comment";
          const visited = visitedQuests.includes(quest._id);
          const claimed = quest.done || claimedQuests.includes(quest._id);
          const failed = failedQuests.includes(quest._id);
          const isExpanded = expandedQuestId === quest._id;

          let buttonText = "Start Quest";

          if (visited) buttonText = "Claim";
          if (claimed) buttonText = "Completed";

          return (
            <div
              key={quest._id}
              className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition gap-3 sm:gap-0"
            >
              <div className="flex items-center gap-3 w-full sm:w-2/3">
                <div className="w-6 h-6 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-white/10 text-white">
                  {claimed ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Play className="w-4 h-4" />}
                </div>
                <span className="text-sm sm:text-base font-medium">{quest.quest}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {failed && (
                  <button
                    onClick={() => {
                      retryQuest(quest);
                    }}
                    className="px-3 py-2 rounded-full bg-red-600 hover:bg-red-700 flex items-center gap-1 text-sm font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                )}

                <button
                  disabled={claimed}
                  onClick={() => (!visited ? markQuestAsVisited(quest) : claimQuest(quest))}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold ${claimed ? "bg-gray-600 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"}`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          );
        })) : <span>No quests available</span>
      }
    </div>
  );
}