import { Router } from "express";
import { db, exercisesTable, lessonRetryQueueTable, userProgressTable } from "@workspace/db";
import { eq, asc, and, isNull } from "drizzle-orm";
import { GetExercisesParams, SubmitAnswerBody, SubmitAnswerParams } from "@workspace/api-zod";
import { ensureProgress, nextLifeAt, refreshLives, LIFE_REGENERATION_MS } from "../lib/learning-state";

const router = Router();

router.get("/exercises/:lessonId", async (req, res) => {
  try {
    const parsed = GetExercisesParams.safeParse({ lessonId: Number(req.params.lessonId) });
    if (!parsed.success) return void res.status(400).json({ error: "Invalid lessonId" });

    const exercises = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.lessonId, parsed.data.lessonId))
      .orderBy(asc(exercisesTable.order));

    res.json(exercises.map((e) => ({ ...e, options: e.options ?? [], retryType: null })));
  } catch (err) {
    req.log.error({ err }, "Failed to get exercises");
    res.status(500).json({ error: "Failed to load exercises" });
  }
});

router.post("/exercises/:id/answer", async (req, res) => {
  try {
    const params = SubmitAnswerParams.safeParse({ id: Number(req.params.id) });
    const body = SubmitAnswerBody.safeParse(req.body);
    if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });

    const exercise = await db
      .select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, params.data.id))
      .limit(1);
    if (!exercise.length) return void res.status(404).json({ error: "Exercise not found" });

    const userId = req.isAuthenticated() ? req.user.id : null;
    const ex = exercise[0];
    const progress = await refreshLives(await ensureProgress(userId));
    const retryFilter = userId
      ? eq(lessonRetryQueueTable.userId, userId)
      : isNull(lessonRetryQueueTable.userId);
    const existingRetry = await db
      .select()
      .from(lessonRetryQueueTable)
      .where(and(retryFilter, eq(lessonRetryQueueTable.exerciseId, ex.id)))
      .limit(1);

    const isCorrect = body.data.answer.trim().toLowerCase() === ex.correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      if (existingRetry.length) {
        await db.delete(lessonRetryQueueTable).where(eq(lessonRetryQueueTable.id, existingRetry[0].id));
      }
      return void res.json({
        isCorrect: true,
        correctAnswer: ex.correctAnswer,
        explanation: ex.explanation ?? null,
        livesRemaining: progress.currentLives,
        retryQueued: false,
      });
    }

    const now = new Date();
    const livesRemaining = Math.max(0, progress.currentLives - 1);
    await db.update(userProgressTable)
      .set({
        currentLives: livesRemaining,
        livesRestoredAt: progress.livesRestoredAt ?? now,
        updatedAt: now,
      })
      .where(eq(userProgressTable.id, progress.id));

    if (existingRetry.length) {
      await db.update(lessonRetryQueueTable).set({
        attempts: existingRetry[0].attempts + 1,
        updatedAt: now,
      }).where(eq(lessonRetryQueueTable.id, existingRetry[0].id));
    } else {
      const retryType = ex.type === "multiple_choice" || ex.type === "translation" || ex.type === "listening"
        ? "typing"
        : ex.type === "typing" || ex.type === "fill_blank"
          ? "multiple_choice"
          : "typing";
      await db.insert(lessonRetryQueueTable).values({
        userId,
        lessonId: ex.lessonId,
        exerciseId: ex.id,
        retryType,
        attempts: 1,
      });
    }

    res.json({
      isCorrect: false,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation ?? null,
      livesRemaining,
      retryQueued: true,
      nextLifeAt: livesRemaining < progress.maxLives
        ? new Date((progress.livesRestoredAt ?? now).getTime() + LIFE_REGENERATION_MS).toISOString()
        : nextLifeAt(progress)?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit answer");
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

export default router;
