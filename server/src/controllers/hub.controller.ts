import { OTP } from '@/models/otp.model';
import { hub, hubAdmin, userHub, userHubAdmin } from '@/models/hub.model';
import { user } from '@/models/user.model';
import { server } from '@/models/server.model';
import { addHubAdminEmail } from '@/utils/sendMail';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, CREATED, OK, NO_CONTENT, NOT_FOUND, FORBIDDEN } from '@/utils/status.utils';
import { CLIENT_URL } from '@/utils/env.utils';
import { generateOTP, validateHubData, getMissingFields, validateCampaignData, validateCampaignQuestData, validateSaveCampaignData, validateUserHubData, validateDiscordTaskConfig } from '@/utils/utils';
import logger from '@/config/logger';
import { submission } from '@/models/submission.model';
import { miniQuestCompleted, campaignQuestCompleted } from '@/models/questsCompleted.models';
import { campaign } from '@/models/campaign.model';
import { campaignQuest } from '@/models/quests.model';
import { withSubmissionCategory } from '@/controllers/quest.controller';
import { uploadImg } from "@/utils/img.utils";
import { uploadFile } from "@/utils/file.utils";
import { normalizeCampaignDateInput, normalizeCampaignDatesForResponse, parseDate } from "@/utils/dates";

const DISCORD_CAMPAIGN_TAGS = new Set([
  "discord",
  "join",
  "join-discord",
  "message",
  "message-discord",
  "acquire-role-discord",
  "send-message-discord",
]);

const isDiscordCampaignTask = (task: Record<string, any>) =>
  DISCORD_CAMPAIGN_TAGS.has(String(task?.tag ?? "").trim()) || String(task?.category ?? "").trim() === "discord";

const ONGOING_CAMPAIGN_STATUSES = ["Active", "Scheduled"] as const;

const getDiscordQuestGuildIdsForCampaigns = async (campaignIds: string[]) => {
  if (campaignIds.length === 0) return [];

  const quests = await campaignQuest
    .find({ campaign: { $in: campaignIds } })
    .select("guildId tag category")
    .lean();

  return Array.from(
    new Set(
      quests
        .filter((quest: any) => isDiscordCampaignTask(quest))
        .map((quest: any) => String(quest.guildId ?? "").trim())
        .filter(Boolean)
    )
  );
};

const resolveCampaignDiscordLaunchGuildId = async (campaignDoc: any) => {
  const storedGuildId = String(campaignDoc?.discordLaunchGuildId ?? "").trim();
  if (storedGuildId) return storedGuildId;

  const guildIds = await getDiscordQuestGuildIdsForCampaigns([String(campaignDoc?._id ?? "")].filter(Boolean));
  return guildIds[0] ?? "";
};

const getRequiredOngoingDiscordGuildIdForHub = async (hubId: unknown) => {
  const ongoingCampaigns = await campaign
    .find({ hub: hubId, status: { $in: ONGOING_CAMPAIGN_STATUSES } })
    .select("_id discordLaunchGuildId")
    .lean();

  if (ongoingCampaigns.length === 0) {
    return "";
  }

  const lockedGuildIds = new Set<string>();
  const fallbackCampaignIds: string[] = [];

  for (const ongoingCampaign of ongoingCampaigns) {
    const storedGuildId = String((ongoingCampaign as any).discordLaunchGuildId ?? "").trim();
    if (storedGuildId) {
      lockedGuildIds.add(storedGuildId);
      continue;
    }

    fallbackCampaignIds.push(String((ongoingCampaign as any)._id ?? "").trim());
  }

  const fallbackGuildIds = await getDiscordQuestGuildIdsForCampaigns(fallbackCampaignIds.filter(Boolean));
  for (const guildId of fallbackGuildIds) {
    lockedGuildIds.add(guildId);
  }

  if (lockedGuildIds.size > 1) {
    throw new Error("Multiple active campaigns with Discord tasks are locked to different Discord servers. Reconnect the original server used for those campaigns before changing Studio Discord.");
  }

  return Array.from(lockedGuildIds)[0] ?? "";
};

export const createHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { error } = validateHubData(req.body);
    if (error) {
      const emptyFields = getMissingFields(error);

      res
        .status(BAD_REQUEST)
        .json({ error: `these field(s) are required: ${emptyFields}` });
      return;
    }

    const name = String(req.body.name ?? "").trim().toUpperCase();

    const existingHubWithName = await hub.findOne({ name });
    if (existingHubWithName) {
      // If it's already their hub, we can just update it or proceed
      if (String(existingHubWithName.superAdmin) === String(req.id)) {
        // Proceed to update or just return success if already exists
        await hub.findByIdAndUpdate(existingHubWithName._id, {
          description: req.body.description ?? existingHubWithName.description,
          website: String(req.body.website ?? existingHubWithName.website).trim(),
          xAccount: String(req.body.xAccount ?? existingHubWithName.xAccount).trim(),
          discordServer: String(req.body.discordServer ?? existingHubWithName.discordServer).trim(),
        });
        res.status(OK).json({ message: "hub updated!" });
        return;
      }
      res.status(BAD_REQUEST).json({ error: "name is already in use" });
      return;
    }

    const hubLogoAsFile = req.file?.buffer;
    if (!hubLogoAsFile) {
      res.status(BAD_REQUEST).json({ error: "hub logo is required" });
      return;
    }

    const hubLogo = await uploadImg({ file: hubLogoAsFile, filename: req.file?.originalname, folder: "hub-logos" });
    const website = String(req.body.website ?? "").trim();
    const xAccount = String(req.body.xAccount ?? "").trim();
    const discordServer = String(req.body.discordServer ?? "").trim();

    const createdHub = await hub.create({
      name,
      description: req.body.description ?? "",
      website,
      xAccount,
      discordServer,
      logo: hubLogo,
      superAdmin: req.id,
      xpAllocated: 200,
    });

    const adminDoc = req.admin as any;
    await hubAdmin.findByIdAndUpdate(req.id, { hub: createdHub._id, pendingTxHash: null });

    // Migrate any pending payment hash from admins to hub (payment represents completed on-chain studio fee)
    if (adminDoc?.pendingTxHash) {
      await hub.findByIdAndUpdate(createdHub._id, { pendingTxHash: adminDoc.pendingTxHash, $inc: { noOfPayments: 1 } });
    }

    res.status(CREATED).json({ message: "hub created!" });
  } catch (error: any) {
    logger.error(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: error?.message || "Error creating hub" });
  }
};

