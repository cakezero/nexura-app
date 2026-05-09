import { userHubLogout } from "@/controllers/hub.auth.controller";
import { createUserHub, updateUserHub, deleteUserHub, getCampaignSubmissions, validateCampaignSubmissions, getUserHub } from "@/controllers/hub.controller";
import {
  createLesson,
  publishLesson,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  unpublishLesson,
  createMiniLesson,
  deleteLesson,
  deleteMiniLesson,
  updateLesson,
  updateMiniLesson,
  createVideoLesson,
  updateVideoLesson,
  deleteVideoLesson,
  reorderLessonContent,
  getLessonDetailsForAdmin,
  getHubLessons,
} from "@/controllers/lesson.controller";
import {
  createQuest,
  deleteQuest,
  saveQuest,
  deleteMiniQuest,
  saveQuestWithMiniQuests,
  getHubQuests,
  publishQuest,
} from "@/controllers/quest.controller";
import { Router } from "express";
import { upload } from "@/config/multer";

const router = Router();

router
  .post("/create-user-hub", upload.none(), createUserHub)
  .get("/get-quests", getHubQuests)
  .get("/me", getUserHub)
  .get("/quest-submissions", getCampaignSubmissions)
  .post("/validate-quest-submissions", validateCampaignSubmissions)
  .post("/create-lesson", upload.fields([{ name: "coverImage", maxCount: 1 }, { name: "profileImage", maxCount: 1 }]), createLesson)
  .patch("/update-lesson", updateLesson)
  .delete("/delete-lesson", deleteLesson)
  .post("/create-mini-lesson", createMiniLesson)
  .patch("/update-mini-lesson", updateMiniLesson)
  .delete("/delete-mini-lesson", deleteMiniLesson)
  .post("/publish-lesson", publishLesson)
  .post("/unpublish-lesson", unpublishLesson)
  .patch("/publish-quest", publishQuest)
  .post("/create-question", createQuestion)
  .patch("/update-question", updateQuestion)
  .delete("/delete-question", deleteQuestion)
  .get("/get-lessons", getHubLessons)
  .get("/get-lesson-details", getLessonDetailsForAdmin)
  .post("/create-video-lesson", createVideoLesson)
  .patch("/update-video-lesson", updateVideoLesson)
  .delete("/delete-video-lesson", deleteVideoLesson)
  .patch("/reorder-lesson-content", reorderLessonContent)
  .patch("/update-profile", upload.single("logo"), updateUserHub)
  .delete("/delete-profile", deleteUserHub)
  .post("/create-quest", upload.single("coverImage"), createQuest)
  .delete("/delete-mini-quest", deleteMiniQuest)
  .post("/save-quest", upload.single("coverImage"), saveQuest)
  .post("/save-mini-quest", upload.single("coverImage"), saveQuestWithMiniQuests)
  .post("/logout", userHubLogout)
  .delete("/delete-quest", deleteQuest);

export default router;
