import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Paperclip, Image, FileText, FileSpreadsheet, Upload, Sparkles, Mail, Lock, LogIn, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PayPalButton from "./PayPalButton";
import { KeywordResearch } from "./KeywordResearch";
import { EmailMarketing } from "./EmailMarketing";
import { PasswordManager } from "./PasswordManager";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  files?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isTestMode?: boolean;
}

export function ChatPopup({ isOpen, onClose, isTestMode = false }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: isTestMode 
        ? "Hello! I'm Sofeia AI - your advanced content writing assistant. I specialize in creating high-quality, SEO-optimized content that drives results.\n\n✨ Try my capabilities right here!\n\nI can help you create:\n• SEO-optimized blog posts\n• Professional articles & guides\n• Product descriptions\n• Email campaigns & social media posts\n• Technical documentation\n• And much more!\n\nExamples:\n• Single: \"Write me a SEO optimized blogpost about digital marketing. Words: about 1500. Tone: professional. Language: English\"\n• Bulk: \"Write me 25 product descriptions for eco-friendly home products. Words: about 200 each. Tone: persuasive. Language: English\"\n\n🚀 Experience professional content creation - get started today!"
        : "Hello! I'm Sofeia AI - the world's most advanced CONTENT WRITER. I'm superior to Manus AI and Replit Agents. Ask me to write anything:\n\n• Blog posts (SEO optimized)\n• Articles & guides\n• Product descriptions\n• Emails & social media posts\n• And much more!\n\n💰 PRICING: $2 per content piece - FIRST ARTICLE FREE!\n• Single: \"Write me a blog post\" = FREE (first article)\n• Bulk: \"Write me 10 blog posts\" = $18 (first free + 9 × $2)\n• Bulk: \"Write me 100 articles\" = $198 (first free + 99 × $2)\n\nExamples:\n• Single: \"Write me a SEO optimized blogpost. Seed Keyword: .... Words: about 1500. Tone: professional. Language: English\"\n• Bulk: \"Write me 50 SEO optimized blogpost. Seed Keywords ..... Words: about 2200. Tone: professional. Language: Spanish\"",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Authentication and credit system
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState(""); // Remember user's password
  const [userCredits, setUserCredits] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasUsedFreeContent, setHasUsedFreeContent] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("2");
  const [showKeywordResearch, setShowKeywordResearch] = useState(false);
  const [showEmailMarketing, setShowEmailMarketing] = useState(false);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");

  // Generate device fingerprint for security
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = btoa([
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        navigator.hardwareConcurrency,
(navigator as any).deviceMemory || 'unknown'
      ].join('|'));
      
      setDeviceFingerprint(fingerprint);
    };
    
    generateFingerprint();
  }, []);

  // Load stored password on component mount
  useEffect(() => {
    const stored = localStorage.getItem(`userPassword_${userEmail}`);
    if (stored && userEmail) {
      setStoredPassword(stored);
      setUserPassword(stored);
    }
  }, [userEmail]);

  // Custom PayPal Button Component
  const CustomPayPalButton: React.FC<{
    amount: string;
    onSuccess: (data: any) => void;
    onCancel: () => void;
    onError: (error: any) => void;
  }> = ({ amount, onSuccess, onCancel, onError }) => {
    
    const createOrder = async () => {
      const orderPayload = {
        amount: amount,
        currency: "USD",
        intent: "CAPTURE",
      };
      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const output = await response.json();
      return { orderId: output.id };
    };

    const captureOrder = async (orderId: string) => {
      const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    };

    const handleApprove = async (data: any) => {
      try {
        const orderData = await captureOrder(data.orderId);
        onSuccess(orderData);
      } catch (error) {
        onError(error);
      }
    };

    useEffect(() => {
      const loadPayPalSDK = async () => {
        try {
          if (!(window as any).paypal) {
            const script = document.createElement("script");
            script.src = import.meta.env.PROD
              ? "https://www.paypal.com/web-sdk/v6/core"
              : "https://www.sandbox.paypal.com/web-sdk/v6/core";
            script.async = true;
            script.onload = () => initPayPal();
            document.body.appendChild(script);
          } else {
            await initPayPal();
          }
        } catch (e) {
          console.error("Failed to load PayPal SDK", e);
          onError(e);
        }
      };

      const initPayPal = async () => {
        try {
          const clientToken: string = await fetch("/api/paypal/setup")
            .then((res) => res.json())
            .then((data) => data.clientToken);
            
          const sdkInstance = await (window as any).paypal.createInstance({
            clientToken,
            components: ["paypal-payments"],
          });

          const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
            onApprove: handleApprove,
            onCancel,
            onError,
          });

          const onClick = async () => {
            try {
              const checkoutOptionsPromise = createOrder();
              await paypalCheckout.start(
                { paymentFlow: "auto" },
                checkoutOptionsPromise,
              );
            } catch (e) {
              console.error(e);
              onError(e);
            }
          };

          const paypalButton = document.getElementById("custom-paypal-button");
          if (paypalButton) {
            paypalButton.addEventListener("click", onClick);
          }

          return () => {
            if (paypalButton) {
              paypalButton.removeEventListener("click", onClick);
            }
          };
        } catch (e) {
          console.error(e);
          onError(e);
        }
      };

      loadPayPalSDK();
    }, [amount]);

    return (
      <button
        id="custom-paypal-button"
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:scale-105"
      >
        <CreditCard className="w-5 h-5" />
        <span>Pay ${amount} with PayPal</span>
      </button>
    );
  };

  // Handle payment success
  const handlePaymentSuccess = (orderData: any) => {
    console.log("Payment successful:", orderData);
    
    // Calculate credits purchased
    const creditsPurchased = parseInt(paymentAmount) / 2;
    
    // Add credits to user account
    setUserCredits(prev => prev + creditsPurchased);
    
    // Close payment popup
    setShowPaymentPopup(false);
    
    // Show success message
    const successMessage: Message = {
      id: Date.now().toString(),
      text: `Payment successful! ${creditsPurchased} credits have been added to your account. You can now continue with your request.`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMessage]);
  };

  // Handle credit deduction for keyword research
  const handleCreditDeduction = (credits: number) => {
    setUserCredits(prev => prev - credits);
  };

  // Handle payment requirement for keyword research
  const handlePaymentRequired = (amount: string) => {
    setPaymentAmount(amount);
    setShowPaymentPopup(true);
  };

  // Handle login
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
    }
    return null;
  };

  const handleLogin = async () => {
    if (!userEmail.trim() || !userPassword.trim()) {
      setAuthError("Please enter both email and password");
      return;
    }

    // Skip password validation for admin
    if (userEmail.toLowerCase() !== "ottmar.francisca1969@gmail.com") {
      const passwordError = validatePassword(userPassword);
      if (passwordError) {
        setAuthError(passwordError);
        return;
      }
    }

    setIsLoggingIn(true);
    setAuthError("");

    try {
      // Capture email for marketing system
      try {
        await fetch('/api/email-capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail.toLowerCase().trim(),
            source: 'chat_signup',
            subscribedToNewsletter: true,
            subscribedToMarketing: true,
          }),
        });
        console.log(`📧 Email captured for marketing: ${userEmail}`);
      } catch (emailError) {
        console.log('Email capture failed (non-blocking):', emailError);
      }

      // Security check: Verify device and IP for account creation prevention
      try {
        const securityResponse = await fetch('/api/security/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail.toLowerCase().trim(),
            deviceFingerprint: deviceFingerprint,
            action: 'login'
          }),
        });

        if (!securityResponse.ok) {
          const securityError = await securityResponse.json();
          setAuthError(securityError.message || "Security check failed. Contact support.");
          setIsLoggingIn(false);
          return;
        }
      } catch (securityError) {
        console.error('Security check failed:', securityError);
        setAuthError('Security verification failed. Please try again.');
        setIsLoggingIn(false);
        return;
      }

      // Check for stored password - don't allow password changes
      const existingPassword = localStorage.getItem(`userPassword_${userEmail.toLowerCase()}`);
      if (existingPassword && existingPassword !== userPassword) {
        setAuthError("Incorrect password. This account has a different password.");
        setIsLoggingIn(false);
        return;
      }

      // Check admin credentials
      if (userEmail.toLowerCase() === "ottmar.francisca1969@gmail.com" && userPassword === "Utrecht160011.@") {
        // Store admin password
        localStorage.setItem(`userPassword_${userEmail.toLowerCase()}`, userPassword);
        
        setIsAuthenticated(true);
        setIsAdmin(true);
        setUserCredits(999999); // Unlimited for admin
        setStoredPassword(userPassword);
        setUserPassword(""); // Clear password from state for security
        
        // Show welcome message for admin with unlimited credits
        const adminWelcomeMessage: Message = {
          id: Date.now().toString(),
          text: `🚀 Welcome back, Admin! You have UNLIMITED credits.\n\n✨ Sofeia AI is ready for advanced content creation:\n\n• Single: "Write me a SEO optimized blog post about AI trends"\n• Bulk: "Write me 50 product descriptions for tech gadgets"\n• Research: "Do keyword research for digital marketing niche"\n\nAll features unlocked - create as much content as you need!`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([adminWelcomeMessage]);
        return;
      }

      // For regular users, store password and give 1 free credit for testing
      if (!existingPassword) {
        localStorage.setItem(`userPassword_${userEmail.toLowerCase()}`, userPassword);
      }
      
      setIsAuthenticated(true);
      setIsAdmin(false);
      setUserCredits(1);
      setStoredPassword(userPassword);
      setUserPassword(""); // Clear password from state for security
      
      // Show welcome message for new users with free credit
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `🎉 Welcome! You have 1 FREE credit to test our AI content generation.\n\nTry creating content by typing:\n• "Seed Keyword: Digital Marketing"\n• "Write me a blog post about sustainable living"\n\nOr upload files for bulk content creation. After your free article, continue with PayPal for just $2 per article!`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
    } catch (error) {
      setAuthError("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
    setUserPassword("");
    setUserCredits(0);
    setIsAdmin(false);
    setMessages([{
      id: "welcome",
      text: isTestMode 
        ? "Hello! I'm Sofeia AI - your advanced content writing assistant. I specialize in creating high-quality, SEO-optimized content that drives results.\n\n✨ Try my capabilities right here!\n\nI can help you create:\n• SEO-optimized blog posts\n• Professional articles & guides\n• Product descriptions\n• Email campaigns & social media posts\n• Technical documentation\n• And much more!\n\nExamples:\n• Single: \"Write me a SEO optimized blogpost about digital marketing. Words: about 1500. Tone: professional. Language: English\"\n• Bulk: \"Write me 25 product descriptions for eco-friendly home products. Words: about 200 each. Tone: persuasive. Language: English\"\n\n🚀 Experience professional content creation - get started today!"
        : "Hello! I'm Sofeia AI - the world's most advanced CONTENT WRITER. I'm superior to Manus AI and Replit Agents. Ask me to write anything:\n\n• Blog posts (SEO optimized)\n• Articles & guides\n• Product descriptions\n• Emails & social media posts\n• And much more!\n\n💰 PRICING: $2 per content piece - FIRST ARTICLE FREE!\n• Single: \"Write me a blog post\" = FREE (first article)\n• Bulk: \"Write me 10 blog posts\" = $18 (first free + 9 × $2)\n• Bulk: \"Write me 100 articles\" = $198 (first free + 99 × $2)\n\nExamples:\n• Single: \"Write me a SEO optimized blogpost. Seed Keyword: .... Words: about 1500. Tone: professional. Language: English\"\n• Bulk: \"Write me 50 SEO optimized blogpost. Seed Keywords ..... Words: about 2200. Tone: professional. Language: Spanish\"",
      isUser: false,
      timestamp: new Date(),
    }]);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileAttachment[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to detect bulk content requests and keyword research
  const detectBulkRequest = (message: string): number => {
    const text = message.toLowerCase();
    
    // Check for keyword research requests first
    if (text.includes('keyword research') || 
        text.includes('research keyword') ||
        text.includes('seo research') ||
        text.includes('find keywords') ||
        text.includes('keyword analysis')) {
      return 1; // Keyword research costs 1 credit
    }
    
    // Look for numbers in the text that indicate quantity
    const numberMatches = text.match(/\b\d+\b/g);
    if (!numberMatches) return 1;
    
    let maxQuantity = 1;
    
    // Check if numbers are followed by content keywords
    const contentKeywords = ['blog', 'post', 'article', 'email', 'description', 'piece', 'content', 'different'];
    
    for (const numStr of numberMatches) {
      const num = parseInt(numStr);
      if (num > 1 && num <= 1000) { // Reasonable limits
        // Check if this number is near content keywords
        const numIndex = text.indexOf(numStr);
        const surrounding = text.substring(Math.max(0, numIndex - 20), numIndex + 50);
        
        const hasContentKeyword = contentKeywords.some(keyword => 
          surrounding.includes(keyword) || 
          text.includes(`${numStr} ${keyword}`) ||
          text.includes(`write me ${numStr}`) ||
          text.includes(`create ${numStr}`) ||
          text.includes(`generate ${numStr}`)
        );
        
        if (hasContentKeyword && num > maxQuantity) {
          maxQuantity = num;
        }
      }
    }
    
    return maxQuantity;
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const messageText = inputValue.trim() || "Shared files for analysis";
    const requiredCredits = detectBulkRequest(messageText);
    
    // Check if user has enough credits (admin always has unlimited)
    if (!isAdmin && userCredits < requiredCredits) {
      // Show PayPal payment interface
      const totalCost = requiredCredits * 2; // $2 per credit
      setPaymentAmount(totalCost.toString());
      setShowPaymentPopup(true);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `You need ${requiredCredits} credits for this request. Please purchase ${requiredCredits} credits for $${totalCost} to continue.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);
    
    // Check if this is a keyword research request
    const text = messageText.toLowerCase();
    if (text.includes('keyword research') || 
        text.includes('research keyword') ||
        text.includes('seo research') ||
        text.includes('find keywords') ||
        text.includes('keyword analysis')) {
      
      // Deduct credits for keyword research
      if (!isAdmin) {
        setUserCredits(prev => prev - 1);
      }
      
      // Show keyword research interface
      setShowKeywordResearch(true);
      setIsLoading(false);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Opening keyword research tool for you! This will help you find high-performing keywords for your content strategy.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      return;
    }
    
    // Deduct credits for non-admin users
    if (!isAdmin) {
      setUserCredits(prev => prev - requiredCredits);
    }

    try {
      // Send message to backend for AI processing
      const formData = new FormData();
      formData.append('message', userMessage.text);
      
      // Add files to form data
      for (let i = 0; i < attachedFiles.length; i++) {
        const file = attachedFiles[i];
        if (file.url) {
          try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            formData.append(`file_${i}`, blob, file.name);
          } catch (error) {
            console.error('Error processing file:', error);
          }
        }
      }

      const response = await fetch("/api/sofeia/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage.text,
          sessionId: null,
          customInstructions: customInstructions || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Sofeia response:", data);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "I'm analyzing your request and will provide insights based on current market trends and best practices.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Let me try to help you anyway - what specific business challenge are you facing?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-purple-500/30">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-white text-2xl">Access Sofeia AI</CardTitle>
            <p className="text-gray-300">Sign in to start creating content</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400"
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>
            {authError && (
              <div className="text-red-400 text-sm text-center">{authError}</div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center text-xs text-gray-400 space-y-1">
              <p>✓ Use your real email address</p>
              <p>✓ Temporary emails are not accepted</p>
              <p>🎁 New user? Get 1 free article on sign up!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl flex items-center gap-2">
                Sofeia AI
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Online & Ready</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-300">{userEmail}</div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 px-2 py-1 text-xs">
                {isAdmin ? "Unlimited" : `${userCredits} Credits`}
              </Badge>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmailMarketing(true)}
                className="text-purple-200 hover:text-white hover:bg-purple-700/50"
                title="Email Marketing"
              >
                <Mail className="w-5 h-5" />
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordManager(true)}
                className="text-purple-200 hover:text-white hover:bg-purple-700/50"
                title="Password Manager"
              >
                <Lock className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-purple-200 hover:text-white hover:bg-purple-700/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.isUser
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-slate-800/50 text-gray-100 border border-purple-500/20"
                  }`}
                >
                  {message.files && message.files.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {message.files.map((file) => (
                        <div key={file.id} className="flex items-center space-x-2 bg-black/20 rounded-lg p-2">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs opacity-70">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/50 border border-purple-500/20 rounded-2xl p-4 max-w-[80%]">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-gray-300 text-sm">Analyzing market data and trends...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Example Buttons */}
        {messages.length === 1 && (
          <div className="border-t border-purple-500/20 p-4">
            <div className="text-center mb-3">
              <span className="text-sm text-gray-400">Quick Examples - Click to Try:</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setInputValue("Write me a SEO optimized blogpost. Seed Keyword: .... Words: about 1500. Tone: professional. Language: English")}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 text-xs px-3 py-2 rounded-lg transition-all"
              >
                Single Blog Post
              </button>
              <button
                onClick={() => setInputValue("Write me 50 SEO optimized blogpost. Seed Keywords ..... Words: about 2200. Tone: professional. Language: Spanish")}
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 text-xs px-3 py-2 rounded-lg transition-all"
              >
                Bulk 50 Posts (Spanish)
              </button>
              <button
                onClick={() => setInputValue("Write me 10 product descriptions for eco-friendly water bottles. Tone: persuasive. Language: English")}
                className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-400/50 text-green-300 text-xs px-3 py-2 rounded-lg transition-all"
              >
                Product Descriptions
              </button>
              <button
                onClick={() => setInputValue("Write me 5 email marketing campaigns for Black Friday sales. Tone: urgent. Language: English")}
                className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-400/50 text-orange-300 text-xs px-3 py-2 rounded-lg transition-all"
              >
                Email Campaigns
              </button>
              <button
                onClick={() => setInputValue("Do (Top 10 keywords) / (AI Search engine) / (Top 5 Long Tails Keywords) research for (.....) Niche")}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 hover:border-yellow-400/50 text-yellow-300 text-xs px-3 py-2 rounded-lg transition-all"
              >
                Keyword Research
              </button>
              {userEmail === 'ottmar.francisca1969@gmail.com' && (
                <button
                  onClick={() => window.open('/admin#emails', '_blank')}
                  className="bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 hover:border-pink-400/50 text-pink-300 text-xs px-3 py-2 rounded-lg transition-all"
                >
                  Email Marketing
                </button>
              )}
            </div>
          </div>
        )}

        {/* File Upload Area */}
        {attachedFiles.length > 0 && (
          <div className="border-t border-purple-500/20 p-4">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-2 border border-purple-500/20">
                  {getFileIcon(file.type)}
                  <span className="text-sm text-white">{file.name}</span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Instructions Area */}
        {showCustomInstructions && (
          <div className="border-t border-purple-500/20 p-4">
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Add specific instructions for the AI to follow... (e.g., 'Write in a formal tone', 'Include technical details', 'Target beginner audience')"
              className="w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400 rounded-lg p-3 text-sm resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-purple-500/20 pt-4 px-6 pb-6">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="How can I optimize my business strategy for 2025?"
                className="bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400 rounded-xl h-12 text-base"
                disabled={isLoading}
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 h-12 px-4"
              disabled={isLoading}
              title="Upload File"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setShowCustomInstructions(!showCustomInstructions)}
              variant="outline"
              className={`border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 h-12 px-4 ${showCustomInstructions ? 'bg-purple-500/20' : ''}`}
              disabled={isLoading}
              title="Custom Instructions"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 px-6 rounded-xl font-medium"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* PayPal Payment Modal */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 border-purple-500/30">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-white text-2xl">Purchase Credits</CardTitle>
              <p className="text-gray-300">Unlock more AI-powered content creation</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">${paymentAmount}</div>
                <div className="text-gray-400">Secure payment via PayPal</div>
              </div>
              
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Credits:</span>
                  <span className="text-white font-medium">{parseInt(paymentAmount) / 2}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-300">Cost per article:</span>
                  <span className="text-white font-medium">$2.00</span>
                </div>
              </div>

              {/* PayPal Button */}
              <div className="space-y-4">
                <div className="w-full">
                  <CustomPayPalButton
                    amount={paymentAmount}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => console.log("Payment cancelled")}
                    onError={(error: any) => console.error("Payment error:", error)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentPopup(false)}
                  className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  Cancel
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>✓ Secure PayPal payment processing</p>
                <p>✓ No card details stored</p>
                <p>✓ Instant credit delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyword Research Modal */}
      {showKeywordResearch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl border border-purple-500/30">
            <KeywordResearch
              onClose={() => setShowKeywordResearch(false)}
            />
          </div>
        </div>
      )}

      {/* Admin Email Marketing Modal */}
      {showEmailMarketing && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-purple-500/30">
            <EmailMarketing onClose={() => setShowEmailMarketing(false)} />
          </div>
        </div>
      )}

      {/* Admin Password Manager Modal */}
      {showPasswordManager && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-purple-500/30">
            <PasswordManager onClose={() => setShowPasswordManager(false)} />
          </div>
        </div>
      )}
    </div>
  );
}