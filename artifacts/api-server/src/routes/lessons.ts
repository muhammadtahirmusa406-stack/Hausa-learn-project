import { Router } from "express";
import { db } from "@workspace/db";
import {
  lessonsTable,
  unitsTable,
  exercisesTable,
  lessonCompletionsTable,
  userProgressTable,
  activityFeedTable,
  userUnitUnlocksTable,
} from "@workspace/db";
import { eq, asc, sql, and, isNull } from "drizzle-orm";
import {
  CompleteLessonBody,
  CompleteLessonParams,
  GetLessonParams,
} from "@workspace/api-zod";

const router = Router();

function userFilter(userId: string | null) {
  return userId ? eq(lessonCompletionsTable.userId, userId) : isNull(lessonCompletionsTable.userId);
}

function progressFilter(userId: string | null) {
  return userId ? eq(userProgressTable.userId, userId) : isNull(userProgressTable.userId);
}

function unlockFilter(userId: string | null) {
  return userId ? eq(userUnitUnlocksTable.userId, userId) : isNull(userUnitUnlocksTable.userId);
}

/** For a given lesson order index, determine if it's unlocked based on unit progression */
function computeIsUnlocked(
  lessonIndex: number,
  lessons: typeof lessonsTable.$inferSelect[],
  completedIds: Set<number>,
  manuallyUnlockedUnitIds: Set<number>
): boolean {
  if (lessonIndex === 0) return true;

  const lesson = lessons[lessonIndex];
  const prevLesson = lessons[lessonIndex - 1];

  if (!prevLesson) return true;

  // If same unit: previous lesson must be completed
  if (lesson.unitId === prevLesson.unitId) {
    return completedIds.has(prevLesson.id);
  }

  // Crossing unit boundary: either previous unit is fully done OR this unit is manually unlocked
  if (lesson.unitId && manuallyUnlockedUnitIds.has(lesson.unitId)) return true;

  // Check all lessons in the previous unit are completed
  const prevUnitLessons = lessons.filter((l) => l.unitId === prevLesson.unitId);
  return prevUnitLessons.every((l) => completedIds.has(l.id));
}

