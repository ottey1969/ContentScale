import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Search, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordResearchProps {
  onClose?: () => void;
}

interface KeywordData {
  keyword: string;
  volume: string;
  difficulty: string;
  cpc: string;
  competition: string;
  trend: string;
}

export function KeywordResearch({ onClose }: KeywordResearchProps) {
  const [keyword, setKeyword] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [results, setResults] = useState<KeywordData[]>([]);
  const [selectedOptions, setSelectedOptions] = useState({
    topKeywords: true,
    aiOverview: true,
    competitorAnalysis: false,
    longTailKeywords: false
  });
  const { toast } = useToast();

  const handleResearch = async () => {
    if (!keyword.trim()) {
      toast({
        title: "Enter a keyword",
        description: "Please enter a keyword to research",
        variant: "destructive"
      });
      return;
    }

    // Show payment requirement for keyword research
    toast({
      title: "Payment Required",
      description: "Keyword research requires credits. Please purchase credits to continue.",
      variant: "destructive"
    });
    return;

    setIsResearching(true);
    
    try {
      // Simulate keyword research API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock results based on keyword
      const mockResults: KeywordData[] = [
        {
          keyword: keyword.trim(),
          volume: "12,500",
          difficulty: "Medium",
          cpc: "$2.40",
          competition: "High",
          trend: "Rising"
        },
        {
          keyword: `${keyword.trim()} guide`,
          volume: "8,300",
          difficulty: "Low",
          cpc: "$1.80",
          competition: "Medium",
          trend: "Stable"
        },
        {
          keyword: `best ${keyword.trim()}`,
          volume: "15,600",
          difficulty: "High",
          cpc: "$3.20",
          competition: "High",
          trend: "Rising"
        },
        {
          keyword: `${keyword.trim()} 2025`,
          volume: "6,700",
          difficulty: "Medium",
          cpc: "$2.10",
          competition: "Medium",
          trend: "Growing"
        },
        {
          keyword: `how to ${keyword.trim()}`,
          volume: "9,400",
          difficulty: "Low",
          cpc: "$1.95",
          competition: "Low",
          trend: "Stable"
        }
      ];
      
      setResults(mockResults);
      toast({
        title: "Research complete!",
        description: `Found ${mockResults.length} keywords for "${keyword}"`,
      });
    } catch (error) {
      toast({
        title: "Research failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsResearching(false);
    }
  };

  const handleDownload = () => {
    if (results.length === 0) return;
    
    const csvContent = [
      "Keyword,Volume,Difficulty,CPC,Competition,Trend",
      ...results.map(r => `"${r.keyword}","${r.volume}","${r.difficulty}","${r.cpc}","${r.competition}","${r.trend}"`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyword-research-${keyword}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Keyword research data saved as CSV",
    });
  };

  const toggleOption = (option: keyof typeof selectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-800/95 border-purple-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-purple-400" />
          <CardTitle className="text-xl text-white">Advanced SEO Insight Engine</CardTitle>
          <Badge className="bg-orange-600 text-white text-xs">PAID FEATURE</Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Keyword Input */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Keyword for Research
          </label>
          <div className="flex space-x-2">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword (e.g., 'test')"
              className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
              onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
            />
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.topKeywords}
                onChange={() => toggleOption('topKeywords')}
                className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-gray-300">Top 50 Keywords</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.aiOverview}
                onChange={() => toggleOption('aiOverview')}
                className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-gray-300">AI Overview</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.competitorAnalysis}
                onChange={() => toggleOption('competitorAnalysis')}
                className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-gray-300">Competitor Analysis</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.longTailKeywords}
                onChange={() => toggleOption('longTailKeywords')}
                className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded"
              />
              <span className="text-sm text-gray-300">Long-tail Keywords</span>
            </label>
          </div>
        </div>

        {/* Research Button */}
        <Button
          onClick={handleResearch}
          disabled={isResearching}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
        >
          {isResearching ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>RESEARCHING KEYWORDS</span>
            </div>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              RESEARCH KEYWORDS
            </>
          )}
        </Button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                <span>Keyword: "{keyword}"</span><br />
                <span>Options: {Object.entries(selectedOptions).filter(([_, v]) => v).length} selected</span><br />
                <span className="flex items-center space-x-2">
                  <span>Status:</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Ready</span>
                </span>
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 border-green-500 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3">Keyword Results</h4>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-white font-medium">{result.keyword}</span>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-gray-300">Vol: {result.volume}</span>
                      <Badge variant={result.difficulty === 'Low' ? 'default' : result.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                        {result.difficulty}
                      </Badge>
                      <span className="text-green-400">{result.cpc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}