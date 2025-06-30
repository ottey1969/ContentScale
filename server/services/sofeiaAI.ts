import { z } from "zod";
import Anthropic from '@anthropic-ai/sdk';

// Sofeia AI - World's Most Advanced AI with Direct Responses
// Uses Anthropic API for natural, conversational responses

interface SofeiaContext {
  userEmail: string;
  isAdmin: boolean;
  currentPage?: string;
  userAgent?: string;
  timestamp: string;
  sessionHistory?: ChatMessage[];
  userProfile?: UserProfile;
  questionCount?: number;
  creditBalance?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    topic: string;
    confidence: number;
    suggestions: string[];
    reasoning: string;
    questionNumber?: number;
    creditUsed?: boolean;
  };
}

interface UserProfile {
  totalQuestions: number;
  freeQuestionsUsed: number;
  creditBalance: number;
  subscriptionStatus: 'free' | 'paid' | 'credits';
  lastPayment?: string;
  preferredTopics: string[];
}

interface PaymentInfo {
  required: boolean;
  freeQuestionsRemaining: number;
  pricePerQuestion: number;
  creditBalance: number;
  paymentOptions: {
    payPerQuestion: number;
    creditPackages: Array<{
      questions: number;
      price: number;
      savings: number;
    }>;
  };
}

// Pricing configuration
const PRICING_INFO = {
  freeQuestions: 5,
  pricePerQuestion: 2.69,
  creditPackages: [
    { questions: 10, price: 24.99, savings: 1.91 },
    { questions: 25, price: 59.99, savings: 7.26 },
    { questions: 50, price: 109.99, savings: 24.51 },
    { questions: 100, price: 199.99, savings: 69.01 }
  ]
};

export class SofeiaAI {
  private static instance: SofeiaAI;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private questionCounts: Map<string, number> = new Map();

  public static getInstance(): SofeiaAI {
    if (!SofeiaAI.instance) {
      SofeiaAI.instance = new SofeiaAI();
    }
    return SofeiaAI.instance;
  }

  async generateResponse(
    message: string, 
    context: SofeiaContext
  ): Promise<{
    content: string;
    metadata: {
      topic: string;
      confidence: number;
      suggestions: string[];
      reasoning: string;
      questionNumber: number;
      creditUsed: boolean;
    };
    paymentInfo: PaymentInfo;
  }> {
    // Get user profile and question count
    const userProfile = this.getUserProfile(context.userEmail);
    const questionNumber = userProfile.totalQuestions + 1;
    
    // Detect if this is a blog post request
    const isBlogRequest = this.isBlogPostRequest(message);
    
    // Check if payment is required (different logic for blog posts vs regular questions)
    const paymentInfo = this.getPaymentInfo(context.userEmail, userProfile, isBlogRequest);
    
    // If payment required, return payment prompt instead of processing
    if (paymentInfo.required) {
      return {
        content: isBlogRequest ? 
          "I'd love to help you create that blog post! Since you've used your free article, this will cost $2.00. Please complete payment to continue." :
          "You've used your 5 free questions. Please purchase credits or pay $2.69 per question to continue chatting.",
        metadata: {
          topic: "payment",
          confidence: 1.0,
          suggestions: ["Purchase Credits", "Pay Per Question", "Learn More"],
          reasoning: "Payment required",
          questionNumber,
          creditUsed: false
        },
        paymentInfo
      };
    }
    
    // Generate direct response using Anthropic API
    const response = await this.generateDirectResponse(message, context, questionNumber);

    // Update user profile (now correctly decrements counters)
    this.updateQuestionCount(context.userEmail, false, isBlogRequest);
    
    return {
      ...response,
      paymentInfo: this.getPaymentInfo(context.userEmail, this.getUserProfile(context.userEmail), isBlogRequest)
    };
  }

  private getUserProfile(userEmail: string): UserProfile {
    const existingProfile = this.userProfiles.get(userEmail);
    if (existingProfile) {
      return existingProfile;
    }

    const newProfile: UserProfile = {
      totalQuestions: 0,
      freeQuestionsUsed: 0,
      creditBalance: 0,
      subscriptionStatus: 'free',
      preferredTopics: []
    };

    this.userProfiles.set(userEmail, newProfile);
    return newProfile;
  }

