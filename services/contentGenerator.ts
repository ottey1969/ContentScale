import { InsertContent, Content } from "@shared/schema";
import { storage } from "../storage";

interface ContentGenerationRequest extends InsertContent {
  topic?: string;
  targetKeywords?: string[];
  contentLength?: 'short' | 'medium' | 'long';
}

interface AIContentResponse {
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  seoScore: number;
  aiOverviewPotential: 'high' | 'medium' | 'low';
  aiModeScore: number;
}

class ContentGenerator {
  async generateContent(request: ContentGenerationRequest): Promise<Content> {
    try {
      // Simulate AI content generation with sophisticated SEO optimization
      const generatedContent = await this.simulateAIGeneration(request);
      
      // Save to database
      const content = await storage.createContent({
        userId: request.userId,
        title: generatedContent.title,
        content: generatedContent.content,
        metaDescription: generatedContent.metaDescription,
        keywords: generatedContent.keywords,
        contentType: request.contentType,
        seoScore: generatedContent.seoScore,
        aiOverviewPotential: generatedContent.aiOverviewPotential,
        aiModeScore: generatedContent.aiModeScore,
        status: 'draft',
        creditsUsed: 1,
      });

      return content;
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

  private async simulateAIGeneration(request: ContentGenerationRequest): Promise<AIContentResponse> {
    // In a real implementation, this would call OpenAI API or similar
    // For now, we'll simulate sophisticated content generation
    
    const contentTemplates = {
      blog: {
        title: `${this.extractMainTopic(request.topic || '')} - Complete Guide for 2025`,
        structure: ['introduction', 'main-points', 'practical-examples', 'conclusion'],
      },
      article: {
        title: `Understanding ${this.extractMainTopic(request.topic || '')}: Expert Analysis`,
        structure: ['overview', 'deep-dive', 'implications', 'recommendations'],
      },
      faq: {
        title: `Frequently Asked Questions About ${this.extractMainTopic(request.topic || '')}`,
        structure: ['common-questions', 'detailed-answers', 'additional-resources'],
      },
      social: {
        title: `${this.extractMainTopic(request.topic || '')} - Key Insights`,
        structure: ['hook', 'main-point', 'call-to-action'],
      },
    };

    const template = contentTemplates[request.contentType as keyof typeof contentTemplates] || contentTemplates.blog;
    
    // Generate sophisticated content with CRAFT framework integration
    const content = await this.generateWithCRAFTFramework(request, template);
    const keywords = this.generateSEOKeywords(request.topic || '');
    const seoScore = this.calculateSEOScore(content, keywords);
    
    return {
      title: template.title,
      content,
      metaDescription: this.generateMetaDescription(template.title, content),
      keywords,
      seoScore,
      aiOverviewPotential: this.assessAIOverviewPotential(content, keywords),
      aiModeScore: this.calculateAIModeScore(content, keywords),
    };
  }

  private extractMainTopic(input: string): string {
    // Extract the main topic from user input
    const cleanedInput = input.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const topicKeywords = cleanedInput.split(' ').slice(0, 3).join(' ');
    return topicKeywords || 'Cybersecurity Best Practices';
  }

  private async generateWithCRAFTFramework(request: ContentGenerationRequest, template: any): Promise<string> {
    const topic = this.extractMainTopic(request.topic || '');
    
    // CRAFT Framework: Cutting-edge, Relevant, Accurate, Factual, Trustworthy
    const sections = {
      introduction: `
# ${template.title}

In today's rapidly evolving digital landscape, ${topic} has become more critical than ever. This comprehensive guide provides cutting-edge insights and practical strategies that industry experts recommend for 2025.

## What You Need to Know

Understanding ${topic} is essential for modern businesses and individuals alike. Recent developments in AI and cybersecurity have fundamentally changed how we approach these challenges.
      `,
      
      mainContent: `
## Key Components of ${topic}

### 1. Current Industry Standards
The latest industry benchmarks show that organizations implementing proper ${topic} strategies see significant improvements in security posture and operational efficiency.

### 2. Best Practices Implementation
- **Risk Assessment**: Conduct thorough evaluations of current vulnerabilities
- **Strategic Planning**: Develop comprehensive implementation roadmaps  
- **Continuous Monitoring**: Establish ongoing assessment protocols
- **Staff Training**: Ensure team members understand key principles

### 3. Advanced Strategies for 2025
Modern approaches to ${topic} incorporate AI-powered solutions and automated threat detection systems. These technologies enable proactive rather than reactive security measures.

## Practical Implementation Steps

1. **Assessment Phase**: Evaluate current state and identify gaps
2. **Planning Phase**: Develop detailed implementation strategy
3. **Execution Phase**: Deploy solutions with proper testing
4. **Monitoring Phase**: Continuously assess and improve

### Common Challenges and Solutions

Many organizations face similar obstacles when implementing ${topic} strategies. Here are proven solutions:

- **Budget Constraints**: Prioritize high-impact, low-cost measures first
- **Technical Complexity**: Partner with certified professionals
- **Staff Resistance**: Implement comprehensive training programs
- **Compliance Requirements**: Ensure all solutions meet regulatory standards
      `,
      
      conclusion: `
## Key Takeaways

Implementing effective ${topic} strategies requires a comprehensive approach that combines technical expertise with strategic planning. The key is to start with foundational elements and gradually build more sophisticated capabilities.

### Next Steps

1. Conduct a thorough assessment of your current situation
2. Develop a prioritized implementation plan
3. Begin with high-impact, low-risk improvements
4. Continuously monitor and adjust your approach

For expert consultation on ${topic} implementation, contact our certified professionals who can provide personalized guidance for your specific needs.
      `
    };

    return [sections.introduction, sections.mainContent, sections.conclusion].join('\n\n');
  }

  private generateSEOKeywords(topic: string): string[] {
    const baseKeywords = topic.toLowerCase().split(' ');
    const seoKeywords = [
      topic,
      `${topic} best practices`,
      `${topic} guide 2025`,
      `how to implement ${topic}`,
      `${topic} strategy`,
      `${topic} solutions`,
      `${topic} consulting`,
      `${topic} expert advice`,
    ];

    // Add cybersecurity-specific keywords if relevant
    if (topic.includes('security') || topic.includes('cyber')) {
      seoKeywords.push(
        'cybersecurity consultant Netherlands',
        'AI powered security analysis',
        'threat assessment services',
        'security audit checklist'
      );
    }

    return seoKeywords.slice(0, 8);
  }

  private generateMetaDescription(title: string, content: string): string {
    const firstParagraph = content.split('\n').find(p => p.length > 50) || '';
    const cleanDescription = firstParagraph
      .replace(/[#*]/g, '')
      .substring(0, 150)
      .trim();
    
    return `${cleanDescription}... Learn proven strategies and expert insights for implementation.`;
  }

  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 0;
    
    // Content length score (20 points)
    const wordCount = content.split(' ').length;
    if (wordCount > 1000) score += 20;
    else if (wordCount > 500) score += 15;
    else if (wordCount > 300) score += 10;
    
    // Keyword optimization (30 points)
    const keywordDensity = keywords.filter(k => 
      content.toLowerCase().includes(k.toLowerCase())
    ).length / keywords.length;
    score += Math.round(keywordDensity * 30);
    
    // Structure score (25 points)
    if (content.includes('# ')) score += 10; // Has H1
    if (content.includes('## ')) score += 10; // Has H2
    if (content.includes('### ')) score += 5; // Has H3
    
    // AI optimization (25 points)
    if (content.includes('What You Need to Know')) score += 5;
    if (content.includes('Key Takeaways')) score += 5;
    if (content.includes('Next Steps')) score += 5;
    if (content.includes('Best Practices')) score += 5;
    if (content.includes('Implementation')) score += 5;
    
    return Math.min(score, 100);
  }

  private assessAIOverviewPotential(content: string, keywords: string[]): 'high' | 'medium' | 'low' {
    let score = 0;
    
    // Question-based content
    if (content.includes('What ') || content.includes('How ') || content.includes('Why ')) score += 2;
    
    // Structured information
    if (content.includes('Key Components') || content.includes('Steps')) score += 2;
    
    // Authoritative language
    if (content.includes('expert') || content.includes('proven') || content.includes('certified')) score += 1;
    
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private calculateAIModeScore(content: string, keywords: string[]): number {
    let score = 5; // Base score
    
    // Conversational elements
    if (content.includes('you') || content.includes('your')) score += 1;
    
    // Question format
    if (content.includes('?')) score += 1;
    
    // Clear structure
    if (content.includes('## ') && content.includes('### ')) score += 1;
    
    // Actionable content
    if (content.includes('Steps') || content.includes('Implementation')) score += 1;
    
    // Expert authority
    if (content.includes('professional') || content.includes('consultant')) score += 1;
    
    return Math.min(score, 10);
  }
}

export const contentGenerator = new ContentGenerator();
