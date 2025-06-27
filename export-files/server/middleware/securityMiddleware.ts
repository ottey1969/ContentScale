import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/securityService';

interface SecurityRequest extends Request {
  security?: {
    ipAddress: string;
    fingerprint: string;
    userId?: string;
  };
}

/**
 * Security middleware that tracks fingerprints, IPs, and enforces rate limits
 */
export function securityMiddleware() {
  return async (req: SecurityRequest, res: Response, next: NextFunction) => {
    try {
      const ipAddress = securityService.getClientIP(req);
      const fingerprint = securityService.generateFingerprint(req);
      const userId = (req.user as any)?.claims?.sub;

      // Attach security info to request
      req.security = { ipAddress, fingerprint, userId };

      // Check if IP or fingerprint is blocked
      const isBlocked = await securityService.isBlocked(ipAddress, fingerprint);
      if (isBlocked) {
        return res.status(429).json({
          message: 'Access temporarily restricted due to suspicious activity',
          retryAfter: 3600 // 1 hour
        });
      }

      // Log the security event
      await securityService.logSecurityEvent({
        userId,
        ipAddress,
        fingerprint,
        eventType: 'login',
        userAgent: req.headers['user-agent'] || 'Unknown',
        timestamp: new Date(),
        metadata: {
          endpoint: req.path,
          method: req.method
        }
      });

      next();
    } catch (error) {
      console.error('Security middleware error:', error);
      // Don't block the request on security middleware errors
      next();
    }
  };
}

/**
 * Rate limiting middleware for specific actions
 */
export function rateLimitMiddleware(action: string) {
  return async (req: SecurityRequest, res: Response, next: NextFunction) => {
    try {
      const { ipAddress, fingerprint, userId } = req.security || {};
      
      if (!ipAddress || !fingerprint) {
        return next();
      }

      const rateLimit = await securityService.checkRateLimit(
        userId,
        ipAddress,
        fingerprint,
        action
      );

      if (!rateLimit.allowed) {
        return res.status(429).json({
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000),
          remaining: 0
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toISOString()
      });

      // Log the action
      await securityService.logSecurityEvent({
        userId,
        ipAddress,
        fingerprint,
        eventType: action as any,
        userAgent: req.headers['user-agent'] || 'Unknown',
        timestamp: new Date(),
        metadata: {
          endpoint: req.path,
          remaining: rateLimit.remaining
        }
      });

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next();
    }
  };
}

/**
 * Security monitoring middleware for admin routes
 */
export function adminSecurityMiddleware() {
  return async (req: SecurityRequest, res: Response, next: NextFunction) => {
    try {
      const { ipAddress, fingerprint, userId } = req.security || {};
      
      // Enhanced logging for admin actions
      await securityService.logSecurityEvent({
        userId,
        ipAddress: ipAddress || 'unknown',
        fingerprint: fingerprint || 'unknown',
        eventType: 'suspicious_activity',
        userAgent: req.headers['user-agent'] || 'Unknown',
        timestamp: new Date(),
        metadata: {
          action: 'admin_access',
          endpoint: req.path,
          method: req.method,
          body: req.method === 'POST' ? 'admin_action' : undefined
        }
      });

      next();
    } catch (error) {
      console.error('Admin security middleware error:', error);
      next();
    }
  };
}