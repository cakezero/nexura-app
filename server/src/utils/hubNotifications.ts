import logger from "@/config/logger";
import { hub, hubAdmin } from "@/models/hub.model";
import { hubNotification } from "@/models/hubNotification.model";

/** Labels for the project settings fields, as the notice shows them. */
export const PROJECT_FIELD_LABELS: Record<string, string> = {
  name: "project name", description: "description", categories: "categories", website: "website", logo: "logo", document: "document",
  xAccount: "X account", discord: "Discord server", telegram: "Telegram",
};
const SOCIAL_FIELDS = new Set(["xAccount", "discord", "telegram"]);

/**
 * Tells the hub's Owner and Super Admins (everyone but the person who made it) that the project
 * settings changed. Never throws: a failed notice never blocks the change itself.
 */
export async function notifyProjectChange(req: any, fields: string[]) {
  try {
    const hubId = req.admin?.hub;
    if (!hubId || !fields.length || req.isPlatformAdmin) return;
    const [h, superAdmins] = await Promise.all([
      hub.findById(hubId).select("superAdmin").lean() as Promise<any>,
      hubAdmin.find({ hub: hubId, role: "superadmin" }).select("_id").lean(),
    ]);
    const ids = new Set([...superAdmins.map(a => String(a._id)), ...(h?.superAdmin ? [String(h.superAdmin)] : [])]);
    ids.delete(String(req.id));
    if (!ids.size) return;
    await hubNotification.create({
      hub: hubId, kind: "project", actor: req.id, actorName: String(req.admin?.name ?? ""),
      changes: [...new Set(fields.map(f => PROJECT_FIELD_LABELS[f] ?? f))],
      tab: fields.every(f => SOCIAL_FIELDS.has(f)) ? "accounts" : "project",
      recipients: [...ids],
    });
  } catch (err) {
    logger.warn(`project change notice failed: ${(err as Error)?.message ?? err}`);
  }
}
