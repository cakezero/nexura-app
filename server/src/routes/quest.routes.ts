import { Router } from "express";
import {
	claimEcosystemQuest,
	performCampaignQuest,
	setTimer,
	submitQuest,
	claimQuest,
	claimMiniQuest,
	createMiniQuest,
	startQuest
} from "@/controllers/quest.controller";
import { checkRelics, claimRelicReward, updateSubmission, validateAtlasTask, validatePortalTask, validateTrustNameTask } from "@/controllers/app.controller";

const router = Router();

router
	.post("/claim-ecosystem-quest", claimEcosystemQuest)
	.post("/set-timer", setTimer)
	.post("/create-mini-quest", createMiniQuest)
	.post("/start-quest", startQuest)
	.post("/check-portal-task", validatePortalTask)
	.post("/validate-atlas-task", validateAtlasTask)
	.post("/check-atlas-task", validateAtlasTask)
	.post("/verify-relic", checkRelics)
	.post("/claim-relic-reward", claimRelicReward)
	.post("/check-trust-name", validateTrustNameTask)
	.post("/claim-mini-quest", claimMiniQuest)
	.post("/update-submission", updateSubmission)
	.post("/claim-quest", claimQuest)
	.post("/perform-campaign-quest", performCampaignQuest)
	.post("/submit-quest", submitQuest);

export default router;
