import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export class EmailValidationService {
  // Common disposable email domains to block
  private disposableEmailDomains = new Set([
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    'temp-mail.org',
    'throwaway.email',
    'maildrop.cc',
    'sharklasers.com',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'bccto.me',
    'chacuo.net',
    'dispostable.com',
    'trbvm.com',
    'mohmal.com',
    'emailondeck.com',
    'getairmail.com',
    'getnada.com',
    'rhyta.com',
    'tmpmail.net',
    'tmpeml.com'
  ]);

  // Common email providers that are legitimate
  private legitimateProviders = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'zoho.com',
    'fastmail.com'
  ]);

  /**
   * Validates email format using regex
   */
  validateEmailFormat(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Checks if email domain exists and has MX records
   */
  async validateEmailDomain(email: string): Promise<boolean> {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      // Check if domain has MX records
      const mxRecords = await resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      console.error('Domain validation error:', error);
      return false;
    }
  }

  /**
   * Checks if email is from a disposable/temporary email service
   */
  isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return true;

    return this.disposableEmailDomains.has(domain);
  }

  /**
   * Checks if email is from a legitimate provider
   */
  isFromLegitimateProvider(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return this.legitimateProviders.has(domain);
  }

  /**
   * Comprehensive email validation
   */
  async validateEmail(email: string): Promise<{
    isValid: boolean;
    score: number; // 0-100 quality score
    reasons: string[];
    canAcceptMarketing: boolean;
  }> {
    const reasons: string[] = [];
    let score = 0;
    let isValid = true;
    let canAcceptMarketing = true;

    // Format validation
    if (!this.validateEmailFormat(email)) {
      isValid = false;
      reasons.push('Invalid email format');
      return { isValid, score: 0, reasons, canAcceptMarketing: false };
    }

    score += 20; // Base score for valid format

    // Disposable email check
    if (this.isDisposableEmail(email)) {
      isValid = false;
      canAcceptMarketing = false;
      reasons.push('Temporary/disposable email detected');
      return { isValid, score: 0, reasons, canAcceptMarketing };
    }

    score += 30; // Not disposable

    // Legitimate provider check
    if (this.isFromLegitimateProvider(email)) {
      score += 30;
      reasons.push('From trusted email provider');
    } else {
      // Check domain validity for unknown providers
      const domainValid = await this.validateEmailDomain(email);
      if (domainValid) {
        score += 15;
        reasons.push('Domain has valid MX records');
      } else {
        isValid = false;
        canAcceptMarketing = false;
        reasons.push('Domain does not exist or cannot receive emails');
        return { isValid, score: 0, reasons, canAcceptMarketing };
      }
    }

    // Additional quality checks
    const localPart = email.split('@')[0];
    
    // Check for suspicious patterns
    if (localPart.length < 3) {
      score -= 10;
      reasons.push('Suspiciously short local part');
    }

    if (/^[a-z]+\d{4,}$/.test(localPart)) {
      score -= 5;
      reasons.push('Potentially auto-generated email');
    }

    // Bonus for common patterns of real emails
    if (/^[a-zA-Z]+\.[a-zA-Z]+/.test(localPart) || /^[a-zA-Z]+\d{1,3}$/.test(localPart)) {
      score += 5;
      reasons.push('Natural email pattern detected');
    }

    score += 15; // Final bonus for passing all checks

    return {
      isValid: isValid && score >= 50,
      score: Math.min(100, Math.max(0, score)),
      reasons,
      canAcceptMarketing: canAcceptMarketing && score >= 70
    };
  }

  /**
   * Generate verification token
   */
  generateVerificationToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Validate verification token format
   */
  isValidVerificationToken(token: string): boolean {
    return /^[a-z0-9]{10,}$/.test(token);
  }
}

export const emailValidationService = new EmailValidationService();