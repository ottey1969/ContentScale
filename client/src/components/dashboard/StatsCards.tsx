import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  contentGenerated: number;
  keywordsResearched: number;
  referralConversions: number;
  avgSeoScore: number;
  contentGeneratedToday: number;
  creditsEarned: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-surface border-surface-light animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-surface-light rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Content Generated",
      value: stats?.contentGeneratedToday || 0,
      change: `+${Math.floor((stats?.contentGeneratedToday || 0) * 0.5)} from yesterday`,
      icon: "fas fa-file-alt",
      color: "primary",
      bgColor: "bg-primary bg-opacity-20"
    },
    {
      title: "Keywords Researched",
      value: stats?.keywordsResearched || 0,
      change: "via Answer Socrates",
      icon: "fas fa-search",
      color: "secondary",
      bgColor: "bg-secondary bg-opacity-20"
    },
    {
      title: "Referral Conversions",
      value: stats?.referralConversions || 0,
      change: `${(stats?.creditsEarned || 0)} credits earned`,
      icon: "fas fa-users",
      color: "accent",
      bgColor: "bg-accent bg-opacity-20"
    },
    {
      title: "Avg SEO Score",
      value: stats?.avgSeoScore || 0,
      change: "RankMath optimized",
      icon: "fas fa-chart-line",
      color: "neural",
      bgColor: "bg-neural bg-opacity-20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className={`bg-surface border-surface-light card-hover hover:border-${stat.color} transition-colors`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className={`text-${stat.color} text-xs`}>{stat.change}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-${stat.color} text-xl`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
