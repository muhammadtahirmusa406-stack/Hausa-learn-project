import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull().default(0),
  iconEmoji: text("icon_emoji").notNull().default("🏆"),
});

export const userAchievementsTable = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  achievementKey: text("achievement_key").notNull().references(() => achievementsTable.key),
  userId: text("user_id"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const dailyChallengesTable = pgTable("daily_challenges", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  hausa: text("hausa"),
  english: text("english"),
  options: text("options").array().notNull().default([]),
  correctAnswer: text("correct_answer").notNull(),
  xpReward: integer("xp_reward").notNull().default(20),
  challengeDate: date("challenge_date").notNull(),
});

export const dailyChallengeCompletionsTable = pgTable("daily_challenge_completions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => dailyChallengesTable.id),
  userId: text("user_id"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export type Achievement = typeof achievementsTable.$inferSelect;
export type DailyChallenge = typeof dailyChallengesTable.$inferSelect;
