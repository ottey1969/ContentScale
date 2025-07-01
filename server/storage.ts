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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lt, gt, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    const [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "1"));
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
}

export const storage = new DatabaseStorage();
