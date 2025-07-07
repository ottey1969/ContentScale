import crypto from 'crypto';
import bcrypt from 'bcrypt';

interface SecureEmailSubscriber {
  id: string;
  emailHash: string;
  emailEncrypted: string;
  verified: boolean;
  subscribed: boolean;
  joinedDate: string;
  tags: string[];
  lastAccessed?: string;
  accessCount: number;
}

interface EmailAccessLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'view' | 'export' | 'send' | 'delete';
  subscriberCount: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

class SecureEmailService {
  private readonly ENCRYPTION_KEY: string;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private readonly HASH_ROUNDS = 12;

  constructor() {
    // In production, this should come from environment variables
    this.ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || this.generateEncryptionKey();
    
    if (!process.env.EMAIL_ENCRYPTION_KEY) {
      console.warn('⚠️  EMAIL_ENCRYPTION_KEY not set in environment. Using generated key.');
      console.warn('🔒 For production, set EMAIL_ENCRYPTION_KEY environment variable.');
    }
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt email address for secure storage
   */
  encryptEmail(email: string): { encrypted: string; hash: string } {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Create hash for indexing and duplicate detection
      const hash = bcrypt.hashSync(email.toLowerCase(), this.HASH_ROUNDS);

      // Encrypt email for storage
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, this.ENCRYPTION_KEY);
      
      let encrypted = cipher.update(email.toLowerCase(), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      const encryptedWithIv = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

      return {
        encrypted: encryptedWithIv,
        hash: hash
      };
    } catch (error) {
      console.error('Error encrypting email:', error);
      throw new Error('Failed to encrypt email address');
    }
  }