export const getHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const hubFound = await hub.findById(req.admin.hub).lean() as any;
    // If hub exists but pendingTxHash isn't on it, fall back to admin's stored hash
    const adminHash = (req.admin as any).pendingTxHash ?? null;
    const pendingTxHash = hubFound?.pendingTxHash ?? adminHash;
    const adminInfo = { _id: req.id, name: req.admin.name, email: req.admin.email, role: req.admin.role };
    res.status(OK).json({ hub: hubFound ? { ...hubFound, pendingTxHash } : { pendingTxHash }, admin: adminInfo });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error getting hub" });
  }
};

export const savePaymentHash = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { txHash } = req.body;
    if (req.admin.hub) {
      // Hub exists — save on hub
      if (txHash) {
        await hub.findByIdAndUpdate(req.admin.hub, { pendingTxHash: txHash, $inc: { noOfPayments: 1 } });
      } else {
        await hub.findByIdAndUpdate(req.admin.hub, { pendingTxHash: null });
      }
    } else {
      // Hub not created yet — save on admin as fallback; counter is incremented when hub is created
      await hubAdmin.findByIdAndUpdate(req.id, { pendingTxHash: txHash ?? null });
    }
    res.status(OK).json({ message: "payment hash saved" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error saving payment hash" });
  }
};

export const updateIds = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { verifiedId, guildId, discordServer, discordSessionId } = req.body;
    const normalizedGuildId = String(guildId ?? "").trim();
    const normalizedDiscordServer = String(discordServer ?? "").trim();
    const normalizedDiscordSessionId = String(discordSessionId ?? "").trim();

    const updatePayload: Record<string, any> = {
      verifiedId,
      guildId: normalizedGuildId,
      discordConnected: true,
    };
    if (normalizedDiscordServer) updatePayload.discordServer = normalizedDiscordServer;
    if (normalizedDiscordSessionId) updatePayload.discordSessionId = normalizedDiscordSessionId;

    // userHubAdmin has userId field; hubAdmin has role field
    const isUserHub = !!(req.admin as any).userId;
    const adminHubId = String((req.admin as any).hub ?? "");
    console.log("[updateIds] isUserHub:", isUserHub, "hubId:", adminHubId, "payload:", JSON.stringify(updatePayload));

    // Note: with the schema no longer enforcing guildId uniqueness, we no
    // longer $unset other hubs' guildId here — multiple hubs may legitimately
    // share a Discord server.

    if (isUserHub) {
      await userHub.findByIdAndUpdate(req.admin.hub, updatePayload);
    } else {
      await hub.findByIdAndUpdate(req.admin.hub, updatePayload);
    }

    res.status(OK).json({ message: "ids updated successfully" });
  } catch (error: any) {
    logger.error(error);
    if (error?.code === 11000 || error?.message?.includes("E11000")) {
      res.status(FORBIDDEN).json({ error: "This Discord server is already linked to another hub. Disconnect it there first." });
      return;
    }
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error updating ids" });
	}
}

export const completeHubDiscordConnect = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { serverId } = req.body as { serverId?: string };
    if (!serverId) {
      res.status(BAD_REQUEST).json({ error: "serverId is required" });
      return;
    }

    const serverDoc = await server.findById(serverId);
    if (!serverDoc || !serverDoc.servers?.length) {
      res.status(NOT_FOUND).json({ error: "Discord server data not found" });
      return;
    }

    const primaryGuild = serverDoc.servers[0]!;

    // Multi-hub to one-server is allowed: guildId is no longer unique-indexed,
    // so a disconnected hub doesn't block another hub from connecting either
    // to the same Discord server or to a different one.

    await hub.findByIdAndUpdate(req.admin.hub, {
      guildId: primaryGuild.id,
      discordServer: primaryGuild.name,
      discordConnected: true,
      discordSessionId: serverId,
    });

    res.status(OK).json({ message: "Discord connected successfully" });
  } catch (error: any) {
    logger.error(error);
    if (error?.code === 11000 || error?.message?.includes("E11000")) {
      res.status(FORBIDDEN).json({
        error: "This Discord server is already linked to another hub. Disconnect it there first.",
      });
      return;
    }
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error connecting Discord" });
  }
};

