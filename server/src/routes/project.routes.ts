import { Router } from "express";
import { upload } from "@/middlewares/auth.middleware";
import { projectAndAdminSignIn, projectSignUp, projectAdminSignUp, forgotPassword, resetPasswordProject, resetPasswordProjectAdmin, logoutProjectOrAdmin } from "@/controllers/project.auth.controller";
import { authenticateProject, authenticateProject2 } from "@/middlewares/auth.middleware";
import { fetchProjectCampaigns } from "@/controllers/campaign.controller";
import { validateCampaignSubmissions } from "@/controllers/project.controller";
import projectAppRoutes from "./project.app.routes";

const router = Router();

router
  .get("/get-campaigns", authenticateProject2, fetchProjectCampaigns)
  .post("/validate-campaign-submissions", authenticateProject2, validateCampaignSubmissions)
  .post("/sign-up", upload.single("logo"), projectSignUp)
  .post("/sign-in", projectAndAdminSignIn)
  .post("/logout", authenticateProject2, logoutProjectOrAdmin)
  .post("/reset-password", resetPasswordProject)
  .post("/reset-password-admin", resetPasswordProjectAdmin)
  .post("/forgot-password", forgotPassword)
  .post("/admin/sign-up", projectAdminSignUp)
  .use("/", authenticateProject, projectAppRoutes)

export default router;
