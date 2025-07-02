import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SimpleDashboard from "@/pages/simple-dashboard";
import Landing from "@/pages/landing";
import Admin from "@/pages/admin";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg animate-pulse"></div>
          <div className="text-white">Loading ContentScale...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Landing page - first thing users see */}
      <Route path="/" component={Landing} />
      
      {/* Dashboard - redirect directly to main dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={isAuthenticated ? Admin : Landing} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