export const disconnectHubDiscord = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    // Also $unset guildId and verifiedId so the unique-indexed slot is released
    // — otherwise a future hub can no longer connect to the same Discord server.
    await hub.findByIdAndUpdate(req.admin.hub, {
      $unset: { guildId: 1, verifiedId: 1 },
      discordConnected: false,
      discordServer: "",
      discordSessionId: "",
    });

    res.status(OK).json({ message: "discord disconnected" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error disconnecting discord" });
  }
};

export const addHubAdmin = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { email, role, clientUrl } = req.body;
    if (!email) {
      res.status(BAD_REQUEST).json({ error: "admin email is required" });
      return;
    }

    if (!req.admin.hub) {
      res.status(BAD_REQUEST).json({ error: "create a hub to continue" });
      return;
    }

    const validRole = role === "superadmin" ? "superadmin" : "admin";
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingAdmin = await hubAdmin.findOne({ email: normalizedEmail }).lean();
    if (existingAdmin) {
      res.status(BAD_REQUEST).json({ error: "email is already in use" });
      return;
    }

    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateOTP();
      const codeExists = await OTP.exists({ code: candidate });
      if (!codeExists) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to generate invite code" });
      return;
    }

    const existingInvite = await OTP.findOne({ email: normalizedEmail, hubId: String(req.admin.hub) }).lean();

    await OTP.findOneAndUpdate(
      { email: normalizedEmail, hubId: String(req.admin.hub) },
      {
        email: normalizedEmail,
        code,
        hubId: String(req.admin.hub),
        role: validRole,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Use the client's origin for the invite link so it works in dev/prod
    const origin = clientUrl || CLIENT_URL;
    try {
      await addHubAdminEmail(normalizedEmail, code, origin);
    } catch (error) {
      if (existingInvite) {
        await OTP.findOneAndUpdate(
          { email: normalizedEmail, hubId: String(req.admin.hub) },
          {
            code: existingInvite.code,
            role: existingInvite.role,
            expiresAt: existingInvite.expiresAt,
          }
        );
      } else {
        await OTP.deleteOne({ email: normalizedEmail, hubId: String(req.admin.hub) });
      }
      throw error;
    }

    res.status(OK).json({ message: "otp sent" });
  } catch (error: any) {
    logger.error("addHubAdmin failed:", error);
    const msg = error?.message || 'Failed to add hub admin';
    res.status(INTERNAL_SERVER_ERROR).json({ error: msg });
  }
};

export const updateHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const logoFile = files?.logo?.[0];
    const documentFile = files?.document?.[0];

    const { name, logo } = req.body;

    if (logoFile?.buffer) {
      req.body.logo = await uploadImg({
        file: logoFile.buffer,
        filename: logoFile.originalname,
        folder: "hub-logo",
      });
    }

    if (documentFile?.buffer) {
      req.body.document = await uploadFile({
        file: documentFile.buffer,
        filename: documentFile.originalname,
        contentType: documentFile.mimetype,
        folder: "hub-documents",
      });
    }

    const trimmedName = typeof name === "string" ? name.trim().toUpperCase() : undefined;
    if (trimmedName) {
      const nameExists = await hub.exists({
        name: trimmedName,
        _id: { $ne: req.admin.hub },
      });

      if (nameExists) {
        res.status(400).json({ error: "hub name already exists" });
        return;
      }
      req.body.name = trimmedName;
    }

    const { xpAllocated: _xp, ...safeBody } = req.body;
    if (safeBody.website !== undefined) safeBody.website = String(safeBody.website ?? "").trim();
    if (safeBody.xAccount !== undefined) safeBody.xAccount = String(safeBody.xAccount ?? "").trim();
    if (safeBody.discordServer !== undefined) safeBody.discordServer = String(safeBody.discordServer ?? "").trim();
    if (safeBody.guildId !== undefined) safeBody.guildId = String(safeBody.guildId ?? "").trim();
    if (safeBody.document !== undefined) safeBody.document = String(safeBody.document ?? "").trim();
    const updatedHub = await hub.findByIdAndUpdate(req.admin.hub, safeBody, { new: true });
    res.status(OK).json(updatedHub);
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: 'Failed to update hub' });
  }
};

export const deleteHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {

    await hub.findByIdAndDelete(req.admin.hub);

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error)
    res.status(INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete hub' });
  }
};

export const removeHubAdmin = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { id } = req.query as { id: string };
    if (!id) {
      res.status(BAD_REQUEST).json({ error: "admin id is required" });
      return;
    }

    if (id === req.id) {
      res.status(BAD_REQUEST).json({ error: "you cannot remove yourself" });
      return;
    }

    // Only allow removing admins from the same hub
    const target = await hubAdmin.findById(id).lean();
    if (!target || String(target.hub) !== String(req.admin.hub)) {
      res.status(NOT_FOUND).json({ error: "admin not found in your hub" });
      return;
    }

    await hubAdmin.findByIdAndDelete(id);

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error removing admin" })
  }
};

