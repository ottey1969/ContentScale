import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface SecurityConfig {
  maxEmailsPerHour: number;
  maxExportsPerDay: number;
  maxViewsPerMinute: number;
  suspiciousActivityThreshold: number;
}

interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach_attempt';
  adminId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class EmailSecurityMiddleware {
  private securityConfig: SecurityConfig = {
    maxEmailsPerHour: 100,
    maxExportsPerDay: 5,
    maxViewsPerMinute: 30,
    suspiciousActivityThreshold: 10
  };

  private securityEvents: SecurityEvent[] = [];
  private userActivity: Map<string, any[]> = new Map();

  /**
   * Rate limiting for email campaigns
   */
  emailCampaignLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: this.securityConfig.maxEmailsPerHour,
    message: {
      error: 'Too many email campaigns sent',
      message: `Maximum ${this.securityConfig.maxEmailsPerHour} campaigns per hour allowed`,
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      this.logSecurityEvent('rate_limit', req, {
        type: 'email_campaign',
        limit: this.securityConfig.maxEmailsPerHour,
        window: '1 hour'
      }, 'medium');
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Maximum ${this.securityConfig.maxEmailsPerHour} email campaigns per hour allowed`,
        retryAfter: 3600
      });
    }
  });

  /**
   * Rate limiting for data exports
   */
  exportLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: this.securityConfig.maxExportsPerDay,
    message: {
      error: 'Too many exports requested',
      message: `Maximum ${this.securityConfig.maxExportsPerDay} exports per day allowed`,
      retryAfter: '24 hours'
    },
    keyGenerator: (req: Request) => {
      // Use admin ID for per-user limiting
      return (req as any).user?.claims?.sub || req.ip;
    },
    handler: (req: Request, res: Response) => {
      this.logSecurityEvent('rate_limit', req, {
        type: 'data_export',
        limit: this.securityConfig.maxExportsPerDay,
        window: '24 hours'
      }, 'high');
      
      res.status(429).json({
        error: 'Export limit exceeded',
        message: `Maximum ${this.securityConfig.maxExportsPerDay} exports per day allowed for security`,
        retryAfter: 86400
      });
    }
  });

  /**
   * Rate limiting for email viewing
   */
  viewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: this.securityConfig.maxViewsPerMinute,
    message: {
      error: 'Too many view requests',
      message: `Maximum ${this.securityConfig.maxViewsPerMinute} views per minute allowed`,
      retryAfter: '1 minute'
    },
    handler: (req: Request, res: Response) => {
      this.logSecurityEvent('rate_limit', req, {
        type: 'email_view',
        limit: this.securityConfig.maxViewsPerMinute,
        window: '1 minute'
      }, 'low');
      
      res.status(429).json({
        error: 'View rate limit exceeded',
        message: `Maximum ${this.securityConfig.maxViewsPerMinute} views per minute allowed`,
        retryAfter: 60
      });
    }
  });

  /**
   * Email validation middleware
   */
  validateEmailInput = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subject, message, recipients } = req.body;

      // Validate subject
      if (subject && typeof subject === 'string') {
        if (subject.length > 200) {
          return res.status(400).json({
            error: 'Invalid subject',
            message: 'Subject must be 200 characters or less'
          });
        }

        // Check for suspicious patterns
        if (this.containsSuspiciousContent(subject)) {
          this.logSecurityEvent('suspicious_activity', req, {
            type: 'suspicious_subject',
            subject: subject
          }, 'medium');
          
          return res.status(400).json({
            error: 'Suspicious content detected',
            message: 'Subject contains potentially harmful content'
          });
        }
      }

      // Validate message
      if (message && typeof message === 'string') {
        if (message.length > 10000) {
          return res.status(400).json({
            error: 'Invalid message',
            message: 'Message must be 10,000 characters or less'
          });
        }

        // Check for suspicious patterns
        if (this.containsSuspiciousContent(message)) {
          this.logSecurityEvent('suspicious_activity', req, {
            type: 'suspicious_message',
            messageLength: message.length
          }, 'medium');
          
          return res.status(400).json({
            error: 'Suspicious content detected',
            message: 'Message contains potentially harmful content'
          });
        }
      }

      // Validate recipients
      if (recipients && !['all', 'verified', 'subscribed'].includes(recipients)) {
        return res.status(400).json({
          error: 'Invalid recipients',
          message: 'Recipients must be one of: all, verified, subscribed'
        });
      }

      next();
    } catch (error) {
      console.error('Email validation error:', error);
      res.status(500).json({
        error: 'Validation failed',
        message: 'Failed to validate email input'
      });
    }
  };

  /**
   * Admin authorization middleware
   */
  requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      
      if (!userId) {
        this.logSecurityEvent('unauthorized_access', req, {
          type: 'missing_auth',
          endpoint: req.path
        }, 'high');
        
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Valid authentication token required'
        });
      }

      // Check if user is admin (in production, check database)
      const isAdmin = userId === 'admin' || 
                     (req as any).user?.email === 'ottmar.francisca1969@gmail.com';
      
      if (!isAdmin) {
        this.logSecurityEvent('unauthorized_access', req, {
          type: 'insufficient_privileges',
          userId: userId,
          endpoint: req.path
        }, 'high');
        
        return res.status(403).json({
          error: 'Admin access required',
          message: 'Insufficient privileges for this operation'
        });
      }

      // Track admin activity
      this.trackAdminActivity(userId, req);

      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(500).json({
        error: 'Authorization failed',
        message: 'Failed to verify admin privileges'
      });
    }
  };

  /**
   * Suspicious activity detection
   */
  detectSuspiciousActivity = (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      
      if (!userId) {
        return next();
      }

      // Get user activity history
      const userActivities = this.userActivity.get(userId) || [];
      
      // Check for suspicious patterns
      const recentActivities = userActivities.filter(
        activity => Date.now() - activity.timestamp < 60000 // Last minute
      );

      if (recentActivities.length > this.securityConfig.suspiciousActivityThreshold) {
        this.logSecurityEvent('suspicious_activity', req, {
          type: 'high_frequency_access',
          activityCount: recentActivities.length,
          timeWindow: '1 minute'
        }, 'high');
        
        return res.status(429).json({
          error: 'Suspicious activity detected',
          message: 'Too many requests in short time period',
          retryAfter: 300 // 5 minutes
        });
      }

      // Check for unusual access patterns
      const uniqueEndpoints = new Set(recentActivities.map(a => a.endpoint));
      if (uniqueEndpoints.size > 5) {
        this.logSecurityEvent('suspicious_activity', req, {
          type: 'endpoint_scanning',
          uniqueEndpoints: uniqueEndpoints.size
        }, 'medium');
      }

      next();
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      next();
    }
  };

  /**
   * Input sanitization middleware
   */
  sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize string inputs
      const sanitizeString = (str: string): string => {
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/javascript:/gi, '') // Remove javascript: URLs
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      };

      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
          if (typeof value === 'string') {
            req.body[key] = sanitizeString(value);
          }
        }
      }

      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      next();
    }
  };

  /**
   * Check for suspicious content patterns
   */
  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /\bphishing\b/i,
      /\bmalware\b/i,
      /\bvirus\b/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Track admin activity for monitoring
   */
  private trackAdminActivity(userId: string, req: Request): void {
    const activity = {
      timestamp: Date.now(),
      endpoint: req.path,
      method: req.method,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    const userActivities = this.userActivity.get(userId) || [];
    userActivities.push(activity);

    // Keep only last 100 activities per user
    if (userActivities.length > 100) {
      userActivities.splice(0, userActivities.length - 100);
    }

    this.userActivity.set(userId, userActivities);
  }

  /**
   * Log security events
   */
  private logSecurityEvent(
    type: SecurityEvent['type'],
    req: Request,
    details: any,
    severity: SecurityEvent['severity']
  ): void {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      type: type,
      adminId: (req as any).user?.claims?.sub || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date().toISOString(),
      details: details,
      severity: severity
    };

    this.securityEvents.push(event);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000);
    }

    // Log critical events immediately
    if (severity === 'critical' || severity === 'high') {
      console.warn('🚨 SECURITY EVENT:', event);
    }
  }

  /**
   * Get security events for admin review
   */
  getSecurityEvents(severity?: SecurityEvent['severity']): SecurityEvent[] {
    if (severity) {
      return this.securityEvents.filter(event => event.severity === severity);
    }
    return this.securityEvents;
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): any {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp).getTime() > last24h
    );

    return {
      totalEvents: this.securityEvents.length,
      eventsLast24h: recentEvents.length,
      eventsBySeverity: {
        low: recentEvents.filter(e => e.severity === 'low').length,
        medium: recentEvents.filter(e => e.severity === 'medium').length,
        high: recentEvents.filter(e => e.severity === 'high').length,
        critical: recentEvents.filter(e => e.severity === 'critical').length
      },
      eventsByType: {
        rate_limit: recentEvents.filter(e => e.type === 'rate_limit').length,
        suspicious_activity: recentEvents.filter(e => e.type === 'suspicious_activity').length,
        unauthorized_access: recentEvents.filter(e => e.type === 'unauthorized_access').length,
        data_breach_attempt: recentEvents.filter(e => e.type === 'data_breach_attempt').length
      },
      activeUsers: this.userActivity.size,
      configuredLimits: this.securityConfig
    };
  }
}

export const emailSecurityMiddleware = new EmailSecurityMiddleware();