  /**
   * Decrypt email address for authorized access
   */
  decryptEmail(encryptedEmail: string): string {
    try {
      const parts = encryptedEmail.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted email format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, this.ENCRYPTION_KEY);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Error decrypting email:', error);
      throw new Error('Failed to decrypt email address');
    }
  }

  /**
   * Mask email address for display purposes
   */
  maskEmail(email: string): string {
    try {
      const [localPart, domain] = email.split('@');
      
      if (!localPart || !domain) {
        return '***@***.***';
      }

      // Mask local part
      let maskedLocal: string;
      if (localPart.length <= 2) {
        maskedLocal = '*'.repeat(localPart.length);
      } else if (localPart.length <= 4) {
        maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
      } else {
        maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 4) + localPart.substring(localPart.length - 2);
      }

      // Mask domain
      const [domainName, tld] = domain.split('.');
      let maskedDomain: string;
      
      if (domainName.length <= 2) {
        maskedDomain = '*'.repeat(domainName.length);
      } else {
        maskedDomain = domainName[0] + '*'.repeat(domainName.length - 2) + domainName[domainName.length - 1];
      }

      return `${maskedLocal}@${maskedDomain}.${tld}`;
    } catch (error) {
      return '***@***.***';
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Securely add new subscriber
   */
  async addSubscriber(email: string, tags: string[] = []): Promise<SecureEmailSubscriber> {
    try {
      // Validate and sanitize email
      const cleanEmail = email.trim().toLowerCase();
      if (!this.isValidEmail(cleanEmail)) {
        throw new Error('Invalid email address format');
      }

      // Check for existing subscriber
      const existing = await this.findSubscriberByEmail(cleanEmail);
      if (existing) {
        throw new Error('Email address already subscribed');
      }

      // Encrypt email
      const { encrypted, hash } = this.encryptEmail(cleanEmail);

      // Create secure subscriber record
      const subscriber: SecureEmailSubscriber = {
        id: `sub_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        emailHash: hash,
        emailEncrypted: encrypted,
        verified: false,
        subscribed: true,
        joinedDate: new Date().toISOString(),
        tags: tags.filter(tag => tag.trim().length > 0),
        accessCount: 0
      };

      // Save to secure storage
      await this.saveSubscriber(subscriber);

      return subscriber;
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }

  /**
   * Get subscribers for admin view (with masked emails)
   */
  async getSubscribersForAdmin(adminId: string, showFullEmails: boolean = false): Promise<any[]> {
    try {
      // Log access attempt
      await this.logEmailAccess(adminId, 'view', 0);

      // Get all subscribers
      const subscribers = await this.getAllSubscribers();

      // Return with appropriate email display
      return subscribers.map(subscriber => ({
        id: subscriber.id,
        email: showFullEmails 
          ? this.decryptEmail(subscriber.emailEncrypted)
          : this.maskEmail(this.decryptEmail(subscriber.emailEncrypted)),
        emailMasked: this.maskEmail(this.decryptEmail(subscriber.emailEncrypted)),
        verified: subscriber.verified,
        subscribed: subscriber.subscribed,
        joinedDate: subscriber.joinedDate,
        tags: subscriber.tags,
        accessCount: subscriber.accessCount
      }));
    } catch (error) {
      console.error('Error getting subscribers for admin:', error);
      throw error;
    }
  }

  /**
   * Export subscribers securely
   */
  async exportSubscribers(adminId: string, format: 'csv' | 'encrypted' = 'encrypted'): Promise<any> {
    try {
      const subscribers = await this.getAllSubscribers();
      
      // Log export attempt
      await this.logEmailAccess(adminId, 'export', subscribers.length);

      if (format === 'encrypted') {
        // Return encrypted export
        const exportData = {
          exportDate: new Date().toISOString(),
          adminId: adminId,
          subscriberCount: subscribers.length,
          data: subscribers.map(sub => ({
            id: sub.id,
            emailEncrypted: sub.emailEncrypted,
            verified: sub.verified,
            subscribed: sub.subscribed,
            joinedDate: sub.joinedDate,
            tags: sub.tags
          })),
          decryptionNote: 'Use SecureEmailService.decryptEmail() to decrypt email addresses'
        };

        return {
          type: 'encrypted',
          filename: `subscribers_encrypted_${Date.now()}.json`,
          data: JSON.stringify(exportData, null, 2)
        };
      } else {
        // Return CSV with masked emails only
        const csvData = [
          ['ID', 'Email (Masked)', 'Verified', 'Subscribed', 'Joined Date', 'Tags'],
          ...subscribers.map(sub => [
            sub.id,
            this.maskEmail(this.decryptEmail(sub.emailEncrypted)),
            sub.verified ? 'Yes' : 'No',
            sub.subscribed ? 'Yes' : 'No',
            sub.joinedDate,
            sub.tags.join(';')
          ])
        ].map(row => row.join(',')).join('\n');

        return {
          type: 'csv',
          filename: `subscribers_masked_${Date.now()}.csv`,
          data: csvData
        };
      }
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      throw error;
    }
  }

  /**
   * Send email campaign securely
   */
  async sendCampaign(adminId: string, subject: string, message: string, recipients: 'all' | 'verified' | 'subscribed'): Promise<any> {
    try {
      const subscribers = await this.getAllSubscribers();
      
      // Filter recipients
      let targetSubscribers = subscribers;
      switch (recipients) {
        case 'verified':
          targetSubscribers = subscribers.filter(s => s.verified);
          break;
        case 'subscribed':
          targetSubscribers = subscribers.filter(s => s.subscribed);
          break;
      }

      // Log campaign send
      await this.logEmailAccess(adminId, 'send', targetSubscribers.length);

      // In production, integrate with secure email service (SendGrid, AWS SES, etc.)
      console.log(`📧 Secure email campaign sent to ${targetSubscribers.length} recipients`);
      console.log(`Subject: ${subject}`);
      console.log(`Recipients: ${recipients} (${targetSubscribers.length} emails)`);

      return {
        success: true,
        recipientCount: targetSubscribers.length,
        campaignId: `campaign_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        message: 'Campaign sent securely'
      };
    } catch (error) {
      console.error('Error sending secure campaign:', error);
      throw error;
    }
  }

  /**
   * Log email access for audit trail
   */
  private async logEmailAccess(adminId: string, action: string, subscriberCount: number): Promise<void> {
    try {
      const logEntry: EmailAccessLog = {
        id: `log_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        adminId: adminId,
        adminEmail: 'ottmar.francisca1969@gmail.com', // In production, get from user data
        action: action as any,
        subscriberCount: subscriberCount,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1', // In production, get from request
        userAgent: 'Admin Panel' // In production, get from request
      };

      // Save to audit log storage
      await this.saveAuditLog(logEntry);
    } catch (error) {
      console.error('Error logging email access:', error);
    }
  }

  /**
   * Get audit logs for compliance
   */
  async getAuditLogs(adminId: string, days: number = 30): Promise<EmailAccessLog[]> {
    try {
      // In production, query from secure audit log storage
      return []; // Mock implementation
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Mock storage methods (replace with actual database implementation)
  private async saveSubscriber(subscriber: SecureEmailSubscriber): Promise<void> {
    console.log('🔒 Saving encrypted subscriber:', {
      id: subscriber.id,
      emailMasked: this.maskEmail(this.decryptEmail(subscriber.emailEncrypted)),
      verified: subscriber.verified
    });
  }

  private async getAllSubscribers(): Promise<SecureEmailSubscriber[]> {
    // Mock encrypted subscribers
    return [
      {
        id: 'sub_1',
        emailHash: await bcrypt.hash('contact@weboom.be', this.HASH_ROUNDS),
        emailEncrypted: this.encryptEmail('contact@weboom.be').encrypted,
        verified: true,
        subscribed: true,
        joinedDate: '2025-07-06T19:00:00.000Z',
        tags: ['chat signup', 'Marketing'],
        accessCount: 0
      },
      {
        id: 'sub_2',
        emailHash: await bcrypt.hash('info@smithersofstamford.com', this.HASH_ROUNDS),
        emailEncrypted: this.encryptEmail('info@smithersofstamford.com').encrypted,
        verified: true,
        subscribed: true,
        joinedDate: '2025-07-05T19:00:00.000Z',
        tags: ['Marketing', 'Newsletter'],
        accessCount: 0
      }
    ];
  }

  private async findSubscriberByEmail(email: string): Promise<SecureEmailSubscriber | null> {
    // In production, search by hash for privacy
    return null;
  }

  private async saveAuditLog(logEntry: EmailAccessLog): Promise<void> {
    console.log('📋 Audit log entry:', {
      action: logEntry.action,
      adminId: logEntry.adminId,
      subscriberCount: logEntry.subscriberCount,
      timestamp: logEntry.timestamp
    });
  }
}

export const secureEmailService = new SecureEmailService();