export const getHubAdmins = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    if (!req.admin.hub) {
      res.status(BAD_REQUEST).json({ error: "no hub found" });
      return;
    }

    const admins = await hubAdmin.find({ hub: req.admin.hub }).select("_id name email role createdAt").lean();

    // Also fetch pending invites for this hub
    const now = new Date();
    await OTP.deleteMany({ hubId: String(req.admin.hub), expiresAt: { $lte: now } });
    const pendingInvites = await OTP.find({ hubId: String(req.admin.hub), expiresAt: { $gt: now } })
      .select("_id email role createdAt expiresAt")
      .lean();

    res.status(OK).json({ admins, pendingInvites });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching hub admins" });
  }
};

export const resendInvite = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { inviteId, clientUrl } = req.body;
    if (!inviteId) {
      res.status(BAD_REQUEST).json({ error: "inviteId is required" });
      return;
    }

    const existingOtp = await OTP.findById(inviteId);
    if (!existingOtp || String(existingOtp.hubId) !== String(req.admin.hub)) {
      res.status(NOT_FOUND).json({ error: "invite not found" });
      return;
    }

    // Generate a fresh code and reset expiry
    let newCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateOTP();
      const codeExists = await OTP.exists({ code: candidate, _id: { $ne: existingOtp._id } });
      if (!codeExists) {
        newCode = candidate;
        break;
      }
    }

    if (!newCode) {
      res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to generate invite code" });
      return;
    }

    const previousCode = existingOtp.code;
    const previousExpiresAt = existingOtp.expiresAt;
    existingOtp.code = newCode;
    existingOtp.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await existingOtp.save();

    const origin = clientUrl || CLIENT_URL;
    try {
      await addHubAdminEmail(existingOtp.email, newCode, origin);
    } catch (error) {
      existingOtp.code = previousCode;
      existingOtp.expiresAt = previousExpiresAt;
      await existingOtp.save();
      throw error;
    }

    res.status(OK).json({ message: "invite resent" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to resend invite" });
  }
};

export const deleteInvite = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(BAD_REQUEST).json({ error: "invite id is required" });
      return;
    }

    const invite = await OTP.findById(id);
    if (!invite || String(invite.hubId) !== String(req.admin.hub)) {
      res.status(NOT_FOUND).json({ error: "invite not found" });
      return;
    }

    await OTP.findByIdAndDelete(id);
    res.status(OK).json({ message: "invite deleted" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to delete invite" });
  }
};

export const updateHubAdminRole = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { adminId, newRole } = req.body;
    if (!adminId || !newRole) {
      res.status(BAD_REQUEST).json({ error: "adminId and newRole are required" });
      return;
    }

    if (!["admin", "superadmin"].includes(newRole)) {
      res.status(BAD_REQUEST).json({ error: "role must be admin or superadmin" });
      return;
    }

    if (adminId === req.id) {
      res.status(BAD_REQUEST).json({ error: "you cannot change your own role" });
      return;
    }

    const target = await hubAdmin.findById(adminId).lean();
    if (!target || String(target.hub) !== String(req.admin.hub)) {
      res.status(NOT_FOUND).json({ error: "admin not found in your hub" });
      return;
    }

    await hubAdmin.findByIdAndUpdate(adminId, { role: newRole });

    res.status(OK).json({ message: `admin role updated to ${newRole}` });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error updating admin role" });
  }
};

export const validateCampaignSubmissions = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { submissionId, action }: { submissionId: string; action: "reject" | "accept" } = req.body;

    const userSubmission = await submission.findById(submissionId);
    if (!userSubmission) {
      res.status(BAD_REQUEST).json({ error: "submission not found" });
      return;
    }

    let model;
    let isSeasonalQuest = false;

    if (userSubmission.page === "quest" || userSubmission.page === "user") {
      isSeasonalQuest = true;
      model = await miniQuestCompleted.findOne({ _id: userSubmission.questCompleted, status: { $in: ["pending", "retry"] } });
      if (!model) {
        res.status(NOT_FOUND).json({ error: "mini quest already completed or id is invalid" });
        return
      }
    } else {
      model = await campaignQuestCompleted.findOne({ _id: userSubmission.questCompleted, status: { $in: ["pending", "retry"] } });
      if (!model) {
        res.status(NOT_FOUND).json({ error: "campaign quest already completed or id is invalid" });
        return
      }
    }

    if (action === "accept") {
      userSubmission.status = "done";
      userSubmission.validatedBy = req.adminName;
      if (isSeasonalQuest) {
        // Seasonal mini-tasks decouple approval from completion: the user must
        // still click "Claim XP" to finalize, so leave it claimable (not done).
        model.status = "approved";
        model.done = false;
      } else {
        model.done = true;
        model.status = "done";
      }
    } else if (action === "reject") {
      userSubmission.status = "retry";
      userSubmission.validatedBy = req.adminName;
      userSubmission.rejectedCount = (userSubmission.rejectedCount || 0) + 1;
      model.status = "retry";
    }

    await userSubmission.save();
    await model.save();

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: 'Failed to validate campaign submissions' });
  }
};

export const getCampaignSubmissions = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    // Return all submissions tied to this hub (studio campaigns only)
    const rawTasks = await submission.find({ hub: req.admin.hub }).lean().sort({ createdAt: 1 });
    const pendingTasks = await withSubmissionCategory(rawTasks);
    res.status(OK).json({ message: "submissions fetched", pendingTasks });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch campaign submissions" });
  }
};

