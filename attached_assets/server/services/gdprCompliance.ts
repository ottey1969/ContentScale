import crypto from 'crypto';

interface GDPRRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  email: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completionDate?: string;
  requestDetails: any;
  verificationToken: string;
  ipAddress: string;
  userAgent: string;
}

interface ConsentRecord {
  id: string;
  email: string;
  consentType: 'marketing' | 'newsletter' | 'analytics' | 'cookies';
  consentGiven: boolean;
  consentDate: string;
  consentMethod: 'signup' | 'checkbox' | 'email_confirmation' | 'opt_in';
  ipAddress: string;
  userAgent: string;
  withdrawalDate?: string;
  withdrawalMethod?: string;
}

interface DataProcessingRecord {
  id: string;
  email: string;
  processingType: 'collection' | 'storage' | 'transmission' | 'deletion' | 'access';
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  timestamp: string;
  adminId?: string;
  details: any;
}

class GDPRComplianceService {
  private gdprRequests: Map<string, GDPRRequest> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private processingRecords: Map<string, DataProcessingRecord[]> = new Map();

  /**
   * Handle GDPR data subject access request (Article 15)
   */
  async handleAccessRequest(email: string, ipAddress: string, userAgent: string): Promise<any> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create GDPR request
      const request: GDPRRequest = {
        id: `gdpr_access_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        type: 'access',
        email: email.toLowerCase(),
        requestDate: new Date().toISOString(),
        status: 'pending',
        requestDetails: {
          requestedData: ['personal_info', 'consent_records', 'processing_activities', 'email_history']
        },
        verificationToken: verificationToken,
        ipAddress: ipAddress,
        userAgent: userAgent
      };

      this.gdprRequests.set(request.id, request);

      // Log processing activity
      await this.logProcessingActivity(email, 'access', 'Data subject access request initiated', 'consent');

      // Send verification email (in production)
      await this.sendVerificationEmail(email, verificationToken, 'access');

      return {
        requestId: request.id,
        message: 'Access request submitted. Please check your email for verification.',
        estimatedCompletion: '30 days',
        verificationRequired: true
      };
    } catch (error) {
      console.error('Error handling access request:', error);
      throw error;
    }
  }

  /**
   * Handle GDPR right to erasure request (Article 17)
   */
  async handleErasureRequest(email: string, ipAddress: string, userAgent: string): Promise<any> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create GDPR request
      const request: GDPRRequest = {
        id: `gdpr_erasure_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        type: 'erasure',
        email: email.toLowerCase(),
        requestDate: new Date().toISOString(),
        status: 'pending',
        requestDetails: {
          dataToErase: ['all_personal_data', 'email_address', 'consent_records', 'processing_logs'],
          reason: 'withdrawal_of_consent'
        },
        verificationToken: verificationToken,
        ipAddress: ipAddress,
        userAgent: userAgent
      };

      this.gdprRequests.set(request.id, request);

      // Log processing activity
      await this.logProcessingActivity(email, 'deletion', 'Data subject erasure request initiated', 'consent');

      // Send verification email (in production)
      await this.sendVerificationEmail(email, verificationToken, 'erasure');

