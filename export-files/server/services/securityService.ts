import { db } from "../db";
import { storage } from "../storage";
import crypto from "crypto";

interface SecurityEvent {
  userId?: string;
  ipAddress: string;
  fingerprint: string;
  eventType: 'login' | 'content_generation' | 'keyword_research' | 'suspicious_activity';
  userAgent: string;
  timestamp: Date;
  metadata?: any;
}

interface RateLimitRule {
  action: string;
  maxRequests: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

interface SecurityMetrics {
  totalSuspiciousEvents: number;
  blockedIPs: number;
  activeUsers: number;
  rateLimitViolations: number;
}

class SecurityService {
  private rateLimits: Map<string, RateLimitRule> = new Map([
    ['content_generation', { action: 'content_generation', maxRequests: 10, windowMinutes: 60, blockDurationMinutes: 30 }],
    ['keyword_research', { action: 'keyword_research', maxRequests: 50, windowMinutes: 60, blockDurationMinutes: 15 }],
    ['login_attempts', { action: 'login', maxRequests: 5, windowMinutes: 15, blockDurationMinutes: 60 }],
  ]);

  private blockedIPs: Set<string> = new Set();
  private suspiciousFingerprints: Set<string> = new Set();

  /**
   * Generate browser fingerprint from request headers
   */
  generateFingerprint(req: any): string {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.headers['accept'] || '',
      req.connection?.remoteAddress || '',
      req.headers['x-forwarded-for']?.split(',')[0] || '',
    ];

    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Extract real IP address from request
   */
  getClientIP(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Check if request should be blocked
   */
  async isBlocked(ipAddress: string, fingerprint: string): Promise<boolean> {
    // Check IP blocks
    if (this.blockedIPs.has(ipAddress)) {
      return true;
    }

    // Check fingerprint blocks
    if (this.suspiciousFingerprints.has(fingerprint)) {
      return true;
    }

    // Check database for persistent blocks
    try {
      const blockedIP = await storage.getBlockedIP(ipAddress);
      const blockedFingerprint = await storage.getBlockedFingerprint(fingerprint);
      
      if (blockedIP && new Date() < blockedIP.expiresAt) {
        this.blockedIPs.add(ipAddress);
        return true;
      }

      if (blockedFingerprint && new Date() < blockedFingerprint.expiresAt) {
        this.suspiciousFingerprints.add(fingerprint);
        return true;
      }
    } catch (error) {
      console.error('Error checking blocks:', error);
    }

    return false;
  }

  /**
   * Check rate limits for specific actions
   */
  async checkRateLimit(
    userId: string | undefined,
    ipAddress: string,
    fingerprint: string,
    action: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const rule = this.rateLimits.get(action);
    if (!rule) {
      return { allowed: true, remaining: 999, resetTime: new Date() };
    }

    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);
    
    try {
      // Check requests in the time window
      const requestCount = await storage.getSecurityEventCount(
        userId,
        ipAddress,
        fingerprint,
        action,
        windowStart
      );

      const remaining = Math.max(0, rule.maxRequests - requestCount);
      const resetTime = new Date(Date.now() + rule.windowMinutes * 60 * 1000);

      if (requestCount >= rule.maxRequests) {
        // Block the IP/fingerprint temporarily
        await this.blockTemporary(ipAddress, fingerprint, rule.blockDurationMinutes);
        
        await this.logSecurityEvent({
          userId,
          ipAddress,
          fingerprint,
          eventType: 'suspicious_activity',
          userAgent: 'Rate limit exceeded',
          timestamp: new Date(),
          metadata: { action, requestCount, limit: rule.maxRequests }
        });

        return { allowed: false, remaining: 0, resetTime };
      }

      return { allowed: true, remaining, resetTime };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true, remaining: 999, resetTime: new Date() };
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await storage.createSecurityEvent({
        userId: event.userId,
        ipAddress: event.ipAddress,
        fingerprint: event.fingerprint,
        eventType: event.eventType,
        userAgent: event.userAgent,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Block IP and fingerprint temporarily
   */
  async blockTemporary(ipAddress: string, fingerprint: string, durationMinutes: number): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    try {
      await storage.blockIP(ipAddress, expiresAt);
      await storage.blockFingerprint(fingerprint, expiresAt);
      
      this.blockedIPs.add(ipAddress);
      this.suspiciousFingerprints.add(fingerprint);
    } catch (error) {
      console.error('Error blocking IP/fingerprint:', error);
    }
  }

  /**
   * Analyze user behavior patterns for anomalies
   */
  async analyzeUserBehavior(userId: string): Promise<{ risk: 'low' | 'medium' | 'high'; reasons: string[] }> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const events = await storage.getUserSecurityEvents(userId, last24Hours);
      
      const reasons: string[] = [];
      let riskScore = 0;

      // Check for multiple IPs
      const uniqueIPs = new Set(events.map(e => e.ipAddress));
      if (uniqueIPs.size > 5) {
        reasons.push('Multiple IP addresses detected');
        riskScore += 2;
      }

      // Check for multiple fingerprints
      const uniqueFingerprints = new Set(events.map(e => e.fingerprint));
      if (uniqueFingerprints.size > 3) {
        reasons.push('Multiple device fingerprints detected');
        riskScore += 2;
      }

      // Check for high activity volume
      const contentEvents = events.filter(e => e.eventType === 'content_generation');
      if (contentEvents.length > 20) {
        reasons.push('Unusually high content generation activity');
        riskScore += 1;
      }

      // Check for rapid successive requests
      const rapidRequests = events.filter((event, index) => {
        if (index === 0) return false;
        const timeDiff = event.createdAt.getTime() - events[index - 1].createdAt.getTime();
        return timeDiff < 5000; // Less than 5 seconds apart
      });

      if (rapidRequests.length > 10) {
        reasons.push('Rapid successive API requests detected');
        riskScore += 2;
      }

      if (riskScore >= 4) return { risk: 'high', reasons };
      if (riskScore >= 2) return { risk: 'medium', reasons };
      return { risk: 'low', reasons };
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return { risk: 'low', reasons: [] };
    }
  }

  /**
   * Get security metrics for admin dashboard
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const [suspiciousEvents, blockedIPs, activeUsers, rateLimitViolations] = await Promise.all([
        storage.getSecurityEventCount(undefined, undefined, undefined, 'suspicious_activity', last24Hours),
        storage.getBlockedIPCount(),
        storage.getActiveUserCount(last24Hours),
        storage.getRateLimitViolationCount(last24Hours),
      ]);

      return {
        totalSuspiciousEvents: suspiciousEvents,
        blockedIPs,
        activeUsers,
        rateLimitViolations,
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        totalSuspiciousEvents: 0,
        blockedIPs: 0,
        activeUsers: 0,
        rateLimitViolations: 0,
      };
    }
  }

  /**
   * Clean up expired blocks and old events
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      
      // Remove expired IP blocks
      await storage.cleanupExpiredIPBlocks(now);
      
      // Remove expired fingerprint blocks
      await storage.cleanupExpiredFingerprintBlocks(now);
      
      // Remove old security events (keep 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      await storage.cleanupOldSecurityEvents(thirtyDaysAgo);
      
      // Clear in-memory caches
      this.blockedIPs.clear();
      this.suspiciousFingerprints.clear();
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }
}

export const securityService = new SecurityService();

// Run cleanup every hour
setInterval(() => {
  securityService.cleanupExpiredData();
}, 60 * 60 * 1000);