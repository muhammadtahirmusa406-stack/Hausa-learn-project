import { Router } from "express";
import { db } from "@workspace/db";
import { unitsTable, lessonsTable, lessonCompletionsTable, userUnitUnlocksTable } from "@workspace/db";
import { eq, asc, and, isNull } from "drizzle-orm";

const router = Router();

function completionFilter(userId: string | null) {
  return userId ? eq(lessonCompletionsTable.userId, userId) : isNull(lessonCompletionsTable.userId);
}

function unlockFilter(userId: string | null) {
  return userId ? eq(userUnitUnlocksTable.userId, userId) : isNull(userUnitUnlocksTable.userId);
}

router.get("/units", async (req, res) => {
  try {
    const userId = req.isAuthenticated() ? req.user.id : null;

    const units = await db.select().from(unitsTable).orderBy(asc(unitsTable.order));
    const lessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.order));
    const completions = await db.select().from(lessonCompletionsTable).where(completionFilter(userId));
    const manualUnlocks = await db.select().from(userUnitUnlocksTable).where(unlockFilter(userId));

    const completedLessonIds = new Set(completions.map((c) => c.lessonId));
    const manualUnlockedUnitIds = new Set(manualUnlocks.map((u) => u.unitId));

    const lessonsByUnit = new Map<number, typeof lessons>();
    for (const lesson of lessons) {
      if (!lesson.unitId) continue;
      if (!lessonsByUnit.has(lesson.unitId)) lessonsByUnit.set(lesson.unitId, []);
      lessonsByUnit.get(lesson.unitId)!.push(lesson);
    }

    const result = units.map((unit, index) => {
      const unitLessons = lessonsByUnit.get(unit.id) ?? [];
      const completedCount = unitLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const totalCount = unitLessons.length;
      const isCompleted = totalCount > 0 && completedCount === totalCount;

      // First unit is always unlocked; subsequent units unlock when previous is completed or manually unlocked
      const prevUnit = index > 0 ? units[index - 1] : null;
      const prevUnitLessons = prevUnit ? (lessonsByUnit.get(prevUnit.id) ?? []) : [];
      const prevCompleted = prevUnit
        ? prevUnitLessons.every((l) => completedLessonIds.has(l.id))
        : true;

      const checkpointUnlocked = manualUnlockedUnitIds.has(unit.id);
      const isLocked = index > 0 && !prevCompleted && !checkpointUnlocked;

      return {
        id: unit.id,
        title: unit.title,
        description: unit.description,
        iconEmoji: unit.iconEmoji,
        order: unit.order,
        isLocked,
        isCompleted,
        completedLessons: completedCount,
        totalLessons: totalCount,
        xpRequired: unit.xpRequired,
        checkpointUnlocked,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get units");
    res.status(500).json({ error: "Failed to load units" });
  }
});

router.post("/units/:id/unlock", async (req, res) => {
  try {
    const unitId = Number(req.params.id);
    if (!unitId || isNaN(unitId)) return void res.status(400).json({ error: "Invalid unit id" });

    const unit = await db.select().from(unitsTable).where(eq(unitsTable.id, unitId)).limit(1);
    if (!unit.length) return void res.status(404).json({ error: "Unit not found" });

    const userId = req.isAuthenticated() ? req.user.id : null;

    // Check if already unlocked
    const existing = await db
      .select()
      .from(userUnitUnlocksTable)
      .where(
        and(
          userId ? eq(userUnitUnlocksTable.userId, userId) : isNull(userUnitUnlocksTable.userId),
          eq(userUnitUnlocksTable.unitId, unitId)
        )
      )
      .limit(1);

    if (!existing.length) {
      await db.insert(userUnitUnlocksTable).values({ userId, unitId });
    }

    res.json({ success: true, message: `Unit "${unit[0].title}" unlocked via checkpoint!` });
  } catch (err) {
    req.log.error({ err }, "Failed to unlock unit");
    res.status(500).json({ error: "Failed to unlock unit" });
  }
});

export default router;
