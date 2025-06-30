import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Paperclip, Image, FileText, FileSpreadsheet, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
}

export function ChatPopup({ isOpen, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "How can I optimize my business strategy for 2025?",
      isUser: true,
      timestamp: new Date(),
    },
    {
      id: "2",
      text: "I'll analyze current market trends and provide a comprehensive strategy framework. Let me break this down into key areas: digital transformation, customer experience optimization, and emerging technology adoption...\n\n• Analyzing market data and trends...",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim() || "Shared files for analysis",
      isUser: true,
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);

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
          sessionId: null 
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
              <h3 className="text-white font-bold text-xl">Sofeia AI</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Online & Ready</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 px-4 py-2">
              5 Free Questions
            </Badge>
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
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && attachedFiles.length === 0)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12 px-8 rounded-xl font-medium"
            >
              <Bot className="w-5 h-5 mr-2" />
              Start Chatting with Sofeia AI
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}