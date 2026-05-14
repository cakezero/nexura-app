/**
 * Re-exports — split into two explicit controllers:
 *   - studioPayment.controller.ts  → fee required for hub publishing
 *   - adminPublish.controller.ts   → no fee for admin dashboard
 */
export { requireStudioPayment, savePaymentHash, consumePaymentHash } from "./studioPayment.controller";
export { noPaymentRequired } from "./adminPublish.controller";
