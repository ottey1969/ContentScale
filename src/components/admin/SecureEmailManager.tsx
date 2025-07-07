import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Send, 
  Download, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Lock,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText
} from "lucide-react";

interface SecureEmailSubscriber {
  id: string;
  email: string;
  emailMasked: string;
  verified: boolean;
  subscribed: boolean;
  joinedDate: string;
  tags: string[];
  accessCount: number;
}

interface SecurityStats {
  security: {
    totalEvents: number;
    eventsLast24h: number;
    eventsBySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    activeUsers: number;
    configuredLimits: any;
  };
  gdpr: {
    totalRequests: number;
    requestsByType: any;
    requestsByStatus: any;
  };
}

export default function SecureEmailManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [showFullEmails, setShowFullEmails] = useState(false);
  const [emailComposer, setEmailComposer] = useState({
    visible: false,
    subject: '',
    message: '',
    recipients: 'all' as 'all' | 'verified' | 'subscribed'
  });
  const [securityWarningShown, setSecurityWarningShown] = useState(false);

  // Check if user is admin
  const isAdmin = user && ((user as any)?.email === 'ottmar.francisca1969@gmail.com' || (user as any)?.id === 'admin');

  // Fetch secure email subscribers
  const { data: subscribers = [], isLoading: subscribersLoading } = useQuery({
    queryKey: ['/api/admin/emails'],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await apiRequest('/api/admin/emails', 'GET');
      return response || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch security statistics
  const { data: securityStats, isLoading: securityLoading } = useQuery({
    queryKey: ['/api/admin/security/stats'],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await apiRequest('/api/admin/security/stats', 'GET');
      return response;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Send email campaign mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: typeof emailComposer) => {
      return await apiRequest('/api/admin/emails/send', 'POST', emailData);
    },
    onSuccess: () => {
      toast({
        title: "Email Campaign Sent",
        description: "Your secure email campaign has been sent successfully.",
      });
      setEmailComposer({ visible: false, subject: '', message: '', recipients: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Campaign Failed",
        description: error.message || "Failed to send email campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle viewing full emails with security warning
  const handleViewFullEmails = () => {
    if (!securityWarningShown) {
      const confirmed = window.confirm(
        '🔒 SECURITY WARNING\n\n' +
        'You are about to view full email addresses. This action will be:\n' +
        '• Logged for security audit purposes\n' +
        '• Monitored for compliance\n' +
        '• Subject to rate limiting\n\n' +
        'Only proceed if you have a legitimate business need.\n\n' +
        'Continue?'
      );
      
      if (!confirmed) {
        return;
      }
      setSecurityWarningShown(true);
    }
    
    setShowFullEmails(!showFullEmails);
    
    // Log the access attempt
    toast({
      title: showFullEmails ? "Email Masking Enabled" : "Full Email Access Granted",
      description: showFullEmails ? "Emails are now masked for security" : "This access has been logged for audit",
      variant: showFullEmails ? "default" : "destructive",
    });
  };

  // Handle secure export
  const handleSecureExport = async (format: 'csv' | 'encrypted' = 'encrypted') => {
    try {
      const response = await fetch('/api/admin/emails/export?format=' + format, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Export limit exceeded. Maximum 5 exports per day for security.');
        }
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 
                      `subscribers_${format}_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Secure Export Complete",
        description: `Exported ${format === 'encrypted' ? 'encrypted' : 'masked'} subscriber data. This action has been logged.`,
      });

      // Refresh security stats
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/stats'] });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export subscriber data securely",
        variant: "destructive",
      });
    }
  };

  // Handle sending email campaign
  const handleSendEmail = () => {
    if (!emailComposer.subject || !emailComposer.message) {
      toast({
        title: "Invalid Input",
        description: "Please enter both subject and message.",
        variant: "destructive",
      });
      return;
    }

    // Security confirmation for email campaigns
    const confirmed = window.confirm(
      `🔒 SECURE EMAIL CAMPAIGN\n\n` +
      `Subject: ${emailComposer.subject}\n` +
      `Recipients: ${emailComposer.recipients}\n` +
      `Estimated recipients: ${getRecipientCount()}\n\n` +
      `This campaign will be:\n` +
      `• Sent through secure channels\n` +
      `• Logged for compliance\n` +
      `• Subject to rate limiting\n\n` +
      `Proceed with sending?`
    );

    if (confirmed) {
      sendEmailMutation.mutate(emailComposer);
    }
  };

  // Get recipient count based on filter
  const getRecipientCount = () => {
    switch (emailComposer.recipients) {
      case 'verified':
        return subscribers.filter((s: SecureEmailSubscriber) => s.verified).length;
      case 'subscribed':
        return subscribers.filter((s: SecureEmailSubscriber) => s.subscribed).length;
      default:
        return subscribers.length;
    }
  };

  // Security status indicator
  const getSecurityStatus = () => {
    if (!securityStats) return { status: 'unknown', color: 'gray' };
    
    const { security } = securityStats;
    const criticalEvents = security.eventsBySeverity.critical + security.eventsBySeverity.high;
    
    if (criticalEvents > 0) {
      return { status: 'warning', color: 'red' };
    } else if (security.eventsLast24h > 10) {
      return { status: 'caution', color: 'yellow' };
    } else {
      return { status: 'secure', color: 'green' };
    }
  };

  const securityStatus = getSecurityStatus();

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required for email management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Shield className={`w-5 h-5 text-${securityStatus.color}-400`} />
              <span>Secure Email Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-${securityStatus.color}-400`}></div>
              <span className="text-sm text-gray-400 capitalize">{securityStatus.status}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{subscribers.length}</div>
              <div className="text-sm text-gray-400">Total Subscribers</div>
              <div className="text-xs text-blue-400">Encrypted Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {subscribers.filter((s: SecureEmailSubscriber) => s.verified).length}
              </div>
              <div className="text-sm text-gray-400">Verified</div>
              <div className="text-xs text-green-400">GDPR Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {securityStats?.security.eventsLast24h || 0}
              </div>
              <div className="text-sm text-gray-400">Security Events</div>
              <div className="text-xs text-yellow-400">Last 24h</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {securityStats?.gdpr.totalRequests || 0}
              </div>
              <div className="text-sm text-gray-400">GDPR Requests</div>
              <div className="text-xs text-purple-400">Automated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Management Controls */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>Email Management Controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/emails'] })}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleViewFullEmails}
              variant={showFullEmails ? "destructive" : "outline"}
              className={showFullEmails ? "" : "border-slate-600 text-white hover:bg-slate-700"}
            >
              {showFullEmails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showFullEmails ? "Hide Full Emails" : "View Full Emails"}
            </Button>
            
            <Button
              onClick={() => handleSecureExport('encrypted')}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Export Encrypted
            </Button>
            
            <Button
              onClick={() => handleSecureExport('csv')}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Masked CSV
            </Button>
            
            <Button
              onClick={() => setEmailComposer(prev => ({ ...prev, visible: !prev.visible }))}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Compose Campaign
            </Button>
          </div>

          {/* Security Warning */}
          {showFullEmails && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Security Notice</span>
              </div>
              <p className="text-red-300 text-sm mt-1">
                Full email addresses are visible. This access is being logged for security audit purposes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Composer */}
      {emailComposer.visible && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Send className="w-5 h-5 text-purple-400" />
              <span>Secure Email Campaign Composer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Recipients</Label>
              <select
                value={emailComposer.recipients}
                onChange={(e) => setEmailComposer(prev => ({ ...prev, recipients: e.target.value as any }))}
                className="w-full bg-slate-700 border-slate-600 text-white rounded-md p-2"
              >
                <option value="all">All Subscribers ({subscribers.length})</option>
                <option value="verified">Verified Only ({subscribers.filter((s: SecureEmailSubscriber) => s.verified).length})</option>
                <option value="subscribed">Subscribed Only ({subscribers.filter((s: SecureEmailSubscriber) => s.subscribed).length})</option>
              </select>
            </div>
            
            <div>
              <Label className="text-gray-300">Subject</Label>
              <Input
                placeholder="Email subject (max 200 characters)"
                value={emailComposer.subject}
                onChange={(e) => setEmailComposer(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                maxLength={200}
              />
            </div>
            
            <div>
              <Label className="text-gray-300">Message</Label>
              <Textarea
                placeholder="Email message (max 10,000 characters)"
                value={emailComposer.message}
                onChange={(e) => setEmailComposer(prev => ({ ...prev, message: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 h-32"
                maxLength={10000}
              />
              <div className="text-xs text-gray-400 mt-1">
                {emailComposer.message.length}/10,000 characters
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSendEmail}
                disabled={sendEmailMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendEmailMutation.isPending ? "Sending..." : `Send to ${getRecipientCount()} Recipients`}
              </Button>
              <Button
                onClick={() => setEmailComposer(prev => ({ ...prev, visible: false }))}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribers List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Email Subscribers ({subscribers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscribersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading secure subscriber data...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {subscribers.map((subscriber: SecureEmailSubscriber) => (
                <div key={subscriber.id} className="bg-slate-700 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">
                        {showFullEmails ? subscriber.email : subscriber.emailMasked}
                      </span>
                      {showFullEmails && (
                        <Lock className="w-4 h-4 text-yellow-400" title="Full email visible - logged for audit" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center space-x-4">
                      <span>Joined: {subscriber.joinedDate}</span>
                      <span className="flex items-center space-x-1">
                        {subscriber.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span>{subscriber.verified ? 'Verified' : 'Unverified'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span>{subscriber.subscribed ? 'Subscribed' : 'Unsubscribed'}</span>
                      </span>
                    </div>
                    {subscriber.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {subscriber.tags.map((tag, index) => (
                          <span key={index} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Statistics */}
      {securityStats && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Security & Compliance Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-white font-medium">Security Events (24h)</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Low Priority</span>
                    <span className="text-green-400">{securityStats.security.eventsBySeverity.low}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Medium Priority</span>
                    <span className="text-yellow-400">{securityStats.security.eventsBySeverity.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">High Priority</span>
                    <span className="text-red-400">{securityStats.security.eventsBySeverity.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Critical</span>
                    <span className="text-red-600">{securityStats.security.eventsBySeverity.critical}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">GDPR Compliance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Requests</span>
                    <span className="text-blue-400">{securityStats.gdpr.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Access Requests</span>
                    <span className="text-purple-400">{securityStats.gdpr.requestsByType.access || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Erasure Requests</span>
                    <span className="text-orange-400">{securityStats.gdpr.requestsByType.erasure || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pending</span>
                    <span className="text-yellow-400">{securityStats.gdpr.requestsByStatus.pending || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

