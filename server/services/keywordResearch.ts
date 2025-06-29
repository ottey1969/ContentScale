interface KeywordResult {
  keyword: string;
  searchVolume: number | null;
  difficulty: 'low' | 'medium' | 'high';
  aiOverviewPotential: 'high' | 'medium' | 'low';
  relatedKeywords: string[];
}

class SEOInsightEngine {
  // Internal SEO insights - no external API needed

  async researchKeywords(seedKeyword: string, country: string = 'us'): Promise<KeywordResult[]> {
    try {
      // In a real implementation, this would call the SEO Insight Engine API
      // For now, we'll simulate comprehensive keyword research
      
      const results = await this.simulateSEOInsightAPI(seedKeyword, country);
      return results;
    } catch (error) {
      console.error('Error researching keywords:', error);
      throw new Error('Failed to research keywords');
    }
  }

  async clusterKeywords(keywords: string[]): Promise<{ [cluster: string]: string[] }> {
    // Simulate AI-powered keyword clustering
    const clusters: { [cluster: string]: string[] } = {};
    
    for (const keyword of keywords) {
      const cluster = this.determineCluster(keyword);
      if (!clusters[cluster]) {
        clusters[cluster] = [];
      }
      clusters[cluster].push(keyword);
    }
    
    return clusters;
  }

  private async simulateSEOInsightAPI(seedKeyword: string, country: string): Promise<KeywordResult[]> {
    // Simulate sophisticated keyword research based on the seed keyword
    const variations = this.generateKeywordVariations(seedKeyword);
    const results: KeywordResult[] = [];
    
    for (const variation of variations) {
      const result: KeywordResult = {
        keyword: variation,
        searchVolume: this.estimateSearchVolume(variation),
        difficulty: this.assessKeywordDifficulty(variation),
        aiOverviewPotential: this.assessAIOverviewPotential(variation),
        relatedKeywords: this.generateRelatedKeywords(variation),
      };
      results.push(result);
    }
    
    return results;
  }

  private generateKeywordVariations(seedKeyword: string): string[] {
    const baseKeyword = seedKeyword.toLowerCase().trim();
    const variations = [baseKeyword];
    
    // Question-based variations (high AI Overview potential)
    const questionPrefixes = ['what is', 'how to', 'why does', 'when should', 'where can'];
    questionPrefixes.forEach(prefix => {
      variations.push(`${prefix} ${baseKeyword}`);
    });
    
    // Long-tail variations
    const modifiers = ['best', 'top', 'guide', '2025', 'complete', 'ultimate', 'professional'];
    modifiers.forEach(modifier => {
      variations.push(`${modifier} ${baseKeyword}`);
      variations.push(`${baseKeyword} ${modifier}`);
    });
    
    // Industry-specific variations
    if (baseKeyword.includes('security') || baseKeyword.includes('cyber')) {
      variations.push(
        `${baseKeyword} consultant`,
        `${baseKeyword} services`,
        `${baseKeyword} audit`,
        `${baseKeyword} assessment`,
        `${baseKeyword} Netherlands`,
        `cheap ${baseKeyword} consultant`,
        `AI powered ${baseKeyword}`
      );
    }
    
    // Local variations
    variations.push(
      `${baseKeyword} NL`,
      `${baseKeyword} Netherlands`,
      `${baseKeyword} Amsterdam`,
      `${baseKeyword} expert NL`
    );
    
    return variations.slice(0, 25); // Limit to 25 variations
  }

  private estimateSearchVolume(keyword: string): number | null {
    // Simulate search volume estimation based on keyword characteristics
    const wordCount = keyword.split(' ').length;
    const hasQuestionWord = /^(what|how|why|when|where|who)\s/.test(keyword.toLowerCase());
    const hasLocalTerm = /\b(netherlands|nl|amsterdam)\b/i.test(keyword);
    const hasBrandTerm = /\b(cheap|best|top|professional)\b/i.test(keyword);
    
    let baseVolume = 1000;
    
    // Longer keywords typically have lower search volume
    if (wordCount > 4) baseVolume *= 0.3;
    else if (wordCount > 2) baseVolume *= 0.6;
    
    // Question keywords often have medium volume
    if (hasQuestionWord) baseVolume *= 0.7;
    
    // Local keywords have lower volume
    if (hasLocalTerm) baseVolume *= 0.2;
    
    // Branded keywords vary
    if (hasBrandTerm) baseVolume *= 0.8;
    
    // Add some randomization
    const randomFactor = 0.5 + Math.random();
    baseVolume *= randomFactor;
    
    return Math.round(baseVolume);
  }

