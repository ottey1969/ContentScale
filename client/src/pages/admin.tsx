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
        return await apiRequest('/api/admin/give-credits', 'POST', data);
      },
      onSuccess: (data: any) => {
        toast({
          title: "Credits Granted",
          description: data.message,
        });
        setUserEmail('');
        setCredits(10);
        setReason('');
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to grant credits",
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

  // Check if user is admin
  const isAdmin = user && ((user as any)?.id === 'admin' || (user as any)?.id === '44276721' || (user as any)?.email === 'ottmar.francisca1969@gmail.com');

  const [settings, setSettings] = useState<AdminSettings>({
    demoVideoId: '',
    demoVideoTitle: 'ContentScale Demo',
    maintenanceMode: false,
    welcomeMessage: 'Welcome to ContentScale!',
    maxCreditsPerUser: 100,
  });

  // Fetch current admin settings
  const { data: currentSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !!isAdmin,
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings as AdminSettings);
    }
  }, [currentSettings]);

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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
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

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Security Dashboard */}
            <SecurityDashboard />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}