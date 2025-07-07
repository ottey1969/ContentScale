import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Video, Save, Eye, Shield, Mail, CreditCard, MessageCircle, Download, Trash2, RefreshCw, Send, Users, Bell } from "lucide-react";
import SecurityDashboard from "@/components/dashboard/SecurityDashboard";
import { SEOHead, SEOConfigs } from "@/components/seo/SEOHead";

interface AdminSettings {
  demoVideoId: string;
  demoVideoTitle: string;
  maintenanceMode: boolean;
  welcomeMessage: string;
  maxCreditsPerUser: number;
}

interface EmailSubscriber {
  id: string;
  email: string;
  verified: boolean;
  subscribed: boolean;
  joinedDate: string;
  tags: string[];
}

interface ChatConversation {
  id: string;
  userEmail: string;
  lastMessage: string;
  unreadCount: number;
  lastActivity: string;
}

export default function AdminEnhanced() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  const isAdmin = user && ((user as any)?.id === 'admin' || (user as any)?.email === 'ottmar.francisca1969@gmail.com');

  const [settings, setSettings] = useState<AdminSettings>({
    demoVideoId: '',
    demoVideoTitle: 'ContentScale Demo',
    maintenanceMode: false,
    welcomeMessage: 'Welcome to ContentScale!',
    maxCreditsPerUser: 100,
  });

  // Credit management state
  const [creditForm, setCreditForm] = useState({
    userEmail: '',
    credits: 10,
    reason: ''
  });

  // Email management state
  const [emailSubscribers, setEmailSubscribers] = useState<EmailSubscriber[]>([]);
  const [emailComposer, setEmailComposer] = useState({
    visible: false,
    subject: '',
    message: '',
    recipients: 'all' as 'all' | 'verified' | 'subscribed'
  });

  // Chat management state
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Fetch current admin settings
  const { data: currentSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: isAdmin,
  });

  // Fetch email subscribers
  const { data: subscribers } = useQuery({
    queryKey: ['/api/admin/emails'],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await apiRequest('/api/admin/emails', 'GET');
      return response || [];
    }
  });

  // Fetch chat conversations
  const { data: conversations } = useQuery({
    queryKey: ['/api/admin/chat/conversations'],
    enabled: isAdmin,
    queryFn: async () => {
      const response = await apiRequest('/api/admin/chat/conversations', 'GET');
      return response || [];
    }
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  useEffect(() => {
    if (subscribers) {
      setEmailSubscribers(subscribers);
    }
  }, [subscribers]);

  useEffect(() => {
    if (conversations) {
      setChatConversations(conversations);
    }
  }, [conversations]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      return await apiRequest('/api/admin/settings', 'POST', newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Admin settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/video-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      console.error('Settings save error:', error);
    },
  });

  // Give credits mutation
  const giveCreditsMutation = useMutation({
    mutationFn: async (creditData: typeof creditForm) => {
      return await apiRequest('/api/admin/credits/give', 'POST', creditData);
    },
    onSuccess: () => {
      toast({
        title: "Credits given",
        description: `Successfully gave ${creditForm.credits} credits to ${creditForm.userEmail}`,
      });
      setCreditForm({ userEmail: '', credits: 10, reason: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to give credits. Please check the email address.",
        variant: "destructive",
      });
      console.error('Credits error:', error);
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: typeof emailComposer) => {
      return await apiRequest('/api/admin/emails/send', 'POST', emailData);
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Email has been sent to selected recipients.",
      });
      setEmailComposer({ visible: false, subject: '', message: '', recipients: 'all' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
      console.error('Email error:', error);
    },
  });

  // Send chat message mutation
  const sendChatMutation = useMutation({
    mutationFn: async ({ chatId, message }: { chatId: string, message: string }) => {
      return await apiRequest('/api/admin/chat/send', 'POST', { chatId, message });
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent to the user.",
      });
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error('Chat error:', error);
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleVideoIdChange = (value: string) => {
    // Extract video ID from YouTube URLs
    let videoId = value;
    
    // Handle different YouTube URL formats
    if (value.includes("youtube.com/watch?v=")) {
      videoId = value.split("v=")[1]?.split("&")[0] || "";
    } else if (value.includes("youtu.be/")) {
      videoId = value.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (value.includes("youtube.com/embed/")) {
      videoId = value.split("embed/")[1]?.split("?")[0] || "";
    }
    
    setSettings(prev => ({ ...prev, demoVideoId: videoId }));
  };

  const handleGiveCredits = () => {
    if (!creditForm.userEmail || creditForm.credits < 1) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email and credit amount.",
        variant: "destructive",
      });
      return;
    }
    giveCreditsMutation.mutate(creditForm);
  };

  const handleSendEmail = () => {
    if (!emailComposer.subject || !emailComposer.message) {
      toast({
        title: "Invalid input",
        description: "Please enter both subject and message.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(emailComposer);
  };

  const handleSendChatMessage = () => {
    if (!selectedChat || !chatMessage.trim()) {
      toast({
        title: "Invalid input",
        description: "Please select a chat and enter a message.",
        variant: "destructive",
      });
      return;
    }
    sendChatMutation.mutate({ chatId: selectedChat, message: chatMessage });
  };

  const exportEmailsCSV = () => {
    const csvContent = [
      ['Email', 'Verified', 'Subscribed', 'Joined Date', 'Tags'],
      ...emailSubscribers.map(sub => [
        sub.email,
        sub.verified ? 'Yes' : 'No',
        sub.subscribed ? 'Yes' : 'No',
        sub.joinedDate,
        sub.tags.join(';')
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contentscale-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const previewVideoUrl = settings.demoVideoId 
    ? `https://www.youtube.com/embed/${settings.demoVideoId}` 
    : "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* SEO Optimization */}
      <SEOHead {...SEOConfigs.admin} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Credits</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Emails</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Demo Video Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Video className="w-5 h-5 text-purple-400" />
                  <span>Demo Video Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="videoId" className="text-gray-300">
                    YouTube Video URL or ID
                  </Label>
                  <Input
                    id="videoId"
                    placeholder="https://www.youtube.com/watch?v=YOUR_VIDEO_ID or just YOUR_VIDEO_ID"
                    value={settings.demoVideoId}
                    onChange={(e) => handleVideoIdChange(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Paste any YouTube URL format or just the video ID
                  </p>
                </div>

                <div>
                  <Label htmlFor="videoTitle" className="text-gray-300">
                    Video Title
                  </Label>
                  <Input
                    id="videoTitle"
                    placeholder="Video title for display"
                    value={settings.demoVideoTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, demoVideoTitle: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Video Preview */}
                {previewVideoUrl && (
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Live Preview
                    </Label>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={previewVideoUrl}
                        title={settings.demoVideoTitle}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* General Settings */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <span>General Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="welcomeMessage" className="text-gray-300">
                    Welcome Message
                  </Label>
                  <Textarea
                    id="welcomeMessage"
                    placeholder="Welcome message for new users"
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="maxCredits" className="text-gray-300">
                    Max Credits Per User
                  </Label>
                  <Input
                    id="maxCredits"
                    type="number"
                    min="1"
                    max="10000"
                    value={settings.maxCreditsPerUser}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxCreditsPerUser: parseInt(e.target.value) || 100 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintenance"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="maintenance" className="text-gray-300">
                    Maintenance Mode
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="credits" className="space-y-6 mt-6">
            {/* Credit Management */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CreditCard className="w-5 h-5 text-yellow-400" />
                  <span>Credit Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userEmail" className="text-gray-300">
                    User Email
                  </Label>
                  <Input
                    id="userEmail"
                    placeholder="user@example.com"
                    value={creditForm.userEmail}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, userEmail: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="credits" className="text-gray-300">
                    Credits to Give
                  </Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="1000"
                    value={creditForm.credits}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, credits: parseInt(e.target.value) || 10 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="reason" className="text-gray-300">
                    Reason (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Admin credit grant for customer support..."
                    value={creditForm.reason}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                  />
                </div>

                <Button
                  onClick={handleGiveCredits}
                  disabled={giveCreditsMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {giveCreditsMutation.isPending ? "Giving Credits..." : `Give ${creditForm.credits} Credits`}
                </Button>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Instructions</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Enter the user's email address (must match their login email)</li>
                    <li>• Specify the number of credits to grant (1-1000)</li>
                    <li>• Credits will be added to their existing balance</li>
                    <li>• User must have logged in at least once</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6 mt-6">
            {/* Email Marketing */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>Email Marketing</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Manage your email subscribers and campaigns
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">{emailSubscribers.length}</div>
                    <div className="text-sm text-gray-400">Total Subscribers</div>
                    <div className="text-xs text-green-400">+1 today</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">{emailSubscribers.filter(s => s.verified).length}</div>
                    <div className="text-sm text-gray-400">Verified</div>
                    <div className="text-xs text-blue-400">100% verified</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">0%</div>
                    <div className="text-sm text-gray-400">Open Rate</div>
                    <div className="text-xs text-gray-400">0 campaigns sent</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-white">0%</div>
                    <div className="text-sm text-gray-400">Click Rate</div>
                    <div className="text-xs text-gray-400">-0 unsubscribed today</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={exportEmailsCSV}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/emails'] })}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setEmailComposer(prev => ({ ...prev, visible: !prev.visible }))}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Show Email Composer
                  </Button>
                </div>

                {/* Email Composer */}
                {emailComposer.visible && (
                  <div className="bg-slate-700 p-4 rounded-lg space-y-4">
                    <h4 className="text-white font-medium">Compose Email</h4>
                    <div>
                      <Label className="text-gray-300">Recipients</Label>
                      <select
                        value={emailComposer.recipients}
                        onChange={(e) => setEmailComposer(prev => ({ ...prev, recipients: e.target.value as any }))}
                        className="w-full bg-slate-600 border-slate-500 text-white rounded-md p-2"
                      >
                        <option value="all">All Subscribers</option>
                        <option value="verified">Verified Only</option>
                        <option value="subscribed">Subscribed Only</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Subject</Label>
                      <Input
                        placeholder="Email subject..."
                        value={emailComposer.subject}
                        onChange={(e) => setEmailComposer(prev => ({ ...prev, subject: e.target.value }))}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Message</Label>
                      <Textarea
                        placeholder="Email message..."
                        value={emailComposer.message}
                        onChange={(e) => setEmailComposer(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-slate-600 border-slate-500 text-white h-32"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSendEmail}
                        disabled={sendEmailMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
                      </Button>
                      <Button
                        onClick={() => setEmailComposer(prev => ({ ...prev, visible: false }))}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Subscribers List */}
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Email Subscribers ({emailSubscribers.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {emailSubscribers.map((subscriber) => (
                      <div key={subscriber.id} className="bg-slate-700 p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{subscriber.email}</div>
                          <div className="text-sm text-gray-400">
                            Joined: {subscriber.joinedDate} • 
                            <span className="ml-1 text-green-400">Verified</span> • 
                            <span className="ml-1 text-blue-400">subscribed</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6 mt-6">
            {/* Chat Management */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span>Send Message to User by Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setEmailComposer(prev => ({ ...prev, visible: !prev.visible }))}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Show Email Composer
                </Button>
              </CardContent>
            </Card>

            {/* Active Conversations */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Active Conversations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Active Conversations</h4>
                  <div className="space-y-2">
                    {/* Mock conversations */}
                    <div className="bg-slate-700 p-3 rounded-lg">
                      <div className="text-white font-medium">contact@weboom.be</div>
                      <div className="text-sm text-gray-400">Nu net gedaan. 20 credits....</div>
                    </div>
                    <div className="bg-slate-700 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">ottmar.francisca1969@gmail.com</div>
                        <div className="text-sm text-gray-400">Hi Joseph, het lukt niet met de credits....</div>
                      </div>
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">2</div>
                    </div>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="bg-slate-700 p-4 rounded-lg space-y-4">
                  <h4 className="text-white font-medium">Send Direct Message</h4>
                  <div>
                    <Label className="text-gray-300">Select User</Label>
                    <select
                      value={selectedChat || ''}
                      onChange={(e) => setSelectedChat(e.target.value)}
                      className="w-full bg-slate-600 border-slate-500 text-white rounded-md p-2"
                    >
                      <option value="">Select a user...</option>
                      <option value="contact@weboom.be">contact@weboom.be</option>
                      <option value="ottmar.francisca1969@gmail.com">ottmar.francisca1969@gmail.com</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Message</Label>
                    <Textarea
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white h-24"
                    />
                  </div>
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={sendChatMutation.isPending || !selectedChat}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendChatMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Security Dashboard */}
            <SecurityDashboard />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

