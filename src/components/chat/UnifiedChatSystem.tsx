import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Bell, 
  BellOff, 
  Minimize2, 
  Maximize2, 
  X,
  Volume2,
  VolumeX,
  UserCheck,
  Crown
} from "lucide-react";

interface ChatMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
  isRead: boolean;
}

interface ChatUser {
  id: string;
  email: string;
  name: string;
  isOnline: boolean;
  isAdmin: boolean;
  unreadCount: number;
}

interface UnifiedChatSystemProps {
  isAdmin?: boolean;
}

export default function UnifiedChatSystem({ isAdmin = false }: UnifiedChatSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Check if current user is admin
  const userIsAdmin = user && ((user as any)?.email === 'ottmar.francisca1969@gmail.com' || (user as any)?.id === 'admin');
  
  // Fetch chat messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/messages', selectedUser],
    queryFn: async () => {
      if (userIsAdmin && selectedUser) {
        return await apiRequest(`/api/chat/messages/${selectedUser}`, 'GET');
      } else if (!userIsAdmin) {
        return await apiRequest('/api/chat/messages', 'GET');
      }
      return [];
    },
    enabled: isOpen && (!!selectedUser || !userIsAdmin),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
  
  // Fetch online users (admin only)
  const { data: onlineUsers = [] } = useQuery({
    queryKey: ['/api/chat/users'],
    queryFn: async () => await apiRequest('/api/chat/users', 'GET'),
    enabled: isOpen && userIsAdmin,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, targetUserId }: { message: string, targetUserId?: string }) => {
      const endpoint = userIsAdmin && targetUserId 
        ? '/api/chat/send-admin' 
        : '/api/chat/send';
      
      return await apiRequest(endpoint, 'POST', { 
        message, 
        targetUserId: userIsAdmin ? targetUserId : undefined 
      });
    },
    onSuccess: () => {
      setCurrentMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/users'] });
      
      // Play send sound
      if (soundEnabled) {
        playNotificationSound('send');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.error('Send message error:', error);
    },
  });
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Chat WebSocket connected');
        // Send authentication
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          userId: (user as any)?.id,
          email: (user as any)?.email,
          isAdmin: userIsAdmin
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              // Play notification sound for incoming messages
              if (soundEnabled && data.senderId !== (user as any)?.id) {
                playNotificationSound('receive');
              }
              
              // Show browser notification
              if (notificationsEnabled && data.senderId !== (user as any)?.id) {
                showBrowserNotification(data);
              }
              
              // Refresh messages
              queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
              break;
              
            case 'user_online':
            case 'user_offline':
              // Refresh online users
              queryClient.invalidateQueries({ queryKey: ['/api/chat/users'] });
              break;
              
            case 'typing':
              // Handle typing indicators
              console.log(`${data.userEmail} is typing...`);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Chat WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to chat WebSocket:', error);
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, user, userIsAdmin, soundEnabled, notificationsEnabled, queryClient]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const playNotificationSound = (type: 'send' | 'receive') => {
    if (!soundEnabled) return;
    
    try {
      // Create audio context for notification sounds
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for send/receive
      oscillator.frequency.setValueAtTime(type === 'send' ? 800 : 600, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  const showBrowserNotification = (messageData: any) => {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    
    const notification = new Notification(`New message from ${messageData.senderName}`, {
      body: messageData.message.substring(0, 100) + (messageData.message.length > 100 ? '...' : ''),
      icon: '/favicon.ico',
      tag: 'contentscale-chat'
    });
    
    notification.onclick = () => {
      window.focus();
      setIsOpen(true);
      setIsMinimized(false);
      notification.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  };
  
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    const targetUserId = userIsAdmin ? selectedUser : undefined;
    sendMessageMutation.mutate({ 
      message: currentMessage.trim(), 
      targetUserId 
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-4 shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {onlineUsers.some((u: ChatUser) => u.unreadCount > 0) && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {onlineUsers.reduce((sum: number, u: ChatUser) => sum + u.unreadCount, 0)}
          </div>
        )}
      </Button>
    );
  }
  
  return (
    <Card className={`fixed bottom-6 right-6 w-96 bg-slate-800 border-slate-700 shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[600px]'
    }`}>
      {/* Header */}
      <CardHeader className="pb-2 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-white">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <span>{userIsAdmin ? 'Admin Chat' : 'Support Chat'}</span>
            {userIsAdmin && (
              <Crown className="w-4 h-4 text-yellow-400" />
            )}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400 hover:text-white p-1"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="text-gray-400 hover:text-white p-1"
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white p-1"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(600px-80px)]">
          <div className="flex flex-1 overflow-hidden">
            {/* User List (Admin Only) */}
            {userIsAdmin && (
              <div className="w-32 bg-slate-900 border-r border-slate-700 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2">Online Users</div>
                  <div className="space-y-1">
                    {onlineUsers.map((chatUser: ChatUser) => (
                      <button
                        key={chatUser.id}
                        onClick={() => setSelectedUser(chatUser.id)}
                        className={`w-full text-left p-2 rounded text-xs transition-colors ${
                          selectedUser === chatUser.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            chatUser.isOnline ? 'bg-green-400' : 'bg-gray-500'
                          }`} />
                          {chatUser.isAdmin && <Crown className="w-3 h-3 text-yellow-400" />}
                        </div>
                        <div className="truncate">{chatUser.name || chatUser.email}</div>
                        {chatUser.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center mt-1">
                            {chatUser.unreadCount}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message: ChatMessage) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === (user as any)?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.senderId === (user as any)?.id
                            ? 'bg-blue-600 text-white'
                            : message.isAdmin
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName || message.senderEmail}
                          </span>
                          {message.isAdmin && <Crown className="w-3 h-3 text-yellow-400" />}
                          <span className="text-xs opacity-70">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="border-t border-slate-700 p-4">
                {userIsAdmin && !selectedUser ? (
                  <div className="text-center text-gray-400 text-sm">
                    Select a user to start chatting
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder={userIsAdmin ? "Send message to user..." : "Type your message..."}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 resize-none h-10"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !currentMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

