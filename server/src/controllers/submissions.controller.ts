import mongoose from "mongoose";
import logger from "@/config/logger";
import { hub } from "@/models/hub.model";
import { user } from "@/models/user.model";
import { campaign, campaignCompleted } from "@/models/campaign.model";
import { campaignQuest } from "@/models/quests.model";
import { campaignQuestCompleted } from "@/models/questsCompleted.models";
import { submission } from "@/models/submission.model";
import { parseDate } from "@/utils/dates";
import { buildCampaignStages, computeRetention, scoreCampaignRetention } from "@/utils/retention";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "@/utils/status.utils";

/*
 * Studio "Submissions": campaign-first review and analytics.
 *
 * Retention is defined in utils/retention.ts. Only people who claimed the reward are listed.
 */

const PUBLISHED = { $nin: ["Save", "Deleted"] };

/** Which campaigns this admin can see: their hub's, or every hub's for the system hub (as on the Campaigns tab). */
async function campaignScope(hubId: string): Promise<{ filter: Record<string, unknown>; isSystem: boolean } | null> {
  const hubDoc = await hub.findById(hubId).select("systemKey").lean() as any;
  if (!hubDoc) return null;
  const isSystem = hubDoc.systemKey === "nexura-admin-campaigns";
  return { filter: isSystem ? { hub: { $ne: null } } : { hub: hubId }, isSystem };
}

/** Live status from the dates, matching the Campaigns tab. */
function liveStatus(c: any): "Active" | "Upcoming" | "Ended" {
  const now = Date.now();
  const starts = parseDate(c.starts_at);
  const ends = parseDate(c.ends_at);
  if (c.status === "Ended" || (ends && ends.getTime() <= now)) return "Ended";
  if (starts && starts.getTime() > now) return "Upcoming";
  return "Active";
}

/** GET /hub/submission-campaigns — the hub's published campaigns with review and participation counts. */
export const getSubmissionCampaigns = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const scope = await campaignScope(String(req.admin.hub));
    if (!scope) {
      res.status(NOT_FOUND).json({ error: "hub not found" });
      return;
    }

    const campaigns = await campaign.find({ ...scope.filter, status: PUBLISHED, deletedAt: null })
      .select("title projectCoverImage starts_at ends_at status participants maxParticipants reward contractAddress")
      .lean() as any[];
    const ids = campaigns.map(c => c._id);

    const quests = await campaignQuest.find({ campaign: { $in: ids } }).select("_id campaign").lean() as any[];
    const campaignByQuest = new Map(quests.map(q => [String(q._id), String(q.campaign)]));

    const subs = await submission.find({ page: "campaign", miniQuestId: { $in: [...campaignByQuest.keys()] } })
      .select("miniQuestId status").lean() as any[];
    const pending = new Map<string, number>();
    const total = new Map<string, number>();
    for (const s of subs) {
      const cid = campaignByQuest.get(String(s.miniQuestId));
      if (!cid) continue;
      total.set(cid, (total.get(cid) ?? 0) + 1);
      if (s.status === "pending") pending.set(cid, (pending.get(cid) ?? 0) + 1);
    }

    const joins = await campaignCompleted.aggregate([
      { $match: { campaign: { $in: ids } } },
      { $group: { _id: "$campaign", joined: { $sum: 1 }, completed: { $sum: { $cond: ["$questsCompleted", 1, 0] } }, claimed: { $sum: { $cond: ["$campaignCompleted", 1, 0] } } } },
    ]);
    const joinsById = new Map(joins.map((j: any) => [String(j._id), j]));

    const order = { Active: 0, Upcoming: 1, Ended: 2 } as const;
    const result = campaigns.map(c => {
      const id = String(c._id);
      const j = joinsById.get(id);
      return {
        _id: id,
        title: c.title,
        projectCoverImage: c.projectCoverImage,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        status: liveStatus(c),
        hasRewards: !!c.contractAddress && Number(c.reward?.pool ?? 0) > 0,
        participants: j?.joined ?? 0,
        completed: j?.completed ?? 0,
        claimed: j?.claimed ?? 0,
        pendingSubmissions: pending.get(id) ?? 0,
        totalSubmissions: total.get(id) ?? 0,
      };
    }).sort((a, b) => order[a.status] - order[b.status] || b.pendingSubmissions - a.pendingSubmissions);

    res.status(OK).json({ campaigns: result });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch campaigns" });
  }
};

/**
 * GET /hub/campaign-submission-details?id= — one campaign's submissions plus analytics for each
 * person who claimed the reward: campaign retention, overall retention and stage-by-stage history.
 */
