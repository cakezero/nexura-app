import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticateUser } from "@/middlewares/auth.middleware";
import { graphConfig, graphScore, graphScores, pinProject, uploadLogo } from "@/controllers/socialGraph.controller";
import { acceptInvite, ambassadorEarnings, checkInvite, listInvites, payInvite } from "@/controllers/graphInvite.controller";

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: "Too many projects listed from this network. Try again in 15 minutes." },
});

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: "Too many invites from this network. Try again in 15 minutes." },
});

const router = Router();

router
  .get("/config", graphConfig)
  .post("/pin", pinLimiter, authenticateUser, pinProject)
  .post("/logo", pinLimiter, authenticateUser, uploadLogo)
  .get("/score/:address", graphScore)
  .get("/scores", graphScores)
  .get("/invites", listInvites)
  .get("/invites/check", checkInvite)
  .get("/invites/earnings", ambassadorEarnings)
  .post("/invites/accept", inviteLimiter, authenticateUser, acceptInvite)
  .post("/invites/pay", inviteLimiter, authenticateUser, payInvite);

export default router;
