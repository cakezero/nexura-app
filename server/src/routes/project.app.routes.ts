import {
  addCampaignAddress,
  closeCampaign,
  createCampaign,
  deleteCampaign,
  publishCampaign,
  updateCampaign
} from "@/controllers/campaign.controller";
import {
  addProjectAdmin,
  deleteCampaignQuest,
  deleteProject,
  getCampaign,
  removeProjectAdmin,
  saveCampaign,
  saveCampaignWithQuests,
  updateCamapaignQuest,
  updateProject,
  validateCampaignSubmissions
} from "@/controllers/project.controller";
import { Router } from "express";
import { upload } from "@/config/multer";

const router = Router();

router
  .patch("/save-campaign-quests", upload.single("coverImage"), saveCampaignWithQuests)
  .patch("/save-campaign", upload.single("coverImage"), saveCampaign)
  .get("/get-campaign", getCampaign)
  .delete("/delete-project", deleteProject)
  .delete("/remove-admin", removeProjectAdmin)
  .patch("/update-project", upload.single("logo"), updateProject)
  .post("/add-admin", addProjectAdmin)
  .post("/create-campaign", upload.single("coverImage"), createCampaign)
  .delete("/delete-campaign-quest", deleteCampaignQuest)
  .delete("/delete-campaign", deleteCampaign)
  .patch("/update-campaign", upload.single("coverImage"), updateCampaign)
  .patch("/update-campaign-quest", updateCamapaignQuest)
  .patch("/close-campaign", closeCampaign)
  .patch("/add-campaign-address", addCampaignAddress)
  .patch("/publish-campaign", publishCampaign);

export default router;