import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Code, ExternalLink, Users, TrendingUp, Gift, Twitter, Linkedin, MessageCircle, Facebook, Instagram, Youtube } from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  conversions: number;
  creditsEarned: number;
  conversionRate: number;
  topReferrers: Array<{
    platform: string;
    clicks: number;
    conversions: number;
  }>;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  shareUrl: (url: string, text: string) => string;
  previewImage: string;
}

export default function ViralReferrals() {
  const [referralLink, setReferralLink] = useState("");
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data for referral link
  const { data: user } = useQuery<{ id: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Get referral statistics
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  // Generate referral link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/referrals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to generate referral link");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setReferralLink(data.referralLink);
      toast({
        title: "Referral Link Generated!",
        description: "Your unique referral link is ready to share.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize referral link on component mount
  React.useEffect(() => {
    if (user?.id && !referralLink) {
      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}?ref=${user.id}`;
      setReferralLink(generatedLink);
    }
  }, [user, referralLink]);

  const socialPlatforms: SocialPlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-blue-500 hover:bg-blue-600',
      shareUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      previewImage: '/images/social-previews/twitter-preview.png'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      shareUrl: (url, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      previewImage: '/images/social-previews/linkedin-preview.png'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      shareUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      previewImage: '/images/social-previews/whatsapp-preview.png'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      shareUrl: (url, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      previewImage: '/images/social-previews/facebook-preview.png'
    }
  ];

  const shareText = "🚀 Discover ContentScale - The World's First Autonomous AI Content Writing System! Generate high-quality, SEO-optimized content in seconds. Join me and get 3 free blog posts!";

  const copyToClipboard = (text: string, label: string = "Link") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} has been copied to clipboard.`,
    });
  };

  const shareToSocial = (platform: SocialPlatform) => {
    if (!referralLink) {
      toast({
        title: "No Referral Link",
        description: "Please generate a referral link first.",
        variant: "destructive",
      });
      return;
    }

    const shareUrl = platform.shareUrl(referralLink, shareText);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    // Track the share event
    fetch("/api/referrals/track-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platform.id, referralLink }),
    });

    toast({
      title: `Sharing to ${platform.name}`,
      description: "Share window opened. Complete the share to start earning referrals!",
    });
  };

  const embedCode = `<!-- ContentScale Referral Widget -->
<div style="max-width: 400px; margin: 20px auto; padding: 20px; border: 2px solid #3B82F6; border-radius: 12px; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: white; font-family: Arial, sans-serif; text-align: center;">
  <div style="margin-bottom: 15px;">
    <h3 style="margin: 0 0 10px 0; color: #3B82F6; font-size: 18px;">🚀 ContentScale</h3>
    <p style="margin: 0; font-size: 14px; color: #CBD5E1;">World's First Autonomous AI Content Writing System</p>
  </div>
  <div style="margin-bottom: 15px;">
    <p style="margin: 0; font-size: 13px; line-height: 1.4;">Generate high-quality, SEO-optimized content in seconds. Join thousands of businesses automating their content creation!</p>
  </div>
  <a href="${referralLink}" target="_blank" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; transition: background 0.3s;">
    Get 3 Free Blog Posts →
  </a>
  <div style="margin-top: 10px; font-size: 11px; color: #94A3B8;">
    Powered by ContentScale AI
  </div>
</div>`;

  const iframeEmbedCode = `<iframe src="${window.location.origin}/embed/referral?ref=${user?.id}" width="400" height="300" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></iframe>`;

  return (
    <Card className="bg-surface border-surface-light">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span>Viral Referrals</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats?.creditsEarned || 0} Credits Earned
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Referral Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats?.totalReferrals || 0}</div>
            <div className="text-sm text-muted-foreground">Total Referrals</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-500">{stats?.conversions || 0}</div>
            <div className="text-sm text-muted-foreground">Conversions</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{stats?.creditsEarned || 0}</div>
            <div className="text-sm text-muted-foreground">Credits Earned</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{stats?.conversionRate || 0}%</div>
            <div className="text-sm text-muted-foreground">Conversion Rate</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Your Referral Link</label>
          <div className="flex space-x-2">
            <Input
              value={referralLink}
              readOnly
              className="flex-1"
              placeholder="Generate your referral link..."
            />
            <Button
              onClick={() => copyToClipboard(referralLink, "Referral link")}
              disabled={!referralLink}
              variant="outline"
              className="flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </Button>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Share Your Link</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {socialPlatforms.map((platform) => (
              <Button
                key={platform.id}
                onClick={() => shareToSocial(platform)}
                disabled={!referralLink}
                className={`${platform.color} text-white flex flex-col items-center space-y-1 h-auto py-3`}
              >
                <platform.icon className="w-5 h-5" />
                <span className="text-xs">{platform.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Social Preview */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Social Media Preview</label>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                CS
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">ContentScale - AI Content Writing System</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate high-quality, SEO-optimized content in seconds. Join thousands of businesses automating their content creation with AI.
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                  <Badge variant="secondary" className="text-xs">SEO Optimized</Badge>
                  <Badge variant="secondary" className="text-xs">3 Free Posts</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Embed on Your Website</label>
            <Dialog open={isEmbedModalOpen} onOpenChange={setIsEmbedModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Code className="w-4 h-4" />
                  <span>Get Embed Code</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Embed ContentScale Referral Widget</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Widget Preview */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Preview</h4>
                    <div className="border rounded-lg p-4 bg-muted">
                      <div dangerouslySetInnerHTML={{ __html: embedCode }} />
                    </div>
                  </div>

                  {/* HTML Embed Code */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">HTML Embed Code</h4>
                      <Button
                        onClick={() => copyToClipboard(embedCode, "HTML embed code")}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy HTML</span>
                      </Button>
                    </div>
                    <ScrollArea className="h-32 w-full border rounded-lg p-3 bg-muted">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {embedCode}
                      </pre>
                    </ScrollArea>
                  </div>

                  {/* iFrame Embed Code */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">iFrame Embed Code</h4>
                      <Button
                        onClick={() => copyToClipboard(iframeEmbedCode, "iFrame embed code")}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy iFrame</span>
                      </Button>
                    </div>
                    <ScrollArea className="h-20 w-full border rounded-lg p-3 bg-muted">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {iframeEmbedCode}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-sm text-muted-foreground">
            Add a referral widget to your website or blog to earn credits automatically.
          </div>
        </div>

        {/* How Conversions Work */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Gift className="w-4 h-4 text-primary" />
            <span>How Conversions Work</span>
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>A user becomes a "bulk user" after generating 5+ blog posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>You earn 3 free blogs for each bulk user conversion</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Rewards: 1 bulk user = 5 blogs, 3 = 20 blogs, 10 = 100 blogs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Only active content creators count as conversions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

