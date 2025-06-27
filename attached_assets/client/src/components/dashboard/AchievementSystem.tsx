import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  achievementType: string;
  level: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementSystem() {
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const achievementConfig = {
    content_creator: {
      name: "Content Creator",
      icon: "fas fa-pen",
      color: "text-accent",
      bgColor: "bg-accent",
      description: "Create high-quality content",
      levels: [
        { threshold: 5, name: "Writer", reward: "5 posts created" },
        { threshold: 10, name: "Author", reward: "10 posts created" },
        { threshold: 25, name: "Content Master", reward: "25 posts created" },
      ]
    },
    keyword_master: {
      name: "Keyword Master",
      icon: "fas fa-search",
      color: "text-secondary",
      bgColor: "bg-secondary",
      description: "Research keywords like a pro",
      levels: [
        { threshold: 100, name: "Researcher", reward: "100 keywords researched" },
        { threshold: 500, name: "Analyst", reward: "500 keywords researched" },
        { threshold: 1000, name: "SEO Expert", reward: "1000 keywords researched" },
      ]
    },
    referral_pro: {
      name: "Referral Pro",
      icon: "fas fa-users",
      color: "text-neural",
      bgColor: "bg-neural",
      description: "Grow the community",
      levels: [
        { threshold: 1, name: "Inviter", reward: "1 conversion" },
        { threshold: 5, name: "Networker", reward: "5 conversions" },
        { threshold: 10, name: "Community Builder", reward: "10 conversions" },
      ]
    },
    seo_expert: {
      name: "SEO Expert",
      icon: "fas fa-chart-line",
      color: "text-primary",
      bgColor: "bg-primary",
      description: "Master SEO optimization",
      levels: [
        { threshold: 10, name: "Optimizer", reward: "10 optimized posts" },
        { threshold: 25, name: "SEO Specialist", reward: "25 optimized posts" },
        { threshold: 50, name: "SEO Master", reward: "50 optimized posts" },
      ]
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-surface border-surface-light">
        <CardHeader className="border-b border-surface-light">
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-trophy text-neural"></i>
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-light rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAchievementProgress = (achievement: Achievement) => {
    const config = achievementConfig[achievement.achievementType as keyof typeof achievementConfig];
    if (!config) return { percentage: 0, nextLevel: null, currentLevel: null };

    const currentLevel = config.levels.find(level => achievement.progress >= level.threshold);
    const nextLevel = config.levels.find(level => achievement.progress < level.threshold);
    
    const percentage = (achievement.progress / achievement.maxProgress) * 100;

    return { percentage, nextLevel, currentLevel };
  };

  return (
    <Card className="bg-surface border-surface-light overflow-hidden">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-trophy text-neural"></i>
          <span>Achievements</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Achievement Badges */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(achievementConfig).map(([type, config]) => {
            const achievement = achievements?.find(a => a.achievementType === type);
            const { currentLevel } = achievement ? getAchievementProgress(achievement) : { currentLevel: null };
            
            return (
              <div
                key={type}
                className={`text-center p-3 rounded-lg transition-all ${
                  achievement?.unlocked 
                    ? 'bg-dark' 
                    : 'bg-dark opacity-50'
                }`}
              >
                <div className={`w-8 h-8 ${achievement?.unlocked ? config.bgColor : 'bg-surface-light'} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <i className={`${config.icon} ${achievement?.unlocked ? 'text-white' : 'text-text-secondary'} text-sm`}></i>
                </div>
                <div className="text-xs font-medium">
                  {config.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {currentLevel ? currentLevel.name : `${achievement?.progress || 0}/${achievement?.maxProgress || 0}`}
                </div>
                {achievement?.unlocked && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Unlocked
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Progress to Next Achievement */}
        {achievements && achievements.length > 0 && (
          <div className="space-y-3">
            {achievements
              .filter(achievement => !achievement.unlocked)
              .slice(0, 2)
              .map((achievement) => {
                const config = achievementConfig[achievement.achievementType as keyof typeof achievementConfig];
                const { percentage, nextLevel } = getAchievementProgress(achievement);
                
                if (!config || !nextLevel) return null;

                return (
                  <div key={achievement.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{nextLevel.name}</span>
                      <span className="text-xs text-text-secondary">
                        {achievement.progress}/{nextLevel.threshold}
                      </span>
                    </div>
                    <Progress 
                      value={(achievement.progress / nextLevel.threshold) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {nextLevel.threshold - achievement.progress} more needed
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        {/* No achievements message */}
        {(!achievements || achievements.length === 0) && (
          <div className="text-center py-6 text-text-secondary">
            <i className="fas fa-trophy text-3xl mb-3 opacity-50"></i>
            <p className="text-sm">Start creating content to unlock achievements!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
