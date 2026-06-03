import { Router } from "express";
import { db } from "@workspace/db";
import {
  lessonsTable,
  exercisesTable,
  lessonCompletionsTable,
  userProgressTable,
  activityFeedTable,
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

router.get("/lessons", async (req, res) => {
  const userId = req.isAuthenticated() ? req.user.id : null;
  const lessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
  const completions = await db.select().from(lessonCompletionsTable).where(userFilter(userId));
  const completedIds = new Set(completions.map((c) => c.lessonId));
  const exerciseCounts = await db
    .select({ lessonId: exercisesTable.lessonId, count: sql<number>`count(*)::int` })
    .from(exercisesTable)
    .groupBy(exercisesTable.lessonId);
  const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

  res.json(
    lessons.map((lesson, index) => ({
      ...lesson,
      isCompleted: completedIds.has(lesson.id),
      isUnlocked: index === 0 || completedIds.has(lessons[index - 1]?.id),
      exerciseCount: countMap.get(lesson.id) ?? 0,
    }))
  );
});

router.get("/lessons/categories", async (req, res) => {
  const userId = req.isAuthenticated() ? req.user.id : null;
  const lessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
  const completions = await db.select().from(lessonCompletionsTable).where(userFilter(userId));
  const completedIds = new Set(completions.map((c) => c.lessonId));
  const exerciseCounts = await db
    .select({ lessonId: exercisesTable.lessonId, count: sql<number>`count(*)::int` })
    .from(exercisesTable)
    .groupBy(exercisesTable.lessonId);
  const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

  const categoryMap = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    if (!categoryMap.has(lesson.category)) categoryMap.set(lesson.category, []);
    categoryMap.get(lesson.category)!.push(lesson);
  }

  const allLessons = lessons.map((lesson, index) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
    isUnlocked: index === 0 || completedIds.has(lessons[index - 1]?.id),
    exerciseCount: countMap.get(lesson.id) ?? 0,
  }));
  const allLessonsMap = new Map(allLessons.map((l) => [l.id, l]));

  res.json(
    Array.from(categoryMap.entries()).map(([name, catLessons]) => {
      const enriched = catLessons.map((l) => allLessonsMap.get(l.id)!);
      return { name, lessons: enriched, completedCount: enriched.filter((l) => l.isCompleted).length, totalCount: enriched.length };
    })
  );
});

router.get("/lessons/:id", async (req, res) => {
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
  const completedIds = new Set(allCompletions.map((c) => c.lessonId));
  const lessonIndex = allLessons.findIndex((l) => l.id === parsed.data.id);

  res.json({
    ...lesson[0],
    isCompleted: completedIds.has(parsed.data.id),
    isUnlocked: lessonIndex === 0 || completedIds.has(allLessons[lessonIndex - 1]?.id),
    exerciseCount: exercises.length,
    exercises: exercises.map((e) => ({ ...e, options: e.options ?? [] })),
  });
});

router.post("/lessons/:id/complete", async (req, res) => {
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
    await db.insert(userProgressTable).values({ userId, totalXp: xpEarned, streak: 1, longestStreak: 1, level: 1, weeklyXp: xpEarned, lastActivityAt: new Date() });
    progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);
  } else {
    const cur = progress[0];
    const newXp = cur.totalXp + xpEarned;
    const newStreak = cur.streak + 1;
    const newLongest = Math.max(cur.longestStreak, newStreak);
    await db.update(userProgressTable).set({ totalXp: newXp, weeklyXp: cur.weeklyXp + xpEarned, streak: newStreak, longestStreak: newLongest, level: Math.floor(newXp / 100) + 1, lastActivityAt: new Date(), updatedAt: new Date() }).where(eq(userProgressTable.id, cur.id));
    progress = await db.select().from(userProgressTable).where(progressFilter(userId)).limit(1);
  }

  await db.insert(activityFeedTable).values({ userId, type: "lesson_complete", description: `Completed "${lesson[0].title}"`, xp: xpEarned });

  const cur = progress[0];
  res.json({ xpEarned, totalXp: cur.totalXp, streak: cur.streak, isNewBest: cur.streak === cur.longestStreak, message: `Great job! You earned ${xpEarned} XP!` });
});

export default router;
