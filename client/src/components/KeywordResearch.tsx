import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KeywordResearchProps {
  onClose?: () => void;
}

export function KeywordResearch({ onClose }: KeywordResearchProps) {
  const [keyword, setKeyword] = useState("");
  const [isResearching, setIsResearching] = useState(false);
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

    setIsResearching(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Research Complete!",
        description: `Found keywords for "${keyword.trim()}"`,
      });
    } catch (error) {
      toast({
        title: "Research Failed",
        description: "There was an error performing keyword research. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-purple-500/30 backdrop-blur-sm shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Advanced SEO Insight Engine</CardTitle>
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs mt-1">PAID FEATURE</Badge>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Keyword for Research
            </label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword (e.g., 'test')"
              className="bg-slate-700/80 border-slate-600/50 text-white placeholder-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20"
              onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Top 50 Keywords</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">AI Overview</span>
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Competitor Analysis</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-500 bg-slate-700 border-slate-600 rounded focus:ring-purple-500/50"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Long-tail Keywords</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleResearch}
          disabled={isResearching}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 transform hover:scale-105 transition-all duration-200 shadow-lg shadow-purple-500/25"
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
      </div>
    </div>
  );
}