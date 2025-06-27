import { storage } from "../storage";
import { randomBytes } from 'crypto';

class ReferralSystem {
  async getReferralCode(userId: string): Promise<string> {
    // Check if user already has a referral code
    const existingReferral = await storage.getUserReferralCode(userId);
    if (existingReferral) {
      return existingReferral.referralCode;
    }
    
    // Generate new referral code
    const referralCode = this.generateReferralCode(userId);
    await storage.createReferral({
      referrerId: userId,
      referralCode,
      status: 'pending',
    });
    
    return referralCode;
  }

  async processReferralSignup(referralCode: string, newUserId?: string): Promise<void> {
    const referral = await storage.getReferralByCode(referralCode);
    if (!referral) {
      console.log('Referral code not found:', referralCode);
      return;
    }
    
    if (newUserId) {
      // Update referral with new user ID
      await storage.updateReferral(referral.id, {
        referredUserId: newUserId,
        status: 'pending', // Still pending until user creates content
      });
    }
  }

  async processReferralConversion(userId: string): Promise<void> {
    // Called when a referred user creates their first content
    const referral = await storage.getReferralByReferredUser(userId);
    if (!referral || referral.status !== 'pending') {
      return;
    }
    
    // Calculate credits to award (5 credits per conversion)
    const creditsToAward = 5;
    
    // Update referral status
    await storage.updateReferral(referral.id, {
      status: 'converted',
      conversionDate: new Date(),
      creditsAwarded: creditsToAward,
    });
    
    // Award credits to referrer
    const referrer = await storage.getUser(referral.referrerId);
    if (referrer) {
      await storage.updateUserCredits(
        referral.referrerId,
        referrer.credits + creditsToAward
      );
      
      // Update referrer stats
      await storage.updateUser(referral.referrerId, {
        totalConversions: referrer.totalConversions + 1,
        referralCreditsEarned: referrer.referralCreditsEarned + creditsToAward,
      });
      
      // Create activity for referrer
      await storage.createActivity({
        userId: referral.referrerId,
        type: 'referral_converted',
        title: 'New referral conversion',
        description: `+${creditsToAward} blog credits earned`,
        metadata: { 
          referredUserId: userId,
          creditsAwarded: creditsToAward,
        },
      });
      
      // Update referral achievement
      await storage.updateAchievement(referral.referrerId, 'referral_pro', 1);
      
      // Check for bonus rewards
      await this.checkBonusRewards(referral.referrerId);
    }
  }

  private async checkBonusRewards(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;
    
    const totalConversions = user.totalConversions;
    let bonusCredits = 0;
    
    // Bonus structure: 1 = 5, 3 = 20 total (15 bonus), 10 = 100 total (50 bonus)
    if (totalConversions === 3) {
      bonusCredits = 15; // 20 total - 15 already earned = 5 bonus
    } else if (totalConversions === 10) {
      bonusCredits = 50; // 100 total - 50 already earned = 50 bonus
    }
    
    if (bonusCredits > 0) {
      await storage.updateUserCredits(userId, user.credits + bonusCredits);
      
      await storage.createActivity({
        userId,
        type: 'referral_bonus',
        title: `Referral milestone bonus: ${bonusCredits} credits!`,
        description: `Congratulations on ${totalConversions} successful referral conversions`,
        metadata: { 
          milestone: totalConversions,
          bonusCredits,
        },
      });
    }
  }

  private generateReferralCode(userId: string): string {
    // Generate a unique referral code based on user ID and random bytes
    const randomPart = randomBytes(4).toString('hex');
    const userPart = userId.slice(-4);
    return `${userPart}${randomPart}`.toLowerCase();
  }

  async generateShareableLinks(referralCode: string): Promise<{
    twitter: string;
    linkedin: string;
    whatsapp: string;
    email: string;
  }> {
    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'contentscale.site';
    const referralUrl = `https://${baseUrl}/signup?ref=${referralCode}`;
    
    const message = "🚀 Just discovered ContentScale Agent - an AI-powered content creation platform that's revolutionizing how we create SEO-optimized content! Check it out:";
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message} ${referralUrl}`)}`,
      email: `mailto:?subject=${encodeURIComponent('Check out ContentScale Agent')}&body=${encodeURIComponent(`${message}\n\n${referralUrl}`)}`,
    };
  }
}

export const referralSystem = new ReferralSystem();
