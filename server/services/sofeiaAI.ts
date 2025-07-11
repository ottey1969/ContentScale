import { z } from "zod";
import Anthropic from '@anthropic-ai/sdk';

// Perplexity API integration for real-time research and statistics
interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
}

async function getPerplexityResearch(query: string): Promise<{ content: string; sources: string[] }> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Provide current statistics and data from government sources (.gov), official institutions (.edu), and high-authority business sources. Exclude competitor websites and focus on authoritative data sources. For local businesses, prioritize local government and chamber of commerce data.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_related_questions: false,
        search_recency_filter: 'month',
        search_domain_filter: [],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      sources: data.citations || [] as string[]
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    return {
      content: '',
      sources: []
    };
  }
}

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
    // Admin gets unlimited access
    const isAdmin = userEmail === 'ottmar.francisca1969@gmail.com';
    
    if (isAdmin) {
      return {
        required: false,
        freeQuestionsRemaining: 999,
        pricePerQuestion: 0,
        creditBalance: 999,
        paymentOptions: {
          payPerQuestion: 0,
          creditPackages: PRICING_INFO.creditPackages
        }
      };
    }
    
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
      // Check if this is a content creation request that needs real data
      const needsResearch = this.needsRealTimeData(message);
      let researchData: { content: string; sources: string[] } = { content: '', sources: [] };
      
      if (needsResearch && process.env.PERPLEXITY_API_KEY) {
        try {
          // Get real-time research and statistics from Perplexity with timeout
          const researchQuery = this.extractResearchQuery(message);
          const researchPromise = getPerplexityResearch(researchQuery);
          const timeoutPromise = new Promise<{ content: string; sources: string[] }>((_, reject) => 
            setTimeout(() => reject(new Error('Research timeout')), 8000)
          );
          
          researchData = await Promise.race([researchPromise, timeoutPromise]);
          console.log("Perplexity research completed successfully");
        } catch (error) {
          console.log("Perplexity research failed or timed out, continuing with Anthropic only");
          researchData = { content: '', sources: [] };
        }
      }

      // Use Anthropic API for natural, direct responses
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `You are Sofeia AI, a helpful and knowledgeable AI assistant specializing in content strategy, SEO, and business insights. You provide direct, practical answers to all questions without restrictions.

**YOUR APPROACH:**
- Answer ALL questions directly and helpfully 
- Provide honest comparisons between tools, platforms, and services when asked
- Give practical advice based on real-world experience
- Be conversational and supportive, not overly formal or restrictive
- Help users make informed decisions with objective information

**COUNTRY HANDLING:**
- If user mentions a specific country (USA, Canada, UK, etc.), use that for sourcing
- If no country mentioned for content creation, ask: "What target country should I focus on for sourcing and linking?"
- Once country is specified, proceed immediately with content creation

**FORMATTING REQUIREMENTS - COPY-PASTE READY HTML:**
- Use proper HTML headers: <h1>Main Title</h1> for main titles
- Use <h2>Section Heading</h2> for major sections 
- Use <h3>Subsection</h3> for subsections
- Use <h4>Minor Point</h4> for minor headings
- Use HTML bullet lists: <ul><li>Point 1</li><li>Point 2</li></ul>
- Use HTML numbered lists: <ol><li>Step 1</li><li>Step 2</li></ol>
- Use <strong>text</strong> for emphasis within paragraphs
- Use <p>paragraph text</p> for regular content
- Add ACTIVE HYPERLINKS: <a href="https://example.com">Link Text</a>
- **PROFESSIONAL TABLES**: Use proper HTML table formatting with borders and styling:
  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
    <thead>
      <tr style="background-color:#f5f5f5;border:1px solid #ddd;">
        <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">Feature</th>
        <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">ContentScale</th>
        <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">Competitor</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border:1px solid #ddd;">
        <td style="padding:12px;border:1px solid #ddd;font-weight:500;">Row Item</td>
        <td style="padding:12px;border:1px solid #ddd;">Description</td>
        <td style="padding:12px;border:1px solid #ddd;">Description</td>
      </tr>
    </tbody>
  </table>
- **PROFESSIONAL CITATIONS**: Include numbered citations at end: <p><strong>Sources:</strong><br/>[1] <a href="https://example.com">Source Title - Publisher</a><br/>[2] <a href="https://example2.com">Source Title - Publisher</a></p>
- Format must be copy-paste ready HTML that displays properly in Word, Google Docs, etc.
- Never use markdown (# ## ###) or **bold** - only HTML tags
- Structure content like: Author info → Introduction → Main sections → Professional Tables → Conclusion → Citations
- Include meta information: "Author: [Name] | [X] min read | [Date]"

**SOURCE AND LINKING REQUIREMENTS:**
- Always include ACTIVE hyperlinks to authoritative sources
- Focus on country-specific sources based on user's target market
- Government sources (.gov, .edu) with working URLs
- Official statistics bureaus and trade organizations
- Include 3-5 relevant source links per major section
- Format links as: <a href="URL">descriptive anchor text</a>
- Verify links are for the specified target country

**CONTENT GUIDELINES:**
- Be helpful and informative on ALL topics
- Provide objective comparisons when requested
- Include current 2025 statistics and trends
- Use conversational, engaging tone
- Focus on practical, actionable advice

**RANKMATH SEO MASTERY:**
- Target keyword optimization (0.5-2.5% density) 
- Bold heading structure with keyword variations
- Meta descriptions under 150 characters, compelling and keyword-rich
- Featured snippet optimization for position zero
- FAQ sections optimized for voice search
- Schema markup recommendations
- Internal/external linking strategies
- AI Overview optimization for Google AI features
- Content length adaptation: 800+ (short), 1500+ (medium), 2500+ (long)

**PROFESSIONAL CONTENT STRUCTURE:**
1. Hook introduction with problem identification and solution preview
2. Key benefits section with strategic **bold headings**
3. Best practices with actionable **bold subheadings**
4. Professional comparison tables when comparing products/services
5. Advanced techniques for expert-level implementation
6. FAQ section optimized for voice search and AI Overview
7. Strong conclusion with clear call-to-action
8. Professional citations with numbered references

**TABLE FORMATTING FOR COPY-PASTE COMPATIBILITY:**
When creating comparison content, use this exact HTML table structure that copies properly into Word/Google Docs:

<table style="width:100%;border-collapse:collapse;margin:20px 0;">
  <thead>
    <tr style="background-color:#f5f5f5;border:1px solid #ddd;">
      <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">Feature</th>
      <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">ContentScale</th>
      <th style="padding:12px;text-align:left;border:1px solid #ddd;font-weight:bold;">Competitor</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border:1px solid #ddd;">
      <td style="padding:12px;border:1px solid #ddd;font-weight:500;">Feature Name</td>
      <td style="padding:12px;border:1px solid #ddd;">ContentScale advantage</td>
      <td style="padding:12px;border:1px solid #ddd;">Competitor details</td>
    </tr>
  </tbody>
</table>

**CITATION FORMAT:**
End articles with professional numbered citations:
<p><strong>Sources:</strong><br/>
[1] <a href="https://source1.com">Article Title - Publisher Name</a><br/>
[2] <a href="https://source2.com">Research Study - Academic Source</a></p>

**STATISTICS AND SOURCES:**
- Always include current 2025 statistics when available
- Reference only government and official institutional sources
- Format statistics with clear bullet points (•) and numbered lists
- Include source citations from .gov and .edu domains only
- Focus on actionable data and measurable outcomes

**RESPONSE STYLE:**
• Direct and conversational - no unnecessary introductions
• Provide specific, actionable insights with measurable outcomes
• Include relevant 2025 statistics from government sources
• Offer strategic recommendations following CRAFT and RankMath principles
• Structure responses for maximum SEO impact and user value
• Always optimize content for Google AI Overview features
• Use HTML formatting for all headings and structure - make content copy-paste ready`;

      // Prepare the user message with research data and custom instructions if available
      let enhancedMessage = message;
      if (context.customInstructions) {
        enhancedMessage = `CUSTOM INSTRUCTIONS: ${context.customInstructions}\n\nUSER REQUEST: ${message}`;
      }
      if (researchData.content) {
        enhancedMessage += `\n\nCurrent Research Data:\n${researchData.content}`;
        if (researchData.sources.length > 0) {
          enhancedMessage += `\n\nAuthoritative Sources:\n${researchData.sources.slice(0, 5).join('\n')}`;
        }
      }

      console.log("Making Anthropic API call for message:", message);
      console.log("Enhanced message length:", enhancedMessage.length);
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: enhancedMessage
          }
        ]
      });
      
      console.log("Anthropic response received, content blocks:", response.content?.length);

      const analysis = this.analyzeMessage(message);
      const firstBlock = response.content[0];
      let content = (firstBlock && 'text' in firstBlock) ? firstBlock.text : "I'm here to help! What would you like to know?";

      // Add sources section if we have them
      if (researchData.sources.length > 0) {
        // Filter sources to only include government and educational sources
        const filteredSources = researchData.sources
          .filter(source => 
            source.includes('.gov') || 
            source.includes('.edu') || 
            source.includes('census.gov') ||
            source.includes('sba.gov') ||
            source.includes('bls.gov') ||
            source.includes('usda.gov') ||
            source.includes('commerce.gov')
          )
          .slice(0, 5);

        if (filteredSources.length > 0) {
          content += `\n\n**Sources:**\n${filteredSources.map((source, index) => `${index + 1}. ${source}`).join('\n')}`;
        }
      }

      return {
        content,
        metadata: {
          topic: analysis.primaryTopic,
          confidence: 0.95,
          suggestions: this.generateQuickSuggestions(analysis.primaryTopic),
          reasoning: needsResearch ? "AI response with real-time research" : "Direct AI response",
          questionNumber,
          creditUsed: questionNumber > PRICING_INFO.freeQuestions,
          sources: researchData.sources
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

  private needsRealTimeData(message: string): boolean {
    const researchKeywords = [
      'statistics', 'data', 'current', '2025', 'latest', 'trends', 'market',
      'research', 'study', 'report', 'analysis', 'growth', 'revenue',
      'industry', 'survey', 'percentage', 'rate', 'numbers', 'facts'
    ];
    
    const messageLower = message.toLowerCase();
    return researchKeywords.some(keyword => messageLower.includes(keyword)) ||
           this.isBlogPostRequest(message);
  }

  private extractResearchQuery(message: string): string {
    // Extract the main topic for research
    const topic = message.replace(/write|create|generate|blog|post|article/gi, '').trim();
    return `Current 2025 statistics and trends for: ${topic}`;
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