  private assessKeywordDifficulty(keyword: string): 'low' | 'medium' | 'high' {
    const wordCount = keyword.split(' ').length;
    const hasLocalTerm = /\b(netherlands|nl|amsterdam)\b/i.test(keyword);
    const hasLongTail = wordCount > 3;
    const hasQuestionWord = /^(what|how|why|when|where|who)\s/.test(keyword.toLowerCase());
    
    let difficultyScore = 0;
    
    // Local and long-tail keywords are typically easier
    if (hasLocalTerm) difficultyScore -= 2;
    if (hasLongTail) difficultyScore -= 1;
    if (hasQuestionWord) difficultyScore -= 1;
    
    // Generic terms are harder
    if (wordCount === 1) difficultyScore += 3;
    if (wordCount === 2 && !hasLocalTerm) difficultyScore += 1;
    
    if (difficultyScore <= -2) return 'low';
    if (difficultyScore >= 2) return 'high';
    return 'medium';
  }

  private assessAIOverviewPotential(keyword: string): 'high' | 'medium' | 'low' {
    const hasQuestionWord = /^(what|how|why|when|where|who)\s/.test(keyword.toLowerCase());
    const hasInfoIntent = /\b(guide|tutorial|tips|best|comparison|vs|review)\b/i.test(keyword);
    const hasDefinitionIntent = /\b(what is|definition|meaning|explain)\b/i.test(keyword);
    
    let aiScore = 0;
    
    if (hasQuestionWord) aiScore += 3;
    if (hasInfoIntent) aiScore += 2;
    if (hasDefinitionIntent) aiScore += 2;
    
    if (aiScore >= 4) return 'high';
    if (aiScore >= 2) return 'medium';
    return 'low';
  }

  private generateRelatedKeywords(keyword: string): string[] {
    const baseKeyword = keyword.toLowerCase();
    const related = [];
    
    // Semantic variations
    if (baseKeyword.includes('security')) {
      related.push('cybersecurity', 'information security', 'data protection', 'threat protection');
    }
    
    if (baseKeyword.includes('consultant')) {
      related.push('expert', 'specialist', 'advisor', 'professional services');
    }
    
    if (baseKeyword.includes('cyber')) {
      related.push('digital security', 'online protection', 'network security', 'IT security');
    }
    
    // Add some generic related terms
    related.push(
      `${keyword} services`,
      `${keyword} solutions`,
      `${keyword} company`,
      `${keyword} provider`
    );
    
    return related.slice(0, 6);
  }

  private determineCluster(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    
    if (lowerKeyword.includes('what') || lowerKeyword.includes('definition')) {
      return 'Definitions & Basics';
    }
    
    if (lowerKeyword.includes('how') || lowerKeyword.includes('guide') || lowerKeyword.includes('tutorial')) {
      return 'How-To & Guides';
    }
    
    if (lowerKeyword.includes('best') || lowerKeyword.includes('top') || lowerKeyword.includes('comparison')) {
      return 'Best Practices & Comparisons';
    }
    
    if (lowerKeyword.includes('consultant') || lowerKeyword.includes('services') || lowerKeyword.includes('expert')) {
      return 'Professional Services';
    }
    
    if (lowerKeyword.includes('netherlands') || lowerKeyword.includes('nl') || lowerKeyword.includes('amsterdam')) {
      return 'Local Netherlands';
    }
    
    if (lowerKeyword.includes('security') || lowerKeyword.includes('cyber')) {
      return 'Cybersecurity';
    }
    
    return 'General Topics';
  }
}

export const seoInsightEngine = new SEOInsightEngine();