export const getCampaign = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { id } = req.query as { id: string };
    if (!id) {
      res.status(BAD_REQUEST).json({ error: "send campaign id" });
      return;
    }

    const campaignFound = await campaign.findById(id).lean();
    if (!campaignFound) {
      res.status(NOT_FOUND).json({ error: "campaign not found" });
      return;
    }
    if (req.admin?.hub && !req.isPlatformAdmin && String(campaignFound.hub) !== String(req.admin.hub)) {
      res.status(FORBIDDEN).json({ error: "you are not allowed to access this campaign" });
      return;
    }

    const campaignQuests = await campaignQuest.find({ campaign: id }).lean();

    res.status(OK).json({ campaignQuests, campaignFound: normalizeCampaignDatesForResponse(campaignFound) });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error fetching campaign" });
  }
}

export const saveCampaign = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    // FormData sends JSON fields as strings — parse them before validation
    if (typeof req.body.reward === "string") {
      try { req.body.reward = JSON.parse(req.body.reward); } catch { /* leave as-is */ }
    }

    req.body.starts_at = normalizeCampaignDateInput(req.body.starts_at);
    req.body.ends_at = normalizeCampaignDateInput(req.body.ends_at);

    const hubFound = await hub.findById(req.admin.hub).lean();
    if (!hubFound) {
      res.status(BAD_REQUEST).json({ error: "create a hub to continue" });
      return;
    }

    // Parse campaignQuests if provided
    let questsToSave: any[] | null = null;
    if (req.body.campaignQuests !== undefined) {
      try {
        questsToSave = typeof req.body.campaignQuests === "string"
          ? JSON.parse(req.body.campaignQuests)
          : req.body.campaignQuests;
      } catch { /* ignore */ }
    }

    const { error } = validateSaveCampaignData(req.body);
    if (error) {
      const emptyFields = getMissingFields(error);
      res.status(BAD_REQUEST).json({ error: `Missing required fields: ${emptyFields}` });
      return;
    }

    const coverImageBuffer = req.file?.buffer;
    const { hubCoverImage } = req.body;

    if (hubCoverImage && coverImageBuffer) {
      // remove previous cover image
      req.body.coverImage = await uploadImg({
        file: coverImageBuffer,
        filename: req.file?.originalname,
        folder: "cover-images",
        maxSize: 2 * 1024 ** 2
      });
    } else if (coverImageBuffer && !hubCoverImage) {
      req.body.coverImage = await uploadImg({
        file: coverImageBuffer,
        filename: req.file?.originalname,
        folder: "cover-images",
        maxSize: 2 * 1024 ** 2
      });
    }

    const { id } = req.query as { id: string };
    if (!id) {
      // Fill in defaults for required model fields not yet provided in a draft
      const [campaignCount] = await Promise.all([
        campaign.countDocuments({ creator: req.id }),
      ]);
      const reward = req.body.reward ?? {};
      const body = {
        ...req.body,
        project_image: hubFound.logo ?? "pending",
        project_name: hubFound.name ?? req.body.nameOfProject ?? "",
        sub_title: req.body.description ?? "",
        totalXpAvailable: reward.xp ?? 0,
        totalTrustAvailable: reward.pool ?? 0,
        campaignNumber: campaignCount + 1,
        projectCoverImage: req.body.coverImage ?? "pending",
        creator: req.id,
        hub: req.admin.hub,
        reward: {
          xp: reward.xp ?? 0,
          pool: reward.pool ?? 0,
          trustTokens: reward.trust ?? 0,
        },
      };

      const savedCampaign = await campaign.create(body);
      const savedCampaignId = savedCampaign._id;

      // Save quests
      if (questsToSave !== null) {
        // Per-task Discord validation: refuse to persist quests that the
        // verifier will immediately reject with "missing discord channel/role".
        for (let i = 0; i < questsToSave.length; i++) {
          const taskCheck = validateDiscordTaskConfig(questsToSave[i] as any);
          if (!taskCheck.success) {
            res.status(BAD_REQUEST).json({
              error: `task #${i + 1}: ${taskCheck.error}`,
            });
            return;
          }
        }
        await campaignQuest.deleteMany({ campaign: savedCampaignId });
        if (questsToSave.length > 0) {
          await campaignQuest.insertMany(
            questsToSave.map((q: any) => (
              isDiscordCampaignTask(q) ? { ...q, campaign: savedCampaignId, guildId: hubFound.guildId } :
              { ...q, campaign: savedCampaignId }))
          );
        }
        await campaign.findByIdAndUpdate(savedCampaignId, { noOfQuests: questsToSave.length });
      }

      res.status(CREATED).json({ message: 'Campaign saved successfully', campaignId: savedCampaign._id });
      return;
    }

    const campaignFound = await campaign.findById(id).lean();
    if (!campaignFound) {
      res.status(NOT_FOUND).json({ error: "campaign not found" });
      return;
    }

    const lockedDiscordGuildId = campaignFound.status !== "Save"
      ? await resolveCampaignDiscordLaunchGuildId(campaignFound)
      : "";

    const discordGuildIdForCampaign = lockedDiscordGuildId || String(hubFound.guildId ?? "").trim();

    const incomingNameOfProject = typeof req.body.nameOfProject === "string"
      ? req.body.nameOfProject.trim()
      : "";

    const { campaignQuests: _cq, isDraft: _d, existingCoverImage: _e, hubCoverImage: _h, nameOfProject: _n, ...updateFields } = req.body;

    if (updateFields.reward && typeof updateFields.reward === "object") {
      const rewardUpdate = updateFields.reward as Record<string, unknown>;
      const pool = Number(rewardUpdate.pool ?? 0);
      const xp = Number(rewardUpdate.xp ?? 0);
      const trustTokens = Number(rewardUpdate.trust ?? rewardUpdate.trustTokens ?? 0);
      updateFields.reward = {
        xp,
        pool,
        trustTokens,
      };
      updateFields.totalXpAvailable = xp;
      updateFields.totalTrustAvailable = pool;
    }

    if (updateFields.maxParticipants !== undefined) {
      updateFields.maxParticipants = Number(updateFields.maxParticipants ?? 0);
    }

    if (updateFields.description !== undefined) {
      updateFields.sub_title = String(updateFields.description ?? "").trim();
    }

    if (req.body.nameOfProject !== undefined || campaignFound.project_name) {
      updateFields.project_name = hubFound.name ?? incomingNameOfProject ?? campaignFound.project_name;
    }

    const existingPool = Number(campaignFound.reward?.pool ?? 0);
    const existingMaxParticipants = Number((campaignFound as any).maxParticipants ?? campaignFound.participants ?? 0);
    const existingStartsAt = parseDate(campaignFound.starts_at);
    const existingEndsAt = parseDate(campaignFound.ends_at);
    const incomingPool = updateFields.reward
      ? Number((updateFields.reward as Record<string, unknown>).pool ?? existingPool)
      : existingPool;
    const incomingMaxParticipants = updateFields.maxParticipants !== undefined
      ? Number(updateFields.maxParticipants ?? existingMaxParticipants)
      : existingMaxParticipants;
    const incomingEndsAt = updateFields.ends_at ? parseDate(updateFields.ends_at) : existingEndsAt;
    const rewardsContractSettled = Boolean((campaignFound as any).rewardsDeployment?.remainderWithdrawalTxHash);
    const campaignHasStarted = existingStartsAt ? existingStartsAt.getTime() <= Date.now() : false;

    if (campaignFound.status !== "Save" && campaignFound.contractAddress && existingPool > 0) {
      if (
        rewardsContractSettled &&
        existingEndsAt &&
        incomingEndsAt &&
        incomingEndsAt.getTime() > existingEndsAt.getTime()
      ) {
        res.status(BAD_REQUEST).json({
          error: "this rewards campaign cannot be extended because its remaining funds have already been withdrawn",
        });
        return;
      }

      if (campaignHasStarted) {
        if (incomingPool < existingPool) {
          res.status(BAD_REQUEST).json({ error: "reward pool cannot be reduced after publishing" });
          return;
        }
        if (incomingMaxParticipants < existingMaxParticipants) {
          res.status(BAD_REQUEST).json({ error: "participant limit cannot be reduced after publishing" });
          return;
        }
      }

    }

    // Recalculate status atomically when dates change on a published campaign
    if (campaignFound.status !== "Save") {
      const now = new Date();
      const newStartsAt = updateFields.starts_at
        ? parseDate(updateFields.starts_at)
        : parseDate(campaignFound.starts_at);
      const newEndsAt = updateFields.ends_at
        ? parseDate(updateFields.ends_at)
        : parseDate(campaignFound.ends_at);

      if (newEndsAt && newEndsAt <= now) {
        updateFields.status = "Ended";
      } else if (newStartsAt && newStartsAt > now) {
        updateFields.status = "Scheduled";
      } else {
        updateFields.status = "Active";
      }
    }

    await campaign.findByIdAndUpdate(id, updateFields, { new: true });

    // Update quests without destroying existing IDs/submissions
    if (questsToSave !== null) {
      const existingQuests = await campaignQuest.find({ campaign: id }).select("_id").lean();
      const existingQuestIds = existingQuests.map((q: any) => q._id.toString());
      const incomingQuestIds = questsToSave
        .map((q: any) => q._id?.toString())
        .filter(Boolean);

      const questsToUpdate = questsToSave.filter((q: any) => q._id);
      const questsToInsert = questsToSave.filter((q: any) => !q._id);

      if (questsToUpdate.length > 0) {
        // Per-task Discord validation on the update path: refuse malformed
        // tag flips/channels on existing quests as well (e.g. swapping a "like"
        // task's tag to "send-message-discord" without channelId would have silently
        // persisted before this guard).
        for (let i = 0; i < questsToUpdate.length; i++) {
          const taskCheck = validateDiscordTaskConfig(questsToUpdate[i] as any);
          if (!taskCheck.success) {
            res.status(BAD_REQUEST).json({
              error: `task #${i + 1}: ${taskCheck.error}`,
            });
            return;
          }
        }
        await campaignQuest.bulkWrite(
          questsToUpdate.map((q: any) => {
            const { _id, ...rest } = q;
            const updatePayload = isDiscordCampaignTask(q)
              ? { ...rest, campaign: id, guildId: discordGuildIdForCampaign }
              : { ...rest, campaign: id };

            return {
              updateOne: {
                filter: { _id, campaign: id as any },
                update: { $set: updatePayload },
              }
            };
          })
        );
      }

      if (questsToInsert.length > 0) {
        // Newly inserted rows also go through the per-task Discord validation to
        // keep behaviour consistent with the create-only branch above.
        for (let i = 0; i < questsToInsert.length; i++) {
          const taskCheck = validateDiscordTaskConfig(questsToInsert[i] as any);
          if (!taskCheck.success) {
            res.status(BAD_REQUEST).json({
              error: `task #${i + 1}: ${taskCheck.error}`,
            });
            return;
          }
        }
        await campaignQuest.insertMany(
          questsToInsert.map((q: any) => (
            isDiscordCampaignTask(q)
              ? { ...q, campaign: id, guildId: discordGuildIdForCampaign }
              : { ...q, campaign: id }
          ))
        );
      }

      const questIdsToDelete = existingQuestIds.filter((existingId) => !incomingQuestIds.includes(existingId));
      if (questIdsToDelete.length > 0) {
        await campaignQuest.deleteMany({ _id: { $in: questIdsToDelete }, campaign: id });
      }

      await campaign.findByIdAndUpdate(id, { noOfQuests: questsToSave.length });
    }

    res.status(OK).json({ campaignId: id });
  } catch (error: any) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: error?.message || 'Failed to save campaign' });
  }
}

