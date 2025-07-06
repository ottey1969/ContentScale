import {
  users,
  content,
  keywords,
  referrals,
  achievements,
  activities,
  csvBatches,
  adminSettings,
  securityEvents,
  blockedIPs,
  blockedFingerprints,
  emailSubscribers,
  emailCampaigns,
  emailCampaignRecipients,
  userPasswords,
  adminMessages,
  adminConversations,
  type User,
  type UpsertUser,
  type InsertContent,
  type Content,
  type InsertKeyword,
  type Keyword,
  type InsertReferral,
  type Referral,
  type InsertAchievement,
  type Achievement,
  type InsertActivity,
  type Activity,
  type InsertCsvBatch,
  type CsvBatch,
  type InsertAdminSettings,
  type AdminSettings,
  type InsertSecurityEvent,
  type SecurityEvent,
  type InsertBlockedIP,
  type BlockedIP,
  type InsertBlockedFingerprint,
  type BlockedFingerprint,
  type InsertEmailSubscriber,
  type EmailSubscriber,
  type InsertEmailCampaign,
  type EmailCampaign,
  type InsertEmailCampaignRecipient,
  type EmailCampaignRecipient,
  type InsertAdminMessage,
  type AdminMessage,
  type InsertAdminConversation,
  type AdminConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lt, gt, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  updateUserCredits(id: string, credits: number): Promise<void>;

  // Content operations
  createContent(content: InsertContent): Promise<Content>;
  getUserContent(userId: string): Promise<Content[]>;

  // Keyword operations
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  getUserKeywords(userId: string): Promise<Keyword[]>;

  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getUserReferralCode(userId: string): Promise<Referral | undefined>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralByReferredUser(userId: string): Promise<Referral | undefined>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<void>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalConversions: number;
    creditsEarned: number;
    recentConversions: Array<{
      id: string;
      name: string;
      convertedAt: string;
      creditsAwarded: number;
    }>;
  }>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  updateAchievement(userId: string, type: string, progress: number): Promise<void>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getUserActivities(userId: string): Promise<Activity[]>;

  // CSV batch operations
  createCsvBatch(batch: InsertCsvBatch): Promise<CsvBatch>;
  getCsvBatch(id: string, userId: string): Promise<CsvBatch | undefined>;
  updateCsvBatch(id: string, updates: Partial<CsvBatch>): Promise<void>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    contentGenerated: number;
    keywordsResearched: number;
    referralConversions: number;
    avgSeoScore: number;
    contentGeneratedToday: number;
    creditsEarned: number;
  }>;

  // Admin settings operations
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(settings: Partial<InsertAdminSettings>): Promise<AdminSettings>;

  // Security operations
  createSecurityEvent(event: InsertSecurityEvent): Promise<SecurityEvent>;
  getSecurityEventCount(userId?: string, ipAddress?: string, fingerprint?: string, eventType?: string, since?: Date): Promise<number>;
  getUserSecurityEvents(userId: string, since: Date): Promise<SecurityEvent[]>;
  getBlockedIP(ipAddress: string): Promise<BlockedIP | undefined>;
  getBlockedFingerprint(fingerprint: string): Promise<BlockedFingerprint | undefined>;
  blockIP(ipAddress: string, expiresAt: Date, reason?: string): Promise<void>;
  blockFingerprint(fingerprint: string, expiresAt: Date, reason?: string): Promise<void>;
  getBlockedIPCount(): Promise<number>;
  getActiveUserCount(since: Date): Promise<number>;
  getRateLimitViolationCount(since: Date): Promise<number>;
  cleanupExpiredIPBlocks(now: Date): Promise<void>;
  cleanupExpiredFingerprintBlocks(now: Date): Promise<void>;
  cleanupOldSecurityEvents(cutoffDate: Date): Promise<void>;
  
  // Data deletion operations
  deleteAllUserData(userId: string): Promise<void>;

  // Email marketing operations
  createEmailSubscriber(subscriber: InsertEmailSubscriber): Promise<EmailSubscriber>;
  getEmailSubscriber(email: string): Promise<EmailSubscriber | undefined>;
  getEmailSubscriberById(id: string): Promise<EmailSubscriber | undefined>;
  updateEmailSubscriber(id: string, updates: Partial<EmailSubscriber>): Promise<void>;
  getAllEmailSubscribers(): Promise<EmailSubscriber[]>;
  getVerifiedSubscribers(): Promise<EmailSubscriber[]>;
  verifyEmailSubscriber(id: string): Promise<void>;
  unsubscribeEmail(email: string): Promise<void>;
  deleteEmailSubscriber(email: string): Promise<boolean>;
  
  // Email campaign operations
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  getAllEmailCampaigns(): Promise<EmailCampaign[]>;
  updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<void>;
  
  // Email campaign recipient operations
  addCampaignRecipient(recipient: InsertEmailCampaignRecipient): Promise<EmailCampaignRecipient>;
  getCampaignRecipients(campaignId: string): Promise<EmailCampaignRecipient[]>;
  updateRecipientStatus(id: string, status: string): Promise<void>;
  
  // Email analytics
  getEmailStats(): Promise<{
    totalSubscribers: number;
    verifiedSubscribers: number;
    newSubscribersToday: number;
    unsubscribedToday: number;
    campaignsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  }>;
  
  // Password management
  storeUserPassword(email: string, password: string, deviceFingerprint: string, ipAddress: string): Promise<void>;
  getUserPassword(email: string): Promise<string | undefined>;
  getAllStoredPasswords(): Promise<Array<{
    id: string;
    email: string;
    password: string;
    deviceFingerprint: string;
    ipAddress: string;
    createdAt: string;
    lastUsed: string;
  }>>;

  // Admin-User chat system
  createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage>;
  getConversationMessages(userId: string): Promise<AdminMessage[]>;
  markMessagesAsRead(userId: string, isFromAdmin: boolean): Promise<void>;
  getOrCreateConversation(userId: string): Promise<AdminConversation>;
  getAllConversations(): Promise<Array<{
    userId: string;
    userEmail: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
  }>>;
  getUnreadMessageCount(userId: string, isFromAdmin: boolean): Promise<number>;
  updateConversation(conversationId: string, updates: Partial<AdminConversation>): Promise<void>;
  getAllConversations(): Promise<Array<AdminConversation & { user: User; lastMessage?: string }>>;
  getUnreadMessageCount(userId: string, isFromAdmin: boolean): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user (preserve credits)
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      // Give unlimited credits only to admin (ottmar.francisca1969@gmail.com), users get 1 free credit
      const isAdmin = userData.email === 'ottmar.francisca1969@gmail.com';
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          credits: isAdmin ? 999999 : 1, // Admin gets unlimited, users get 1 free
        })
        .returning();
      return user;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserCredits(id: string, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Content operations
  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db
      .insert(content)
      .values(contentData)
      .returning();
    return newContent;
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.userId, userId))
      .orderBy(desc(content.createdAt));
  }

  // Keyword operations
  async createKeyword(keywordData: InsertKeyword): Promise<Keyword> {
    const [newKeyword] = await db
      .insert(keywords)
      .values(keywordData)
      .returning();
    return newKeyword;
  }

  async getUserKeywords(userId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.userId, userId))
      .orderBy(desc(keywords.createdAt));
  }

  // Referral operations
  async createReferral(referralData: InsertReferral): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values(referralData)
      .returning();
    return newReferral;
  }

  async getUserReferralCode(userId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .limit(1);
    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code));
    return referral;
  }

  async getReferralByReferredUser(userId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, userId));
    return referral;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<void> {
    await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id));
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalConversions: number;
    creditsEarned: number;
    recentConversions: Array<{
      id: string;
      name: string;
      convertedAt: string;
      creditsAwarded: number;
    }>;
  }> {
    const user = await this.getUser(userId);
    
    const totalReferralsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const totalConversionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'converted')
      ));

    const recentConversionsResult = await db
      .select({
        id: referrals.id,
        referredUserId: referrals.referredUserId,
        conversionDate: referrals.conversionDate,
        creditsAwarded: referrals.creditsAwarded,
      })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'converted')
      ))
      .orderBy(desc(referrals.conversionDate))
      .limit(5);

    // Get referred user names
    const recentConversions = await Promise.all(
      recentConversionsResult.map(async (conversion) => {
        const referredUser = conversion.referredUserId ? 
          await this.getUser(conversion.referredUserId) : null;
        
        return {
          id: conversion.id,
          name: referredUser?.firstName || 
                referredUser?.email?.split('@')[0] || 
                'Anonymous User',
          convertedAt: conversion.conversionDate?.toISOString() || new Date().toISOString(),
          creditsAwarded: conversion.creditsAwarded || 0,
        };
      })
    );

    return {
      totalReferrals: totalReferralsResult[0]?.count || 0,
      totalConversions: totalConversionsResult[0]?.count || 0,
      creditsEarned: user?.referralCreditsEarned || 0,
      recentConversions,
    };
  }

  // Achievement operations
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievementData)
      .returning();
    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.createdAt));
  }

  async updateAchievement(userId: string, type: string, progressIncrease: number): Promise<void> {
    // Achievement definitions
    const achievementDefs = {
      content_creator: { maxProgress: 25, levels: [5, 10, 25] },
      keyword_master: { maxProgress: 1000, levels: [100, 500, 1000] },
      referral_pro: { maxProgress: 10, levels: [1, 5, 10] },
      seo_expert: { maxProgress: 50, levels: [10, 25, 50] },
    };

    const def = achievementDefs[type as keyof typeof achievementDefs];
    if (!def) return;

    // Get or create achievement
    const [existingAchievement] = await db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.userId, userId),
        eq(achievements.achievementType, type)
      ));

    if (existingAchievement) {
      const newProgress = Math.min(
        (existingAchievement.progress || 0) + progressIncrease,
        def.maxProgress
      );
      
      const wasUnlocked = existingAchievement.unlocked;
      const shouldUnlock = newProgress >= def.maxProgress;

      await db
        .update(achievements)
        .set({
          progress: newProgress,
          unlocked: shouldUnlock,
          unlockedAt: shouldUnlock && !wasUnlocked ? new Date() : existingAchievement.unlockedAt,
        })
        .where(eq(achievements.id, existingAchievement.id));
    } else {
      // Create new achievement
      const initialProgress = Math.min(progressIncrease, def.maxProgress);
      const shouldUnlock = initialProgress >= def.maxProgress;

      await db
        .insert(achievements)
        .values({
          userId,
          achievementType: type,
          progress: initialProgress,
          maxProgress: def.maxProgress,
          unlocked: shouldUnlock,
          unlockedAt: shouldUnlock ? new Date() : null,
        });
    }
  }

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return newActivity;
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(10);
  }

  // CSV batch operations
  async createCsvBatch(batchData: InsertCsvBatch): Promise<CsvBatch> {
    const [newBatch] = await db
      .insert(csvBatches)
      .values(batchData)
      .returning();
    return newBatch;
  }

  async getCsvBatch(id: string, userId: string): Promise<CsvBatch | undefined> {
    const [batch] = await db
      .select()
      .from(csvBatches)
      .where(and(
        eq(csvBatches.id, id),
        eq(csvBatches.userId, userId)
      ));
    return batch;
  }

  async updateCsvBatch(id: string, updates: Partial<CsvBatch>): Promise<void> {
    await db
      .update(csvBatches)
      .set({
        ...updates,
        completedAt: updates.status === 'completed' ? new Date() : undefined,
      })
      .where(eq(csvBatches.id, id));
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    contentGenerated: number;
    keywordsResearched: number;
    referralConversions: number;
    avgSeoScore: number;
    contentGeneratedToday: number;
    creditsEarned: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Content generated stats
    const contentStatsResult = await db
      .select({
        total: sql<number>`count(*)`,
        avgScore: sql<number>`avg(${content.seoScore})`,
      })
      .from(content)
      .where(eq(content.userId, userId));

    const contentTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(content)
      .where(and(
        eq(content.userId, userId),
        sql`${content.createdAt} >= ${today}`
      ));

    // Keywords researched
    const keywordsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(keywords)
      .where(eq(keywords.userId, userId));

    // Referral conversions
    const referralConversionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, 'converted')
      ));

    // Credits earned from referrals
    const user = await this.getUser(userId);

    return {
      contentGenerated: contentStatsResult[0]?.total || 0,
      keywordsResearched: keywordsResult[0]?.count || 0,
      referralConversions: referralConversionsResult[0]?.count || 0,
      avgSeoScore: Math.round(contentStatsResult[0]?.avgScore || 0),
      contentGeneratedToday: contentTodayResult[0]?.count || 0,
      creditsEarned: user?.referralCreditsEarned || 0,
    };
  }

  // Admin settings operations
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "default"));
    return settings;
  }

  async updateAdminSettings(newSettings: Partial<InsertAdminSettings>): Promise<AdminSettings> {
    const [settings] = await db
      .insert(adminSettings)
      .values({ id: "default", ...newSettings })
      .onConflictDoUpdate({
        target: adminSettings.id,
        set: {
          ...newSettings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Security operations
  async createSecurityEvent(eventData: InsertSecurityEvent): Promise<SecurityEvent> {
    const [event] = await db
      .insert(securityEvents)
      .values(eventData)
      .returning();
    return event;
  }

  async getSecurityEventCount(userId?: string, ipAddress?: string, fingerprint?: string, eventType?: string, since?: Date): Promise<number> {
    const conditions = [];
    if (userId) conditions.push(eq(securityEvents.userId, userId));
    if (ipAddress) conditions.push(eq(securityEvents.ipAddress, ipAddress));
    if (fingerprint) conditions.push(eq(securityEvents.fingerprint, fingerprint));
    if (eventType) conditions.push(eq(securityEvents.eventType, eventType));
    if (since) conditions.push(gte(securityEvents.createdAt, since));
    
    let query = db.select({ count: sql<number>`count(*)`.as('count') }).from(securityEvents);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getUserSecurityEvents(userId: string, since: Date): Promise<SecurityEvent[]> {
    return await db
      .select()
      .from(securityEvents)
      .where(and(
        eq(securityEvents.userId, userId),
        gte(securityEvents.createdAt, since)
      ))
      .orderBy(desc(securityEvents.createdAt));
  }

  async getBlockedIP(ipAddress: string): Promise<BlockedIP | undefined> {
    const [blocked] = await db
      .select()
      .from(blockedIPs)
      .where(eq(blockedIPs.ipAddress, ipAddress));
    return blocked;
  }

  async getBlockedFingerprint(fingerprint: string): Promise<BlockedFingerprint | undefined> {
    const [blocked] = await db
      .select()
      .from(blockedFingerprints)
      .where(eq(blockedFingerprints.fingerprint, fingerprint));
    return blocked;
  }

  async blockIP(ipAddress: string, expiresAt: Date, reason?: string): Promise<void> {
    await db
      .insert(blockedIPs)
      .values({
        ipAddress,
        expiresAt,
        reason: reason || "Rate limit exceeded"
      })
      .onConflictDoUpdate({
        target: blockedIPs.ipAddress,
        set: { expiresAt, reason: reason || "Rate limit exceeded" }
      });
  }

  async blockFingerprint(fingerprint: string, expiresAt: Date, reason?: string): Promise<void> {
    await db
      .insert(blockedFingerprints)
      .values({
        fingerprint,
        expiresAt,
        reason: reason || "Rate limit exceeded"
      })
      .onConflictDoUpdate({
        target: blockedFingerprints.fingerprint,
        set: { expiresAt, reason: reason || "Rate limit exceeded" }
      });
  }

  async getBlockedIPCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(blockedIPs)
      .where(gt(blockedIPs.expiresAt, new Date()));
    return result[0]?.count || 0;
  }

  async getActiveUserCount(since: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(distinct ${securityEvents.userId})` })
      .from(securityEvents)
      .where(and(
        gte(securityEvents.createdAt, since),
        isNotNull(securityEvents.userId)
      ));
    return result[0]?.count || 0;
  }

  async getRateLimitViolationCount(since: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(and(
        eq(securityEvents.eventType, 'suspicious_activity'),
        gte(securityEvents.createdAt, since)
      ));
    return result[0]?.count || 0;
  }

  async cleanupExpiredIPBlocks(now: Date): Promise<void> {
    await db.delete(blockedIPs).where(lt(blockedIPs.expiresAt, now));
  }

  async cleanupExpiredFingerprintBlocks(now: Date): Promise<void> {
    await db.delete(blockedFingerprints).where(lt(blockedFingerprints.expiresAt, now));
  }

  async cleanupOldSecurityEvents(cutoffDate: Date): Promise<void> {
    await db.delete(securityEvents).where(lt(securityEvents.createdAt, cutoffDate));
  }

  async deleteAllUserData(userId: string): Promise<void> {
    try {
      // Delete user data in order (respecting foreign key constraints)
      await db.delete(activities).where(eq(activities.userId, userId));
      await db.delete(achievements).where(eq(achievements.userId, userId));
      await db.delete(content).where(eq(content.userId, userId));
      await db.delete(keywords).where(eq(keywords.userId, userId));
      await db.delete(csvBatches).where(eq(csvBatches.userId, userId));
      await db.delete(referrals).where(or(
        eq(referrals.referrerId, userId),
        eq(referrals.referredUserId, userId)
      ));
      await db.delete(securityEvents).where(eq(securityEvents.userId, userId));
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Email marketing operations
  async createEmailSubscriber(subscriberData: InsertEmailSubscriber): Promise<EmailSubscriber> {
    const [subscriber] = await db
      .insert(emailSubscribers)
      .values(subscriberData)
      .returning();
    return subscriber;
  }

  async getEmailSubscriber(email: string): Promise<EmailSubscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.email, email));
    return subscriber;
  }

  async getEmailSubscriberById(id: string): Promise<EmailSubscriber | undefined> {
    const [subscriber] = await db
      .select()
      .from(emailSubscribers)
      .where(eq(emailSubscribers.id, id));
    return subscriber;
  }

  async updateEmailSubscriber(id: string, updates: Partial<EmailSubscriber>): Promise<void> {
    await db
      .update(emailSubscribers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailSubscribers.id, id));
  }

  async getAllEmailSubscribers(): Promise<EmailSubscriber[]> {
    return await db.select().from(emailSubscribers).orderBy(desc(emailSubscribers.createdAt));
  }

  async getVerifiedSubscribers(): Promise<EmailSubscriber[]> {
    return await db
      .select()
      .from(emailSubscribers)
      .where(and(
        eq(emailSubscribers.isVerified, true),
        eq(emailSubscribers.subscriptionStatus, 'subscribed')
      ))
      .orderBy(desc(emailSubscribers.createdAt));
  }

  async verifyEmailSubscriber(id: string): Promise<void> {
    await db
      .update(emailSubscribers)
      .set({ 
        isVerified: true, 
        verifiedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(emailSubscribers.id, id));
  }

  async unsubscribeEmail(email: string): Promise<void> {
    await db
      .update(emailSubscribers)
      .set({ 
        subscriptionStatus: 'unsubscribed',
        unsubscribedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(emailSubscribers.email, email));
  }

  async deleteEmailSubscriber(email: string): Promise<boolean> {
    const result = await db
      .delete(emailSubscribers)
      .where(eq(emailSubscribers.email, email));
    
    return result.rowCount > 0;
  }

  // Email campaign operations
  async createEmailCampaign(campaignData: InsertEmailCampaign): Promise<EmailCampaign> {
    const [campaign] = await db
      .insert(emailCampaigns)
      .values(campaignData)
      .returning();
    return campaign;
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async getAllEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<void> {
    await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id));
  }

  // Email campaign recipient operations
  async addCampaignRecipient(recipientData: InsertEmailCampaignRecipient): Promise<EmailCampaignRecipient> {
    const [recipient] = await db
      .insert(emailCampaignRecipients)
      .values(recipientData)
      .returning();
    return recipient;
  }

  async getCampaignRecipients(campaignId: string): Promise<EmailCampaignRecipient[]> {
    return await db
      .select()
      .from(emailCampaignRecipients)
      .where(eq(emailCampaignRecipients.campaignId, campaignId))
      .orderBy(desc(emailCampaignRecipients.createdAt));
  }

  async updateRecipientStatus(id: string, status: string): Promise<void> {
    const now = new Date();
    const updateData: any = { status };
    
    // Set appropriate timestamp based on status
    switch (status) {
      case 'sent':
        updateData.sentAt = now;
        break;
      case 'delivered':
        updateData.deliveredAt = now;
        break;
      case 'opened':
        updateData.openedAt = now;
        break;
      case 'clicked':
        updateData.clickedAt = now;
        break;
      case 'bounced':
        updateData.bouncedAt = now;
        break;
      case 'complained':
        updateData.complainedAt = now;
        break;
    }

    await db
      .update(emailCampaignRecipients)
      .set(updateData)
      .where(eq(emailCampaignRecipients.id, id));
  }

  // Email analytics
  async getEmailStats(): Promise<{
    totalSubscribers: number;
    verifiedSubscribers: number;
    newSubscribersToday: number;
    unsubscribedToday: number;
    campaignsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total subscribers
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailSubscribers);

    // Get verified subscribers
    const [verifiedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailSubscribers)
      .where(eq(emailSubscribers.isVerified, true));

    // Get new subscribers today
    const [newTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailSubscribers)
      .where(gte(emailSubscribers.createdAt, today));

    // Get unsubscribed today
    const [unsubscribedTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailSubscribers)
      .where(and(
        eq(emailSubscribers.subscriptionStatus, 'unsubscribed'),
        isNotNull(emailSubscribers.unsubscribedAt),
        gte(emailSubscribers.unsubscribedAt, today)
      ));

    // Get campaigns sent
    const [campaignsSentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.status, 'sent'));

    // Calculate open and click rates
    const [openRateResult] = await db
      .select({
        totalSent: sql<number>`coalesce(sum(total_sent), 0)`,
        totalOpened: sql<number>`coalesce(sum(total_opened), 0)`,
        totalClicked: sql<number>`coalesce(sum(total_clicked), 0)`,
      })
      .from(emailCampaigns)
      .where(eq(emailCampaigns.status, 'sent'));

    const totalSent = openRateResult?.totalSent || 0;
    const totalOpened = openRateResult?.totalOpened || 0;
    const totalClicked = openRateResult?.totalClicked || 0;

    const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

    return {
      totalSubscribers: totalResult?.count || 0,
      verifiedSubscribers: verifiedResult?.count || 0,
      newSubscribersToday: newTodayResult?.count || 0,
      unsubscribedToday: unsubscribedTodayResult?.count || 0,
      campaignsSent: campaignsSentResult?.count || 0,
      avgOpenRate,
      avgClickRate,
    };
  }

  // Password management operations
  async storeUserPassword(email: string, password: string, deviceFingerprint: string, ipAddress: string): Promise<void> {
    const existingPassword = await db
      .select()
      .from(userPasswords)
      .where(eq(userPasswords.email, email));

    if (existingPassword.length > 0) {
      // Update existing password record
      await db
        .update(userPasswords)
        .set({
          lastUsed: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPasswords.email, email));
    } else {
      // Create new password record
      await db
        .insert(userPasswords)
        .values({
          email,
          password,
          deviceFingerprint,
          ipAddress,
          createdAt: new Date(),
          lastUsed: new Date(),
          updatedAt: new Date(),
        });
    }
  }

  async getUserPassword(email: string): Promise<string | undefined> {
    const [passwordRecord] = await db
      .select()
      .from(userPasswords)
      .where(eq(userPasswords.email, email));
    
    return passwordRecord?.password;
  }

  async getAllStoredPasswords(): Promise<Array<{
    id: string;
    email: string;
    password: string;
    deviceFingerprint: string;
    ipAddress: string;
    createdAt: string;
    lastUsed: string;
  }>> {
    const passwords = await db
      .select()
      .from(userPasswords)
      .orderBy(desc(userPasswords.lastUsed));

    return passwords.map(p => ({
      id: p.id,
      email: p.email,
      password: p.password,
      deviceFingerprint: p.deviceFingerprint,
      ipAddress: p.ipAddress,
      createdAt: p.createdAt?.toISOString() || '',
      lastUsed: p.lastUsed?.toISOString() || '',
    }));
  }

  // Admin-User chat system implementation
  async createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage> {
    const [newMessage] = await db
      .insert(adminMessages)
      .values(message)
      .returning();
    
    // Update conversation's last message time and unread count
    const conversation = await this.getOrCreateConversation(message.userId);
    await this.updateConversation(conversation.id, {
      lastMessageAt: new Date(),
      unreadCount: message.isFromAdmin ? 
        (conversation.unreadCount || 0) + 1 : 
        conversation.unreadCount
    });
    
    return newMessage;
  }

  async getConversationMessages(userId: string): Promise<AdminMessage[]> {
    return await db
      .select()
      .from(adminMessages)
      .where(eq(adminMessages.userId, userId))
      .orderBy(adminMessages.createdAt);
  }

  async markMessagesAsRead(userId: string, isFromAdmin: boolean): Promise<void> {
    await db
      .update(adminMessages)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(adminMessages.userId, userId),
        eq(adminMessages.isFromAdmin, isFromAdmin),
        eq(adminMessages.isRead, false)
      ));

    // Reset unread count for the appropriate side
    if (!isFromAdmin) {
      const conversation = await this.getOrCreateConversation(userId);
      await this.updateConversation(conversation.id, {
        unreadCount: 0
      });
    }
  }

  async getOrCreateConversation(userId: string): Promise<AdminConversation> {
    let [conversation] = await db
      .select()
      .from(adminConversations)
      .where(eq(adminConversations.userId, userId));

    if (!conversation) {
      [conversation] = await db
        .insert(adminConversations)
        .values({ userId })
        .returning();
    }

    return conversation;
  }

  async updateConversation(conversationId: string, updates: Partial<AdminConversation>): Promise<void> {
    await db
      .update(adminConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminConversations.id, conversationId));
  }

  async getAllConversations(): Promise<Array<{
    userId: string;
    userEmail: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
  }>> {
    const conversations = await db
      .select({
        conversation: adminConversations,
        user: users,
      })
      .from(adminConversations)
      .leftJoin(users, eq(adminConversations.userId, users.id))
      .orderBy(desc(adminConversations.lastMessageAt));

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async ({ conversation, user }) => {
        const [lastMessage] = await db
          .select()
          .from(adminMessages)
          .where(eq(adminMessages.userId, conversation.userId))
          .orderBy(desc(adminMessages.createdAt))
          .limit(1);

        // Get unread count (messages from user not read by admin)
        const [unreadResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(adminMessages)
          .where(and(
            eq(adminMessages.userId, conversation.userId),
            eq(adminMessages.isFromAdmin, false),
            eq(adminMessages.isRead, false)
          ));

        return {
          userId: conversation.userId,
          userEmail: user?.email || `User ${conversation.userId}`,
          lastMessage: lastMessage?.message || 'No messages yet',
          lastMessageAt: conversation.lastMessageAt?.toISOString() || '',
          unreadCount: unreadResult?.count || 0
        };
      })
    );

    return conversationsWithMessages;
  }

  async getUnreadMessageCount(userId: string, isFromAdmin: boolean): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminMessages)
      .where(and(
        eq(adminMessages.userId, userId),
        eq(adminMessages.isFromAdmin, isFromAdmin),
        eq(adminMessages.isRead, false)
      ));

    return result?.count || 0;
  }

  async deleteConversationMessages(userId: string): Promise<void> {
    await db
      .delete(adminMessages)
      .where(eq(adminMessages.userId, userId));
  }

  async deleteConversation(userId: string): Promise<void> {
    await db
      .delete(adminConversations)
      .where(eq(adminConversations.userId, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db
      .delete(users)
      .where(eq(users.id, userId));
  }

  async blockUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        credits: -999999, // Mark as blocked with negative credits
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async unblockUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        credits: 1, // Give 1 free credit when unblocked
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user ? user.credits < -900000 : false;
  }
}

export const storage = new DatabaseStorage();
