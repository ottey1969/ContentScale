import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-brain text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold">ContentScale Agent</h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-sm text-text-secondary">
              <i className="fas fa-robot text-neural animate-pulse-slow"></i>
              <span>Sofeia Agent Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="flex items-center space-x-2 bg-surface-light px-3 py-1 rounded-full">
              <i className="fas fa-coins text-neural"></i>
              <span className="text-sm font-medium">{user?.credits || 0} Credits</span>
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="p-2">
              <i className="fas fa-bell text-text-secondary hover:text-text-primary"></i>
            </Button>
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block">
                {user?.firstName || user?.email?.split('@')[0] || 'User'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-text-secondary hover:text-text-primary"
              >
                <i className="fas fa-sign-out-alt"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
