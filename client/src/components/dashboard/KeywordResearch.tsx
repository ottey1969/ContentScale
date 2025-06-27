import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, Loader2, TrendingUp, BarChart3 } from "lucide-react";

interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number | null;
  difficulty: 'low' | 'medium' | 'high';
  aiOverviewPotential: 'high' | 'medium' | 'low';
}

export default function KeywordResearch() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const { toast } = useToast();

  const { data: keywords, isLoading: keywordsLoading } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords"],
  });

  const researchMutation = useMutation({
    mutationFn: async () => {
      if (!searchKeyword.trim()) {
        throw new Error("Please enter a keyword to research");
      }
      
      try {
        const response = await apiRequest("POST", "/api/keywords/research", {
          keyword: searchKeyword.trim(),
          country: "us"
        });
        return response;
      } catch (error: any) {
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
      const results = await response.json();
      toast({
        title: "Keyword Research Complete!",
        description: `Found ${results.length} keywords via Answer Socrates`,
      });
      
      // Clear search input
      setSearchKeyword("");
    },
    onError: (error: any) => {
      console.error('Keyword research error:', error);
      
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
    switch (difficulty) {
      case 'low': return 'text-accent';
      case 'medium': return 'text-neural';
      case 'high': return 'text-red-500';
      default: return 'text-text-secondary';
    }
  };

  const getAIOverviewColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-accent';
      case 'medium': return 'bg-neural';
      case 'low': return 'bg-red-500';
      default: return 'bg-surface-light';
    }
  };

  const recentKeywords = keywords?.slice(0, 5) || [];

  return (
    <Card className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-secondary" />
          <span>Answer Socrates Integration</span>
          <Badge className="bg-secondary bg-opacity-20 text-secondary border-none">Live</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Search Input */}
        <div className="mb-4">
          <div className="flex space-x-3">
            <Input
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
              onClick={() => researchMutation.mutate()}
              disabled={researchMutation.isPending || !searchKeyword.trim()}
              className="bg-secondary hover:bg-purple-600 text-white px-6 h-12"
            >
              {researchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Research"
              )}
            </Button>
          </div>
        </div>
        
        {/* Results Preview */}
        <div className="space-y-3">
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
                  <div className={`w-2 h-2 rounded-full ${getAIOverviewColor(keyword.aiOverviewPotential)}`}></div>
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
