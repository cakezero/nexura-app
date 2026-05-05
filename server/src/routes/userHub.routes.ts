import { authenticateUserHub } from '@/middlewares/auth.middleware';
import userHubAppRoutes from './userHub.app.routes';
import { Router } from 'express';
import { userHubAdminSignUp, userHubSignIn, userHubResetPassword, userHubForgotPassword } from '@/controllers/hub.auth.controller';

const router = Router();

router
  .post("/sign-in", userHubSignIn)
  .post("/sign-up", userHubAdminSignUp)
  .post("/forgot-password", userHubForgotPassword)
  .post("/reset-password", userHubResetPassword)
  .use("/", authenticateUserHub, userHubAppRoutes);

export default router;