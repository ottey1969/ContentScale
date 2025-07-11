import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bot, Loader2, Sparkles, FileText, Newspaper, HelpCircle, Share2, CreditCard, DollarSign, Download, Trash2, Eye, Copy, FolderOpen } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  type: 'blog' | 'article' | 'faq' | 'social';
  topic: string;
  createdAt: string;
  seoScore: number;
  wordCount: number;
}

export default function ContentGenerator() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("2.00");
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data for credit display
  const { data: user } = useQuery<{ credits: number }>({
    queryKey: ['/api/auth/user'],
  });

  // Get user's generated content
  const { data: userContent = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/content/user"],
  });

  // Debug function to test state
  const handleInputChange = (value: string) => {
    console.log('Setting topic to:', value);
    setTopic(value);
    console.log('Topic state after set:', topic);
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      console.log('Generate button clicked, topic:', topic);
      
      if (!topic.trim()) {
        throw new Error("Please enter a topic or keywords");
      }
      
      const payload = {
        contentType,
        topic: topic.trim(),
        title: "", // Will be generated by AI
        content: "", // Will be generated by AI
        userId: "", // Will be set by backend from auth
      };
      
      console.log('Sending API request with payload:', payload);
      
      try {
        const response = await apiRequest("POST", "/api/content/generate", payload);
        console.log('API response received:', response);
        return response;
      } catch (error: any) {
        console.error('API request failed:', error);
        
        // Handle specific error cases and re-throw with proper structure
        if (error.message?.includes('402')) {
          const paymentError = new Error("Payment required");
          (paymentError as any).status = 402;
          throw paymentError;
        }
        if (error.message?.includes('429')) {
          const rateLimitError = new Error("Rate limit exceeded");
          (rateLimitError as any).status = 429;
          throw rateLimitError;
        }
        if (error.message?.includes('401')) {
          const authError = new Error("Authentication required");
          (authError as any).status = 401;
          throw authError;
        }
        throw error;
      }
    },
    onSuccess: async (response) => {
      const content = await response.json();
      toast({
        title: "Content Generated Successfully!",
        description: `Created "${content.title}" with SEO score: ${content.seoScore}`,
      });
      
      // Clear form
      setTopic("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: any) => {
      console.error('Content generation error:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate content.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle specific error cases
      if (error.status === 402) {
        // Payment required - show PayPal interface
        setShowPayment(true);
        setPaymentAmount("2.00");
        toast({
          title: "Payment Required",
          description: "Generate your next article for $2.00",
          variant: "default",
        });
        return;
      } else if (error.status === 429) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Content Generation Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete content");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content/user"] });
      setSelectedContent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadAsWord = (content: GeneratedContent) => {
    // Create a simple HTML document that can be opened in Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${content.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${content.title}</h1>
        <div class="meta">
          <p><strong>Type:</strong> ${content.type.toUpperCase()}</p>
          <p><strong>Topic:</strong> ${content.topic}</p>
          <p><strong>Created:</strong> ${new Date(content.createdAt).toLocaleDateString()}</p>
          <p><strong>SEO Score:</strong> ${content.seoScore}%</p>
          <p><strong>Word Count:</strong> ${content.wordCount}</p>
        </div>
        <div>${content.content}</div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your content is being downloaded as a Word document.",
    });
  };

  const downloadAllAsWord = () => {
    if (userContent.length === 0) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>All Generated Content - ContentScale</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 40px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          .content-item { page-break-before: always; margin-bottom: 50px; }
          .content-item:first-child { page-break-before: auto; }
        </style>
      </head>
      <body>
        <h1>All Generated Content - ContentScale</h1>
        <div class="meta">
          <p><strong>Total Content:</strong> ${userContent.length} items</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        ${userContent.map(content => `
          <div class="content-item">
            <h2>${content.title}</h2>
            <div class="meta">
              <p><strong>Type:</strong> ${content.type.toUpperCase()} | <strong>Topic:</strong> ${content.topic} | <strong>Created:</strong> ${new Date(content.createdAt).toLocaleDateString()} | <strong>SEO Score:</strong> ${content.seoScore}% | <strong>Words:</strong> ${content.wordCount}</p>
            </div>
            <div>${content.content}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentscale_all_content_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Bulk Download Started",
      description: `Downloading all ${userContent.length} content items as a Word document.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content has been copied to clipboard.",
    });
  };

  const contentTypes = [
    { id: "blog", label: "Blog Post", icon: FileText, color: "text-primary" },
    { id: "article", label: "Article", icon: Newspaper, color: "text-secondary" },
    { id: "faq", label: "FAQ", icon: HelpCircle, color: "text-accent" },
    { id: "social", label: "Social", icon: Share2, color: "text-neural" },
  ];

  return (
    <Card id="content-generator" className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>AI Content Generation Hub</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-green-400 font-normal">
              {userContent.length}/∞
            </div>
            <Dialog open={isContentModalOpen} onOpenChange={setIsContentModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <FolderOpen className="w-4 h-4" />
                  <span>My Content ({userContent.length})</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>My Generated Content</span>
                    {userContent.length > 0 && (
                      <Button
                        onClick={downloadAllAsWord}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download All</span>
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[70vh] pr-4">
                  {userContent.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No content generated yet</h3>
                      <p>Start creating content to see it here! Your generated articles, blog posts, FAQs, and social content will appear in this library.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userContent.map((content) => (
                        <div key={content.id} className="border rounded-lg p-4 space-y-3 bg-card">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  {content.type.toUpperCase()}
                                </Badge>
                                <span>{content.wordCount} words</span>
                                <span>SEO: {content.seoScore}%</span>
                                <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedContent(selectedContent?.id === content.id ? null : content)}
                                className="flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>{selectedContent?.id === content.id ? 'Hide' : 'View'}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAsWord(content)}
                                className="flex items-center space-x-1"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(content.content)}
                                className="flex items-center space-x-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(content.id)}
                                disabled={deleteMutation.isPending}
                                className="flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </Button>
                            </div>
                          </div>
                          {selectedContent?.id === content.id && (
                            <div className="mt-4 p-4 bg-muted rounded-lg border">
                              <ScrollArea className="h-80">
                                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.content }} />
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium text-gray-300">
            Enter Topic or Keywords
          </Label>
          <div className="relative">
            <Input
              id="topic"
              type="text"
              placeholder="e.g., Cybersecurity best practices for SMBs"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !generateMutation.isPending && topic.trim()) {
                  e.preventDefault();
                  generateMutation.mutate();
                }
              }}
              className="h-12 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={(e) => {
            console.log('🔥 BUTTON CLICK EVENT FIRED!');
            console.log('Event object:', e);
            console.log('Current topic value:', topic);
            console.log('Topic length:', topic.length);
            console.log('Topic trimmed:', topic.trim());
            console.log('Topic trimmed length:', topic.trim().length);
            console.log('generateMutation.isPending:', generateMutation.isPending);
            console.log('Button should be disabled:', generateMutation.isPending || !topic.trim());
            
            // Force enable for debugging
            if (!topic.trim()) {
              console.log('⚠️ Topic is empty, but proceeding for debug...');
              setTopic('Debug test topic');
            }
            
            console.log('🚀 Calling generateMutation.mutate()');
            try {
              generateMutation.mutate();
              console.log('✅ generateMutation.mutate() called successfully');
            } catch (error) {
              console.error('❌ Error calling generateMutation.mutate():', error);
            }
          }}
          disabled={false} // Force enable for debugging
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-12 cursor-pointer"
          style={{ pointerEvents: 'auto', zIndex: 1000 }}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span>Generating</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              <span>Generate</span>
            </>
          )}
        </Button>
        
        {/* Content Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              className={`p-3 rounded-lg border transition-all text-center ${
                contentType === type.id
                  ? "bg-primary bg-opacity-20 border-primary"
                  : "bg-dark border-surface-light hover:border-primary"
              }`}
            >
              <type.icon className={`w-5 h-5 ${type.color} mb-1`} />
              <div className="text-xs">{type.label}</div>
            </button>
          ))}
        </div>
        
        {/* AI Preview */}
        <div style={{ backgroundColor: '#374151', padding: '16px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>AI Preview</span>
          </div>
          <div style={{ 
            color: '#FFFFFF', 
            fontSize: '14px', 
            lineHeight: '1.5', 
            maxHeight: '128px', 
            overflowY: 'auto',
            paddingRight: '8px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B7280 #374151'
          }}>
            {generateMutation.isPending ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '16px', backgroundColor: '#4B5563', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
                <div style={{ height: '16px', backgroundColor: '#4B5563', borderRadius: '4px', width: '75%', animation: 'pulse 2s infinite' }}></div>
                <div style={{ height: '16px', backgroundColor: '#4B5563', borderRadius: '4px', width: '50%', animation: 'pulse 2s infinite' }}></div>
              </div>
            ) : topic ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#10B981' }}>Title:</strong>
                  <p style={{ marginTop: '4px' }}>"Essential {topic} Practices Every Business Must Implement in 2025"</p>
                </div>
                <div>
                  <strong style={{ color: '#8B5CF6' }}>Meta Description:</strong>
                  <p style={{ marginTop: '4px' }}>Discover proven {topic} strategies that protect businesses. Learn implementation steps, costs, and ROI for immediate impact.</p>
                </div>
                <div>
                  <strong style={{ color: '#3B82F6' }}>Keywords:</strong>
                  <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p><span style={{ color: '#3B82F6' }}>{topic}</span>, <span style={{ color: '#8B5CF6' }}>{topic} best practices</span>, <span style={{ color: '#10B981' }}>{topic} guide</span></p>
                    <p><span style={{ color: '#F59E0B' }}>{topic} implementation</span>, <span style={{ color: '#3B82F6' }}>{topic} strategy</span>, <span style={{ color: '#8B5CF6' }}>{topic} checklist</span></p>
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#10B981' }}>AI Overview Potential:</strong>
                  <p style={{ marginTop: '4px', color: '#9CA3AF' }}>High - This content is optimized for AI search engines and features rich, actionable information that search algorithms prefer.</p>
                </div>
                <div>
                  <strong style={{ color: '#3B82F6' }}>SEO Score:</strong>
                  <p style={{ marginTop: '4px', color: '#9CA3AF' }}>Estimated 85/100 - Well-structured with target keywords, meta optimization, and user-focused content.</p>
                </div>
                <div>
                  <strong style={{ color: '#F59E0B' }}>Content Length:</strong>
                  <p style={{ marginTop: '4px', color: '#9CA3AF' }}>1,200-1,500 words with proper heading structure, bullet points, and actionable insights for maximum engagement.</p>
                </div>
                <div>
                  <strong style={{ color: '#8B5CF6' }}>Target Audience:</strong>
                  <p style={{ marginTop: '4px', color: '#9CA3AF' }}>Business owners, IT managers, and decision-makers looking for practical {topic} solutions.</p>
                </div>
              </div>
            ) : (
              <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Enter a topic to see AI-generated preview...</p>
            )}
          </div>
        </div>

        {/* PayPal Payment Section */}
        {showPayment && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Payment Required</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your next high-quality article for ${paymentAmount}. Payment processed securely via PayPal.
            </p>
            <div className="flex items-center gap-4">
              <PayPalButton
                amount={paymentAmount}
                currency="USD"
                intent="CAPTURE"
              />
              <Button
                variant="outline"
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

