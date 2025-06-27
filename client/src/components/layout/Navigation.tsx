import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Rocket, Brain, Coins, Bell, LogOut } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-surface border-b border-surface-light sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* ContentScale Rocket Logo */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ContentScale
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Sofeia AI Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="flex items-center space-x-2 bg-surface-light px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-neural" />
              <span className="text-sm font-medium">{(user as any)?.credits || 0} Credits</span>
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="w-4 h-4 text-text-secondary hover:text-text-primary" />
            </Button>
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              {(user as any)?.profileImageUrl ? (
                <img 
                  src={(user as any).profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">
                {(user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'User'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-text-secondary hover:text-text-primary"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
