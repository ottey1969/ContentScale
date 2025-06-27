import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-dark text-text-primary">
      {/* Navigation */}
      <nav className="bg-surface border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-brain text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold">ContentScale Agent</h1>
            </div>
            <Button onClick={handleLogin} className="btn-primary">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-neural-gradient py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <g className="animate-neural-pulse">
              <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.6"/>
              <circle cx="150" cy="30" r="2" fill="currentColor" opacity="0.4"/>
              <circle cx="250" cy="70" r="4" fill="currentColor" opacity="0.8"/>
              <circle cx="350" cy="40" r="2" fill="currentColor" opacity="0.5"/>
              <line x1="50" y1="50" x2="150" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
              <line x1="150" y1="30" x2="250" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            </g>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white bg-opacity-20 text-white border-white border-opacity-30">
            <i className="fas fa-robot mr-2"></i>
            Powered by Sofeia Agent
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Powered Content &<br />SEO Optimization
          </h1>
          <p className="text-xl text-white text-opacity-90 mb-8 max-w-3xl mx-auto">
            Transform your content strategy with autonomous AI agents that research, write, and optimize for Google's AI Overview and search rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="bg-white text-dark hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
            >
              Start Creating Content
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-dark font-semibold px-8 py-4 text-lg"
            >
              Watch Demo
              <i className="fas fa-play ml-2"></i>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Manus AI Clone with Full Capabilities</h2>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto">
              Complete autonomous AI agent for cybersecurity consultancy, SEO optimization, and viral content marketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sofeia Agent Brain */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-brain text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Sofeia Agent Brain</h3>
                <p className="text-text-secondary mb-4">
                  Real-time neural network visualization showing AI thinking process and autonomous task execution.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Live content generation</li>
                  <li>• Autonomous research & analysis</li>
                  <li>• Multi-modal processing</li>
                </ul>
              </CardContent>
            </Card>

            {/* Keyword Research */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-search text-secondary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Answer Socrates Integration</h3>
                <p className="text-text-secondary mb-4">
                  Real-time keyword research with automated clustering and AI Overview optimization.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Question-based keyword discovery</li>
                  <li>• AI clustering in seconds</li>
                  <li>• CSV bulk processing</li>
                </ul>
              </CardContent>
            </Card>

            {/* Viral Referrals */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-rocket text-accent text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Viral Referral System</h3>
                <p className="text-text-secondary mb-4">
                  Simple reward structure focused on actual user conversions and content creation.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• 1 conversion = 5 free blogs</li>
                  <li>• 3 conversions = 20 free blogs</li>
                  <li>• 10 conversions = 100 free blogs</li>
                </ul>
              </CardContent>
            </Card>

            {/* SEO Optimization */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-neural bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-chart-line text-neural text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Overview Optimization</h3>
                <p className="text-text-secondary mb-4">
                  RankMath integration with CRAFT framework for Google AI Mode compatibility.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Google AI Overview targeting</li>
                  <li>• Featured snippet optimization</li>
                  <li>• Voice search compatibility</li>
                </ul>
              </CardContent>
            </Card>

            {/* Cybersecurity Focus */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-red-500 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Cybersecurity Expertise</h3>
                <p className="text-text-secondary mb-4">
                  Specialized training for cybersecurity consultancy and threat analysis content.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Threat assessment content</li>
                  <li>• Security audit templates</li>
                  <li>• Compliance documentation</li>
                </ul>
              </CardContent>
            </Card>

            {/* Gamification */}
            <Card className="bg-surface border-surface-light card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-trophy text-purple-500 text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Gamified Experience</h3>
                <p className="text-text-secondary mb-4">
                  Achievement system with progress tracking and milestone celebrations.
                </p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Progress bars & badges</li>
                  <li>• Streak counters</li>
                  <li>• Milestone rewards</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Scale Your Content?</h2>
          <p className="text-text-secondary text-lg mb-8">
            Join thousands of content creators using AI-powered automation to dominate search rankings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="btn-primary px-8 py-4 text-lg"
            >
              Start Free Trial
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
            <div className="flex items-center justify-center space-x-4 text-text-secondary">
              <div className="flex items-center space-x-1">
                <i className="fas fa-check text-accent"></i>
                <span>First blog free</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-check text-accent"></i>
                <span>No setup required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark border-t border-surface-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <i className="fas fa-brain text-white text-sm"></i>
              </div>
              <span className="font-semibold">ContentScale Agent</span>
            </div>
            <div className="flex items-center space-x-6 text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">
                <i className="fab fa-whatsapp text-xl"></i>
              </a>
              <span className="text-sm">Support: +31 628073996</span>
              <span className="text-sm">contentscale.site</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
