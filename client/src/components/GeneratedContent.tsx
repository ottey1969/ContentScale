import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Copy, Download, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedContentProps {
  content?: string;
  onClose?: () => void;
}

export function GeneratedContent({ content = "", onClose }: GeneratedContentProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Mock content metrics
  const metrics = {
    words: content.split(' ').length,
    sentences: content.split('.').length - 1,
    headings: (content.match(/#{1,3}\s/g) || []).length,
    seoScore: 92,
    informative: 85,
    tone: "Professional",
    aiReady: true
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-content.txt";
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Content saved as text file",
    });
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsOptimizing(false);
    toast({
      title: "Optimized!",
      description: "Content optimized for AI search engines",
    });
  };

  return (
    <Card className="w-full max-w-6xl mx-auto bg-slate-800/95 border-purple-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <CardTitle className="text-xl text-white">Generated Content</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="bg-green-600 hover:bg-green-700 border-green-500 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing}
            variant="outline"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 border-purple-500 text-white"
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Optimize For AI
              </>
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Content Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{metrics.words}</div>
            <div className="text-sm text-gray-400">Words</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.sentences}</div>
            <div className="text-sm text-gray-400">Sentences</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.headings}</div>
            <div className="text-sm text-gray-400">Headings</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{metrics.seoScore}</div>
            <div className="text-sm text-gray-400">SEO Score</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{metrics.informative}</div>
            <div className="text-sm text-gray-400">Informative</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-sm font-bold text-cyan-400">{metrics.tone}</div>
            <div className="text-sm text-gray-400">Tone</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">SEO Score</span>
              <span className="text-yellow-400">{metrics.seoScore}%</span>
            </div>
            <Progress value={metrics.seoScore} className="h-2 bg-slate-700">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-green-500 rounded-full transition-all duration-500" style={{width: `${metrics.seoScore}%`}}></div>
            </Progress>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Informative Score</span>
              <span className="text-orange-400">{metrics.informative}%</span>
            </div>
            <Progress value={metrics.informative} className="h-2 bg-slate-700">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500" style={{width: `${metrics.informative}%`}}></div>
            </Progress>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">AI Ready Status</span>
            <Badge className="bg-green-600 text-white">
              {metrics.aiReady ? "AI Ready" : "Needs Optimization"}
            </Badge>
          </div>
        </div>

        {/* Content Preview */}
        {content && (
          <div className="bg-slate-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h4 className="text-lg font-semibold text-white mb-3">Content Preview</h4>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {content.substring(0, 1000)}
              {content.length > 1000 && "..."}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}