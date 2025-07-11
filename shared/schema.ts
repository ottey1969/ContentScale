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

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().notNull().default("default"),
  demoVideoId: varchar("demo_video_id").default(""),
  demoVideoTitle: varchar("demo_video_title").default("ContentScale Demo"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  welcomeMessage: text("welcome_message").default("Welcome to ContentScale!"),
  maxCreditsPerUser: integer("max_credits_per_user").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security tables for fingerprint and IP tracking
export const securityEvents = pgTable("security_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  ipAddress: varchar("ip_address").notNull(),
  fingerprint: varchar("fingerprint").notNull(),
  eventType: varchar("event_type").notNull(),
  userAgent: text("user_agent"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_security_events_user_id").on(table.userId),
  index("idx_security_events_ip").on(table.ipAddress),
  index("idx_security_events_fingerprint").on(table.fingerprint),
  index("idx_security_events_created_at").on(table.createdAt),
]);

export const blockedIPs = pgTable("blocked_ips", {
  id: uuid("id").primaryKey().defaultRandom(),
  ipAddress: varchar("ip_address").notNull().unique(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blocked_ips_expires_at").on(table.expiresAt),
]);

export const blockedFingerprints = pgTable("blocked_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  fingerprint: varchar("fingerprint").notNull().unique(),
  reason: text("reason"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blocked_fingerprints_expires_at").on(table.expiresAt),
]);

// User passwords storage table
export const userPasswords = pgTable("user_passwords", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  deviceFingerprint: varchar("device_fingerprint").notNull(),
  ipAddress: varchar("ip_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_passwords_email").on(table.email),
  index("idx_user_passwords_device").on(table.deviceFingerprint),
]);

// Email marketing and lead capture table
export const emailSubscribers = pgTable("email_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  userId: varchar("user_id").references(() => users.id), // Link to user if they register
  source: varchar("source").notNull(), // 'landing_page', 'chat_signup', 'content_download', 'newsletter'
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  subscriptionStatus: varchar("subscription_status").default('subscribed'), // 'subscribed', 'unsubscribed', 'bounced'
  subscribedToNewsletter: boolean("subscribed_to_newsletter").default(true),
  subscribedToMarketing: boolean("subscribed_to_marketing").default(true),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional subscriber data
  verifiedAt: timestamp("verified_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaigns tracking
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  campaignType: varchar("campaign_type").notNull(), // 'welcome', 'newsletter', 'promotional', 'transactional'
  status: varchar("status").default('draft'), // 'draft', 'scheduled', 'sent', 'cancelled'
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaign recipients and tracking
export const emailCampaignRecipients = pgTable("email_campaign_recipients", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").notNull().references(() => emailCampaigns.id),
  subscriberId: uuid("subscriber_id").notNull().references(() => emailSubscribers.id),
  status: varchar("status").default('pending'), // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  complainedAt: timestamp("complained_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin-User chat system
export const adminMessages = pgTable("admin_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversation status
export const adminConversations = pgTable("admin_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status").default('active'), // 'active', 'closed', 'archived'
  priority: varchar("priority").default('normal'), // 'low', 'normal', 'high', 'urgent'
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  unreadCount: integer("unread_count").default(0),
  subject: varchar("subject"),
  metadata: jsonb("metadata"), // Additional conversation data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  emailSubscriptions: many(emailSubscribers),
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

export const emailSubscribersRelations = relations(emailSubscribers, ({ one, many }) => ({
  user: one(users, {
    fields: [emailSubscribers.userId],
    references: [users.id],
  }),
  campaignRecipients: many(emailCampaignRecipients),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({ many }) => ({
  recipients: many(emailCampaignRecipients),
}));

export const emailCampaignRecipientsRelations = relations(emailCampaignRecipients, ({ one }) => ({
  campaign: one(emailCampaigns, {
    fields: [emailCampaignRecipients.campaignId],
    references: [emailCampaigns.id],
  }),
  subscriber: one(emailSubscribers, {
    fields: [emailCampaignRecipients.subscriberId],
    references: [emailSubscribers.id],
  }),
}));

export const adminMessagesRelations = relations(adminMessages, ({ one }) => ({
  user: one(users, {
    fields: [adminMessages.userId],
    references: [users.id],
  }),
  conversation: one(adminConversations, {
    fields: [adminMessages.userId],
    references: [adminConversations.userId],
  }),
}));

export const adminConversationsRelations = relations(adminConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [adminConversations.userId],
    references: [users.id],
  }),
  messages: many(adminMessages),
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

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertBlockedIPSchema = createInsertSchema(blockedIPs).omit({
  id: true,
  createdAt: true,
});

export const insertBlockedFingerprintSchema = createInsertSchema(blockedFingerprints).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignRecipientSchema = createInsertSchema(emailCampaignRecipients).omit({
  id: true,
  createdAt: true,
});

export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminConversationSchema = createInsertSchema(adminConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertBlockedIP = z.infer<typeof insertBlockedIPSchema>;
export type BlockedIP = typeof blockedIPs.$inferSelect;
export type InsertBlockedFingerprint = z.infer<typeof insertBlockedFingerprintSchema>;
export type BlockedFingerprint = typeof blockedFingerprints.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaignRecipient = z.infer<typeof insertEmailCampaignRecipientSchema>;
export type EmailCampaignRecipient = typeof emailCampaignRecipients.$inferSelect;
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;
export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminConversation = z.infer<typeof insertAdminConversationSchema>;
export type AdminConversation = typeof adminConversations.$inferSelect;
