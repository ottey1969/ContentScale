import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function SimpleDashboard() {
  const { user, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect if we have a valid user
    if (user && !isLoading) {
      setIsRedirecting(true);
      // Small delay to ensure smooth transition
      setTimeout(() => {
        window.location.href = '/simple-dashboard.html';
      }, 500);
    }
  }, [user, isLoading]);

  // Show loading while checking auth or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse mx-auto mb-4"></div>
          <div className="text-white">
            {isRedirecting ? 'Loading ContentScale Dashboard...' : 'Authenticating...'}
          </div>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    window.location.href = '/api/login';
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse mx-auto mb-4"></div>
          <div className="text-white">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse mx-auto mb-4"></div>
        <div className="text-white">Loading ContentScale Dashboard...</div>
      </div>
    </div>
  );
}