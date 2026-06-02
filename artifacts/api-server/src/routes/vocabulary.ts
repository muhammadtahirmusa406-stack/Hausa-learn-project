import { Router } from "express";
import { db } from "@workspace/db";
import { vocabularyTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { GetVocabularyQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/vocabulary", async (req, res) => {
  const parsed = GetVocabularyQueryParams.safeParse({
    category: req.query.category,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  if (!parsed.success) {
    return void res.status(400).json({ error: "Invalid query params" });
  }

  let query = db.select().from(vocabularyTable).$dynamic();

  if (parsed.data.category) {
    query = query.where(eq(vocabularyTable.category, parsed.data.category));
  }

  if (parsed.data.limit) {
    query = query.limit(parsed.data.limit);
  }

  const words = await query;
  res.json(words);
});

router.get("/vocabulary/random", async (req, res) => {
  const words = await db
    .select()
    .from(vocabularyTable)
    .orderBy(sql`RANDOM()`)
    .limit(10);

  res.json(words);
});

export default router;
