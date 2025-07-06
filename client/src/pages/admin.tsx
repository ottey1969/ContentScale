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
import { Settings, Video, Save, Eye, Shield, Mail } from "lucide-react";
import SecurityDashboard from "@/components/dashboard/SecurityDashboard";
import { EmailMarketing } from "@/components/EmailMarketing";
import { SEOHead, SEOConfigs } from "@/components/seo/SEOHead";

interface AdminSettings {
  demoVideoId: string;
  demoVideoTitle: string;
  maintenanceMode: boolean;
  welcomeMessage: string;
  maxCreditsPerUser: number;
}



// Admin Chat Dashboard Component
const AdminChatDashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  
  // Fetch all conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/admin/conversations'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Fetch messages for selected user
  const { data: messageData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/messages', selectedUserId],
    enabled: !!selectedUserId,
    refetchInterval: 2000, // Refresh every 2 seconds when conversation is open
  });
  
  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const response = await apiRequest('POST', '/api/admin/messages', {
        userId,
        message,
        isFromAdmin: true
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent to the user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSendMessage = () => {
    if (!selectedUserId || !newMessage.trim()) return;
    
    sendMessage.mutate({
      userId: selectedUserId,
      message: newMessage.trim()
    });
  };
  
  const messages = messageData?.messages || [];
  
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <span>💬</span>
            <span>Admin-User Chat Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-lg font-semibold text-white">Active Conversations</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {conversationsLoading ? (
                  <div className="text-gray-400">Loading conversations...</div>
                ) : conversations?.conversations?.length > 0 ? (
                  conversations.conversations.map((conv: any) => (
                    <div
                      key={conv.userId}
                      onClick={() => setSelectedUserId(conv.userId)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedUserId === conv.userId
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{conv.userEmail || `User ${conv.userId}`}</div>
                          <div className="text-sm opacity-70">
                            {conv.lastMessage ? conv.lastMessage.substring(0, 50) + '...' : 'No messages yet'}
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No conversations yet</div>
                )}
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="lg:col-span-2 flex flex-col">
              {selectedUserId ? (
                <>
                  <div className="flex-1 bg-slate-700 rounded-lg p-4 mb-4 overflow-y-auto max-h-[400px]">
                    {messagesLoading ? (
                      <div className="text-gray-400">Loading messages...</div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message: any) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.isFromAdmin
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-600 text-gray-200'
                              }`}
                            >
                              <div className="text-sm">{message.message}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {new Date(message.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center">No messages in this conversation</div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the user..."
                      className="flex-1 bg-slate-700 border-slate-600 text-white resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white self-end"
                    >
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-700 rounded-lg">
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <div>Select a conversation to start chatting</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Credit Management Component
  const CreditManagement = () => {
    const [userEmail, setUserEmail] = useState('');
    const [credits, setCredits] = useState(10);
    const [reason, setReason] = useState('');

    const giveCredits = useMutation({
      mutationFn: async (data: { userEmail: string; credits: number; reason: string }) => {
        const response = await apiRequest('POST', '/api/admin/give-credits', data);
        return await response.json();
      },
      onSuccess: (data: any) => {
        console.log("✅ Credit granting successful:", data);
        toast({
          title: "Credits Granted Successfully",
          description: `${data.message}. New balance: ${data.newBalance} credits.`,
        });
        setUserEmail('');
        setCredits(10);
        setReason('');
        
        // Invalidate credit cache to refresh all displays
        queryClient.invalidateQueries({ queryKey: ['/api/sofeia/credits'] });
        queryClient.invalidateQueries({ queryKey: ['/api/sofeia/status'] });
      },
      onError: (error: any) => {
        console.error("❌ Credit granting failed:", error);
        toast({
          title: "Credit Granting Failed",
          description: error.message || "Failed to grant credits. Please try again.",
          variant: "destructive",
        });
      },
    });

    const handleGiveCredits = (e: React.FormEvent) => {
      e.preventDefault();
      if (!userEmail.trim()) {
        toast({
          title: "Error",
          description: "Please enter a user email",
          variant: "destructive",
        });
        return;
      }
      giveCredits.mutate({ userEmail: userEmail.trim(), credits, reason });
    };

    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <span>💳</span>
            <span>Credit Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleGiveCredits} className="space-y-4">
            <div>
              <Label htmlFor="userEmail" className="text-gray-300">
                User Email
              </Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                required
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
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value) || 10)}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-gray-300">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Admin credit grant for customer support..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
              />
            </div>

            <Button
              type="submit"
              disabled={giveCredits.isPending}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white w-full"
            >
              {giveCredits.isPending ? "Granting Credits..." : `Give ${credits} Credits`}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
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
    );
  };

  // Since authentication is bypassed, always grant admin access
  const isAdmin = true;

  const [settings, setSettings] = useState<AdminSettings>({
    demoVideoId: '',
    demoVideoTitle: 'ContentScale Demo',
    maintenanceMode: false,
    welcomeMessage: 'Welcome to ContentScale!',
    maxCreditsPerUser: 100,
  });

  // Fetch current admin settings (authentication bypassed, always enable)
  const { data: currentSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: true, // Always enabled since authentication is bypassed
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings as AdminSettings);
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      console.log("🚀 Mutation started with settings:", newSettings);
      console.log("🔧 Making API call to /api/admin/settings");
      try {
        console.log("🌐 Calling apiRequest with method POST");
        const response = await apiRequest('POST', '/api/admin/settings', newSettings);
        console.log("📡 Response received:", response);
        console.log("📊 Response status:", response.status);
        console.log("📋 Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Response not OK:", response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("✅ Mutation successful:", result);
        return result;
      } catch (error) {
        console.error("❌ Mutation failed with error:", error);
        console.error("❌ Error type:", typeof error);
        console.error("❌ Error message:", (error as Error)?.message);
        console.error("❌ Error stack:", (error as Error)?.stack);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Mutation onSuccess triggered:", data);
      toast({
        title: "Settings saved",
        description: "Admin settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/video-settings'] });
    },
    onError: (error) => {
      console.error("❌ Mutation onError triggered:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      console.error('Settings save error:', error);
    },
  });

  const handleSave = () => {
    console.log("🔧 Admin Save button clicked");
    console.log("Current settings:", settings);
    console.log("Is admin:", isAdmin);
    console.log("User:", user);
    console.log("Mutation pending state:", saveSettingsMutation.isPending);
    console.log("Mutation error state:", saveSettingsMutation.error);
    
    // Since authentication is bypassed, allow admin access directly
    console.log("✅ Admin access granted (authentication bypassed), calling save mutation...");
    
    try {
      saveSettingsMutation.mutate(settings);
      console.log("🚀 Mutation.mutate() called successfully");
    } catch (error) {
      console.error("❌ Error calling mutation.mutate():", error);
    }
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
              <Video className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center space-x-2">
              <span>💳</span>
              <span>Credits</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Emails</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <span>💬</span>
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
            <CreditManagement />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6 mt-6">
            {/* Email Marketing Dashboard */}
            <EmailMarketing />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6 mt-6">
            {/* Admin-User Chat Dashboard */}
            <AdminChatDashboard />
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