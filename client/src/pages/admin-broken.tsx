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
import { Settings, Video, Save, Eye, Shield } from "lucide-react";
import SecurityDashboard from "@/components/dashboard/SecurityDashboard";

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
  
  const [settings, setSettings] = useState<AdminSettings>({
    demoVideoId: "",
    demoVideoTitle: "ContentScale Demo",
    maintenanceMode: false,
    welcomeMessage: "Welcome to ContentScale!",
    maxCreditsPerUser: 100
  });

  // Check if user is admin (you can modify this logic as needed)
  const isAdmin = user?.email === "admin@contentscale.site" || user?.id === "admin";

  // Fetch admin settings
  const { data: adminSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: isAdmin,
  });

  // Update settings when fetched
  useEffect(() => {
    if (adminSettings) {
      setSettings(adminSettings);
    }
  }, [adminSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      return await apiRequest("/api/admin/settings", "POST", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Admin settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Settings className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Settings Content */}

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
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste any YouTube URL format or just the video ID
              </p>
            </div>
            
            <div>
              <Label htmlFor="videoTitle" className="text-gray-300">
                Video Title
              </Label>
              <Input
                id="videoTitle"
                value={settings.demoVideoTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, demoVideoTitle: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Video Preview */}
            {settings.demoVideoId && (
              <div className="mt-4">
                <Label className="text-gray-300 flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Label>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={previewVideoUrl}
                    title={settings.demoVideoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="welcomeMessage" className="text-gray-300">
                Welcome Message
              </Label>
              <Textarea
                id="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="maxCredits" className="text-gray-300">
                Max Credits Per User
              </Label>
              <Input
                id="maxCredits"
                type="number"
                value={settings.maxCreditsPerUser}
                onChange={(e) => setSettings(prev => ({ ...prev, maxCreditsPerUser: parseInt(e.target.value) || 0 }))}
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

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Security Dashboard */}
            <SecurityDashboard />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}