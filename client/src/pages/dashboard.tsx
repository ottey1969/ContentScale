import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import SofeiaAgentBrain from "@/components/dashboard/SofeiaAgentBrain";
import StatsCards from "@/components/dashboard/StatsCards";
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
  const [openaiKey, setOpenaiKey] = useState("");
  const [answerSocratesKey, setAnswerSocratesKey] = useState("");
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
        if (key === 'OPENAI_API_KEY') setOpenaiKey("");
        if (key === 'ANSWER_SOCRATES_API_KEY') setAnswerSocratesKey("");
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="p-6 space-y-6 pb-32">
            
            {/* Sofeia Agent Brain */}
            <SofeiaAgentBrain />

            {/* Stats Cards */}
            <StatsCards />

            {/* API Configuration */}
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

      {/* API Configuration Section - Bottom of Page */}
      <div className="bg-dark border-t border-surface-light">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-surface rounded-xl border border-surface-light overflow-hidden">
            <div className="p-6 border-b border-surface-light">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Key className="w-6 h-6 text-primary" />
                <span>API Configuration</span>
              </h3>
              <p className="text-sm text-text-secondary mt-2">
                Configure your API keys to enable AI-powered content generation and advanced features.
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Anthropic API Key */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <h3 className="font-medium">Anthropic API Key</h3>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Required</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Powers AI content generation • Get your key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                </p>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="sk-ant-api03-xxxxx..."
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="flex-1 bg-dark border-surface-light"
                  />
                  <Button 
                    onClick={() => saveApiKey('ANTHROPIC_API_KEY', anthropicKey, 'Anthropic API Key')}
                    disabled={loading === 'ANTHROPIC_API_KEY'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading === 'ANTHROPIC_API_KEY' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* OpenAI API Key */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <h3 className="font-medium">OpenAI API Key</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">Optional</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Additional AI capabilities • Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                </p>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="sk-xxxxx..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="flex-1 bg-dark border-surface-light"
                  />
                  <Button 
                    onClick={() => saveApiKey('OPENAI_API_KEY', openaiKey, 'OpenAI API Key')}
                    disabled={loading === 'OPENAI_API_KEY'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading === 'OPENAI_API_KEY' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* Answer Socrates API Key */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-purple-500" />
                  <h3 className="font-medium">Answer Socrates API Key</h3>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Optional</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Enhanced keyword research data • Get your key from <a href="https://answersocrates.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">answersocrates.com</a>
                </p>
                <div className="flex space-x-2">
                  <Input
                    type="password"
                    placeholder="as_xxxxx..."
                    value={answerSocratesKey}
                    onChange={(e) => setAnswerSocratesKey(e.target.value)}
                    className="flex-1 bg-dark border-surface-light"
                  />
                  <Button 
                    onClick={() => saveApiKey('ANSWER_SOCRATES_API_KEY', answerSocratesKey, 'Answer Socrates API Key')}
                    disabled={loading === 'ANSWER_SOCRATES_API_KEY'}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading === 'ANSWER_SOCRATES_API_KEY' ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* PayPal Configuration */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-yellow-500" />
                  <h3 className="font-medium">PayPal Configuration</h3>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Payment</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Enable credit purchases • Configure PayPal Client ID and Secret
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client ID</label>
                    <Input
                      type="password"
                      placeholder="PayPal Client ID..."
                      value={paypalClientId}
                      onChange={(e) => setPaypalClientId(e.target.value)}
                      className="bg-dark border-surface-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client Secret</label>
                    <Input
                      type="password"
                      placeholder="PayPal Client Secret..."
                      value={paypalSecret}
                      onChange={(e) => setPaypalSecret(e.target.value)}
                      className="bg-dark border-surface-light"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => saveApiKey('PAYPAL_CLIENT_ID', paypalClientId, 'PayPal Client ID')}
                    disabled={loading === 'PAYPAL_CLIENT_ID'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading === 'PAYPAL_CLIENT_ID' ? 'Saving...' : 'Save Client ID'}
                  </Button>
                  <Button 
                    onClick={() => saveApiKey('PAYPAL_CLIENT_SECRET', paypalSecret, 'PayPal Client Secret')}
                    disabled={loading === 'PAYPAL_CLIENT_SECRET'}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading === 'PAYPAL_CLIENT_SECRET' ? 'Saving...' : 'Save Secret'}
                  </Button>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="border-t border-surface-light pt-4">
                <h4 className="font-medium mb-3">Service Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Anthropic: Not configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">OpenAI: Not configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Keywords: Demo mode</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">PayPal: Not configured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
