import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, FileText, Search, Upload, MessageCircle, Share2, Download, Settings, TrendingUp, User, Bot } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'content_generated' | 'keyword_research' | 'csv_upload' | 'csv_processed' | 'chat_message' | 'referral_shared' | 'content_downloaded' | 'settings_updated' | 'login' | 'api_configured';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    contentType?: string;
    keywordCount?: number;
    fileName?: string;
    platform?: string;
    downloadFormat?: string;
    settingType?: string;
  };
  status?: 'success' | 'pending' | 'failed';
}

interface ActivityStats {
  totalActions: number;
  todayActions: number;
  weekActions: number;
  mostActiveHour: number;
  topActivity: string;
}

export default function RecentActivity() {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Get recent activity
  const { data: activities = [] } = useQuery<ActivityItem[]>({
    queryKey: ["/api/activity/recent", timeFilter, typeFilter],
  });

  // Get activity statistics
  const { data: stats } = useQuery<ActivityStats>({
    queryKey: ["/api/activity/stats"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_generated': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'keyword_research': return <Search className="w-4 h-4 text-purple-500" />;
      case 'csv_upload': return <Upload className="w-4 h-4 text-green-500" />;
      case 'csv_processed': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'chat_message': return <MessageCircle className="w-4 h-4 text-pink-500" />;
      case 'referral_shared': return <Share2 className="w-4 h-4 text-cyan-500" />;
      case 'content_downloaded': return <Download className="w-4 h-4 text-indigo-500" />;
      case 'settings_updated': return <Settings className="w-4 h-4 text-gray-500" />;
      case 'login': return <User className="w-4 h-4 text-green-600" />;
      case 'api_configured': return <Bot className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_generated': return 'bg-blue-100 text-blue-800';
      case 'keyword_research': return 'bg-purple-100 text-purple-800';
      case 'csv_upload': return 'bg-green-100 text-green-800';
      case 'csv_processed': return 'bg-orange-100 text-orange-800';
      case 'chat_message': return 'bg-pink-100 text-pink-800';
      case 'referral_shared': return 'bg-cyan-100 text-cyan-800';
      case 'content_downloaded': return 'bg-indigo-100 text-indigo-800';
      case 'settings_updated': return 'bg-gray-100 text-gray-800';
      case 'login': return 'bg-green-100 text-green-800';
      case 'api_configured': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'content_generated', label: 'Content Generated' },
    { value: 'keyword_research', label: 'Keyword Research' },
    { value: 'csv_upload', label: 'CSV Upload' },
    { value: 'chat_message', label: 'Chat Messages' },
    { value: 'referral_shared', label: 'Referrals' },
    { value: 'settings_updated', label: 'Settings' },
  ];

  const timeFilters = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ];

  // Mock data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'content_generated',
      title: 'Blog Post Generated',
      description: 'Created "AI Marketing Strategies for 2024"',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      metadata: { contentType: 'Blog Post' },
      status: 'success'
    },
    {
      id: '2',
      type: 'keyword_research',
      title: 'Keyword Research Completed',
      description: 'Researched keywords for "digital marketing"',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      metadata: { keywordCount: 25 },
      status: 'success'
    },
    {
      id: '3',
      type: 'chat_message',
      title: 'Chat with Sofeia',
      description: 'Asked about CRAFT framework implementation',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'success'
    },
    {
      id: '4',
      type: 'referral_shared',
      title: 'Referral Link Shared',
      description: 'Shared on LinkedIn',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: { platform: 'LinkedIn' },
      status: 'success'
    },
    {
      id: '5',
      type: 'csv_upload',
      title: 'CSV File Uploaded',
      description: 'Uploaded keywords.csv for bulk processing',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      metadata: { fileName: 'keywords.csv' },
      status: 'success'
    },
    {
      id: '6',
      type: 'api_configured',
      title: 'API Key Updated',
      description: 'Anthropic API key configured successfully',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'success'
    },
    {
      id: '7',
      type: 'content_downloaded',
      title: 'Content Downloaded',
      description: 'Downloaded "SEO Guide" as Word document',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      metadata: { downloadFormat: 'Word' },
      status: 'success'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <Card className="bg-surface border-surface-light">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Recent Activity</span>
          </div>
          {stats && (
            <Badge variant="outline" className="text-xs">
              {stats.todayActions} actions today
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Activity Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalActions}</div>
              <div className="text-xs text-muted-foreground">Total Actions</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-500">{stats.todayActions}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{stats.weekActions}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-500">{stats.mostActiveHour}:00</div>
              <div className="text-xs text-muted-foreground">Peak Hour</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Time:</span>
            {timeFilters.map((filter) => (
              <Button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value as any)}
                variant={timeFilter === filter.value ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-input bg-background rounded"
            >
              {activityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity List */}
        <ScrollArea className="h-96 border rounded-lg">
          <div className="p-4 space-y-3">
            {displayActivities.length > 0 ? (
              displayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge className={getActivityColor(activity.type)} variant="secondary">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        {activity.status && (
                          <Badge className={getStatusColor(activity.status)} variant="secondary">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                      {activity.metadata && (
                        <div className="text-xs text-muted-foreground">
                          {activity.metadata.contentType && `Type: ${activity.metadata.contentType}`}
                          {activity.metadata.keywordCount && `${activity.metadata.keywordCount} keywords`}
                          {activity.metadata.fileName && `File: ${activity.metadata.fileName}`}
                          {activity.metadata.platform && `Platform: ${activity.metadata.platform}`}
                          {activity.metadata.downloadFormat && `Format: ${activity.metadata.downloadFormat}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                <p>Start using ContentScale to see your activity here.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Activity Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-3">Activity Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-600">Content</div>
              <div className="text-muted-foreground">
                {displayActivities.filter(a => a.type === 'content_generated').length} generated
              </div>
            </div>
            <div>
              <div className="font-semibold text-purple-600">Research</div>
              <div className="text-muted-foreground">
                {displayActivities.filter(a => a.type === 'keyword_research').length} searches
              </div>
            </div>
            <div>
              <div className="font-semibold text-green-600">Uploads</div>
              <div className="text-muted-foreground">
                {displayActivities.filter(a => a.type === 'csv_upload').length} files
              </div>
            </div>
            <div>
              <div className="font-semibold text-pink-600">Chats</div>
              <div className="text-muted-foreground">
                {displayActivities.filter(a => a.type === 'chat_message').length} messages
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

