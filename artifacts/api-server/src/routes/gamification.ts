import { Router } from "express";
import { db } from "@workspace/db";
import {
  achievementsTable,
  userAchievementsTable,
  dailyChallengesTable,
  dailyChallengeCompletionsTable,
  userProgressTable,
  activityFeedTable,
  usersTable,
  lessonCompletionsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { SubmitAnswerBody } from "@workspace/api-zod";

const router = Router();

router.get("/achievements", async (req, res) => {
  const all = await db.select().from(achievementsTable);
  const userId = req.isAuthenticated() ? req.user.id : null;

  const unlocked = await db
    .select()
    .from(userAchievementsTable)
    .where(userId ? eq(userAchievementsTable.userId, userId) : sql`1=0`);

  const unlockedMap = new Map(
    unlocked.map((u) => [u.achievementKey, u.unlockedAt])
  );

  res.json(
    all.map((a) => ({
      ...a,
      isUnlocked: unlockedMap.has(a.key),
      unlockedAt: unlockedMap.get(a.key)?.toISOString() ?? null,
    }))
  );
});

router.get("/leaderboard", async (req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(usersTable)
    .limit(20);

  const progressRows = await db.select().from(userProgressTable);
  const progressMap = new Map(progressRows.map((p) => [p.userId ?? "guest", p]));

  const entries = users
    .map((u) => {
      const prog = progressMap.get(u.id);
      return {
        userId: u.id,
        displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Anonymous",
        totalXp: prog?.totalXp ?? 0,
        streak: prog?.streak ?? 0,
        level: prog?.level ?? 1,
        profileImageUrl: u.profileImageUrl ?? null,
      };
    })
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  res.json(entries);
});

router.get("/daily-challenge", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const userId = req.isAuthenticated() ? req.user.id : null;

  let challenge = await db
    .select()
    .from(dailyChallengesTable)
    .where(eq(dailyChallengesTable.challengeDate, today))
    .limit(1);

  if (!challenge.length) {
    const [created] = await db
      .insert(dailyChallengesTable)
      .values({
        question: 'Translate to English: "Ina kwana"',
        hausa: "Ina kwana",
        english: "Good morning",
        options: ["Good morning", "Good evening", "Good night", "Hello"],
        correctAnswer: "Good morning",
        xpReward: 25,
        challengeDate: today,
      })
      .returning();
    challenge = [created];
  }

  const ch = challenge[0];

  const completions = await db
    .select()
    .from(dailyChallengeCompletionsTable)
    .where(
      userId
        ? eq(dailyChallengeCompletionsTable.userId, userId)
        : sql`1=0`
    );

  const isCompleted = completions.some((c) => c.challengeId === ch.id);

  res.json({
    id: ch.id,
    question: ch.question,
    hausa: ch.hausa ?? null,
    english: ch.english ?? null,
    options: ch.options ?? [],
    correctAnswer: isCompleted ? ch.correctAnswer : null,
    xpReward: ch.xpReward,
    isCompleted,
    expiresAt: new Date(today + "T23:59:59Z").toISOString(),
  });
});

router.post("/daily-challenge/complete", async (req, res) => {
  const body = SubmitAnswerBody.safeParse(req.body);
  if (!body.success) {
    return void res.status(400).json({ error: "Invalid input" });
  }

  const today = new Date().toISOString().split("T")[0];
  const userId = req.isAuthenticated() ? req.user.id : null;

  const challenge = await db
    .select()
    .from(dailyChallengesTable)
    .where(eq(dailyChallengesTable.challengeDate, today))
    .limit(1);

  if (!challenge.length) {
    return void res.status(404).json({ error: "No challenge today" });
  }

  const ch = challenge[0];
  const isCorrect =
    body.data.answer.trim().toLowerCase() ===
    ch.correctAnswer.trim().toLowerCase();

  if (isCorrect) {
    await db.insert(dailyChallengeCompletionsTable).values({
      challengeId: ch.id,
      userId,
    });

    const progress = await db.select().from(userProgressTable).where(
      userId ? eq(userProgressTable.userId, userId) : sql`"user_id" IS NULL`
    ).limit(1);

    if (progress.length) {
      await db
        .update(userProgressTable)
        .set({
          totalXp: progress[0].totalXp + ch.xpReward,
          weeklyXp: progress[0].weeklyXp + ch.xpReward,
          updatedAt: new Date(),
        })
        .where(eq(userProgressTable.id, progress[0].id));
    }

    await db.insert(activityFeedTable).values({
      type: "daily_challenge",
      description: "Completed today's daily challenge!",
      xp: ch.xpReward,
      userId,
    });
  }

  res.json({
    isCorrect,
    correctAnswer: ch.correctAnswer,
    explanation: isCorrect ? "Excellent work on the daily challenge!" : null,
  });
});

export default router;
