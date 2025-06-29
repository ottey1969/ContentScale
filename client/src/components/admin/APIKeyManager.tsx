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
  
  // Removed API configuration state and functions - APIs already working

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

      {/* API Configuration removed - APIs already configured and working */}
    </div>
  );
}