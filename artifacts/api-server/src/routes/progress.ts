import { Router } from "express";
import { db } from "@workspace/db";
import { userProgressTable, lessonsTable, lessonCompletionsTable, activityFeedTable } from "@workspace/db";
import { desc, eq, isNull, gte, and } from "drizzle-orm";
import { ensureProgress, nextLifeAt, refreshLives } from "../lib/learning-state";

const router = Router();

function progressFilter(userId: string | null) {
  return userId ? eq(userProgressTable.userId, userId) : isNull(userProgressTable.userId);
}

function completionFilter(userId: string | null) {
  return userId ? eq(lessonCompletionsTable.userId, userId) : isNull(lessonCompletionsTable.userId);
}

function activityFilter(userId: string | null) {
  return userId ? eq(activityFeedTable.userId, userId) : isNull(activityFeedTable.userId);
}

router.get("/progress", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const progress = [await refreshLives(await ensureProgress(userId))];

    const totalLessons = await db.select().from(lessonsTable);
    const completions = await db.select().from(lessonCompletionsTable).where(completionFilter(userId));
    const completedIds = new Set(completions.map((c) => c.lessonId));
    const cur = progress[0];

    // Calculate daily XP earned today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCompletions = await db
      .select()
      .from(lessonCompletionsTable)
      .where(
        and(
          userId ? eq(lessonCompletionsTable.userId, userId) : isNull(lessonCompletionsTable.userId),
          gte(lessonCompletionsTable.completedAt, todayStart)
        )
      );
    const dailyXp = todayCompletions.reduce((sum, c) => sum + c.xpEarned, 0);
    const dailyGoalXp = cur.dailyGoalXp ?? 50;

    res.json({
      totalXp: cur.totalXp,
      streak: cur.streak,
      completedLessons: completedIds.size,
      totalLessons: totalLessons.length,
      level: cur.level,
      weeklyXp: cur.weeklyXp,
      longestStreak: cur.longestStreak,
      dailyGoalXp,
      dailyGoalCompleted: dailyXp >= dailyGoalXp,
      currentLives: cur.currentLives,
      maxLives: cur.maxLives,
      nextLifeAt: nextLifeAt(cur)?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get progress");
    res.status(500).json({ error: "Failed to load progress" });
  }
});

router.get("/progress/activity", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const activity = await db
      .select()
      .from(activityFeedTable)
      .where(activityFilter(userId))
      .orderBy(desc(activityFeedTable.createdAt))
      .limit(20);

    res.json(
      activity.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        xp: a.xp,
        createdAt: a.createdAt?.toISOString() ?? new Date().toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get activity feed");
    res.status(500).json({ error: "Failed to load activity" });
  }
});

export default router;