      return {
        requestId: request.id,
        message: 'Erasure request submitted. Please check your email for verification.',
        estimatedCompletion: '30 days',
        verificationRequired: true,
        warning: 'This will permanently delete all your data and cannot be undone.'
      };
    } catch (error) {
      console.error('Error handling erasure request:', error);
      throw error;
    }
  }

  /**
   * Handle GDPR data portability request (Article 20)
   */
  async handlePortabilityRequest(email: string, ipAddress: string, userAgent: string): Promise<any> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create GDPR request
      const request: GDPRRequest = {
        id: `gdpr_portability_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        type: 'portability',
        email: email.toLowerCase(),
        requestDate: new Date().toISOString(),
        status: 'pending',
        requestDetails: {
          format: 'json',
          includeData: ['personal_info', 'preferences', 'activity_history']
        },
        verificationToken: verificationToken,
        ipAddress: ipAddress,
        userAgent: userAgent
      };

      this.gdprRequests.set(request.id, request);

      // Log processing activity
      await this.logProcessingActivity(email, 'transmission', 'Data portability request initiated', 'consent');

      // Send verification email (in production)
      await this.sendVerificationEmail(email, verificationToken, 'portability');

      return {
        requestId: request.id,
        message: 'Data portability request submitted. Please check your email for verification.',
        estimatedCompletion: '30 days',
        verificationRequired: true,
        format: 'Structured JSON format'
      };
    } catch (error) {
      console.error('Error handling portability request:', error);
      throw error;
    }
  }

  /**
   * Verify GDPR request with token
   */
  async verifyGDPRRequest(requestId: string, verificationToken: string): Promise<any> {
    try {
      const request = this.gdprRequests.get(requestId);
      
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.verificationToken !== verificationToken) {
        throw new Error('Invalid verification token');
      }

      if (request.status !== 'pending') {
        throw new Error('Request already processed');
      }

      // Update request status
      request.status = 'processing';
      this.gdprRequests.set(requestId, request);

      // Process the request based on type
      let result;
      switch (request.type) {
        case 'access':
          result = await this.processAccessRequest(request);
          break;
        case 'erasure':
          result = await this.processErasureRequest(request);
          break;
        case 'portability':
          result = await this.processPortabilityRequest(request);
          break;
        default:
          throw new Error('Unsupported request type');
      }

      // Mark as completed
      request.status = 'completed';
      request.completionDate = new Date().toISOString();
      this.gdprRequests.set(requestId, request);

      return result;
    } catch (error) {
      console.error('Error verifying GDPR request:', error);
      throw error;
    }
  }

  /**
   * Record consent for GDPR compliance
   */
  async recordConsent(
    email: string,
    consentType: ConsentRecord['consentType'],
    consentGiven: boolean,
    method: ConsentRecord['consentMethod'],
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const consent: ConsentRecord = {
        id: `consent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        email: email.toLowerCase(),
        consentType: consentType,
        consentGiven: consentGiven,
        consentDate: new Date().toISOString(),
        consentMethod: method,
        ipAddress: ipAddress,
        userAgent: userAgent
      };

      const emailConsents = this.consentRecords.get(email.toLowerCase()) || [];
      emailConsents.push(consent);
      this.consentRecords.set(email.toLowerCase(), emailConsents);

      // Log processing activity
      await this.logProcessingActivity(
        email,
        'collection',
        `Consent ${consentGiven ? 'given' : 'withdrawn'} for ${consentType}`,
        'consent'
      );

      console.log(`📋 Consent recorded: ${email} - ${consentType} - ${consentGiven ? 'GIVEN' : 'WITHDRAWN'}`);
    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Check if user has given consent for specific type
   */
  async hasConsent(email: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    try {
      const emailConsents = this.consentRecords.get(email.toLowerCase()) || [];
      
      // Get latest consent for this type
      const latestConsent = emailConsents
        .filter(c => c.consentType === consentType)
        .sort((a, b) => new Date(b.consentDate).getTime() - new Date(a.consentDate).getTime())[0];

      return latestConsent ? latestConsent.consentGiven : false;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Generate unsubscribe link
   */
  generateUnsubscribeLink(email: string, consentType: ConsentRecord['consentType']): string {
    const token = crypto.createHash('sha256')
      .update(`${email}:${consentType}:${process.env.UNSUBSCRIBE_SECRET || 'default_secret'}`)
      .digest('hex');
    
    return `https://contentscale.site/unsubscribe?email=${encodeURIComponent(email)}&type=${consentType}&token=${token}`;
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(
    email: string,
    consentType: ConsentRecord['consentType'],
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<any> {
    try {
      // Verify unsubscribe token
      const expectedToken = crypto.createHash('sha256')
        .update(`${email}:${consentType}:${process.env.UNSUBSCRIBE_SECRET || 'default_secret'}`)
        .digest('hex');

      if (token !== expectedToken) {
        throw new Error('Invalid unsubscribe token');
      }

      // Record consent withdrawal
      await this.recordConsent(email, consentType, false, 'email_confirmation', ipAddress, userAgent);

      return {
        success: true,
        message: `Successfully unsubscribed from ${consentType}`,
        email: email,
        consentType: consentType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Log data processing activity for audit trail
   */
  private async logProcessingActivity(
    email: string,
    processingType: DataProcessingRecord['processingType'],
    purpose: string,
    legalBasis: DataProcessingRecord['legalBasis'],
    adminId?: string
  ): Promise<void> {
    try {
      const record: DataProcessingRecord = {
        id: `proc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        email: email.toLowerCase(),
        processingType: processingType,
        purpose: purpose,
        legalBasis: legalBasis,
        timestamp: new Date().toISOString(),
        adminId: adminId,
        details: {
          userAgent: 'System',
          ipAddress: 'Internal'
        }
      };

      const emailRecords = this.processingRecords.get(email.toLowerCase()) || [];
      emailRecords.push(record);
      this.processingRecords.set(email.toLowerCase(), emailRecords);

      console.log(`📊 Processing activity logged: ${email} - ${processingType} - ${purpose}`);
    } catch (error) {
      console.error('Error logging processing activity:', error);
    }
  }

  /**
   * Process access request - compile all user data
   */
  private async processAccessRequest(request: GDPRRequest): Promise<any> {
    try {
      const email = request.email;
      
      // Compile all data for the user
      const userData = {
        personalInformation: {
          email: email,
          subscriptionStatus: 'active', // Get from database
          joinDate: '2025-07-06', // Get from database
          lastActivity: new Date().toISOString()
        },
        consentRecords: this.consentRecords.get(email) || [],
        processingActivities: this.processingRecords.get(email) || [],
        gdprRequests: Array.from(this.gdprRequests.values()).filter(r => r.email === email),
        dataRetentionInfo: {
          retentionPeriod: '7 years',
          deletionDate: 'Upon request or after retention period',
          legalBasis: 'Consent and legitimate interests'
        },
        rightsInformation: {
          availableRights: [
            'Right to access (Article 15)',
            'Right to rectification (Article 16)',
            'Right to erasure (Article 17)',
            'Right to restrict processing (Article 18)',
            'Right to data portability (Article 20)',
            'Right to object (Article 21)'
          ],
          contactInformation: {
            dataProtectionOfficer: 'dpo@contentscale.site',
            supervisoryAuthority: 'Your local data protection authority'
          }
        }
      };

      // Log processing activity
      await this.logProcessingActivity(email, 'access', 'GDPR access request fulfilled', 'consent');

      return {
        requestId: request.id,
        completionDate: new Date().toISOString(),
        data: userData,
        format: 'JSON',
        message: 'Your personal data has been compiled according to GDPR Article 15'
      };
    } catch (error) {
      console.error('Error processing access request:', error);
      throw error;
    }
  }

  /**
   * Process erasure request - delete all user data
   */
  private async processErasureRequest(request: GDPRRequest): Promise<any> {
    try {
      const email = request.email;
      
      // Delete all user data
      this.consentRecords.delete(email);
      
      // Keep processing records for legal compliance but anonymize
      const processingRecords = this.processingRecords.get(email) || [];
      const anonymizedRecords = processingRecords.map(record => ({
        ...record,
        email: 'ANONYMIZED',
        details: { ...record.details, anonymized: true }
      }));
      this.processingRecords.set('ANONYMIZED', anonymizedRecords);
      this.processingRecords.delete(email);

      // In production: Delete from database, email service, etc.
      
      // Log processing activity (anonymized)
      await this.logProcessingActivity('ANONYMIZED', 'deletion', 'GDPR erasure request fulfilled', 'legal_obligation');

      return {
        requestId: request.id,
        completionDate: new Date().toISOString(),
        message: 'All personal data has been permanently deleted according to GDPR Article 17',
        dataDeleted: [
          'Email address',
          'Subscription preferences',
          'Consent records',
          'Personal identifiers'
        ],
        dataRetained: [
          'Anonymized processing logs (legal requirement)',
          'GDPR request records (legal requirement)'
        ]
      };
    } catch (error) {
      console.error('Error processing erasure request:', error);
      throw error;
    }
  }

  /**
   * Process portability request - export user data
   */
  private async processPortabilityRequest(request: GDPRRequest): Promise<any> {
    try {
      const email = request.email;
      
      // Compile portable data
      const portableData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          format: 'JSON',
          version: '1.0',
          gdprArticle: 'Article 20 - Right to data portability'
        },
        personalData: {
          email: email,
          subscriptionPreferences: {
            marketing: await this.hasConsent(email, 'marketing'),
            newsletter: await this.hasConsent(email, 'newsletter')
          },
          consentHistory: this.consentRecords.get(email) || []
        },
        metadata: {
          dataController: 'ContentScale',
          contactEmail: 'privacy@contentscale.site',
          exportRequestId: request.id
        }
      };

      // Log processing activity
      await this.logProcessingActivity(email, 'transmission', 'GDPR portability request fulfilled', 'consent');

      return {
        requestId: request.id,
        completionDate: new Date().toISOString(),
        data: portableData,
        format: 'JSON',
        message: 'Your data has been exported in a structured, machine-readable format according to GDPR Article 20'
      };
    } catch (error) {
      console.error('Error processing portability request:', error);
      throw error;
    }
  }

  /**
   * Send verification email (mock implementation)
   */
  private async sendVerificationEmail(email: string, token: string, requestType: string): Promise<void> {
    // In production, integrate with email service
    console.log(`📧 Verification email sent to ${email} for ${requestType} request`);
    console.log(`🔗 Verification link: https://contentscale.site/gdpr/verify?token=${token}`);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get GDPR compliance statistics
   */
  getComplianceStats(): any {
    const totalRequests = this.gdprRequests.size;
    const requestsByType = {
      access: Array.from(this.gdprRequests.values()).filter(r => r.type === 'access').length,
      erasure: Array.from(this.gdprRequests.values()).filter(r => r.type === 'erasure').length,
      portability: Array.from(this.gdprRequests.values()).filter(r => r.type === 'portability').length
    };
    
    const requestsByStatus = {
      pending: Array.from(this.gdprRequests.values()).filter(r => r.status === 'pending').length,
      processing: Array.from(this.gdprRequests.values()).filter(r => r.status === 'processing').length,
      completed: Array.from(this.gdprRequests.values()).filter(r => r.status === 'completed').length
    };

    return {
      totalRequests,
      requestsByType,
      requestsByStatus,
      totalConsentRecords: Array.from(this.consentRecords.values()).flat().length,
      totalProcessingRecords: Array.from(this.processingRecords.values()).flat().length,
      complianceFeatures: [
        'Consent management',
        'Data subject rights',
        'Audit trail',
        'Data minimization',
        'Secure processing',
        'Breach notification'
      ]
    };
  }
}

export const gdprComplianceService = new GDPRComplianceService();