export const saveCampaignWithQuests = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    if (typeof req.body.reward === "string") try { req.body.reward = JSON.parse(req.body.reward); } catch { /* leave */ }
    if (typeof req.body.campaignQuests === "string") try { req.body.campaignQuests = JSON.parse(req.body.campaignQuests); } catch { /* leave */ }

    const { error } = validateCampaignData(req.body);
    if (error) {
      const emptyFields = getMissingFields(error);
      res.status(BAD_REQUEST).json({ error: `Missing required fields: ${emptyFields}` });
      return;
    }

    const hubFound = await hub.findById(req.admin.hub).lean();
    if (!hubFound) {
      res.status(BAD_REQUEST).json({ error: "create a hub to continue" });
      return;
    }

    const { id } = req.query as { id: string };

    let campaignId = id;
    if (!campaignId) {
      const coverImageBuffer = req.file?.buffer;

      if (!coverImageBuffer) {
        res.status(BAD_REQUEST).json({ error: "cover image is required" });
        return;
      }

      req.body.projectCoverImage = await uploadImg({
        file: coverImageBuffer,
        filename: req.file?.originalname,
        folder: "cover-images",
        maxSize: 2 * 1024 ** 2
      });
      const savedCampaign = await campaign.create(req.body);

      campaignId = savedCampaign._id.toString();
    } else {
      const campaignFound = await campaign.findById(campaignId).lean();
      if (!campaignFound) {
        res.status(NOT_FOUND).json({ error: "campaign not found" });
        return;
      }

      await campaign.findByIdAndUpdate(id, req.body.campaignData, { new: true });
    }

    const { error: questError } = validateCampaignQuestData(req.body.questData);
    if (questError) {
      const emptyFields = getMissingFields(questError);
      res.status(BAD_REQUEST).json({ error: `Missing required fields: ${emptyFields}` });
      return;
    }

    const createdQuests = [];

    const newQuests = [];

    for (const qd of req.body.questData) {
      const taskCheck = validateDiscordTaskConfig(qd as Record<string, any>);
      if (!taskCheck.success) {
        res.status(BAD_REQUEST).json({ error: taskCheck.error });
        return;
      }
      const questData = isDiscordCampaignTask(qd)
        ? { ...qd, guildId: hubFound.guildId }
        : { ...qd };

      if (qd.campaign && qd._id) {
        createdQuests.push({
          updateOne: {
            filter: { _id: qd._id },
            update: {
              $set: {
                ...questData,
              }
            }
          }
        });
      } else {
        qd.campaign = campaignId;
        qd.guildId = isDiscordCampaignTask(qd) ? hubFound.guildId : undefined;
        newQuests.push({ ...qd,  })
      }
    }

    if (createdQuests.length && !newQuests.length) {
      await campaignQuest.bulkWrite(createdQuests);
    } else if (!createdQuests.length && newQuests.length) {
      await campaignQuest.insertMany(newQuests);
    } else {
      await campaignQuest.bulkWrite(createdQuests);
      await campaignQuest.insertMany(newQuests);
    }

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: 'Failed to save campaign and quests' });
  }
}

