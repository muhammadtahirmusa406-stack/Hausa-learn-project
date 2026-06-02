import { Router } from "express";
import { db } from "@workspace/db";
import { exercisesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { GetExercisesParams, SubmitAnswerBody, SubmitAnswerParams } from "@workspace/api-zod";

const router = Router();

router.get("/exercises/:lessonId", async (req, res) => {
  const parsed = GetExercisesParams.safeParse({
    lessonId: Number(req.params.lessonId),
  });

  if (!parsed.success) {
    return void res.status(400).json({ error: "Invalid lessonId" });
  }

  const exercises = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.lessonId, parsed.data.lessonId))
    .orderBy(asc(exercisesTable.order));

  res.json(exercises.map((e) => ({ ...e, options: e.options ?? [] })));
});

router.post("/exercises/:id/answer", async (req, res) => {
  const params = SubmitAnswerParams.safeParse({ id: Number(req.params.id) });
  const body = SubmitAnswerBody.safeParse(req.body);

  if (!params.success || !body.success) {
    return void res.status(400).json({ error: "Invalid input" });
  }

  const exercise = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.id, params.data.id))
    .limit(1);

  if (!exercise.length) {
    return void res.status(404).json({ error: "Exercise not found" });
  }

  const ex = exercise[0];
  const isCorrect =
    body.data.answer.trim().toLowerCase() ===
    ex.correctAnswer.trim().toLowerCase();

  res.json({
    isCorrect,
    correctAnswer: ex.correctAnswer,
    explanation: ex.explanation ?? null,
  });
});

export default router;
