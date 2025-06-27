import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface border-r border-surface-light hidden lg:block">
      <div className="p-6 space-y-6">
        
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quick Actions</h3>
          <Button className="w-full bg-primary hover:bg-blue-600 text-white font-medium transition-all duration-200 transform hover:scale-105">
            <i className="fas fa-magic mr-3"></i>
            Generate Content
          </Button>
          <Button className="w-full bg-secondary hover:bg-purple-600 text-white font-medium transition-all duration-200 transform hover:scale-105">
            <i className="fas fa-search mr-3"></i>
            Keyword Research
          </Button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg bg-primary bg-opacity-20 text-primary">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <i className="fas fa-file-alt"></i>
            <span>Content Library</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <i className="fas fa-chart-line"></i>
            <span>Analytics</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <i className="fas fa-users"></i>
            <span>Referrals</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-light text-text-secondary hover:text-text-primary transition-colors">
            <i className="fas fa-cog"></i>
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
