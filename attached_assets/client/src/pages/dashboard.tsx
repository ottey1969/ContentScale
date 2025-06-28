import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import SofeiaAgentBrain from "@/components/dashboard/SofeiaAgentBrain";

import ContentGenerator from "@/components/dashboard/ContentGenerator";
import KeywordResearch from "@/components/dashboard/KeywordResearch";
import CSVUploader from "@/components/dashboard/CSVUploader";
import ReferralDashboard from "@/components/dashboard/ReferralDashboard";
import AchievementSystem from "@/components/dashboard/AchievementSystem";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import APIKeyManager from "@/components/admin/APIKeyManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MessageSquare, 
  Gauge, 
  FileText, 
  Search, 
  Users, 
  Settings,
  Headphones,
  Key,
  Shield,
  Brain,
  CreditCard,
  Save
} from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // API Configuration state
  const [anthropicKey, setAnthropicKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [loading, setLoading] = useState("");

  // Function to save API keys
  const saveApiKey = async (key: string, value: string, label: string) => {
    if (!value.trim()) {
      toast({
        title: "Error",
        description: `Please enter the ${label}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(key);
    
    try {
      const response = await fetch('/api/admin/add-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: value.trim() })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success!",
          description: `${label} saved successfully`,
        });
        
        // Clear the input based on key type
        if (key === 'ANTHROPIC_API_KEY') setAnthropicKey("");
        if (key === 'PAYPAL_CLIENT_ID') setPaypalClientId("");
        if (key === 'PAYPAL_CLIENT_SECRET') setPaypalSecret("");
        
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to save ${label}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${label}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading("");
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg animate-pulse"></div>
          <div className="text-text-primary">Loading ContentScale Agent...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-dark text-text-primary flex flex-col">
      <Navigation />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-0">
          <div className="p-6 space-y-6 pb-40 relative z-10">
            
            {/* Sofeia Agent Brain */}
            <SofeiaAgentBrain />

            {/* Dashboard & API Configuration (includes stats cards) */}
            <APIKeyManager />

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Content Generation & Research */}
              <div className="space-y-8">
                <ContentGenerator />
                <KeywordResearch />
                <CSVUploader />
              </div>

              {/* Right Column - Referrals & Achievements */}
              <div className="space-y-8">
                <ReferralDashboard />
                <AchievementSystem />
                
                {/* Support Integration */}
                <div className="bg-surface rounded-xl border border-surface-light overflow-hidden">
                  <div className="p-6 border-b border-surface-light">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Headphones className="w-5 h-5 text-primary" />
                      <span>Support</span>
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => window.open('https://wa.me/31628073996', '_blank')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp Support
                    </Button>
                    <p className="text-xs text-text-secondary text-center">+31 628073996</p>
                    
                    {/* Quick Help */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Quick Help</p>
                      <div className="space-y-1">
                        <button className="w-full text-left text-xs text-text-secondary hover:text-text-primary p-2 hover:bg-dark rounded transition-colors">
                          • How to earn more credits?
                        </button>
                        <button className="w-full text-left text-xs text-text-secondary hover:text-text-primary p-2 hover:bg-dark rounded transition-colors">
                          • Setting up AI training
                        </button>
                        <button className="w-full text-left text-xs text-text-secondary hover:text-text-primary p-2 hover:bg-dark rounded transition-colors">
                          • Export options explained
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Activity Feed */}
            <ActivityFeed />
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="w-14 h-14 bg-gradient-to-r from-primary to-secondary hover:from-blue-600 hover:to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 p-0"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>

      {/* Mobile Navigation (Hidden by default, would be shown on mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-light">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-primary">
            <Gauge className="w-5 h-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button className="flex flex-col items-center p-2 text-text-secondary">
            <FileText className="w-5 h-5" />
            <span className="text-xs mt-1">Content</span>
          </button>
          <button className="flex flex-col items-center p-2 text-text-secondary">
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Research</span>
          </button>
          <button className="flex flex-col items-center p-2 text-text-secondary">
            <Users className="w-5 h-5" />
            <span className="text-xs mt-1">Referrals</span>
          </button>
          <button className="flex flex-col items-center p-2 text-text-secondary">
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
