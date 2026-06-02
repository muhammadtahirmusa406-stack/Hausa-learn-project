import { Router } from "express";
import { db } from "@workspace/db";
import { userProgressTable, lessonsTable, lessonCompletionsTable, activityFeedTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/progress", async (req, res) => {
  let progress = await db.select().from(userProgressTable).limit(1);

  if (!progress.length) {
    await db.insert(userProgressTable).values({
      totalXp: 0,
      streak: 0,
      longestStreak: 0,
      level: 1,
      weeklyXp: 0,
    });
    progress = await db.select().from(userProgressTable).limit(1);
  }

  const totalLessons = await db.select().from(lessonsTable);
  const completions = await db.select().from(lessonCompletionsTable);
  const completedIds = new Set(completions.map((c) => c.lessonId));

  const current = progress[0];
  res.json({
    totalXp: current.totalXp,
    streak: current.streak,
    completedLessons: completedIds.size,
    totalLessons: totalLessons.length,
    level: current.level,
    weeklyXp: current.weeklyXp,
    longestStreak: current.longestStreak,
  });
});

router.get("/progress/activity", async (req, res) => {
  const activity = await db
    .select()
    .from(activityFeedTable)
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
