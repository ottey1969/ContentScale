import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function SofeiaAgentBrain() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const messages = [
    "Comprehensive cybersecurity audit reveals critical vulnerabilities in network infrastructure...",
    "AI-powered threat detection identifies 23 potential security risks in real-time monitoring...",
    "SEO optimization complete: 94% score achieved with RankMath integration and CRAFT framework...",
    "Keyword research via Answer Socrates discovered 247 high-value long-tail opportunities..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
        setIsTyping(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="relative bg-neural-gradient p-8 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {/* Neural network background pattern */}
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <g className="animate-neural-pulse">
            <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.6"/>
            <circle cx="150" cy="30" r="2" fill="currentColor" opacity="0.4"/>
            <circle cx="250" cy="70" r="4" fill="currentColor" opacity="0.8"/>
            <circle cx="350" cy="40" r="2" fill="currentColor" opacity="0.5"/>
            <circle cx="100" cy="120" r="3" fill="currentColor" opacity="0.7"/>
            <circle cx="200" cy="140" r="2" fill="currentColor" opacity="0.6"/>
            <circle cx="300" cy="110" r="3" fill="currentColor" opacity="0.5"/>
            <line x1="50" y1="50" x2="150" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            <line x1="150" y1="30" x2="250" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            <line x1="250" y1="70" x2="350" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
            <line x1="100" y1="120" x2="200" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          </g>
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Sofeia Agent Brain</h2>
            <p className="text-white text-opacity-90">AI-powered autonomous content generation and SEO optimization</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-none">
                Active & Learning
              </Badge>
            </div>
            <div className="text-white text-opacity-80 text-sm mt-1">Processing 47 tasks</div>
          </div>
        </div>
        
        {/* Live Typing Simulation */}
        <div className="mt-6 bg-black bg-opacity-30 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-white text-sm">Sofeia is writing...</span>
          </div>
          <div className={`text-white font-mono text-sm ${isTyping ? 'animate-typing' : ''}`}>
            {messages[currentMessage]}
          </div>
        </div>
      </div>
    </div>
  );
}
