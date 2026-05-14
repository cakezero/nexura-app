import {
  addCampaignAddress,
  closeCampaign,
  createCampaign,
  deleteCampaign,
  recordCampaignRewardsWithdrawal,
  reopenCampaign,
  updateCampaign
} from "@/controllers/campaign.controller";
import { createQuest, saveQuest, saveQuestWithMiniQuests, deleteMiniQuest, deleteQuest, getHubQuests, publishQuest } from "@/controllers/quest.controller";
import {
  addHubAdmin,
  deleteCampaignQuest,
  deleteHub,
  disconnectHubDiscord,
  getCampaign,
  removeHubAdmin,
  saveCampaign,
  saveCampaignWithQuests,
  updateCamapaignQuest,
  updateHub,
  updateIds,
  createHub,
  savePaymentHash,
  updateHubAdminRole,
  resendInvite,
  deleteInvite
} from "@/controllers/hub.controller";
import {
  createLesson,
  deleteLesson,
  updateLesson,
  createMiniLesson,
  updateMiniLesson,
  deleteMiniLesson,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createVideoLesson,
  updateVideoLesson,
  deleteVideoLesson,
  reorderLessonContent,
  publishLesson,
  unpublishLesson,
  updateQuestionIntro,
  getLessonDetailsForAdmin,
  getHubLessons
} from "@/controllers/lesson.controller";
import { Router } from "express";
import { upload } from "@/config/multer";
import { requireStudioPayment } from "@/controllers/studioPayment.controller";

const router = Router();

router
  .patch("/save-campaign-quests", upload.single("coverImage"), saveCampaignWithQuests)
  .patch("/save-campaign", upload.single("coverImage"), saveCampaign)
  .get("/get-campaign", getCampaign)
  .get("/get-quests", getHubQuests)
  .delete("/delete-hub", deleteHub)
  .delete("/delete-mini-quest", deleteMiniQuest)
  .post("/create-quest", upload.single("coverImage"), createQuest)
  .post("/save-quest", upload.single("coverImage"), saveQuest)
  .post("/save-mini-quest", upload.single("coverImage"), saveQuestWithMiniQuests)
  .patch("/publish-quest", requireStudioPayment, publishQuest)
  .delete("/delete-quest", deleteQuest)
  .patch("/update-ids", updateIds)
  .delete("/remove-admin", removeHubAdmin)
  .post("/create-hub", upload.single("logo"), createHub)
  .patch("/update-hub", upload.fields([{ name: "logo", maxCount: 1 }, { name: "document", maxCount: 1 }]), updateHub)
  .patch("/disconnect-discord", disconnectHubDiscord)
  .patch("/save-payment-hash", savePaymentHash)
  .post("/add-admin", addHubAdmin)
  .post("/resend-invite", resendInvite)
  .delete("/delete-invite", deleteInvite)
  .patch("/update-admin-role", updateHubAdminRole)
  .post("/create-campaign", upload.single("coverImage"), createCampaign)
  .delete("/delete-campaign-quest", deleteCampaignQuest)
  .delete("/delete-campaign", deleteCampaign)
  .patch("/update-campaign", upload.single("coverImage"), updateCampaign)
  .patch("/update-campaign-quest", updateCamapaignQuest)
  .patch("/close-campaign", closeCampaign)
  .patch("/reopen-campaign", reopenCampaign)
  .patch("/add-campaign-address", addCampaignAddress)
  .patch("/record-campaign-rewards-withdrawal", recordCampaignRewardsWithdrawal)
  .post("/create-lesson", upload.fields([{ name: "coverImage", maxCount: 1 }, { name: "profileImage", maxCount: 1 }]), createLesson)
  .delete("/delete-lesson", deleteLesson)
  .patch("/update-lesson", upload.fields([{ name: "coverImage", maxCount: 1 }, { name: "profileImage", maxCount: 1 }]), updateLesson)
  .post("/create-mini-lesson", createMiniLesson)
  .patch("/update-mini-lesson", updateMiniLesson)
  .delete("/delete-mini-lesson", deleteMiniLesson)
  .post("/create-question", createQuestion)
  .patch("/update-question", updateQuestion)
  .delete("/delete-question", deleteQuestion)
  .post("/create-video-lesson", createVideoLesson)
  .patch("/update-video-lesson", updateVideoLesson)
  .delete("/delete-video-lesson", deleteVideoLesson)
  .patch("/reorder-lesson-content", reorderLessonContent)
  .patch("/publish-lesson", requireStudioPayment, publishLesson)
  .patch("/unpublish-lesson", unpublishLesson)
  .patch("/update-question-intro", updateQuestionIntro)
  .get("/get-lesson-details", getLessonDetailsForAdmin)
  .get("/get-lessons", getHubLessons);

export default router;
