import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Download, Users, TrendingUp, Calendar, Eye, Trash2 } from "lucide-react";

interface EmailSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  source: string;
  isVerified: boolean;
  subscriptionStatus: string;
  subscribedToNewsletter: boolean;
  subscribedToMarketing: boolean;
  createdAt: string;
  verifiedAt?: string;
}

interface EmailStats {
  totalSubscribers: number;
  verifiedSubscribers: number;
  newSubscribersToday: number;
  unsubscribedToday: number;
  campaignsSent: number;
  avgOpenRate: number;
  avgClickRate: number;
}

interface EmailMarketingProps {
  onClose?: () => void;
}

export function EmailMarketing({ onClose }: EmailMarketingProps) {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingEmails, setDeletingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/marketing/emails');
      if (!response.ok) {
        throw new Error('Failed to fetch email data');
      }
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email data');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmailSubscriber = async (email: string) => {
    if (!confirm(`Delete email subscriber: ${email}?`)) {
      return;
    }

    try {
      setDeletingEmails(prev => new Set(prev).add(email));
      
      const response = await fetch('/api/marketing/emails/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete email subscriber');
      }

      // Remove from local state
      setSubscribers(prev => prev.filter(sub => sub.email !== email));
      
      toast({
        title: "Email deleted",
        description: `Subscriber ${email} has been removed`,
      });

    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete email',
        variant: "destructive",
      });
    } finally {
      setDeletingEmails(prev => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/marketing/emails/export');
      if (!response.ok) {
        throw new Error('Failed to export emails');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export emails');
    }
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      'chat_signup': 'bg-purple-500/20 text-purple-300',
      'landing_page': 'bg-blue-500/20 text-blue-300',
      'content_download': 'bg-green-500/20 text-green-300',
      'newsletter': 'bg-yellow-500/20 text-yellow-300',
      'exit_intent': 'bg-red-500/20 text-red-300',
    };
    return colors[source as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Loading email marketing data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Email Marketing</h2>
            <p className="text-gray-400">Manage your email subscribers and campaigns</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700"
            disabled={subscribers.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalSubscribers}</div>
              <div className="text-xs text-green-400">+{stats.newSubscribersToday} today</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.verifiedSubscribers}</div>
              <div className="text-xs text-gray-400">
                {stats.totalSubscribers > 0 ? Math.round((stats.verifiedSubscribers / stats.totalSubscribers) * 100) : 0}% verified
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgOpenRate}%</div>
              <div className="text-xs text-gray-400">{stats.campaignsSent} campaigns sent</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Click Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgClickRate}%</div>
              <div className="text-xs text-red-400">-{stats.unsubscribedToday} unsubscribed today</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscribers List */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Email Subscribers ({subscribers.length})
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchEmailData}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {subscribers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No email subscribers yet. Emails will appear here when users sign up through the chat interface.
              </div>
            ) : (
              <div className="space-y-3">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-purple-500/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-white">{subscriber.email}</div>
                          {(subscriber.firstName || subscriber.lastName) && (
                            <div className="text-sm text-gray-400">
                              {subscriber.firstName} {subscriber.lastName}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getSourceBadge(subscriber.source)}>
                            {subscriber.source.replace('_', ' ')}
                          </Badge>
                          
                          {subscriber.isVerified ? (
                            <Badge className="bg-green-500/20 text-green-300">Verified</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-300">Unverified</Badge>
                          )}
                          
                          <Badge 
                            className={
                              subscriber.subscriptionStatus === 'subscribed'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-red-500/20 text-red-300'
                            }
                          >
                            {subscriber.subscriptionStatus}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                        <span>Joined: {new Date(subscriber.createdAt).toLocaleDateString()}</span>
                        {subscriber.subscribedToMarketing && (
                          <span className="text-green-400">✓ Marketing</span>
                        )}
                        {subscriber.subscribedToNewsletter && (
                          <span className="text-blue-400">✓ Newsletter</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <div className="ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteEmailSubscriber(subscriber.email)}
                        disabled={deletingEmails.has(subscriber.email)}
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {deletingEmails.has(subscriber.email) ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}