export const getCampaignSubmissionDetails = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const id = String(req.query.id ?? "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(BAD_REQUEST).json({ error: "send a valid campaign id" });
      return;
    }
    const scope = await campaignScope(String(req.admin.hub));
    if (!scope) {
      res.status(NOT_FOUND).json({ error: "hub not found" });
      return;
    }
    const c = await campaign.findById(id).lean() as any;
    if (!c || c.deletedAt || c.status === "Deleted") {
      res.status(NOT_FOUND).json({ error: "campaign not found" });
      return;
    }
    if (!scope.isSystem && String(c.hub) !== String(req.admin.hub)) {
      res.status(FORBIDDEN).json({ error: "you are not allowed to view this campaign" });
      return;
    }

    const quests = await campaignQuest.find({ campaign: id }).select("_id quest stage order points tag").lean() as any[];
    const questIds = quests.map(q => q._id);
    const questById = new Map(quests.map(q => [String(q._id), q]));
    const stages = buildCampaignStages(c, quests);

    const [joins, completions, subs] = await Promise.all([
      campaignCompleted.find({ campaign: id }).lean() as Promise<any[]>,
      campaignQuestCompleted.find({ campaignQuest: { $in: questIds }, done: true }).select("user campaignQuest updatedAt").lean() as Promise<any[]>,
      submission.find({ page: "campaign", miniQuestId: { $in: questIds.map(String) } }).sort({ createdAt: -1 }).lean() as Promise<any[]>,
    ]);

    // Only people who claimed the reward are listed; everyone who joined still counts in the stats
    const claims = joins.filter(j => j.campaignCompleted);
    const claimerIds = claims.map(j => String(j.user));
    const userIds = [...new Set([...claimerIds, ...subs.map(s => String(s.user))])].filter(u => mongoose.Types.ObjectId.isValid(u));
    const [users, overall] = await Promise.all([
      user.find({ _id: { $in: userIds } }).select("username address profilePic").lean() as Promise<any[]>,
      computeRetention(claimerIds),
    ]);
    const userById = new Map(users.map(u => [String(u._id), u]));

    // userId → task id → completed at
    const doneByUser = new Map<string, Map<string, number>>();
    for (const d of completions) {
      const uid = String(d.user);
      if (!doneByUser.has(uid)) doneByUser.set(uid, new Map());
      doneByUser.get(uid)!.set(String(d.campaignQuest), new Date(d.updatedAt).getTime());
    }

    const now = Date.now();
    const requirement = Number(c.rewardsConfig?.retentionRequirementPct ?? 0) || null;
    const participants = claims.map(j => {
      const uid = String(j.user);
      const u = userById.get(uid);
      const done = doneByUser.get(uid) ?? new Map<string, number>();
      const score = scoreCampaignRetention(stages, done, new Date(j.createdAt).getTime(), now);
      const o = overall.get(uid);
      return {
        userId: uid,
        username: u?.username ?? "",
        address: u?.address ?? "",
        profilePic: u?.profilePic ?? "",
        joinedAt: new Date(j.createdAt).toISOString(),
        claimedAt: new Date(j.updatedAt).toISOString(),
        tasksDone: quests.filter(q => done.has(String(q._id))).length,
        totalTasks: quests.length,
        stagesCompleted: score.stagesCompleted,
        stagesTotal: score.stagesTotal,
        retentionRate: score.retentionRate,
        overallRetention: o?.rate ?? null,
        overallCampaigns: o?.campaigns ?? 0,
        meetsRequirement: requirement !== null && score.retentionRate !== null ? score.retentionRate >= requirement : null,
        history: score.history,
      };
    }).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());

    const submissions = subs.map(s => {
      const q = questById.get(String(s.miniQuestId));
      const u = userById.get(String(s.user));
      return {
        _id: String(s._id),
        submissionLink: s.submissionLink,
        page: s.page,
        status: s.status,
        taskType: s.taskType,
        taskTitle: q?.quest ?? "",
        username: s.username || u?.username || "",
        nexuraUsername: u?.username ?? "",
        address: s.address || u?.address || "",
        campaignId: id,
        validatedBy: s.validatedBy ?? "",
        rejectedCount: s.rejectedCount ?? 0,
        user: String(s.user),
        createdAt: s.createdAt,
      };
    });

    const avg = (xs: Array<number | null>) => {
      const v = xs.filter((x): x is number => x !== null);
      return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
    };
    res.status(OK).json({
      campaign: {
        _id: id,
        title: c.title,
        projectCoverImage: c.projectCoverImage,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        status: liveStatus(c),
        hasRewards: !!c.contractAddress && Number(c.reward?.pool ?? 0) > 0,
        rewardPool: Number(c.reward?.pool ?? 0),
        maxParticipants: Number(c.maxParticipants ?? 0),
        retentionRequirementPct: requirement,
        stages: stages.map(st => ({ key: st.key, name: st.name, offsetDays: st.offsetDays, totalTasks: st.taskIds.length })),
        totalTasks: quests.length,
      },
      stats: {
        participants: joins.length,
        completedAllTasks: joins.filter(j => j.questsCompleted).length,
        claimedReward: claims.length,
        averageRetention: avg(participants.map(p => p.retentionRate)),
        averageOverallRetention: avg(participants.map(p => p.overallRetention)),
        meetingRequirement: requirement === null ? null : participants.filter(p => p.meetsRequirement).length,
        pendingSubmissions: submissions.filter(s => s.status === "pending").length,
        approvedSubmissions: submissions.filter(s => s.status === "done").length,
        rejectedSubmissions: submissions.filter(s => s.status === "retry").length,
      },
      participants,
      submissions,
    });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch campaign submissions" });
  }
};
