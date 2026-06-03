import { Router } from "express";
import { db } from "@workspace/db";
import { userProgressTable, lessonsTable, lessonCompletionsTable, activityFeedTable } from "@workspace/db";
import { desc, eq, isNull } from "drizzle-orm";

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
  const userId = req.isAuthenticated() ? req.user.id : null;
  let progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);

  if (!progress.length) {
    await db.insert(userProgressTable).values({ userId, totalXp: 0, streak: 0, longestStreak: 0, level: 1, weeklyXp: 0 });
    progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);
  }

  const totalLessons = await db.select().from(lessonsTable);
  const completions = await db.select().from(lessonCompletionsTable).where(completionFilter(userId));
  const completedIds = new Set(completions.map((c) => c.lessonId));
  const cur = progress[0];

  res.json({
    totalXp: cur.totalXp,
    streak: cur.streak,
    completedLessons: completedIds.size,
    totalLessons: totalLessons.length,
    level: cur.level,
    weeklyXp: cur.weeklyXp,
    longestStreak: cur.longestStreak,
  });
});

router.get("/progress/activity", async (req, res) => {
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
});

export default router;
