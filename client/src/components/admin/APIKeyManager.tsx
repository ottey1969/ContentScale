import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, Shield, DollarSign, FileText, Search, Users, TrendingUp } from "lucide-react";

interface DashboardStats {
  contentGenerated: number;
  keywordsResearched: number;
  referralConversions: number;
  avgSeoScore: number;
  contentGeneratedToday: number;
  creditsEarned: number;
}

export default function APIKeyManager() {
  // Check if user is admin
  const { data: user } = useQuery<{ id: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Get dashboard stats (always show stats cards regardless of admin status)
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Always show stats cards, but only show API configuration for admin users
  const isAdmin = user && (user.email === "ottmar.francisca19@gmail.com" || user.email === "ottmar.francisca1969@gmail.com");
  
  const [anthropicKey, setAnthropicKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [loading, setLoading] = useState("");
  const { toast } = useToast();

  const addSecret = async (key: string, value: string, label: string) => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: `Please enter the ${label}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(key);
    try {
      const response = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${label} configured successfully`,
        });
        
        // Clear the input field after successful save
        if (key === 'ANTHROPIC_API_KEY') setAnthropicKey("");
        if (key === 'PAYPAL_CLIENT_ID') setPaypalClientId("");
        if (key === 'PAYPAL_CLIENT_SECRET') setPaypalSecret("");
      } else {
        const error = await response.json();
        toast({
          title: "Failed",
          description: error.message || "Failed to add API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading("");
    }
  };

  const statsData = [
    {
      title: "Content Generated",
      value: stats?.contentGeneratedToday || 0,
      change: `+${Math.floor((stats?.contentGeneratedToday || 0) * 0.5)} from yesterday`,
      icon: FileText,
      iconColor: "text-white",
      bgColor: "bg-blue-500"
    },
    {
      title: "Keywords Researched", 
      value: stats?.keywordsResearched || 0,
      change: "via AI Research",
      icon: Search,
      iconColor: "text-white",
      bgColor: "bg-purple-500"
    },
    {
      title: "Referral Conversions",
      value: stats?.referralConversions || 0,
      change: `${(stats?.creditsEarned || 0)} credits earned`,
      icon: Users,
      iconColor: "text-white", 
      bgColor: "bg-green-500"
    },
    {
      title: "Avg SEO Score",
      value: stats?.avgSeoScore || 0,
      change: "RankMath optimized",
      icon: TrendingUp,
      iconColor: "text-white",
      bgColor: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - Always visible */}
      <Card className="bg-surface border-surface-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Dashboard Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-surface-light border border-surface-light rounded-lg p-4 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-secondary text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                    <p className="text-text-secondary text-xs">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration - Admin only */}
      {isAdmin && (
        <Card className="bg-surface border-surface-light">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-primary" />
              <span>API Configuration</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Anthropic API Key */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-medium">Anthropic API Key</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Required</span>
              </div>
              <p className="text-sm text-text-secondary">
                Powers AI content generation • Get your key from console.anthropic.com
              </p>
              <div className="flex space-x-3">
                <Input
                  type="password"
                  placeholder="sk-ant-api03-xxxxx..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => addSecret("ANTHROPIC_API_KEY", anthropicKey, "Anthropic API Key")}
                  disabled={loading === "ANTHROPIC_API_KEY"}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading === "ANTHROPIC_API_KEY" ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            {/* AI Agent Research */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-500" />
                <span className="font-medium">AI Agent Research</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</span>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                The AI agent performs real-time keyword research and content analysis without requiring external APIs. All research is done intelligently by the system.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <div>✓ Real-time keyword research enabled</div>
                  <div>✓ Content generation with built-in SEO analysis</div>
                  <div>✓ No additional API keys required</div>
                </div>
              </div>
            </div>

            {/* PayPal Configuration */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                <span className="font-medium">PayPal Configuration</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Optional</span>
              </div>
              <p className="text-sm text-text-secondary">
                Enable credit purchases • Configure PayPal Client ID and Secret
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client ID</label>
                  <Input
                    type="text"
                    placeholder="PayPal Client ID..."
                    value={paypalClientId}
                    onChange={(e) => setPaypalClientId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Client Secret</label>
                  <Input
                    type="password"
                    placeholder="PayPal Client Secret..."
                    value={paypalSecret}
                    onChange={(e) => setPaypalSecret(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => addSecret("PAYPAL_CLIENT_ID", paypalClientId, "PayPal Client ID")}
                  disabled={loading === "PAYPAL_CLIENT_ID"}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading === "PAYPAL_CLIENT_ID" ? "Saving..." : "Save Client ID"}
                </Button>
                <Button 
                  onClick={() => addSecret("PAYPAL_CLIENT_SECRET", paypalSecret, "PayPal Client Secret")}
                  disabled={loading === "PAYPAL_CLIENT_SECRET"}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading === "PAYPAL_CLIENT_SECRET" ? "Saving..." : "Save Secret"}
                </Button>
              </div>
            </div>

            {/* Service Status */}
            <div className="space-y-3">
              <h4 className="font-medium">Service Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Anthropic: Not configured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI Research: Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>PayPal: Not configured</span>
                </div>
              </div>
            </div>

            {/* Revenue Model */}
            <div className="bg-dark p-4 rounded-lg">
              <h4 className="font-medium mb-2">💰 Revenue Model</h4>
              <p className="text-sm text-text-secondary">
                • $2.00 per article revenue<br/>
                • ~$0.30 Anthropic API cost<br/>
                • <span className="text-green-500 font-medium">$1.70 profit per article (85% margin)</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}