router.get("/lessons", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const lessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
    const completions = await db.select().from(lessonCompletionsTable).where(userFilter(userId));
    const manualUnlocks = await db.select().from(userUnitUnlocksTable).where(unlockFilter(userId));
    const completedIds = new Set(completions.map((c) => c.lessonId));
    const manuallyUnlockedUnitIds = new Set(manualUnlocks.map((u) => u.unitId));

    const exerciseCounts = await db
      .select({ lessonId: exercisesTable.lessonId, count: sql<number>`count(*)::int` })
      .from(exercisesTable)
      .groupBy(exercisesTable.lessonId);
    const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

    res.json(
      lessons.map((lesson, index) => ({
        ...lesson,
        isCompleted: completedIds.has(lesson.id),
        isUnlocked: computeIsUnlocked(index, lessons, completedIds, manuallyUnlockedUnitIds),
        exerciseCount: countMap.get(lesson.id) ?? 0,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get lessons");
    res.status(500).json({ error: "Failed to load lessons" });
  }
});

router.get("/lessons/categories", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;
    const lessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
    const completions = await db.select().from(lessonCompletionsTable).where(userFilter(userId));
    const manualUnlocks = await db.select().from(userUnitUnlocksTable).where(unlockFilter(userId));
    const completedIds = new Set(completions.map((c) => c.lessonId));
    const manuallyUnlockedUnitIds = new Set(manualUnlocks.map((u) => u.unitId));

    const exerciseCounts = await db
      .select({ lessonId: exercisesTable.lessonId, count: sql<number>`count(*)::int` })
      .from(exercisesTable)
      .groupBy(exercisesTable.lessonId);
    const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

    const allLessons = lessons.map((lesson, index) => ({
      ...lesson,
      isCompleted: completedIds.has(lesson.id),
      isUnlocked: computeIsUnlocked(index, lessons, completedIds, manuallyUnlockedUnitIds),
      exerciseCount: countMap.get(lesson.id) ?? 0,
    }));

    const categoryMap = new Map<string, typeof allLessons>();
    for (const lesson of allLessons) {
      if (!categoryMap.has(lesson.category)) categoryMap.set(lesson.category, []);
      categoryMap.get(lesson.category)!.push(lesson);
    }

    res.json(
      Array.from(categoryMap.entries()).map(([name, catLessons]) => ({
        name,
        lessons: catLessons,
        completedCount: catLessons.filter((l) => l.isCompleted).length,
        totalCount: catLessons.length,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get lesson categories");
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/lessons/:id", async (req, res) => {
  try {
    const parsed = GetLessonParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

    const userId = req.isAuthenticated() ? req.user.id : null;
    const lesson = await db.select().from(lessonsTable).where(eq(lessonsTable.id, parsed.data.id)).limit(1);
    if (!lesson.length) return void res.status(404).json({ error: "Lesson not found" });

    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.lessonId, parsed.data.id))
      .orderBy(asc(exercisesTable.order));

    const allLessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
    const allCompletions = await db.select().from(lessonCompletionsTable).where(userFilter(userId));
    const manualUnlocks = await db.select().from(userUnitUnlocksTable).where(unlockFilter(userId));
    const completedIds = new Set(allCompletions.map((c) => c.lessonId));
    const manuallyUnlockedUnitIds = new Set(manualUnlocks.map((u) => u.unitId));
    const lessonIndex = allLessons.findIndex((l) => l.id === parsed.data.id);

    res.json({
      ...lesson[0],
      isCompleted: completedIds.has(parsed.data.id),
      isUnlocked: computeIsUnlocked(lessonIndex, allLessons, completedIds, manuallyUnlockedUnitIds),
      exerciseCount: exercises.length,
      exercises: exercises.map((e) => ({
        id: e.id,
        lessonId: e.lessonId,
        type: e.type,
        question: e.question,
        hausa: e.hausa ?? null,
        english: e.english ?? null,
        options: e.options ?? [],
        order: e.order,
        hint: e.hint ?? null,
        audioWord: e.audioWord ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get lesson");
    res.status(500).json({ error: "Failed to load lesson" });
  }
});

router.post("/lessons/:id/complete", async (req, res) => {
  try {
    const params = CompleteLessonParams.safeParse({ id: Number(req.params.id) });
    const body = CompleteLessonBody.safeParse(req.body);
    if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });

    const userId = req.isAuthenticated() ? req.user.id : null;
    const lesson = await db.select().from(lessonsTable).where(eq(lessonsTable.id, params.data.id)).limit(1);
    if (!lesson.length) return void res.status(404).json({ error: "Lesson not found" });

    const xpEarned = lesson[0].xpReward;

    await db.insert(lessonCompletionsTable).values({ lessonId: params.data.id, userId, score: body.data.score, xpEarned });

    let progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);

    if (!progress.length) {
      await db.insert(userProgressTable).values({ userId, totalXp: xpEarned, streak: 1, longestStreak: 1, level: 1, weeklyXp: xpEarned, dailyXp: xpEarned, dailyGoalXp: 50, lastActivityAt: new Date() });
      progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);
    } else {
      const cur = progress[0];
      const newXp = cur.totalXp + xpEarned;
      const newStreak = cur.streak + 1;
      const newLongest = Math.max(cur.longestStreak, newStreak);
      const newLevel = Math.floor(newXp / 100) + 1;
      await db
        .update(userProgressTable)
        .set({
          totalXp: newXp,
          weeklyXp: cur.weeklyXp + xpEarned,
          dailyXp: (cur.dailyXp ?? 0) + xpEarned,
          streak: newStreak,
          longestStreak: newLongest,
          level: newLevel,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userProgressTable.id, cur.id));
      progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);
    }

    await db.insert(activityFeedTable).values({ userId, type: "lesson_complete", description: `Completed "${lesson[0].title}"`, xp: xpEarned });

    const cur = progress[0];
    const isPerfect = body.data.score === (body.data as { score: number; totalQuestions?: number }).totalQuestions;

    res.json({
      xpEarned,
      totalXp: cur.totalXp,
      streak: cur.streak,
      isNewBest: cur.streak === cur.longestStreak,
      message: isPerfect ? `Perfect score! You earned ${xpEarned} XP!` : `Great job! You earned ${xpEarned} XP!`,
      newAchievements: [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to complete lesson");
    res.status(500).json({ error: "Failed to complete lesson" });
  }
});

export default router;
