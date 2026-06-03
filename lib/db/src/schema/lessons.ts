import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  order: integer("order").notNull(),
  iconEmoji: text("icon_emoji"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id),
  type: text("type").notNull(), // multiple_choice | translation | fill_blank | match_pair
  question: text("question").notNull(),
  hausa: text("hausa"),
  english: text("english"),
  options: text("options").array().notNull().default([]),
  correctAnswer: text("correct_answer").notNull(),
  hint: text("hint"),
  explanation: text("explanation"),
  order: integer("order").notNull(),
});

export const lessonCompletionsTable = pgTable("lesson_completions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id),
  score: integer("score").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const userProgressTable = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  totalXp: integer("total_xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  weeklyXp: integer("weekly_xp").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityFeedTable = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  xp: integer("xp").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vocabularyTable = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  hausa: text("hausa").notNull(),
  english: text("english").notNull(),
  category: text("category").notNull(),
  pronunciation: text("pronunciation").notNull(),
  example: text("example"),
  exampleTranslation: text("example_translation"),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ id: true });
export const insertVocabSchema = createInsertSchema(vocabularyTable).omit({ id: true });

export type Lesson = typeof lessonsTable.$inferSelect;
export type Exercise = typeof exercisesTable.$inferSelect;
export type UserProgress = typeof userProgressTable.$inferSelect;
export type ActivityFeed = typeof activityFeedTable.$inferSelect;
export type VocabWord = typeof vocabularyTable.$inferSelect;
