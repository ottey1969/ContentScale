import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Phone, Mail, HelpCircle, ExternalLink, Send, Clock, CheckCircle } from "lucide-react";

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  lastUpdate: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export default function Support() {
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    priority: "medium"
  });
  const { toast } = useToast();

  // Get user data
  const { data: user } = useQuery<{ id: string; email: string; name: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Get support tickets
  const { data: tickets = [] } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
  });

  // Get FAQ items
  const { data: faqItems = [] } = useQuery<FAQItem[]>({
    queryKey: ["/api/support/faq"],
  });

  const whatsappSupportMutation = useMutation({
    mutationFn: async (message: string) => {
      // WhatsApp Business API integration
      const whatsappNumber = "+31628073996";
      const encodedMessage = encodeURIComponent(
        `Hi! I need help with ContentScale.\n\n` +
        `User: ${user?.name || 'Unknown'}\n` +
        `Email: ${user?.email || 'Unknown'}\n\n` +
        `Message: ${message}\n\n` +
        `Sent from ContentScale Dashboard`
      );
      
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // Track the support request
      await fetch("/api/support/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message, 
          userEmail: user?.email,
          timestamp: new Date().toISOString()
        }),
      });

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp Opened!",
        description: "Your message has been prepared. Complete sending it in WhatsApp.",
      });
      setWhatsappMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "WhatsApp Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof supportForm) => {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticketData,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create support ticket");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Created!",
        description: "We'll get back to you within 24 hours.",
      });
      setSupportForm({ subject: "", message: "", priority: "medium" });
    },
    onError: (error: Error) => {
      toast({
        title: "Ticket Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWhatsAppSupport = () => {
    if (!whatsappMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message before contacting support.",
        variant: "destructive",
      });
      return;
    }

    whatsappSupportMutation.mutate(whatsappMessage);
  };

  const handleCreateTicket = () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast({
        title: "Required Fields",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(supportForm);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const quickHelpTopics = [
    "How to earn more credits?",
    "Setting up AI training",
    "Export options explained",
    "API configuration help",
    "Billing and payments",
    "Account settings"
  ];

  const faqCategories = [...new Set(faqItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* WhatsApp Support */}
      <Card className="bg-surface border-surface-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span>WhatsApp Support</span>
            <Badge className="bg-green-100 text-green-800">
              Available 24/7
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-green-800">Instant WhatsApp Support</div>
                <div className="text-sm text-green-600">+31 628073996</div>
              </div>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Get immediate help from our support team via WhatsApp. We're available 24/7 to assist you!
            </p>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Describe your issue or question..."
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="bg-white border-green-300 focus:border-green-500"
                rows={3}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-600">
                  Your message will include your account details for faster support
                </div>
                <Button
                  onClick={handleWhatsAppSupport}
                  disabled={whatsappSupportMutation.isPending || !whatsappMessage.trim()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Help Topics */}
          <div className="space-y-3">
            <h4 className="font-medium">Quick Help Topics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {quickHelpTopics.map((topic, index) => (
                <Button
                  key={index}
                  onClick={() => setWhatsappMessage(topic)}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2 text-xs"
                >
                  <HelpCircle className="w-3 h-3 mr-2" />
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets */}
      <Card className="bg-surface border-surface-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <span>Support Tickets</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Create New Ticket */}
          <div className="space-y-4">
            <h4 className="font-medium">Create Support Ticket</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Subject"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <select
                  value={supportForm.priority}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
            <Textarea
              placeholder="Describe your issue in detail..."
              value={supportForm.message}
              onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
            />
            <Button
              onClick={handleCreateTicket}
              disabled={createTicketMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </div>

          {/* Existing Tickets */}
          {tickets.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Your Tickets</h4>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium">{ticket.subject}</h5>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {new Date(ticket.lastUpdate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <Card className="bg-surface border-surface-light">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {faqCategories.map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-purple-600">{category}</h4>
                <div className="space-y-2">
                  {faqItems
                    .filter(item => item.category === category)
                    .slice(0, 3)
                    .map((item) => (
                      <details key={item.id} className="border rounded-lg">
                        <summary className="p-3 cursor-pointer hover:bg-muted">
                          <span className="font-medium">{item.question}</span>
                        </summary>
                        <div className="p-3 pt-0 text-sm text-muted-foreground">
                          {item.answer}
                          <div className="mt-2 text-xs text-green-600">
                            👍 {item.helpful} people found this helpful
                          </div>
                        </div>
                      </details>
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card className="bg-surface border-surface-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-orange-500" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">WhatsApp</div>
              <div className="text-sm text-muted-foreground">+31 628073996</div>
              <div className="text-xs text-green-600 mt-1">24/7 Available</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Mail className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">support@contentscale.ai</div>
              <div className="text-xs text-blue-600 mt-1">24h Response</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="font-medium">Business Hours</div>
              <div className="text-sm text-muted-foreground">24/7 Support</div>
              <div className="text-xs text-purple-600 mt-1">Global Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