export const deleteCampaignQuest = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { id } = req.query as { id: string };
    if (!id) {
      res.status(BAD_REQUEST).json({ error: "send the quest id" });
      return;
    }

    const questToBeDeleted = await campaignQuest.findById(id).lean();
    if (!questToBeDeleted) {
      res.status(BAD_REQUEST).json({ error: "quest id is invalid" });
      return;
    }

    await campaignQuest.findByIdAndDelete(id);

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error deleting campaign quest" });
  }
}

export const updateCamapaignQuest = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { id } = req.query as { id: string };
    if (!id) {
      res.status(BAD_REQUEST).json({ error: "send quest id" });
      return;
    }

    const exists = await campaignQuest.findById(id);
    if (!exists) {
      res.status(NOT_FOUND).json({ error: "quest not found, id is invalid" });
      return;
    }

    await campaignQuest.findByIdAndUpdate(id, req.body);

    res.status(NO_CONTENT).send();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error updating quest" });
  }
}

export const createUserHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    // Log received data for debugging
    console.log('[createUserHub] Received data:', {
      bodyKeys: Object.keys(req.body || {}),
      name: req.body?.name,
      description: req.body?.description,
      descriptionLength: req.body?.description?.length,
      reqId: req.id,
      hasAdmin: !!req.admin
    });

    // Handle both JSON body and FormData
    const bodyData = req.body || {};
    console.log('[createUserHub] Received request:', {
      userId: req.id,
      name: bodyData.name,
      description: bodyData.description,
      descriptionLength: bodyData.description?.length
    });
    const { error } = validateUserHubData(bodyData);
    
    if (error) {
      console.log('[createUserHub] Validation error:', error);
      const emptyFields = getMissingFields(error);

      res
        .status(BAD_REQUEST)
        .json({ error: `these field(s) are required: ${emptyFields}` });
      return;
    }

    const name = String(bodyData.name ?? "").trim().toUpperCase();

    const existingUserHubWithName = await userHub.findOne({ name });
    if (existingUserHubWithName) {
      if (String(existingUserHubWithName.superAdmin) === String(req.id)) {
        // Already their hub, just update description and return success
        await userHub.findByIdAndUpdate(existingUserHubWithName._id, {
          description: bodyData.description ?? existingUserHubWithName.description,
          xAccount: String(bodyData.xAccount ?? existingUserHubWithName.xAccount).trim(),
        });
        res.status(OK).json({ message: "user hub updated!" });
        return;
      }
      res.status(BAD_REQUEST).json({ error: "name is already in use" });
      return;
    }

    const xAccount = String(bodyData.xAccount ?? "").trim();

    const hubAdminDoc = await userHubAdmin.findById(req.id).lean();
    const adminName = (hubAdminDoc as any)?.name;
    let logoUrl = "";
    if (adminName) {
      const mainUser = await user.findOne({ username: adminName }).lean();
      logoUrl = (mainUser as any)?.profilePic || "";
    }
    const createdHub = await userHub.create({
      name,
      description: bodyData.description ?? "",
      xAccount,
      logo: logoUrl,
      userId: req.id,
      superAdmin: req.id,
    });

    await userHubAdmin.findByIdAndUpdate(req.id, { hub: createdHub._id, pendingTxHash: null });

    // Migrate any pending payment hash from user to hub (payment represents completed on-chain studio fee)
    if (hubAdminDoc?.pendingTxHash) {
      await userHub.findByIdAndUpdate(createdHub._id, { pendingTxHash: hubAdminDoc.pendingTxHash, $inc: { noOfPayments: 1 } });
    }

    console.log('[createUserHub] Hub created successfully:', {
      hubId: createdHub._id,
      name: createdHub.name,
      description: createdHub.description
    });

    res.status(CREATED).json({ message: "user hub created!" });
  } catch (error: any) {
    logger.error(error);
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: error?.message || "Error creating user hub" });
  }
};

