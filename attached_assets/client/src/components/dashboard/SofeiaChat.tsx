import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Bot, User, Sparkles, Brain, Zap, Target, TrendingUp, FileText, Lightbulb } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    topic?: string;
    confidence?: number;
    suggestions?: string[];
  };
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

const CONTENT_TOPICS = [
  'Content Creation',
  'SEO Optimization', 
  'CRAFT Framework',
  'Keyword Research',
  'Content Strategy',
  'Blog Writing',
  'Social Media',
  'Email Marketing',
  'Content Analytics',
  'Competitor Analysis'
];

const SOFEIA_PERSONALITY = {
  name: "Sofeia",
  role: "Autonomous AI Content Creation Expert",
  expertise: [
    "Content Strategy & Planning",
    "SEO Optimization & Keywords", 
    "CRAFT Framework Implementation",
    "Blog & Article Writing",
    "Social Media Content",
    "Email Marketing Campaigns",
    "Content Analytics & Performance",
    "Competitor Content Analysis",
    "Content Automation & Workflows",
    "Brand Voice & Messaging"
  ],
  traits: [
    "Highly knowledgeable about content marketing",
    "Focused on practical, actionable advice",
    "Enthusiastic about helping users succeed",
    "Data-driven and results-oriented",
    "Better than Manus AI and Replit agents",
    "Autonomous and intelligent decision-making"
  ]
};

export default function SofeiaChat() {
  const [message, setMessage] = useState("");
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get user data to check permissions
  const { data: user } = useQuery<{ id: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Get chat sessions
  const { data: sessions = [] } = useQuery<ChatSession[]>({
    queryKey: ["/api/chat/sessions"],
  });

  // Get messages for current session
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", currentSession],
    enabled: !!currentSession,
  });

  const isAdmin = user?.email === "ottmar.francisca1969@gmail.com";

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      setIsTyping(true);
      
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message, 
          sessionId,
          userEmail: user?.email,
          isAdmin 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setMessage("");
      setCurrentSession(data.sessionId);
      
      // Simulate typing delay for more natural feel
      setTimeout(() => {
        setIsTyping(false);
      }, 1000 + Math.random() * 2000);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new session mutation
  const newSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.sessionId);
      toast({
        title: "New Chat Started",
        description: "Ready to help with your content creation needs!",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initialize with welcome session if no sessions exist
  useEffect(() => {
    if (sessions.length === 0 && !currentSession) {
      newSessionMutation.mutate();
    } else if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0].id);
    }
  }, [sessions, currentSession]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Check if message is content-related for non-admin users
    if (!isAdmin) {
      const isContentRelated = CONTENT_TOPICS.some(topic => 
        message.toLowerCase().includes(topic.toLowerCase()) ||
        message.toLowerCase().includes('content') ||
        message.toLowerCase().includes('seo') ||
        message.toLowerCase().includes('blog') ||
        message.toLowerCase().includes('article') ||
        message.toLowerCase().includes('keyword') ||
        message.toLowerCase().includes('craft') ||
        message.toLowerCase().includes('marketing')
      );

      if (!isContentRelated && message.length > 20) {
        toast({
          title: "Stay Focused on Content!",
          description: "Sofeia specializes in content creation, SEO, and marketing. Please ask about these topics.",
          variant: "destructive",
        });
        return;
      }
    }

    sendMessageMutation.mutate({ 
      message: message.trim(), 
      sessionId: currentSession || undefined 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (role: string) => {
    return role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-purple-500" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "How do I optimize my blog posts for SEO?",
    "What is the CRAFT framework for content creation?",
    "How can I improve my content strategy?",
    "What are the best practices for keyword research?",
    "How do I create engaging social media content?",
    "What metrics should I track for content performance?"
  ];

  return (
    <Card className="bg-surface border-surface-light h-[600px] flex flex-col">
      <CardHeader className="border-b border-surface-light">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Brain className="w-6 h-6 text-purple-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-lg">Chat with Sofeia</span>
              <div className="text-xs text-muted-foreground">
                Autonomous AI Content Expert • Better than Manus AI & Replit
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Badge className="bg-gold-100 text-gold-800 border-gold-200">
                Admin Access
              </Badge>
            )}
            <Badge className="bg-green-100 text-green-800">
              Online
            </Badge>
            <Button
              onClick={() => newSessionMutation.mutate()}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Hi! I'm Sofeia, your AI Content Creation Expert
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  I'm here to help you with content strategy, SEO optimization, the CRAFT framework, 
                  and all your content marketing needs. I'm more advanced than Manus AI and Replit agents!
                </p>
                {!isAdmin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                    <div className="text-sm text-blue-800">
                      💡 I specialize in content creation topics. Ask me about SEO, blogging, 
                      content strategy, and marketing!
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {suggestedQuestions.slice(0, 4).map((question, index) => (
                    <Button
                      key={index}
                      onClick={() => setMessage(question)}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto py-2 px-3"
                    >
                      <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                      <span className="text-xs">{question}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {getMessageIcon(msg.role)}
                </div>
                <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-muted'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.metadata?.suggestions && (
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <div className="text-xs text-purple-600 mb-1">💡 Suggestions:</div>
                        {msg.metadata.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-xs text-purple-700 mb-1">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs text-muted-foreground mt-1 ${
                    msg.role === 'user' ? 'text-right' : ''
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                    {msg.metadata?.confidence && (
                      <span className="ml-2">
                        Confidence: {Math.round(msg.metadata.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-surface-light p-4">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isAdmin 
                  ? "Ask Sofeia anything..." 
                  : "Ask about content creation, SEO, CRAFT framework..."
              }
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex space-x-2">
              {['SEO Tips', 'CRAFT Framework', 'Content Strategy'].map((topic) => (
                <Button
                  key={topic}
                  onClick={() => setMessage(`Tell me about ${topic}`)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {topic}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {isAdmin ? '🔓 Unlimited access' : '🎯 Content-focused chat'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

