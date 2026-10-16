import { Router } from "express";
import {
  createGovernanceProposal,
  executeGovernanceProposal,
  getGovernance,
  voteOnGovernanceProposal,
} from "@/controllers/governance.controller";

// Mounted at /hub/governance behind authenticateHubAdmin2 (any hub admin).
// Role and signer checks happen in the controller.
const router = Router();

router
  .get("/", getGovernance)
  .post("/proposals", createGovernanceProposal)
  .post("/proposals/:ref/vote", voteOnGovernanceProposal)
  .post("/proposals/:ref/execute", executeGovernanceProposal);

export default router;
