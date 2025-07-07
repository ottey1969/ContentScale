import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
  type?: 'message' | 'system' | 'payment';
}

interface ChatWidgetProps {
  userEmail?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface UserCredits {
  credits: number;
  lastUpdated: Date;
}

const EnhancedChatWidget: React.FC<ChatWidgetProps> = ({ 
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
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userEmail) {
      setUserEmailInput(userEmail);
      loadChatHistory();
      loadUserCredits();
    }
  }, [userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (onToggle) {
      onToggle();
    }
  }, [isWidgetOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserCredits = async () => {
    if (!userEmailInput) return;
    
    try {
      const response = await fetch(`/api/user/credits/${userEmailInput}`);
      if (response.ok) {
        const data = await response.json();
        setUserCredits({
          credits: data.credits,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to load user credits:', error);
    }
  };

  const loadChatHistory = async () => {
    if (!userEmailInput) return;
    
    try {
      const response = await fetch(`/api/chat/history/${userEmailInput}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const connectToChat = async () => {
    if (!userEmailInput.trim()) {
      alert('Please enter your email address to connect.');
      return;
    }

    setIsLoading(true);
    try {
      await loadChatHistory();
      await loadUserCredits();
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Welcome to ContentScale support! Your current credit balance: ${userCredits?.credits || 0} credits. How can I help you today?`,
        timestamp: new Date(),
        isFromUser: false,
        type: 'system'
      };
      
      setMessages(prev => [...prev, welcomeMessage]);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      alert('Failed to connect to chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      isFromUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmailInput,
          message: newMessage,
          type: 'support'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'Thank you for your message. Our support team will get back to you soon.',
          timestamp: new Date(),
          isFromUser: false
        };

        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error sending your message. Please try again.',
        timestamp: new Date(),
        isFromUser: false,
        type: 'system'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentRequest = () => {
    setShowPaymentOptions(true);
    
    const paymentMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '💳 Payment Options:\n\n• $2.00 = 10 Credits\n• Instant credit delivery\n• Secure PayPal processing\n\nClick "Buy Credits" to proceed with payment.',
      timestamp: new Date(),
      isFromUser: false,
      type: 'payment'
    };
    
    setMessages(prev => [...prev, paymentMessage]);
  };

  const handleBuyCredits = () => {
    if (!userEmailInput) {
      alert('Please enter your email address first.');
      return;
    }

    // Redirect to payment page
    const paymentUrl = `/payment.html?amount=2.00&credits=10&userEmail=${encodeURIComponent(userEmailInput)}`;
    window.open(paymentUrl, '_blank');
  };

  const reportPayPalIssue = () => {
    const issueMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '🛠️ PayPal Issue Report:\n\nPlease describe your payment issue and include:\n• Order ID (if available)\n• Transaction ID (if available)\n• Amount charged\n• Description of the problem\n\nOur support team will investigate and resolve your issue within 24 hours.',
      timestamp: new Date(),
      isFromUser: false,
      type: 'system'
    };
    
    setMessages(prev => [...prev, issueMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        sendMessage();
      } else {
        connectToChat();
      }
    }
  };

  const toggleWidget = () => {
    setIsWidgetOpen(!isWidgetOpen);
  };

  return (
    <>
      {/* Chat Widget Button */}
      <div 
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isWidgetOpen ? 'translate-y-0' : 'translate-y-0'
        }`}
      >
        {!isWidgetOpen && (
          <button
            onClick={toggleWidget}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>

      {/* Chat Widget Panel */}
      {isWidgetOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">ContentScale Support</h3>
              <p className="text-sm opacity-90">
                {isConnected ? `Credits: ${userCredits?.credits || 0}` : 'Not connected'}
              </p>
            </div>
            <button
              onClick={toggleWidget}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Connection Form */}
          {!isConnected && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmailInput}
                    onChange={(e) => setUserEmailInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={connectToChat}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Connect to Support'}
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isFromUser
                      ? 'bg-purple-600 text-white'
                      : message.type === 'system'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : message.type === 'payment'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
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

          {/* Action Buttons */}
          {isConnected && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={handlePaymentRequest}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  💳 Buy Credits
                </button>
                <button
                  onClick={reportPayPalIssue}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  🛠️ Report Issue
                </button>
              </div>
              
              {showPaymentOptions && (
                <div className="mb-3">
                  <button
                    onClick={handleBuyCredits}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Buy 10 Credits - $2.00
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          {isConnected && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default EnhancedChatWidget;