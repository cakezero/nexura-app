import logger from "@/config/logger";
import { hub, userHub } from "@/models/hub.model";
import { hubAdmin } from "@/models/hub.model";
import { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "@/utils/status.utils";

/**
 * Studio Payment controller — handles the 0.1 $TRUST fee required
 * for hub owners to publish campaigns/quests from Nexura Studio.
 *
 * COMPARED TO:
 *   - Admin dashboard: /api/admin/publish-campaign → NO fee (free admin override)
 *   - Studio hub:     /api/hub/publish-campaign   → Requires payment here
 */

/** Middleware: validates hub has paid before allowing publish */
export const requireStudioPayment = async (req: GlobalRequest, res: GlobalResponse, next: GlobalNextFunction) => {
  try {
    const hubId = req.admin?.hub;
    if (!hubId) {
      res.status(BAD_REQUEST).json({ error: "no hub associated with this admin" });
      return;
    }

    // Check both project hubs and user hubs for a pending payment hash
    const [hubDoc, userHubDoc] = await Promise.all([
      hub.findById(hubId).select("pendingTxHash").lean(),
      userHub.findById(hubId).select("pendingTxHash").lean(),
    ]);

    const finalDoc = hubDoc || userHubDoc;
    if (!finalDoc) {
      res.status(NOT_FOUND).json({ error: "hub not found" });
      return;
    }

    // Skip payment validation if closing a quest/campaign
    if ((req.body as any)?.status === "Ended") {
      next();
      return;
    }

    const bodyHash = (req.body as any)?.txHash as string | undefined;
    const storedHash = (finalDoc as any).pendingTxHash || bodyHash;

    if (!storedHash) {
      res.status(FORBIDDEN).json({
        error: "No confirmed payment found. Please complete the 1 $TRUST launch fee first.",
      });
      return;
    }

    if (!(finalDoc as any).pendingTxHash && bodyHash) {
      await Promise.all([
        hub.findByIdAndUpdate(hubId, { pendingTxHash: bodyHash }),
        userHub.findByIdAndUpdate(hubId, { pendingTxHash: bodyHash }),
      ]);
    }

    req.paymentTxHash = storedHash;
    next();
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error validating studio payment" });
  }
};

/** Saves an on-chain payment tx hash for a studio hub */
export const savePaymentHash = async (req: GlobalRequest, res: GlobalResponse) => {
  try {
    const { txHash } = req.body;
    const hubId = req.admin.hub;
    if (hubId) {
      if (txHash) {
        await Promise.all([
          hub.findByIdAndUpdate(hubId, { pendingTxHash: txHash, $inc: { noOfPayments: 1 } }),
          userHub.findByIdAndUpdate(hubId, { pendingTxHash: txHash, $inc: { noOfPayments: 1 } }),
        ]);
      } else {
        await Promise.all([
          hub.findByIdAndUpdate(hubId, { pendingTxHash: null }),
          userHub.findByIdAndUpdate(hubId, { pendingTxHash: null }),
        ]);
      }
    } else {
      await hubAdmin.findByIdAndUpdate(req.id, { pendingTxHash: txHash ?? null });
    }
    res.status(OK).json({ message: "payment hash saved" });
  } catch (error) {
    logger.error(error);
    res.status(INTERNAL_SERVER_ERROR).json({ error: "error saving payment hash" });
  }
};

/** Clears the hub's pending payment hash after publish (called internally) */
export const consumePaymentHash = async (hubId: string) => {
  await Promise.all([
    hub.findByIdAndUpdate(hubId, { pendingTxHash: null }),
    userHub.findByIdAndUpdate(hubId, { pendingTxHash: null }),
  ]);
};
