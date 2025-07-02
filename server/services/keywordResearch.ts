import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface KeywordData {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  aiOverviewPotential: string;
  competition: string;
  cpc: string;
  intent: string;
}

interface LongTailKeyword {
  keyword: string;
  searchVolume: string;
  difficulty: string;
  intent: string;
  aiOverviewPotential: string;
}

interface KeywordResearchResult {
  niche: string;
  topKeywords: KeywordData[];
  aiSearchEngineAnalysis: {
    overview: string;
    aiOverviewTrends: string[];
    optimizationTips: string[];
  };
  longTailKeywords: LongTailKeyword[];
  competitorAnalysis: string[];
  contentOpportunities: string[];
}

export class KeywordResearchService {
  async performKeywordResearch(niche: string): Promise<KeywordResearchResult> {
    const prompt = `
Perform comprehensive keyword research for the "${niche}" niche. Provide current 2025 data and analysis.

IMPORTANT: Focus on AI Overview potential and AI search engine optimization (Google AI Overview, Perplexity AI, ChatGPT Search, Microsoft Copilot).

Please provide a detailed JSON response with the following structure:

{
  "niche": "${niche}",
  "topKeywords": [
    {
      "keyword": "main keyword",
      "searchVolume": "estimated monthly searches",
      "difficulty": "Low/Medium/High",
      "aiOverviewPotential": "High/Medium/Low with explanation",
      "competition": "Low/Medium/High",
      "cpc": "estimated cost per click",
      "intent": "Informational/Commercial/Transactional"
    }
  ],
  "aiSearchEngineAnalysis": {
    "overview": "Analysis of how AI search engines handle this niche",
    "aiOverviewTrends": ["trend 1", "trend 2", "trend 3"],
    "optimizationTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
  },
  "longTailKeywords": [
    {
      "keyword": "long tail keyword phrase",
      "searchVolume": "estimated monthly searches",
      "difficulty": "Low/Medium/High",
      "intent": "Informational/Commercial/Transactional",
      "aiOverviewPotential": "High/Medium/Low with explanation"
    }
  ],
  "competitorAnalysis": ["competitor insight 1", "competitor insight 2", "competitor insight 3"],
  "contentOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4", "opportunity 5"]
}

Requirements:
- Provide 10 top keywords with realistic search volumes and current difficulty assessments
- Focus heavily on AI Overview potential - this is crucial for 2025 SEO success
- Include 5 long-tail keywords (3+ words) with good AI Overview potential
- Analyze current AI search engine trends and optimization strategies
- Provide actionable insights for competing in AI-powered search results
- Consider voice search and conversational queries
- Include commercial intent keywords for monetization opportunities

Base your analysis on current 2025 market conditions and AI search trends.
`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const keywordData: KeywordResearchResult = JSON.parse(jsonMatch[0]);
      return keywordData;

    } catch (error) {
      console.error('Keyword research error:', error);
      throw new Error('Failed to perform keyword research');
    }
  }

  async generateKeywordReport(niche: string): Promise<string> {
    const research = await this.performKeywordResearch(niche);
    
    const report = `
# Keyword Research Report: ${research.niche}

## 🎯 Top 10 Keywords

${research.topKeywords.map((kw, index) => `
### ${index + 1}. ${kw.keyword}
- **Search Volume:** ${kw.searchVolume}
- **Difficulty:** ${kw.difficulty}
- **AI Overview Potential:** ${kw.aiOverviewPotential}
- **Competition:** ${kw.competition}
- **CPC:** ${kw.cpc}
- **Intent:** ${kw.intent}
`).join('')}

## 🤖 AI Search Engine Analysis

${research.aiSearchEngineAnalysis.overview}

### AI Overview Trends:
${research.aiSearchEngineAnalysis.aiOverviewTrends.map(trend => `- ${trend}`).join('\n')}

### Optimization Tips:
${research.aiSearchEngineAnalysis.optimizationTips.map(tip => `- ${tip}`).join('\n')}

## 🎯 Top 5 Long-Tail Keywords

${research.longTailKeywords.map((kw, index) => `
### ${index + 1}. ${kw.keyword}
- **Search Volume:** ${kw.searchVolume}
- **Difficulty:** ${kw.difficulty}
- **Intent:** ${kw.intent}
- **AI Overview Potential:** ${kw.aiOverviewPotential}
`).join('')}

## 🏆 Competitor Analysis
${research.competitorAnalysis.map(insight => `- ${insight}`).join('\n')}

## 💡 Content Opportunities
${research.contentOpportunities.map(opportunity => `- ${opportunity}`).join('\n')}

---
*Report generated by Sofeia AI - Advanced Keyword Research Engine*
`;

    return report;
  }
}

export const keywordResearchService = new KeywordResearchService();