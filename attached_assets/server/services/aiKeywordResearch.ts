import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface KeywordQuestion {
  question: string;
  category: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  searchVolume?: string;
  difficulty?: string;
}

export interface KeywordResearchResult {
  topic: string;
  totalQuestions: number;
  questions: KeywordQuestion[];
  categories: {
    [key: string]: KeywordQuestion[];
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: string;
  };
}

export async function generateKeywordResearch(topic: string, country: string = 'United States', language: string = 'English'): Promise<KeywordResearchResult> {
  try {
    const prompt = `You are SEO Insight Engine, the most advanced AI-powered keyword research tool available. Generate comprehensive question-based keyword research for the topic: "${topic}"

Generate questions that real people are asking on Google about this topic. Organize them into these categories:

1. **Basic Questions** (What, How, Why, When, Where, Who)
2. **Comparison Questions** (vs, versus, compared to, better than)
3. **Problem-Solving Questions** (how to fix, how to solve, troubleshooting)
4. **Buying Intent Questions** (best, top, reviews, price, cost, buy)
5. **Learning Questions** (learn, course, training, tutorial)
6. **Local Questions** (near me, in [location], local)
7. **Time-Based Questions** (2024, 2025, latest, new, trends)
8. **Alternative Questions** (alternative to, instead of, replace)

For each question, determine the funnel stage:
- TOFU (Top of Funnel): Awareness, educational, "what is", "how does"
- MOFU (Middle of Funnel): Consideration, comparison, "best", "vs"  
- BOFU (Bottom of Funnel): Purchase intent, "buy", "price", "reviews"

Generate at least 50-100 questions total. Make them realistic and based on actual search behavior.

Country: ${country}
Language: ${language}

Return the response in this exact JSON format:
{
  "topic": "${topic}",
  "totalQuestions": number,
  "questions": [
    {
      "question": "exact question text",
      "category": "category name",
      "funnelStage": "TOFU|MOFU|BOFU",
      "searchVolume": "High|Medium|Low",
      "difficulty": "Easy|Medium|Hard"
    }
  ],
  "trends": {
    "direction": "up|down|stable",
    "percentage": "percentage change"
  }
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    // Parse the JSON response
    const result = JSON.parse(content.text);
    
    // Organize questions by category
    const categories: { [key: string]: KeywordQuestion[] } = {};
    result.questions.forEach((q: KeywordQuestion) => {
      if (!categories[q.category]) {
        categories[q.category] = [];
      }
      categories[q.category].push(q);
    });

    return {
      ...result,
      categories
    };

  } catch (error) {
    console.error('Error generating keyword research:', error);
    
    // Return fallback data if API fails
    return {
      topic,
      totalQuestions: 0,
      questions: [],
      categories: {},
      trends: {
        direction: 'stable',
        percentage: '0%'
      }
    };
  }
}

export async function generateQuickKeywords(topic: string): Promise<string[]> {
  try {
    const prompt = `Generate 20 quick keyword variations for: "${topic}"

Include:
- Long-tail keywords
- Question-based keywords  
- Commercial intent keywords
- Local variations
- Trending variations

Return as a simple JSON array of strings: ["keyword1", "keyword2", ...]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return JSON.parse(content.text);

  } catch (error) {
    console.error('Error generating quick keywords:', error);
    return [];
  }
}

