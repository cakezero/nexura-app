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
} from "@/controllers/lesson.controller";
import {
  createQuest,
  deleteQuest,
  saveQuest,
  deleteMiniQuest,
  saveQuestWithMiniQuests,
  getHubQuests,
} from "@/controllers/quest.controller";
import { Router } from "express";
import { upload } from "@/config/multer";

const router = Router();

router
  .post("/create-user-hub", upload.single("logo"), createUserHub)
  .get("/get-quests", getHubQuests)
  .get("/me", getUserHub)
  .get("/quest-submissions", getCampaignSubmissions)
  .post("/validate-quest-submissions", validateCampaignSubmissions)
  .post("/create-lesson", createLesson)
  .patch("/update-lesson", updateLesson)
  .delete("/delete-lesson", deleteLesson)
  .post("/create-mini-lesson", createMiniLesson)
  .patch("/update-mini-lesson", updateMiniLesson)
  .delete("/delete-mini-lesson", deleteMiniLesson)
  .post("/publish-lesson", publishLesson)
  .post("/unpublish-lesson", unpublishLesson)
  .post("/create-question", createQuestion)
  .patch("/update-question", updateQuestion)
  .delete("/delete-question", deleteQuestion)
  .patch("/update-profile", upload.single("logo"), updateUserHub)
  .delete("/delete-profile", deleteUserHub)
  .post("/create-quest", upload.single("coverImage"), createQuest)
  .delete("/delete-mini-quest", deleteMiniQuest)
  .post("/save-quest", upload.single("coverImage"), saveQuest)
  .post("/save-mini-quest", upload.single("coverImage"), saveQuestWithMiniQuests)
  .post("/logout", userHubLogout)
  .delete("/delete-quest", deleteQuest);

export default router;
