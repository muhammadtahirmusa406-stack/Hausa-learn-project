import { db } from "@workspace/db";
import { userProgressTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";

export const MAX_LIVES = 5;
export const LIFE_REGENERATION_MS = 30 * 60 * 1000;
export const STREAK_WINDOW_MS = 24 * 60 * 60 * 1000;

export function userProgressWhere(userId: string | null) {
  return userId ? eq(userProgressTable.userId, userId) : isNull(userProgressTable.userId);
}

export async function ensureProgress(userId: string | null) {
  let rows = await db.select().from(userProgressTable).where(userProgressWhere(userId)).limit(1);
  if (!rows.length) {
    await db.insert(userProgressTable).values({
      userId,
      totalXp: 0,
      streak: 0,
      longestStreak: 0,
      level: 1,
      weeklyXp: 0,
      dailyXp: 0,
      dailyGoalXp: 50,
      currentLives: MAX_LIVES,
      maxLives: MAX_LIVES,
    });
    rows = await db.select().from(userProgressTable).where(userProgressWhere(userId)).limit(1);
  }
  return rows[0];
}

/**
 * Restore lives in fixed 30-minute intervals without ever exceeding maxLives.
 * Existing rows created before lives were added are also normalized here.
 */
export async function refreshLives(progress: typeof userProgressTable.$inferSelect) {
  const now = new Date();
  const maxLives = progress.maxLives || MAX_LIVES;
  const currentLives = Math.max(0, Math.min(progress.currentLives ?? maxLives, maxLives));

  if (currentLives >= maxLives) {
    if (progress.currentLives !== maxLives || progress.maxLives !== maxLives || progress.livesRestoredAt) {
      await db.update(userProgressTable).set({
        currentLives: maxLives,
        maxLives,
        livesRestoredAt: null,
        updatedAt: now,
      }).where(eq(userProgressTable.id, progress.id));
    }
    return { ...progress, currentLives: maxLives, maxLives, livesRestoredAt: null };
  }

  const anchor = progress.livesRestoredAt ?? now;
  const restored = Math.floor((now.getTime() - anchor.getTime()) / LIFE_REGENERATION_MS);
  const newLives = Math.min(maxLives, currentLives + Math.max(0, restored));
  const newAnchor = newLives >= maxLives
    ? null
    : restored > 0
      ? new Date(anchor.getTime() + restored * LIFE_REGENERATION_MS)
      : anchor;

  if (newLives !== progress.currentLives || progress.maxLives !== maxLives || newAnchor?.getTime() !== progress.livesRestoredAt?.getTime()) {
    await db.update(userProgressTable).set({
      currentLives: newLives,
      maxLives,
      livesRestoredAt: newAnchor,
      updatedAt: now,
    }).where(eq(userProgressTable.id, progress.id));
  }

  return { ...progress, currentLives: newLives, maxLives, livesRestoredAt: newAnchor };
}

export function nextLifeAt(progress: Pick<typeof userProgressTable.$inferSelect, "currentLives" | "maxLives" | "livesRestoredAt">) {
  if ((progress.currentLives ?? 0) >= (progress.maxLives ?? MAX_LIVES) || !progress.livesRestoredAt) return null;
  return new Date(progress.livesRestoredAt.getTime() + LIFE_REGENERATION_MS);
}

function isSameUtcDay(left: Date, right: Date) {
  return left.getUTCFullYear() === right.getUTCFullYear()
    && left.getUTCMonth() === right.getUTCMonth()
    && left.getUTCDate() === right.getUTCDate();
}

export function calculateNextStreak(currentStreak: number, lastActivityAt: Date | null, now = new Date()) {
  if (!lastActivityAt) return 1;
  const elapsed = now.getTime() - lastActivityAt.getTime();
  if (elapsed > STREAK_WINDOW_MS || elapsed < 0) return 1;
  if (isSameUtcDay(lastActivityAt, now)) return currentStreak;
  return currentStreak + 1;
}

export async function recordQualifyingActivity(
  progress: typeof userProgressTable.$inferSelect,
  xpEarned: number,
  now = new Date(),
) {
  const nextStreak = calculateNextStreak(progress.streak, progress.lastActivityAt, now);
  const longestStreak = Math.max(progress.longestStreak, nextStreak);
  const totalXp = progress.totalXp + xpEarned;
  await db.update(userProgressTable).set({
    totalXp,
    weeklyXp: progress.weeklyXp + xpEarned,
    dailyXp: (progress.dailyXp ?? 0) + xpEarned,
    streak: nextStreak,
    longestStreak,
    level: Math.floor(totalXp / 100) + 1,
    lastActivityAt: now,
    updatedAt: now,
  }).where(eq(userProgressTable.id, progress.id));
  return { totalXp, streak: nextStreak, longestStreak };
}