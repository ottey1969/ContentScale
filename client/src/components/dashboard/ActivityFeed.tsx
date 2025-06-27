import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Search, UserPlus, Upload, Gift, Info, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  createdAt: string;
}

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_generated':
        return { icon: Wand2, color: 'text-primary', bgColor: 'bg-primary bg-opacity-20' };
      case 'keywords_researched':
        return { icon: Search, color: 'text-secondary', bgColor: 'bg-secondary bg-opacity-20' };
      case 'referral_converted':
        return { icon: UserPlus, color: 'text-accent', bgColor: 'bg-accent bg-opacity-20' };
      case 'csv_processed':
        return { icon: Upload, color: 'text-neural', bgColor: 'bg-neural bg-opacity-20' };
      case 'referral_bonus':
        return { icon: Gift, color: 'text-purple-500', bgColor: 'bg-purple-500 bg-opacity-20' };
      default:
        return { icon: Info, color: 'text-text-secondary', bgColor: 'bg-surface-light' };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-surface border-surface-light overflow-hidden">
        <CardHeader className="border-b border-surface-light">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-text-secondary" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-surface-light">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-surface-light rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-light rounded w-3/4"></div>
                    <div className="h-3 bg-surface-light rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-surface border-surface-light overflow-hidden">
        <CardHeader className="border-b border-surface-light">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-text-secondary" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-text-secondary">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No recent activity. Start creating content to see your activity feed!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-text-secondary" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-surface-light">
          {activities.map((activity) => {
            const iconConfig = getActivityIcon(activity.type);
            
            return (
              <div key={activity.id} className="p-4 hover:bg-surface-light transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 ${iconConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <iconConfig.icon className={`w-5 h-5 ${iconConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatTimeAgo(activity.createdAt)}
                      {activity.description && ` • ${activity.description}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {activity.type === 'content_generated' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-surface-light hover:border-primary"
                      >
                        View
                      </Button>
                    )}
                    {activity.type === 'keywords_researched' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-surface-light hover:border-secondary"
                      >
                        Export
                      </Button>
                    )}
                    {activity.type === 'csv_processed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-surface-light hover:border-neural"
                      >
                        Download
                      </Button>
                    )}
                    {activity.type === 'referral_converted' && (
                      <span className="text-xs text-accent font-medium">
                        +{activity.metadata?.creditsAwarded || 5} Credits
                      </span>
                    )}
                    {activity.type === 'referral_bonus' && (
                      <span className="text-xs text-purple-500 font-medium">
                        +{activity.metadata?.bonusCredits || 0} Bonus
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