export const updateUserHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const hubId = req.admin.hub;
    if (!hubId) {
      res.status(BAD_REQUEST).json({ error: "no hub associated with this account" });
      return;
    }

    const { name, bio, xAccount } = req.body;
    const logoFile = req.file?.buffer;

    const updateFields: any = {};
    if (name) updateFields.name = String(name).trim().toUpperCase();
    if (bio) updateFields.description = bio;
    if (xAccount) updateFields.xAccount = xAccount;

    if (logoFile) {
      updateFields.logo = await uploadImg({
        file: logoFile,
        filename: req.file?.originalname as string,
        folder: "user-hub-logos",
        maxSize: 1 * 1024 ** 2,
      });
    }

    const updated = await userHub.findByIdAndUpdate(hubId, updateFields, { new: true });
    if (!updated) {
      res.status(NOT_FOUND).json({ error: "user hub not found" });
      return;
    }

    res.status(OK).json({ message: "user hub updated!", hub: updated });
  } catch (error: any) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: error?.message || "Error updating user hub" });
  }
};

export const getUserHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const hubId = req.admin.hub;
    const hubFound = await userHub.findById(hubId).lean() as any;
    const adminHash = (req.admin as any).pendingTxHash ?? null;
    const pendingTxHash = hubFound?.pendingTxHash ?? adminHash;
    const adminInfo = { _id: req.id, name: req.admin.name, email: req.admin.email, role: "admin" };
    res.status(OK).json({ hub: hubFound ? { ...hubFound, pendingTxHash } : { pendingTxHash }, admin: adminInfo });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Error getting user hub" });
  }
};

export const deleteUserHub = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const hubId = req.admin.hub;
    if (!hubId) {
      res.status(BAD_REQUEST).json({ error: "no hub associated with this account" });
      return;
    }

    await userHub.findByIdAndDelete(hubId);
    await userHubAdmin.findByIdAndUpdate(req.id, { $unset: { hub: "" } });

    res.status(OK).json({ message: "user hub deleted successfully" });
  } catch (error: any) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: error?.message || "Error deleting user hub" });
  }
};



export const getUserProfileByWallet = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { address } = req.query as { address?: string };
    if (!address) {
      res.status(BAD_REQUEST).json({ error: "address query param is required" });
      return;
    }

    const userFound = await user.findOne({ address: address.toLowerCase() }, { username: 1, profilePic: 1 }).lean();
    if (!userFound) {
      res.status(NOT_FOUND).json({ error: "no user found for this wallet" });
      return;
    }

    res.status(OK).json({ username: userFound.username, profilePic: userFound.profilePic || "" });
  } catch (error: any) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: error?.message || "Error fetching user profile" });
  }
};
