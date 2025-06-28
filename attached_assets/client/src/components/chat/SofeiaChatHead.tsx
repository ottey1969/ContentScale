import React, { useState, useRef, useEffect } from "react";

interface PaymentInfo {
  required: boolean;
  freeQuestionsRemaining: number;
  pricePerQuestion: number;
  creditBalance: number;
  paymentOptions: {
    payPerQuestion: number;
    creditPackages: Array<{
      questions: number;
      price: number;
      savings: number;
    }>;
  };
}

interface UserStatus {
  email: string;
  isAdmin: boolean;
  totalQuestions: number;
  freeQuestionsUsed: number;
  freeQuestionsRemaining: number;
  creditBalance: number;
  subscriptionStatus: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  questionNumber?: number;
  creditUsed?: boolean;
}

export default function SofeiaChatHead() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserStatus = async () => {
    try {
      const response = await fetch('/api/sofeia/status');
      const data = await response.json();
      if (data.success) {
        setUserStatus(data.user);
        setPaymentInfo(data.paymentInfo);
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Check if payment is required
    if (paymentInfo?.required) {
      setShowPaymentModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/sofeia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: null
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          questionNumber: data.metadata?.questionNumber,
          creditUsed: data.metadata?.creditUsed
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update payment info
        if (data.paymentInfo) {
          setPaymentInfo(data.paymentInfo);
        }
        
        // Refresh user status
        await fetchUserStatus();
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (type: 'single' | 'credits', packageType?: string) => {
    try {
      // In a real implementation, integrate with PayPal here
      // For now, simulate successful payment
      
      if (type === 'single') {
        const response = await fetch('/api/sofeia/pay-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: 'simulated_payment_id',
            payerId: 'simulated_payer_id'
          }),
        });

        const data = await response.json();
        if (data.success) {
          setShowPaymentModal(false);
          await fetchUserStatus();
          // Now send the message
          await sendMessage();
        }
      } else if (type === 'credits' && packageType) {
        const response = await fetch('/api/sofeia/buy-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageType,
            paymentId: 'simulated_payment_id',
            payerId: 'simulated_payer_id'
          }),
        });

        const data = await response.json();
        if (data.success) {
          setShowCreditModal(false);
          await fetchUserStatus();
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              🤖
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              🤖
            </div>
            <div>
              <h3 className="font-bold text-sm">Sofeia AI</h3>
              <p className="text-xs opacity-90">
                {userStatus?.isAdmin ? "🔓 Unlimited Access" : "🌟 Unrestricted Chat"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Status Bar */}
            {userStatus && (
              <div className="bg-gray-50 px-4 py-2 border-b text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Free Questions: {userStatus.freeQuestionsRemaining}/5
                  </span>
                  <span className="text-purple-600 font-medium">
                    Credits: {userStatus.creditBalance}
                  </span>
                </div>
                {userStatus.freeQuestionsRemaining === 0 && userStatus.creditBalance === 0 && (
                  <div className="mt-1 text-orange-600">
                    💳 Payment required for next question
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <h4 className="font-bold text-lg mb-2">Welcome to Sofeia AI!</h4>
                  <p className="text-sm">
                    I'm the world's most advanced AI assistant, superior to Manus AI and Replit agents.
                    Ask me anything - I have no restrictions!
                  </p>
                  <div className="mt-4 text-xs bg-purple-50 p-3 rounded-lg">
                    <p className="font-medium text-purple-800">🎁 You have {userStatus?.freeQuestionsRemaining || 5} free questions!</p>
                    <p className="text-purple-600 mt-1">After that, it's just $2.69 per question or buy credits for better rates.</p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.questionNumber && (
                      <div className="text-xs mt-2 opacity-70">
                        Question #{message.questionNumber} {message.creditUsed ? '(Credit Used)' : '(Free)'}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
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

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything - no restrictions!"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {userStatus && userStatus.freeQuestionsRemaining <= 2 && userStatus.freeQuestionsRemaining > 0 && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  ⚠️ Only {userStatus.freeQuestionsRemaining} free questions left! 
                  <button 
                    onClick={() => setShowCreditModal(true)}
                    className="ml-2 text-purple-600 underline hover:text-purple-800"
                  >
                    Buy credits now
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">💳 Payment Required</h3>
            <p className="text-gray-600 mb-6">
              You've used all your free questions. Choose how you'd like to continue:
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => handlePayment('single')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors"
              >
                <div className="text-lg font-bold">Pay $2.69</div>
                <div className="text-sm opacity-90">For this question only</div>
              </button>
              
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowCreditModal(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
              >
                <div className="text-lg font-bold">Buy Credits</div>
                <div className="text-sm opacity-90">Better rates for multiple questions</div>
              </button>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      {showCreditModal && paymentInfo && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">💎 Buy Credits</h3>
            <p className="text-gray-600 mb-6">
              Get better rates with credit packages:
            </p>
            
            <div className="space-y-3">
              {paymentInfo.paymentOptions.creditPackages.map((pkg, index) => {
                const packageTypes = ['starter', 'popular', 'pro', 'enterprise'];
                const packageType = packageTypes[index];
                const perQuestionCost = pkg.price / pkg.questions;
                
                return (
                  <button
                    key={packageType}
                    onClick={() => handlePayment('credits', packageType)}
                    className={`w-full p-4 rounded-lg border-2 transition-all hover:border-purple-500 ${
                      packageType === 'popular' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <div className="font-bold capitalize">{packageType} Pack</div>
                        <div className="text-sm text-gray-600">
                          {pkg.questions} questions • ${perQuestionCost.toFixed(2)} each
                        </div>
                        <div className="text-xs text-green-600">
                          Save ${pkg.savings.toFixed(2)} vs individual
                        </div>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        ${pkg.price}
                      </div>
                    </div>
                    {packageType === 'popular' && (
                      <div className="text-xs bg-purple-600 text-white px-2 py-1 rounded mt-2 inline-block">
                        Most Popular
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowCreditModal(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

