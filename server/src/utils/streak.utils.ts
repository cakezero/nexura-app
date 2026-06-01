// Pure, dependency-free streak helpers so the daily check-in logic can be unit
// tested without importing the controller (which pulls in env parsing, Redis,
// the DB layer and on-chain clients at module load).

export type StreakStatus = "same-day" | "continued" | "inactive" | "broken";

export interface StreakEvaluation {
  status: StreakStatus;
  streakLost: boolean;
}

/** Returns the UTC calendar day of `date` as a YYYY-MM-DD key. */
export const toUtcDateKey = (date: Date): string => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
    .toISOString()
    .split("T")[0] as string;
};

/** Returns the YYYY-MM-DD key for the UTC day before `date`. */
export const previousUtcDateKey = (date: Date): string => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split("T")[0] as string;
};

/**
 * Decide whether a user's daily streak should be considered broken.
 *
 * The source of truth is the user's own `lastSignInDate` (a YYYY-MM-DD UTC key),
 * NOT the monthly `dailySignIn` record. The monthly record's `date` could lag
 * behind real check-ins, which previously caused active daily users to have
 * their streak reset to 0 the moment they opened the check-in modal.
 *
 * - same-day:   already signed in today -> streak intact
 * - continued:  signed in yesterday -> streak intact (next check-in extends it)
 * - inactive:   never signed in, or streak already 0 -> nothing to lose
 * - broken:     last sign-in is 2+ days old with a live streak -> reset
 */
export const evaluateDailyStreak = (
  lastSignInDate: string | null | undefined,
  streak: number,
  now: Date = new Date(),
): StreakEvaluation => {
  const today = toUtcDateKey(now);
  const yesterday = previousUtcDateKey(now);

  if (lastSignInDate === today) {
    return { status: "same-day", streakLost: false };
  }

  if (lastSignInDate === yesterday) {
    return { status: "continued", streakLost: false };
  }

  if (!lastSignInDate || streak <= 0) {
    return { status: "inactive", streakLost: false };
  }

  return { status: "broken", streakLost: true };
};
