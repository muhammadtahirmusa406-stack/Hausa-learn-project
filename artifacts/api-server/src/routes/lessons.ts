import { Router } from "express";
import { db } from "@workspace/db";
import {
  lessonsTable,
  exercisesTable,
  lessonCompletionsTable,
  userProgressTable,
  activityFeedTable,
} from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";
import {
  CompleteLessonBody,
  CompleteLessonParams,
  GetLessonParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/lessons", async (req, res) => {
  const lessons = await db
    .select()
    .from(lessonsTable)
    .orderBy(asc(lessonsTable.order));

  const completions = await db.select().from(lessonCompletionsTable);
  const completedIds = new Set(completions.map((c) => c.lessonId));

  const exerciseCounts = await db
    .select({
      lessonId: exercisesTable.lessonId,
      count: sql<number>`count(*)::int`,
    })
    .from(exercisesTable)
    .groupBy(exercisesTable.lessonId);

  const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

  const result = lessons.map((lesson, index) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
    isUnlocked: index === 0 || completedIds.has(lessons[index - 1]?.id),
    exerciseCount: countMap.get(lesson.id) ?? 0,
  }));

  res.json(result);
});

router.get("/lessons/categories", async (req, res) => {
  const lessons = await db
    .select()
    .from(lessonsTable)
    .orderBy(asc(lessonsTable.order));

  const completions = await db.select().from(lessonCompletionsTable);
  const completedIds = new Set(completions.map((c) => c.lessonId));

  const exerciseCounts = await db
    .select({
      lessonId: exercisesTable.lessonId,
      count: sql<number>`count(*)::int`,
    })
    .from(exercisesTable)
    .groupBy(exercisesTable.lessonId);

  const countMap = new Map(exerciseCounts.map((e) => [e.lessonId, e.count]));

  const categoryMap = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    if (!categoryMap.has(lesson.category)) {
      categoryMap.set(lesson.category, []);
    }
    categoryMap.get(lesson.category)!.push(lesson);
  }

  const allLessons = lessons.map((lesson, index) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
    isUnlocked: index === 0 || completedIds.has(lessons[index - 1]?.id),
    exerciseCount: countMap.get(lesson.id) ?? 0,
  }));

  const allLessonsMap = new Map(allLessons.map((l) => [l.id, l]));

  const categories = Array.from(categoryMap.entries()).map(
    ([name, catLessons]) => {
      const enriched = catLessons.map((l) => allLessonsMap.get(l.id)!);
      return {
        name,
        lessons: enriched,
        completedCount: enriched.filter((l) => l.isCompleted).length,
        totalCount: enriched.length,
      };
    }
  );

  res.json(categories);
});

router.get("/lessons/:id", async (req, res) => {
  const parsed = GetLessonParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  const lesson = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, parsed.data.id))
    .limit(1);

  if (!lesson.length) return void res.status(404).json({ error: "Lesson not found" });

  const exercises = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.lessonId, parsed.data.id))
    .orderBy(asc(exercisesTable.order));

  const completions = await db
    .select()
    .from(lessonCompletionsTable)
    .where(eq(lessonCompletionsTable.lessonId, parsed.data.id));

  const allLessons = await db
    .select()
    .from(lessonsTable)
    .orderBy(asc(lessonsTable.order));

  const allCompletions = await db.select().from(lessonCompletionsTable);
  const completedIds = new Set(allCompletions.map((c) => c.lessonId));

  const lessonIndex = allLessons.findIndex((l) => l.id === parsed.data.id);

  const safeExercises = exercises.map((e) => ({
    ...e,
    options: e.options ?? [],
  }));

  res.json({
    ...lesson[0],
    isCompleted: completedIds.has(parsed.data.id),
    isUnlocked:
      lessonIndex === 0 || completedIds.has(allLessons[lessonIndex - 1]?.id),
    exerciseCount: exercises.length,
    exercises: safeExercises,
  });
});

router.post("/lessons/:id/complete", async (req, res) => {
  const params = CompleteLessonParams.safeParse({ id: Number(req.params.id) });
  const body = CompleteLessonBody.safeParse(req.body);

  if (!params.success || !body.success) {
    return void res.status(400).json({ error: "Invalid input" });
  }

  const lesson = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, params.data.id))
    .limit(1);

  if (!lesson.length) return void res.status(404).json({ error: "Lesson not found" });

  const xpEarned = lesson[0].xpReward;

  await db.insert(lessonCompletionsTable).values({
    lessonId: params.data.id,
    score: body.data.score,
    xpEarned,
  });

  let progress = await db.select().from(userProgressTable).limit(1);

  if (!progress.length) {
    await db.insert(userProgressTable).values({
      totalXp: xpEarned,
      streak: 1,
      longestStreak: 1,
      level: 1,
      weeklyXp: xpEarned,
      lastActivityAt: new Date(),
    });
    progress = await db.select().from(userProgressTable).limit(1);
  } else {
    const current = progress[0];
    const newXp = current.totalXp + xpEarned;
    const newWeeklyXp = current.weeklyXp + xpEarned;
    const newStreak = current.streak + 1;
    const newLongest = Math.max(current.longestStreak, newStreak);
    const newLevel = Math.floor(newXp / 100) + 1;

    await db
      .update(userProgressTable)
      .set({
        totalXp: newXp,
        weeklyXp: newWeeklyXp,
        streak: newStreak,
        longestStreak: newLongest,
        level: newLevel,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userProgressTable.id, current.id));

    progress = await db.select().from(userProgressTable).limit(1);
  }

  await db.insert(activityFeedTable).values({
    type: "lesson_complete",
    description: `Completed "${lesson[0].title}"`,
    xp: xpEarned,
  });

  const current = progress[0];
  res.json({
    xpEarned,
    totalXp: current.totalXp,
    streak: current.streak,
    isNewBest: current.streak === current.longestStreak,
    message: `Great job! You earned ${xpEarned} XP!`,
  });
});

export default router;
