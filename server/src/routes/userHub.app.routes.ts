import { userHubLogout } from "@/controllers/hub.auth.controller";
import { createUserHub } from "@/controllers/hub.controller";
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
} from "@/controllers/quest.controller";
import { Router } from "express";

const router = Router();

router
  .post("/create-user-hub", createUserHub)
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
  // .patch("/update-profile", updateUserHub)
  // .delete("/delete-profile", deleteUserHub)
  .post("/create-quest", createQuest)
  .delete("/delete-mini-quest", deleteMiniQuest)
  .post("/save-quest", saveQuest)
  .post("/save-mini-quest", saveQuestWithMiniQuests)
  .post("/logout", userHubLogout)
  .delete("/delete-quest", deleteQuest);

export default router;
