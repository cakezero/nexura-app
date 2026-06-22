// Human-readable label for ANY xpLog `type` — used on the XP history page so every
// claimed XP shows where it came from (manual sends + auto-generated rewards).
// Kept in sync with the dashboard's xpTags.ts.
const XP_TYPE_LABELS: Record<string, string> = {
  // manual-send tags
  wotw: "WOTW",
  contest: "Contest",
  spotlight: "Spotlight",
  campaign: "Campaign",
  quest: "Quest",
  // auto-generated / other sources
  lesson: "Lesson",
  "daily-xp": "Daily Check-in",
  "daily-xp-streak-reward": "Milestone Reward",
  "milestone-reward": "Milestone Reward",
  "quest-creation": "Quest Creation",
  "ecosystem-quest": "Ecosystem Quest",
  referral: "Referral",
  single: "Manual",
  batch: "Manual (batch)",
};

export function xpTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return XP_TYPE_LABELS[type] ?? type;
}
