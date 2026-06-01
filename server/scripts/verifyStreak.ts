/**
 * Standalone verification for the daily check-in streak fix.
 *
 * Exercises the real `evaluateDailyStreak` helper that `fetchDailyXpDetails`
 * now uses, proving that signing in every day never reports the streak as lost,
 * including across month/year boundaries (the case the old monthly-record logic
 * got wrong). Run with: `bun run scripts/verifyStreak.ts` from the server dir.
 */
import assert from "node:assert/strict";
import {
  evaluateDailyStreak,
  toUtcDateKey,
  previousUtcDateKey,
} from "../src/utils/streak.utils";

let passed = 0;
let failed = 0;

const check = (name: string, fn: () => void) => {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(err as Error).message}`);
  }
};

const at = (iso: string) => new Date(iso);

console.log("daily streak evaluation");

check("already signed in today -> not lost", () => {
  const now = at("2026-06-01T08:00:00Z");
  const r = evaluateDailyStreak(toUtcDateKey(now), 5, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "same-day");
});

check("signed in yesterday -> not lost (streak continues)", () => {
  const now = at("2026-06-01T08:00:00Z");
  const r = evaluateDailyStreak(previousUtcDateKey(now), 5, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "continued");
});

check("gap of 2+ days with a live streak -> lost", () => {
  const now = at("2026-06-03T08:00:00Z");
  const r = evaluateDailyStreak("2026-06-01", 5, now);
  assert.equal(r.streakLost, true);
  assert.equal(r.status, "broken");
});

check("brand new user (no lastSignInDate) -> not lost", () => {
  const now = at("2026-06-01T08:00:00Z");
  const r = evaluateDailyStreak(null, 0, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "inactive");
});

check("already-reset streak (0) -> not lost again", () => {
  const now = at("2026-06-10T08:00:00Z");
  const r = evaluateDailyStreak("2026-06-01", 0, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "inactive");
});

check("late-in-day check still counts as same day (UTC)", () => {
  const now = at("2026-06-01T23:59:59Z");
  const r = evaluateDailyStreak("2026-06-01", 9, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "same-day");
});

check("month boundary: signed in May 31, now Jun 1 -> continued", () => {
  const now = at("2026-06-01T00:30:00Z");
  const r = evaluateDailyStreak("2026-05-31", 12, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "continued");
});

check("year boundary: signed in Dec 31, now Jan 1 -> continued", () => {
  const now = at("2026-01-01T06:00:00Z");
  const r = evaluateDailyStreak("2025-12-31", 30, now);
  assert.equal(r.streakLost, false);
  assert.equal(r.status, "continued");
});

// The reported bug: user checks in every single day. Mirror what
// performDailySignIn now does (lastSignInDate advances to today's key, streak
// increments) and confirm opening the modal never reports the streak as lost.
check("30 consecutive daily check-ins are never reported lost", () => {
  let lastSignInDate: string | null = null;
  let streak = 0;

  for (let day = 0; day < 30; day++) {
    const now = new Date(Date.UTC(2026, 4, 5, 9, 0, 0)); // start May 5, 2026
    now.setUTCDate(now.getUTCDate() + day);

    // What the modal does on open BEFORE checking in: must not be "lost"
    // as long as the user was here yesterday (or it's their first day).
    const beforeCheckIn = evaluateDailyStreak(lastSignInDate, streak, now);
    assert.equal(
      beforeCheckIn.streakLost,
      false,
      `day ${day}: opening modal wrongly reported streak lost (last=${lastSignInDate}, streak=${streak})`,
    );

    // perform-daily-sign-in: advance the source of truth.
    const todayKey = toUtcDateKey(now);
    streak = lastSignInDate === previousUtcDateKey(now) || lastSignInDate === null
      ? streak + 1
      : 1;
    lastSignInDate = todayKey;
  }

  assert.equal(streak, 30, `expected a 30-day streak, got ${streak}`);
});

check("skipping a day breaks the streak, then a fresh streak starts", () => {
  // Active 5-day streak, last check-in 2 days ago -> lost on open.
  let lastSignInDate = "2026-06-01";
  let streak = 5;
  const openOn = at("2026-06-03T09:00:00Z");
  const r = evaluateDailyStreak(lastSignInDate, streak, openOn);
  assert.equal(r.streakLost, true);

  // Controller would reset streak to 0; next check-in starts a new streak at 1.
  streak = 0;
  const checkInDay = at("2026-06-03T09:05:00Z");
  streak = lastSignInDate === previousUtcDateKey(checkInDay) ? streak + 1 : 1;
  lastSignInDate = toUtcDateKey(checkInDay);
  assert.equal(streak, 1);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
