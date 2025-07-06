import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SimpleDashboard from "@/pages/simple-dashboard";
import Landing from "@/pages/landing";
import LandingTest from "@/pages/landing-test";
import Admin from "@/pages/admin";
import UserChatPopup from "@/components/UserChatPopup";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Landing page - everything happens here now */}
      <Route path="/" component={Landing} />
      
      {/* Admin panel - only for authenticated admins */}
      <Route path="/admin" component={isAuthenticated ? Admin : Landing} />
      
      {/* Redirect dashboard to landing page */}
      <Route path="/dashboard">
        {() => {
          window.location.href = "/";
          return <Landing />;
        }}
      </Route>
      
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
        <UserChatPopup />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
