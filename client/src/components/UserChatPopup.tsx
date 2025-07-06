import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { X, MessageCircle, Send, Minimize2, Maximize2 } from "lucide-react";

export default function UserChatPopup() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for message notifications
  useEffect(() => {
    // Create a subtle notification sound using Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };

    audioRef.current = { play: createNotificationSound } as any;
  }, []);

  // Play sound when new messages arrive
  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  // Fetch messages for the current user
  const { data: messageData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/messages', user?.id],
    enabled: !!user?.id && isOpen,
    refetchInterval: 3000, // Refresh every 3 seconds when chat is open
  });

  // Check for unread messages
  const { data: unreadData } = useQuery({
    queryKey: ['/api/admin/messages', user?.id, 'unread'],
    enabled: !!user?.id,
    refetchInterval: 5000, // Check for unread messages every 5 seconds
  });

  // Update unread indicator and play sound for new messages
  useEffect(() => {
    if (unreadData?.unreadCount > 0) {
      setHasUnreadMessages(true);
    } else {
      setHasUnreadMessages(false);
    }
  }, [unreadData]);

  // Detect new messages and play sound
  useEffect(() => {
    const messages = messageData?.messages || [];
    if (messages.length > lastMessageCount && lastMessageCount > 0) {
      // Check if the new message is from admin
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.isFromAdmin) {
        playNotificationSound();
        
        // Show toast notification if chat is closed
        if (!isOpen) {
          toast({
            title: "New message from admin",
            description: latestMessage.message.substring(0, 50) + (latestMessage.message.length > 50 ? '...' : ''),
          });
        }
      }
    }
    setLastMessageCount(messages.length);
  }, [messageData, lastMessageCount, isOpen, toast]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await apiRequest('POST', '/api/admin/messages', {
        userId: user?.id,
        message,
        isFromAdmin: false
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages', user?.id] });
      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin team.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mark messages as read when user opens chat
  const markAsRead = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/admin/messages/${user?.id}/read`, {
        isFromAdmin: true
      });
      return response.json();
    },
    onSuccess: () => {
      setHasUnreadMessages(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages', user?.id, 'unread'] });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessage.mutate({
      message: newMessage.trim()
    });
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (hasUnreadMessages) {
      markAsRead.mutate();
    }
  };

  const messages = messageData?.messages || [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleOpenChat}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg relative"
          >
            <MessageCircle className="w-6 h-6" />
            {hasUnreadMessages && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                !
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Chat Popup Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}>
          <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 bg-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                💬 Chat with Admin
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-purple-700 p-1"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-purple-700 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 bg-slate-700 p-4 overflow-y-auto max-h-[320px]">
                  {messagesLoading ? (
                    <div className="text-gray-400 text-center">Loading messages...</div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-lg ${
                              message.isFromAdmin
                                ? 'bg-slate-600 text-gray-200'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            <div className="text-sm">{message.message}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(message.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">
                      <div className="text-4xl mb-4">👋</div>
                      <div>Start a conversation with our admin team!</div>
                      <div className="text-sm mt-2">We're here to help with any questions or issues.</div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-600">
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-600 border-slate-500 text-white resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white self-end"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-400">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={playNotificationSound}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      🔊 Test Sound
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}