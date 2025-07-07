import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, Loader2, TrendingUp, BarChart3, Brain, Sparkles } from "lucide-react";

interface KeywordQuestion {
  question: string;
  category: string;
  funnelStage: 'TOFU' | 'MOFU' | 'BOFU';
  searchVolume?: string;
  difficulty?: string;
}

interface KeywordResearchResult {
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
  savedKeywords: any[];
}

interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number | null;
  difficulty: 'low' | 'medium' | 'high';
  aiOverviewPotential: 'high' | 'medium' | 'low';
}

export default function KeywordResearch() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [researchResults, setResearchResults] = useState<KeywordResearchResult | null>(null);
  const { toast } = useToast();

  const { data: keywords, isLoading: keywordsLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
  });

  const researchMutation = useMutation({
    mutationFn: async () => {
      console.log('AI Research button clicked, keyword:', searchKeyword);
      
      if (!searchKeyword.trim()) {
        throw new Error("Please enter a keyword to research");
      }
      
      const payload = {
        keyword: searchKeyword.trim(),
        country: "United States",
        language: "English"
      };
      
      console.log('Sending AI keyword research API request with payload:', payload);
      
      try {
        const response = await apiRequest("POST", "/api/keywords/research", payload);
        console.log('AI keyword research API response received:', response);
        return response;
      } catch (error: any) {
        console.error('AI keyword research API request failed:', error);
        
        // Handle specific error cases and re-throw with proper structure
        if (error.message?.includes('401')) {
          const authError = new Error("Authentication required");
          (authError as any).status = 401;
          throw authError;
        }
        if (error.message?.includes('429')) {
          const rateLimitError = new Error("Rate limit exceeded");
          (rateLimitError as any).status = 429;
          throw rateLimitError;
        }
        throw error;
      }
    },
    onSuccess: async (response) => {
      const results: KeywordResearchResult = await response.json();
      console.log('AI Research results:', results);
      
      setResearchResults(results);
      
      toast({
        title: "SEO Insight Engine Complete!",
        description: `Generated ${results.totalQuestions} questions across ${Object.keys(results.categories).length} categories`,
      });
      
      // Clear search input
      setSearchKeyword("");
    },
    onError: (error: any) => {
      console.error('AI keyword research error:', error);
      
      if (isUnauthorizedError(error) || error?.status === 401) {
        toast({
          title: "Authentication Required",
          description: "Please log in to perform keyword research.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error?.status === 429) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Research Failed",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getFunnelStageColor = (stage: string) => {
    switch (stage) {
      case 'TOFU': return 'bg-blue-500';
      case 'MOFU': return 'bg-yellow-500';
      case 'BOFU': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const recentKeywords = keywords?.slice(0, 5) || [];

  return (
    <Card id="keyword-research" className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span>SEO Insight Engine</span>
          <Badge className="bg-purple-500 bg-opacity-20 text-purple-400 border-none">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Search Input */}
        <div className="mb-6">
          <div className="flex space-x-3">
            <Input
              id="keyword-input"
              type="text"
              placeholder="Enter seed keyword..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 h-12 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !researchMutation.isPending && searchKeyword.trim()) {
                  e.preventDefault();
                  researchMutation.mutate();
                }
              }}
            />
            <Button 
              type="button"
              onClick={() => {
                console.log('AI Research button clicked, current keyword:', searchKeyword);
                if (searchKeyword.trim()) {
                  console.log('Keyword is valid, calling researchMutation.mutate()');
                  researchMutation.mutate();
                } else {
                  console.log('Keyword is empty, button should be disabled');
                }
              }}
              disabled={researchMutation.isPending || !searchKeyword.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 h-12"
            >
              {researchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  SEO Research
                </>
              )}
            </Button>
          </div>
        </div>

        {/* AI Research Results */}
        {researchResults && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-500 border-opacity-30">
              <div>
                <h3 className="text-lg font-semibold text-purple-300">
                  {researchResults.topic}
                </h3>
                <p className="text-sm text-gray-400">
                  {researchResults.totalQuestions} questions across {Object.keys(researchResults.categories).length} categories
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(researchResults.trends.direction)}
                <span className="text-sm text-gray-400">
                  {researchResults.trends.percentage}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(researchResults.categories).slice(0, 4).map(([category, questions]) => (
                <div key={category} className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-white mb-2">{category}</h4>
                  <div className="space-y-2">
                    {questions.slice(0, 3).map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate">{q.question}</span>
                        <Badge className={`${getFunnelStageColor(q.funnelStage)} text-white text-xs`}>
                          {q.funnelStage}
                        </Badge>
                      </div>
                    ))}
                    {questions.length > 3 && (
                      <p className="text-xs text-gray-500">+{questions.length - 3} more questions</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Keywords */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400">Recent Keywords</h4>
          {keywordsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-dark rounded-lg animate-pulse">
                  <div className="h-4 bg-surface-light rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : recentKeywords.length > 0 ? (
            recentKeywords.map((keyword) => (
              <div key={keyword.id} className="flex items-center justify-between p-3 bg-dark rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getFunnelStageColor(keyword.aiOverviewPotential)}`}></div>
                  <span className="text-sm">{keyword.keyword}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-text-secondary">
                  <span>Volume: {keyword.searchVolume ? `${keyword.searchVolume}` : 'Unknown'}</span>
                  <span className={getDifficultyColor(keyword.difficulty)}>
                    Difficulty: {keyword.difficulty}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
              <p>No keywords researched yet. Start by entering a seed keyword above.</p>
            </div>
          )}
        </div>
        
        {/* Export Options */}
        {recentKeywords.length > 0 && (
          <div className="mt-4 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-surface-light text-text-secondary hover:text-text-primary"
            >
              <i className="fas fa-download mr-2"></i>
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-surface-light text-text-secondary hover:text-text-primary"
            >
              <i className="fas fa-layer-group mr-2"></i>
              Cluster Keywords
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
