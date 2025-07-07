import React, { useState, useEffect, useRef } from 'react';
import PayPalIssueManager from './PayPalIssueManager';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
}

interface ChatWidgetProps {
  userEmail?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  userEmail = '', 
  isOpen = false, 
  onToggle 
}) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(isOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmailInput, setUserEmailInput] = useState(userEmail);
  const [isConnected, setIsConnected] = useState(false);
  const [showPayPalIssues, setShowPayPalIssues] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userEmail) {
      setUserEmailInput(userEmail);
      loadChatHistory();
    }
  }, [userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onToggle) {
      onToggle();
    }
  }, [isWidgetOpen, onToggle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    if (!userEmailInput) return;

    try {
      const response = await fetch(`/api/chat/history/${encodeURIComponent(userEmailInput)}`);
      if (response.ok) {
        const history = await response.json();
        const formattedMessages: ChatMessage[] = history.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          isFromUser: msg.from === userEmailInput
        }));
        setMessages(formattedMessages);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userEmailInput.trim()) return;

    setIsLoading(true);

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      isFromUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmailInput,
          content: newMessage
        }),
      });

      if (response.ok) {
        setIsConnected(true);
        // Add auto-response
        setTimeout(() => {
          const autoResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: "Thank you for your message! Our admin team will respond shortly. You can continue the conversation here or check back later.",
            timestamp: new Date(),
            isFromUser: false
          };
          setMessages(prev => [...prev, autoResponse]);
        }, 1000);
      } else {
        // Remove the message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      alert('Failed to send message. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToChat = () => {
    if (userEmailInput.trim()) {
      loadChatHistory();
    }
  };

  const toggleWidget = () => {
    setIsWidgetOpen(!isWidgetOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Widget Button */}
      {!isWidgetOpen && (
        <button
          onClick={toggleWidget}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 animate-pulse"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            !
          </span>
        </button>
      )}

      {/* Chat Widget Window */}
      {isWidgetOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">ContentScale Support</h3>
              <p className="text-xs opacity-90">
                {isConnected ? 'Connected' : 'Chat with our team'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPayPalIssues(!showPayPalIssues)}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded"
                title="PayPal Issues"
              >
                💳
              </button>
            <button
              onClick={toggleWidget}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Email Input (if not connected) */}
          {!isConnected && (
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-2">
                <input
                  type="email"
                  value={userEmailInput}
                  onChange={(e) => setUserEmailInput(e.target.value)}
                  placeholder="Enter your email to start chatting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={connectToChat}
                  disabled={!userEmailInput.trim()}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md text-sm hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!isConnected && messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <div className="mb-2">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p>Welcome to ContentScale Support!</p>
                <p className="text-xs mt-1">Enter your email above to start chatting with our team.</p>
              </div>
            )}

            {messages.length === 0 && isConnected && (
              <div className="text-center text-gray-500 text-sm">
                <p>Start a conversation with our support team!</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.isFromUser
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isFromUser ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg rounded-bl-none text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* PayPal Issues Section */}
          {showPayPalIssues && isConnected && (
            <div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
              <PayPalIssueManager 
                userEmail={userEmailInput} 
                onIssueSubmitted={() => {
                  const autoMessage = {
                    id: Date.now().toString(),
                    content: "PayPal issue submitted successfully! Our team will investigate and respond soon.",
                    timestamp: new Date(),
                    isFromUser: false
                  };
                  setMessages(prev => [...prev, autoMessage]);
                }}
              />
            </div>
          )}

          {/* Message Input */}
          {isConnected && (
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send • {1000 - newMessage.length} characters remaining
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;