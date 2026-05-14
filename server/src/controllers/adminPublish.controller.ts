import type { NextFunction, Response } from "express";

/**
 * Admin Publish controller — explicitly NO fee required.
 *
 * The admin dashboard bypasses the 1000 $TRUST launch fee.
 * This middleware documents that intent clearly.
 *
 * COMPARED TO:
 *   - Admin dashboard: /api/admin/publish-campaign → THIS controller (free)
 *   - Studio hub:     /api/hub/publish-campaign   → studioPayment.controller.ts (fee required)
 */

/** Middleware: explicitly passes through with no payment check */
export const noPaymentRequired = (req: GlobalRequest, res: Response, next: NextFunction) => {
  req.paymentTxHash = "ADMIN_NO_FEE";
  next();
};
