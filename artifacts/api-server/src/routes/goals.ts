import { Router } from "express";
import { db } from "@workspace/db";
import { userProgressTable, lessonCompletionsTable, activityFeedTable } from "@workspace/db";
import { eq, isNull, gte, and } from "drizzle-orm";

const router = Router();

function progressFilter(userId: string | null) {
  return userId ? eq(userProgressTable.userId, userId) : isNull(userProgressTable.userId);
}

router.get("/goals/daily", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get today's lesson completions
    const todayCompletions = await db
      .select()
      .from(lessonCompletionsTable)
      .where(
        and(
          userId ? eq(lessonCompletionsTable.userId, userId) : isNull(lessonCompletionsTable.userId),
          gte(lessonCompletionsTable.completedAt, todayStart)
        )
      );

    // Get progress for daily XP
    const progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);

    const dailyGoalXp = progress.length ? (progress[0].dailyGoalXp ?? 50) : 50;
    const xpEarnedToday = todayCompletions.reduce((sum, c) => sum + c.xpEarned, 0);
    const lessonsCompletedToday = todayCompletions.length;

    // Daily word goal: 10 new words (tracked via activity feed)
    const todayActivity = await db
      .select()
      .from(activityFeedTable)
      .where(
        and(
          userId ? eq(activityFeedTable.userId, userId) : isNull(activityFeedTable.userId),
          gte(activityFeedTable.createdAt, todayStart)
        )
      );

    const wordsCompleted = Math.min(todayCompletions.length * 5, 10); // Estimate 5 words per lesson
    const wordsTarget = 10;
    const lessonsTarget = 2;
    const isCompleted = xpEarnedToday >= dailyGoalXp;

    res.json({
      xpTarget: dailyGoalXp,
      xpEarned: xpEarnedToday,
      wordsTarget,
      wordsCompleted,
      lessonsTarget,
      lessonsCompleted: lessonsCompletedToday,
      isCompleted,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get daily goal");
    res.status(500).json({ error: "Failed to load daily goal" });
  }
});

export default router;
