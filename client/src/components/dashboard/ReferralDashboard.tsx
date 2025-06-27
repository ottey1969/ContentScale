import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ProgressRing from "@/components/ui/progress-ring";
import { Rocket } from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  totalConversions: number;
  creditsEarned: number;
  referralCode: string;
  recentConversions: Array<{
    id: string;
    name: string;
    convertedAt: string;
    creditsAwarded: number;
  }>;
}

export default function ReferralDashboard() {
  const { toast } = useToast();

  const { data: referralCode } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/referrals/code"],
  });

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  const referralUrl = referralCode ? 
    `${window.location.origin}/signup?ref=${referralCode.referralCode}` : 
    '';

  const copyReferralLink = async () => {
    if (referralUrl) {
      try {
        await navigator.clipboard.writeText(referralUrl);
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Could not copy referral link",
          variant: "destructive",
        });
      }
    }
  };

  const shareOnPlatform = (platform: string) => {
    const message = "🚀 Just discovered ContentScale - an AI-powered content creation platform! Check it out:";
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(referralUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    };
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  const conversions = stats?.totalConversions || 0;
  const nextMilestone = conversions < 3 ? 3 : conversions < 10 ? 10 : 25;
  const progress = (conversions / nextMilestone) * 100;
  const creditsForNextMilestone = conversions < 3 ? 20 : conversions < 10 ? 100 : 250;

  return (
    <Card className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <Rocket className="w-5 h-5 text-accent" />
          <span>Viral Referrals</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        {/* Progress to Next Reward */}
        <div className="text-center">
          <ProgressRing 
            progress={progress}
            size={96}
            strokeWidth={8}
            className="mx-auto mb-3"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-accent">{conversions}/{nextMilestone}</span>
          </div>
          <p className="text-sm text-text-secondary">Bulk Users (5+ Blogs)</p>
          <p className="text-xs text-accent font-medium">
            {nextMilestone - conversions} more for {creditsForNextMilestone} free blogs!
          </p>
        </div>
        
        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">{stats?.totalReferrals || 0}</div>
            <div className="text-xs text-text-secondary">Links Shared</div>
          </div>
          <div className="bg-dark p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-accent">{stats?.creditsEarned || 0}</div>
            <div className="text-xs text-text-secondary">Credits Earned</div>
          </div>
        </div>
        
        {/* Share Options */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Share Your Link</p>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 bg-dark border-surface-light text-xs text-text-secondary"
            />
            <Button
              size="sm"
              onClick={copyReferralLink}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              Copy
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => shareOnPlatform('twitter')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <i className="fab fa-twitter mr-1"></i>
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              size="sm"
              onClick={() => shareOnPlatform('linkedin')}
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
            >
              <i className="fab fa-linkedin mr-1"></i>
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button
              size="sm"
              onClick={() => shareOnPlatform('whatsapp')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <i className="fab fa-whatsapp mr-1"></i>
              <span className="text-xs">WhatsApp</span>
            </Button>
          </div>
        </div>
        
        {/* Recent Conversions */}
        {stats?.recentConversions && stats.recentConversions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Conversions</p>
            <div className="space-y-2">
              {stats.recentConversions.slice(0, 2).map((conversion) => (
                <div key={conversion.id} className="flex items-center space-x-3 p-2 bg-dark rounded-lg">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-xs text-white">
                    {conversion.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{conversion.name}</div>
                    <div className="text-xs text-text-secondary">
                      {new Date(conversion.convertedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs text-accent">+{conversion.creditsAwarded} credits</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* How It Works Section */}
        <div className="bg-surface-light p-4 rounded-lg mt-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <i className="fas fa-info-circle text-blue-400 mr-2"></i>
            How Conversions Work
          </h4>
          <div className="text-xs text-text-secondary space-y-1">
            <p>• A user becomes a "bulk user" after generating 5+ blog posts</p>
            <p>• You earn 5 free blogs for each bulk user conversion</p>
            <p>• Rewards: 1 bulk user = 5 blogs, 3 = 20 blogs, 10 = 100 blogs</p>
            <p>• Only active content creators count as conversions</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
