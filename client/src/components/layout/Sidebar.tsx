import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Search, 
  Gauge, 
  FileText, 
  BarChart3, 
  Users, 
  Settings,
  Shield,
  Zap
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface border-r border-surface-light hidden lg:block h-screen flex flex-col">
      <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6B7280 #374151' }}>
        
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quick Actions</h3>
          <Button className="w-full bg-primary hover:bg-blue-600 text-white font-medium transition-all duration-200 transform hover:scale-105">
            <Sparkles className="w-4 h-4 mr-3" />
            Generate Content
          </Button>
          <Button className="w-full bg-secondary hover:bg-purple-600 text-white font-medium transition-all duration-200 transform hover:scale-105">
            <Search className="w-4 h-4 mr-3" />
            Keyword Research
          </Button>
          <Button className="w-full bg-accent hover:bg-green-600 text-white font-medium transition-all duration-200 transform hover:scale-105">
            <FileText className="w-4 h-4 mr-3" />
            CSV Upload
          </Button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg bg-primary bg-opacity-20 text-primary">
            <Gauge className="w-4 h-4" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <FileText className="w-4 h-4" />
            <span>Content Library</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <Users className="w-4 h-4" />
            <span>Referrals</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </a>
        </nav>
        
        {/* AI Training Status */}
        <div className="bg-surface-light p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">AI Training Status</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Cybersecurity</span>
                <span className="text-accent">95%</span>
              </div>
              <Progress value={95} className="h-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>SEO & AI Overview</span>
                <span className="text-neural">87%</span>
              </div>
              <Progress value={87} className="h-1" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>CRAFT Framework</span>
                <span className="text-secondary">92%</span>
              </div>
              <Progress value={92} className="h-1" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
