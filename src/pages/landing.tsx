import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket, Brain, Search, Users, TrendingUp, Shield, Trophy, CheckCircle, Play, ArrowRight, Cookie, FileText, Shield as ShieldIcon } from "lucide-react";
import { SEOHead, SEOConfigs } from "@/components/seo/SEOHead";

export default function Landing() {
  const [showCookieConsent, setShowCookieConsent] = useState(
    typeof window !== 'undefined' ? !localStorage.getItem('cookieConsent') : true
  );
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Fetch video settings from admin panel
  const { data: videoSettings } = useQuery({
    queryKey: ["/api/public/video-settings"],
    retry: false,
  });

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const acceptCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookieConsent', 'accepted');
  };

  const demoVideoId = videoSettings?.demoVideoId || "YOUR_VIDEO_ID_HERE";
  const demoVideoTitle = videoSettings?.demoVideoTitle || "ContentScale Demo";

  return (
    <div className="min-h-screen bg-dark text-text-primary">
      {/* SEO Optimization */}
      <SEOHead {...SEOConfigs.landing} />
      
      {/* Navigation */}
      <nav className="bg-surface border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {/* ContentScale Rocket Logo */}
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ContentScale
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowPrivacyModal(true)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Privacy
              </Button>
              <Button onClick={handleLogin} className="btn-primary">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Interactive Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-60 right-1/3 w-4 h-4 bg-indigo-400 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-20 right-10 w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Interactive Badge */}
          <Badge className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-blue-500/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-105">
            <Brain className="w-4 h-4 mr-2 animate-pulse" />
            Powered by Sofeia AI
          </Badge>
          
          {/* Animated Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            AI-Powered Content &<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              SEO Rocket
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your content strategy with autonomous AI that researches, writes, and optimizes for 
            <span className="text-blue-400 font-semibold"> Google's AI Overview</span> and search rankings.
          </p>
          
          {/* Interactive Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={handleLogin}
              size="lg" 
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Launch Content Creation
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {/* Demo Video Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  size="lg"
                  className="group border-2 border-purple-500/50 text-white hover:bg-purple-500/20 hover:border-purple-400 font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Watch Demo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-slate-900 border-purple-500/50">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${demoVideoId}`}
                    title={demoVideoTitle}
                    className="rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Interactive Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2 hover:text-blue-400 transition-colors cursor-pointer">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>First blog free</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-pointer">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-cyan-400 transition-colors cursor-pointer">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant AI optimization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sofeia AI Standalone Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-lg animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-cyan-500/20 rounded-full blur-lg animate-bounce delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border-purple-400/50 hover:border-pink-400/70 transition-all duration-300 cursor-pointer transform hover:scale-110">
              <Brain className="w-5 h-5 mr-2 animate-pulse" />
              World's Most Advanced AI Assistant
            </Badge>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Meet Sofeia AI
            </h2>
            
            <p className="text-xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed">
              The world's most advanced autonomous AI assistant. Superior to Manus AI and Replit agents. 
              <span className="text-purple-300 font-semibold"> Chat about anything</span> - from complex problem-solving to creative brainstorming.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Features */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      Unrestricted Intelligence
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                      Ask about anything - technology, business, science, creativity, philosophy. No topic limitations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      Superior Performance
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                      Outperforms Manus AI and Replit agents with advanced reasoning, creativity, and problem-solving capabilities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-300 transition-colors">
                      Autonomous Decision Making
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                      Independent analysis and strategic thinking. Provides actionable insights and practical solutions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-6 border border-purple-500/30">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                  Simple Pricing
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">First 5 questions</span>
                    <span className="text-green-400 font-semibold">FREE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Additional questions</span>
                    <span className="text-white font-semibold">$2.69 each</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Credit packages</span>
                    <span className="text-purple-400 font-semibold">Save up to 25%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Chat Interface Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-purple-500/30 shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Sofeia AI</h3>
                      <p className="text-green-400 text-sm flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                        Online & Ready
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                    5 Free Questions
                  </Badge>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-slate-700/50 rounded-2xl p-4">
                    <p className="text-gray-300 text-sm">
                      "How can I optimize my business strategy for 2025?"
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
                    <p className="text-white text-sm">
                      I'll analyze current market trends and provide a comprehensive strategy framework. Let me break this down into key areas: digital transformation, customer experience optimization, and emerging technology adoption...
                    </p>
                    <div className="flex items-center mt-3 text-xs text-purple-300">
                      <div className="w-1 h-1 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                      Analyzing market data and trends...
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Start Chatting with Sofeia AI
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500/30 rounded-full animate-bounce delay-500"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-500/30 rounded-full animate-pulse delay-700"></div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Whether you need content creation, business strategy, technical solutions, or creative brainstorming - 
              <span className="text-purple-300 font-semibold"> Sofeia AI delivers superior results</span> compared to any other AI assistant.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No content restrictions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Advanced reasoning</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Real-time responses</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Superior to competitors</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI-Powered Content Engine
            </h2>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Complete autonomous AI system for content creation, SEO optimization, and viral marketing campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sofeia AI Brain */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                  Sofeia AI Brain
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  Real-time neural network visualization showing AI thinking process and autonomous task execution.
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    <span>Live content generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
                    <span>Autonomous research & analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                    <span>Multi-modal processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Keyword Research */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-green-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-green-400 transition-colors">
                  SEO Insight Engine
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  Advanced AI-powered keyword research with automated clustering and AI Overview optimization.
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Question-based keyword discovery</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-200"></div>
                    <span>AI clustering in seconds</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse delay-400"></div>
                    <span>CSV bulk processing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Viral Referrals */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-bounce">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">
                  Viral Referral System
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  Earn rewards when referred users become bulk content creators (5+ generations).
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>1 bulk user (5+ blogs) = 5 free blogs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-200"></div>
                    <span>3 bulk users = 20 free blogs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse delay-400"></div>
                    <span>10 bulk users = 100 free blogs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* SEO Optimization */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-orange-400 transition-colors">
                  AI Overview Optimization
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  CRAFT framework integration for Google AI Mode compatibility and rapid ranking.
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                    <span>Google AI Overview targeting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse delay-200"></div>
                    <span>Featured snippet optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse delay-400"></div>
                    <span>Voice search compatibility</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Cybersecurity Focus */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-red-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-red-400 transition-colors">
                  Cybersecurity Expertise
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  Advanced security monitoring with fingerprint tracking and IP analysis for threat prevention.
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                    <span>Fingerprint tracking & device analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse delay-200"></div>
                    <span>Real-time IP monitoring & blocking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-400"></div>
                    <span>Behavioral threat assessment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Gamification */}
            <Card className="group bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-yellow-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:animate-bounce">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-yellow-400 transition-colors">
                  Gamified Experience
                </h3>
                <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                  Achievement system with progress tracking and milestone celebrations.
                </p>
                <ul className="text-sm text-gray-400 space-y-2 group-hover:text-gray-300 transition-colors">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Progress bars & badges</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse delay-200"></div>
                    <span>Streak counters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse delay-400"></div>
                    <span>Milestone rewards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Ready to Launch Your Content Rocket?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join the world's first autonomous AI content writing system trusted by content creators worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-2 hover:text-green-400 transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-green-400 animate-pulse" />
                  <span>First blog free</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-blue-400 transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-blue-400 animate-pulse delay-200" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center space-x-2 hover:text-purple-400 transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-purple-400 animate-pulse delay-400" />
                  <span>Instant results</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="text-center text-gray-400 text-sm">
            <p className="mb-2">Trusted by content creators worldwide</p>
            <div className="flex justify-center items-center space-x-2">
              <div className="flex space-x-1">
                {[1,2,3,4,5].map((star) => (
                  <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: `${star * 100}ms`}}></div>
                ))}
              </div>
              <span className="text-yellow-400 font-semibold">4.9/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                What Our Users Say
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The world's first autonomous AI content writing system - trusted by businesses and content creators globally
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "ContentScale revolutionized our content strategy. We went from hiring 5 writers to having one editor oversee the entire operation. The autonomous AI creates content that's indistinguishable from human writing."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SM</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">Sarah Mitchell</p>
                  <p className="text-gray-400 text-sm">Marketing Director, TechFlow</p>
                </div>
              </div>
            </div>

            {/* Review 2 - Ottmar F. (Founder) */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "As the founder, I'm proud to say we've created something truly groundbreaking. This isn't just another AI tool - it's a complete autonomous content ecosystem that understands context, tone, and brand voice perfectly."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OF</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">Ottmar Francisca</p>
                  <p className="text-gray-400 text-sm">Founder, ContentScale</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "Incredible! Our content output increased 300% while maintaining quality. The AI understands SEO, brand guidelines, and even adapts writing style for different audiences. Best investment we've made."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MR</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">Marcus Rodriguez</p>
                  <p className="text-gray-400 text-sm">CEO, Digital Dynamics</p>
                </div>
              </div>
            </div>

            {/* Review 4 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "This is the future of content creation. The autonomous system learns our brand voice and creates content that sounds exactly like our team wrote it. Our clients can't tell the difference!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LK</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">Lisa Kim</p>
                  <p className="text-gray-400 text-sm">Content Manager, InnovateCorp</p>
                </div>
              </div>
            </div>

            {/* Review 5 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "From a freelance writer to a content agency owner - ContentScale made this possible. Now I manage multiple clients with just one editor, and the quality is consistently excellent."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">JA</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">James Anderson</p>
                  <p className="text-gray-400 text-sm">Freelance Content Strategist</p>
                </div>
              </div>
            </div>

            {/* Review 6 */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 group hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {"★".repeat(5)}
                </div>
                <span className="ml-2 text-yellow-400 font-semibold">4.9/5</span>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">
                "The ROI is phenomenal. We reduced content costs by 80% while tripling our output. The autonomous AI handles everything from blog posts to social media content with perfect consistency."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AW</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-semibold">Amanda White</p>
                  <p className="text-gray-400 text-sm">VP Marketing, ScaleUp Solutions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Rating Summary */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl px-8 py-4">
              <div className="flex text-yellow-400 text-2xl mr-4">
                {"★".repeat(5)}
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-xl">4.9/5 Average Rating</p>
                <p className="text-gray-400">Based on 1,200+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              {/* ContentScale Rocket Logo */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ContentScale
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 text-gray-400">
              {/* Legal Links */}
              <div className="flex items-center space-x-4 text-sm">
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-purple-400 transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
                <a 
                  href="https://wa.me/31628073996" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors flex items-center space-x-1"
                >
                  <span>WhatsApp Support</span>
                </a>
              </div>
              
              <div className="text-sm text-center md:text-right">
                <p className="text-gray-500">© 2025 ContentScale</p>
                <p className="text-gray-500">contentscale.site</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <ShieldIcon className="w-6 h-6 mr-2 text-blue-400" />
              Privacy Policy
            </h2>
            <div className="text-gray-300 space-y-4">
              <p>Last updated: January 2025</p>
              <h3 className="text-lg font-semibold text-white">Data Collection</h3>
              <p>We collect minimal data necessary for service functionality including email, usage analytics, and content generation metrics.</p>
              <h3 className="text-lg font-semibold text-white">GDPR Compliance</h3>
              <p>We are fully GDPR compliant. You have the right to access, modify, or delete your personal data at any time.</p>
              <h3 className="text-lg font-semibold text-white">Data Storage and Security</h3>
              <div className="space-y-3">
                <p><strong>Database Location:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                  <li>All data is stored in a PostgreSQL database provided by Neon (serverless)</li>
                  <li>Database URL is securely stored in environment variables</li>
                  <li>Data is encrypted in transit and at rest</li>
                </ul>
                
                <p><strong>Data Types Stored:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                  <li>User profiles (email, name, profile image)</li>
                  <li>Content generations (blog posts, SEO scores)</li>
                  <li>Keywords research results</li>
                  <li>Referral tracking data</li>
                  <li>Achievement progress</li>
                  <li>Activity logs</li>
                  <li>Session data</li>
                </ul>
                
                <p>We never share personal information with third parties and implement enterprise-grade security measures including fingerprint tracking and IP monitoring for abuse prevention.</p>
              </div>
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <p>For privacy concerns, contact us via WhatsApp: +31 628073996</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-purple-400" />
              Terms of Service
            </h2>
            <div className="text-gray-300 space-y-4">
              <p>Last updated: January 2025</p>
              <h3 className="text-lg font-semibold text-white">Service Usage</h3>
              <p>ContentScale provides AI-powered content generation services. Users must not abuse the system or generate harmful content.</p>
              <h3 className="text-lg font-semibold text-white">Payment Terms</h3>
              <p>Credit-based pricing at $2 per blog post. First blog post is free. Payments processed via PayPal only.</p>
              <h3 className="text-lg font-semibold text-white">Referral Program</h3>
              <p>Earn free blog posts when referred users become bulk creators (5+ content generations): 1 bulk user = 5 posts, 3 bulk users = 20 posts, 10 bulk users = 100 posts.</p>
              <h3 className="text-lg font-semibold text-white">Content Ownership</h3>
              <p>You own all generated content. We retain no rights to your created materials.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 z-50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <Cookie className="w-5 h-5 text-yellow-400" />
              <span>We use essential cookies to provide our AI content generation service and improve your experience.</span>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPrivacyModal(true)}
                className="border-slate-600 text-gray-300 hover:bg-slate-800"
              >
                Learn More
              </Button>
              <Button 
                size="sm"
                onClick={acceptCookies}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