  private getPaymentInfo(userEmail: string, userProfile: UserProfile, isBlogRequest: boolean = false): PaymentInfo {
    if (isBlogRequest) {
      // Blog posts: 1 free, then $2.00 each (matching dashboard content generation)
      const freeBlogsUsed = userProfile.preferredTopics.includes('blog_created') ? 1 : 0;
      const hasCredits = userProfile.creditBalance > 0;
      const paymentRequired = freeBlogsUsed >= 1 && !hasCredits;
      
      return {
        required: paymentRequired,
        freeQuestionsRemaining: Math.max(0, 1 - freeBlogsUsed),
        pricePerQuestion: 2.00, // Blog posts cost $2.00
        creditBalance: userProfile.creditBalance,
        paymentOptions: {
          payPerQuestion: 2.00,
          creditPackages: PRICING_INFO.creditPackages
        }
      };
    } else {
      // Regular questions: 5 free, then $2.69 each
      const freeQuestionsRemaining = Math.max(0, PRICING_INFO.freeQuestions - userProfile.freeQuestionsUsed);
      const hasCredits = userProfile.creditBalance > 0;
      const paymentRequired = freeQuestionsRemaining === 0 && !hasCredits;

      return {
        required: paymentRequired,
        freeQuestionsRemaining,
        pricePerQuestion: PRICING_INFO.pricePerQuestion,
        creditBalance: userProfile.creditBalance,
        paymentOptions: {
          payPerQuestion: PRICING_INFO.pricePerQuestion,
          creditPackages: PRICING_INFO.creditPackages
        }
      };
    }
  }

  private async generateDirectResponse(
    message: string,
    context: SofeiaContext,
    questionNumber: number
  ) {
    try {
      // Use Anthropic API for natural, direct responses
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `You are Sofeia AI, a world-class content strategist and SEO expert specializing in the CRAFT framework and RankMath principles. You provide direct, actionable advice with professional insights.

**CRAFT FRAMEWORK EXPERTISE:**
- **C**lear: Write in simple, clear language that's easy to understand
- **R**elevant: Stay focused on the topic and user intent  
- **A**uthentic: Use genuine insights and avoid generic content
- **F**ocused: Maintain tight focus on the main topic throughout
- **T**imely: Include current information and trends (2025 focus)

**RANKMATH SEO MASTERY:**
- Target keyword optimization (0.5-2.5% density) 
- H2/H3 heading structure with keyword variations
- Meta descriptions under 150 characters, compelling and keyword-rich
- Featured snippet optimization for position zero
- FAQ sections optimized for voice search
- Schema markup recommendations
- Internal/external linking strategies
- AI Overview optimization for Google AI features
- Content length adaptation: 800+ (short), 1500+ (medium), 2500+ (long)

**PROFESSIONAL CONTENT STRUCTURE:**
1. Hook introduction with problem identification and solution preview
2. Key benefits section with strategic H2 headings
3. Best practices with actionable H3 subheadings
4. Advanced techniques for expert-level implementation
5. FAQ section optimized for voice search and AI Overview
6. Strong conclusion with clear call-to-action

**SEO REQUIREMENTS:**
- Primary keyword in title, first paragraph, and conclusion
- LSI keywords naturally integrated throughout
- Mobile-first content structure and readability
- Flesch-Kincaid readability score 60+ for accessibility
- Current statistics and trends for 2025
- Authority link opportunities identified

**RESPONSE STYLE:**
• Direct and conversational - no unnecessary introductions
• Provide specific, actionable insights with measurable outcomes
• Include relevant 2025 statistics and current trends
• Offer strategic recommendations following CRAFT and RankMath principles
• Structure responses for maximum SEO impact and user value
• Always optimize content for Google AI Overview features`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      });

      const analysis = this.analyzeMessage(message);
      const firstBlock = response.content[0];
      const content = (firstBlock && 'text' in firstBlock) ? firstBlock.text : "I'm here to help! What would you like to know?";

