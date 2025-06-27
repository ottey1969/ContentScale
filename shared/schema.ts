import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").default(1), // First blog post free
  totalReferrals: integer("total_referrals").default(0),
  totalConversions: integer("total_conversions").default(0),
  referralCreditsEarned: integer("referral_credits_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content generation table
export const content = pgTable("content", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  keywords: jsonb("keywords").default([]),
  contentType: varchar("content_type").notNull(), // blog, article, faq, social
  seoScore: integer("seo_score").default(0),
  aiOverviewPotential: varchar("ai_overview_potential").default("medium"), // high, medium, low
  aiModeScore: integer("ai_mode_score").default(5), // 1-10
  status: varchar("status").default("draft"), // draft, published, archived
  creditsUsed: integer("credits_used").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keyword research table
export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume"),
  difficulty: varchar("difficulty"), // low, medium, high
  aiOverviewPotential: varchar("ai_overview_potential").default("medium"),
  relatedKeywords: jsonb("related_keywords").default([]),
  source: varchar("source").default("answer_socrates"), // answer_socrates, manual, csv
  clusterId: uuid("cluster_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referral system table
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").references(() => users.id),
  referralCode: varchar("referral_code").notNull().unique(),
  status: varchar("status").default("pending"), // pending, converted, credited
  conversionDate: timestamp("conversion_date"),
  creditsAwarded: integer("credits_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement system table
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementType: varchar("achievement_type").notNull(), // content_creator, keyword_master, referral_pro, seo_expert
  level: integer("level").default(1),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").notNull(),
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity feed table
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // content_generated, keywords_researched, referral_converted, csv_processed
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// CSV upload batches
export const csvBatches = pgTable("csv_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  totalRows: integer("total_rows").notNull(),
  processedRows: integer("processed_rows").default(0),
  status: varchar("status").default("processing"), // processing, completed, failed
  results: jsonb("results").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  content: many(content),
  keywords: many(keywords),
  referralsGiven: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  achievements: many(achievements),
  activities: many(activities),
  csvBatches: many(csvBatches),
}));

export const contentRelations = relations(content, ({ one }) => ({
  user: one(users, {
    fields: [content.userId],
    references: [users.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one }) => ({
  user: one(users, {
    fields: [keywords.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const csvBatchesRelations = relations(csvBatches, ({ one }) => ({
  user: one(users, {
    fields: [csvBatches.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertCsvBatchSchema = createInsertSchema(csvBatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertCsvBatch = z.infer<typeof insertCsvBatchSchema>;
export type CsvBatch = typeof csvBatches.$inferSelect;
