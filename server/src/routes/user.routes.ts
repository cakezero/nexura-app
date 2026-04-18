import { Router } from "express";
import {
	fetchUser,
	referralInfo,
  updateUser,
  claimDepositXp,
	claimReferreralReward,
	updateBadge,
	performDailySignIn,
	setApproved,
	updateClaims,
	updateClaimsCreated
} from "@/controllers/app.controller";
import { logout } from "@/controllers/auth.controller";
import { upload } from "@/config/multer";

const router = Router();

router
  .get("/profile", fetchUser)
  .post("/claim-referral-reward", claimReferreralReward)
  .patch("/update-badge", updateBadge)
  .post("/claim-deposit-xp", claimDepositXp)
  .post("/update-claims", updateClaims)
  .post("/update-claims-created", updateClaimsCreated)
  .post("/set-approved", setApproved)
  .get("/referral-info", referralInfo)
  .post("/logout", logout)
  .post("/perform-daily-sign-in", performDailySignIn)
  .patch("/update", upload.single("profilePic"), updateUser);

export default router;