      return {
        content,
        metadata: {
          topic: analysis.primaryTopic,
          confidence: 0.95,
          suggestions: this.generateQuickSuggestions(analysis.primaryTopic),
          reasoning: "Direct AI response",
          questionNumber,
          creditUsed: questionNumber > PRICING_INFO.freeQuestions
        }
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      
      // Fallback to simple direct response
      const analysis = this.analyzeMessage(message);
      return {
        content: "I'm ready to help! What specific question do you have?",
        metadata: {
          topic: analysis.primaryTopic,
          confidence: 0.8,
          suggestions: this.generateQuickSuggestions(analysis.primaryTopic),
          reasoning: "Fallback response",
          questionNumber,
          creditUsed: questionNumber > PRICING_INFO.freeQuestions
        }
      };
    }
  }

  private generateQuickSuggestions(topic: string): string[] {
    const suggestions = {
      technology: ["Show me code examples", "Explain the technical details", "What are best practices?"],
      business: ["Give me strategic insights", "How can I improve?", "What's the market trend?"],
      creative: ["Show me examples", "Give me inspiration", "What tools should I use?"],
      personal: ["What should I do next?", "How can I improve this?", "Give me specific steps"],
      education: ["Explain it simply", "Give me examples", "How does this work?"],
      science: ["Show me the research", "Explain the process", "What are the implications?"],
      general: ["Tell me more", "Give me examples", "How can I use this?"]
    };
    
    return suggestions[topic as keyof typeof suggestions] || suggestions.general;
  }

  private analyzeMessage(message: string) {
    // Determine topic categories
    const topics = {
      technology: ['code', 'programming', 'software', 'tech', 'ai', 'machine learning'],
      business: ['marketing', 'strategy', 'sales', 'finance', 'startup', 'growth'],
      creative: ['design', 'writing', 'art', 'music', 'video', 'creative'],
      personal: ['advice', 'help', 'guidance', 'life', 'career', 'relationship'],
      education: ['learn', 'study', 'teach', 'explain', 'understand', 'knowledge'],
      science: ['research', 'data', 'analysis', 'experiment', 'theory', 'discovery']
    };

    let primaryTopic = 'general';
    let maxMatches = 0;

    for (const [topic, keywords] of Object.entries(topics)) {
      const matches = keywords.filter(keyword => 
        message.toLowerCase().includes(keyword)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        primaryTopic = topic;
      }
    }

    const complexity = this.assessComplexity(message);
    const urgency = this.assessUrgency(message);

    return { primaryTopic, complexity, urgency, messageLength: message.length };
  }

  private assessComplexity(message: string): 'simple' | 'moderate' | 'complex' {
    if (message.length < 50) return 'simple';
    if (message.length < 150) return 'moderate';
    return 'complex';
  }

  private assessUrgency(message: string): boolean {
    const urgencyWords = ['urgent', 'asap', 'quickly', 'immediately', 'now', 'emergency'];
    return urgencyWords.some(word => message.toLowerCase().includes(word));
  }

  // Essential utility methods
  private isBlogPostRequest(message: string): boolean {
    const blogKeywords = [
      'write', 'blog', 'post', 'article', 'content', 'write me', 'create',
      'draft', 'compose', 'generate content', 'blog post', 'write an article'
    ];
    
    const messageLower = message.toLowerCase();
    return blogKeywords.some(keyword => messageLower.includes(keyword)) &&
           (messageLower.includes('blog') || messageLower.includes('article') || messageLower.includes('post'));
  }

  private updateQuestionCount(userEmail: string, paymentRequired: boolean, isBlogRequest: boolean = false): void {
    const profile = this.getUserProfile(userEmail);
    profile.totalQuestions += 1;
    
    if (isBlogRequest) {
      // Track blog creation in preferredTopics
      if (!profile.preferredTopics.includes('blog_created')) {
        profile.preferredTopics.push('blog_created');
      }
    } else {
      // Regular questions: use free questions first, then credits
      if (!paymentRequired && profile.freeQuestionsUsed < PRICING_INFO.freeQuestions) {
        profile.freeQuestionsUsed += 1;
      } else if (profile.creditBalance > 0) {
        profile.creditBalance -= 1;
      }
    }
    
    this.userProfiles.set(userEmail, profile);
  }

  // Credit system methods
  addCredits(userEmail: string, credits: number): void {
    const profile = this.getUserProfile(userEmail);
    profile.creditBalance += credits;
    this.userProfiles.set(userEmail, profile);
  }

  getCredits(userEmail: string): number {
    return this.getUserProfile(userEmail).creditBalance;
  }

  // Session management methods
  createSession(userEmail: string): string {
    const sessionId = `session_${userEmail}_${Date.now()}`;
    this.conversationHistory.set(sessionId, []);
    return sessionId;
  }

  getSessionHistory(sessionId: string): ChatMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}

export const sofeiaAI = SofeiaAI.getInstance();