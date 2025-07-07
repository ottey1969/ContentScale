import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Users, MessageSquare, Settings, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  credits: number;
  isNewSubscriber: boolean;
  lastLogin?: Date;
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing' | 'internal';
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantEmail: string;
  lastMessage: string;
  unreadCount: number;
  lastActivity: Date;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('credits');
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Credit Management State
  const [creditForm, setCreditForm] = useState({
    userEmail: '',
    credits: 10,
    reason: '',
    isNewSubscriber: false
  });

  // Messaging State
  const [messageForm, setMessageForm] = useState({
    to: '',
    content: '',
    type: 'outgoing' as 'outgoing' | 'internal'
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
    loadMessages();
    loadConversations();
    
    // Set up real-time message polling
    const interval = setInterval(() => {
      loadMessages();
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/admin/users');
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/admin/messages');
      const messageData = await response.json();
      setMessages(messageData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/admin/conversations');
      const conversationData = await response.json();
      setConversations(conversationData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleCreditGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/admin/grant-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: creditForm.userEmail,
          credits: creditForm.credits,
          reason: creditForm.reason,
          isNewSubscriber: creditForm.isNewSubscriber
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Credits granted successfully!" });
        setCreditForm({
          userEmail: '',
          credits: 10,
          reason: '',
          isNewSubscriber: false
        });
        loadUsers(); // Refresh user list
      } else {
        const error = await response.json();
        toast({ title: "Error", description: `Failed to grant credits: ${error.message}`, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error granting credits:', error);
      toast({ title: "Error", description: "Failed to grant credits. Please try again.", variant: "destructive" });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: messageForm.to,
          content: messageForm.content,
          type: messageForm.type
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Message sent successfully!" });
        setMessageForm({
          to: '',
          content: '',
          type: 'outgoing'
        });
        loadMessages(); // Refresh message list
        loadConversations(); // Refresh conversations
      } else {
        const error = await response.json();
        toast({ title: "Error", description: `Failed to send message: ${error.message}`, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/admin/messages/${messageId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        loadMessages();
        loadConversations();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ContentScale Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage users, credits, and messages</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Credit Management Tab */}
          <TabsContent value="credits">
            <Card>
              <CardHeader>
                <CardTitle>Credit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreditGrant} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userEmail">User Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={creditForm.userEmail}
                        onChange={(e) => setCreditForm(prev => ({ ...prev, userEmail: e.target.value }))}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={creditForm.credits}
                        onChange={(e) => setCreditForm(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
                        min="1"
                        max="1000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={creditForm.reason}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Admin credit grant"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isNewSubscriber"
                      checked={creditForm.isNewSubscriber}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, isNewSubscriber: e.target.checked }))}
                    />
                    <Label htmlFor="isNewSubscriber">New Subscriber Bonus (50% extra)</Label>
                  </div>
                  <Button type="submit">Grant Credits</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userSearch">Search Users</Label>
                    <Input
                      id="userSearch"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by email..."
                    />
                  </div>
                  <Button onClick={loadUsers}>Refresh Users</Button>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.credits} credits</p>
                          {user.lastLogin && (
                            <p className="text-xs text-gray-400">
                              Last login: {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.isNewSubscriber ? 'New Subscriber' : 'Existing User'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Message Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <Label htmlFor="messageTo">To (Email)</Label>
                      <Input
                        id="messageTo"
                        type="email"
                        value={messageForm.to}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, to: e.target.value }))}
                        placeholder="recipient@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="messageContent">Message</Label>
                      <Textarea
                        id="messageContent"
                        value={messageForm.content}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter your message..."
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="messageType">Type</Label>
                      <select
                        id="messageType"
                        value={messageForm.type}
                        onChange={(e) => setMessageForm(prev => ({ ...prev, type: e.target.value as 'outgoing' | 'internal' }))}
                        className="w-full p-2 border rounded"
                      >
                        <option value="outgoing">Outgoing (to user)</option>
                        <option value="internal">Internal note</option>
                      </select>
                    </div>
                    <Button type="submit">Send Message</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={loadMessages}>Refresh Messages</Button>
                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                      {filteredMessages.slice(0, 10).map((message) => (
                        <div key={message.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{message.from} → {message.to}</p>
                              <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                            </div>
                            <div className="text-xs text-gray-400 ml-2">
                              <div>{message.type}</div>
                              <div>{message.isRead ? 'Read' : 'Unread'}</div>
                            </div>
                          </div>
                          {!message.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markMessageAsRead(message.id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={loadConversations}>Refresh Conversations</Button>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {conversations.map((conversation) => (
                      <div 
                        key={conversation.id} 
                        className={`p-4 border rounded-lg cursor-pointer ${
                          selectedConversation === conversation.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{conversation.participantEmail}</p>
                            <p className="text-sm text-gray-600 mt-1">{conversation.lastMessage}</p>
                          </div>
                          <div className="text-xs text-gray-400 ml-2">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-500 text-white px-2 py-1 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <div className="mt-1">
                              {new Date(conversation.lastActivity).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">Admin configuration options will be displayed here.</p>
                  <Button onClick={() => {
                    toast({ title: "Settings", description: "Settings functionality will be implemented here." });
                  }}>
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;