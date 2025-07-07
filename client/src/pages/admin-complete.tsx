import React, { useState, useEffect } from 'react';

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
      const response = await fetch('/api/admin/users');
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages');
      const messageData = await response.json();
      setMessages(messageData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      const conversationData = await response.json();
      setConversations(conversationData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const handleCreditGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/grant-credits', {
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
        alert('Credits granted successfully!');
        setCreditForm({
          userEmail: '',
          credits: 10,
          reason: '',
          isNewSubscriber: false
        });
        loadUsers(); // Refresh user list
      } else {
        const error = await response.json();
        alert(`Failed to grant credits: ${error.message}`);
      }
    } catch (error) {
      console.error('Error granting credits:', error);
      alert('Failed to grant credits. Please try again.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/send-message', {
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
        alert('Message sent successfully!');
        setMessageForm({
          to: '',
          content: '',
          type: 'outgoing'
        });
        loadMessages();
        loadConversations();
      } else {
        const error = await response.json();
        alert(`Failed to send message: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PUT'
      });
      loadMessages();
      loadConversations();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message => 
    message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv => 
    conv.participantEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversationMessages = (conversationId: string) => {
    return messages.filter(msg => 
      msg.from === conversationId || msg.to === conversationId
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          ⚙️ ContentScale Admin Panel
        </h1>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {[
              { id: 'credits', label: '💳 Credits', icon: '💳' },
              { id: 'messages', label: '💬 Messages', icon: '💬' },
              { id: 'users', label: '👥 Users', icon: '👥' },
              { id: 'security', label: '🔒 Security', icon: '🔒' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users, messages, or conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Credit Management Tab */}
        {activeTab === 'credits' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">💳 Credit Management</h2>
            
            <form onSubmit={handleCreditGrant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">User Email</label>
                <input
                  type="email"
                  value={creditForm.userEmail}
                  onChange={(e) => setCreditForm({...creditForm, userEmail: e.target.value})}
                  placeholder="user@example.com"
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Credits to Grant</label>
                <input
                  type="number"
                  value={creditForm.credits}
                  onChange={(e) => setCreditForm({...creditForm, credits: parseInt(e.target.value)})}
                  min="1"
                  max="1000"
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
                <textarea
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({...creditForm, reason: e.target.value})}
                  placeholder="Admin credit grant for customer support..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="newSubscriber"
                  checked={creditForm.isNewSubscriber}
                  onChange={(e) => setCreditForm({...creditForm, isNewSubscriber: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="newSubscriber" className="text-sm">
                  New Subscriber Bonus (applies special new user benefits)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Grant Credits
              </button>
            </form>

            {/* User Credit Overview */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Recent Users</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                    <div>
                      <span className="font-medium">{user.email}</span>
                      {user.isNewSubscriber && (
                        <span className="ml-2 px-2 py-1 bg-green-600 text-xs rounded">New</span>
                      )}
                    </div>
                    <span className="text-purple-400 font-medium">{user.credits} credits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send Message Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">💬 Send Message</h2>
              
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">To (Email)</label>
                  <input
                    type="email"
                    value={messageForm.to}
                    onChange={(e) => setMessageForm({...messageForm, to: e.target.value})}
                    placeholder="recipient@example.com"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message Type</label>
                  <select
                    value={messageForm.type}
                    onChange={(e) => setMessageForm({...messageForm, type: e.target.value as 'outgoing' | 'internal'})}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="outgoing">Outgoing (to user)</option>
                    <option value="internal">Internal note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                    placeholder="Enter your message..."
                    rows={4}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {messageForm.content.length}/5000 characters
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Recent Messages */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Messages</h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMessages.slice(0, 15).map((message) => (
                  <div key={message.id} className="p-3 bg-gray-700 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{message.from}</span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-sm">{message.to}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            message.type === 'incoming' ? 'bg-blue-600' : 
                            message.type === 'outgoing' ? 'bg-green-600' : 'bg-yellow-600'
                          }`}>
                            {message.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{message.content}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                        {!message.isRead && message.type === 'incoming' && (
                          <button
                            onClick={() => markMessageAsRead(message.id)}
                            className="mt-1 px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">👥 User Management</h2>
            
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{user.email}</span>
                      {user.isNewSubscriber && (
                        <span className="px-2 py-1 bg-green-600 text-xs rounded">New Subscriber</span>
                      )}
                    </div>
                    {user.lastLogin && (
                      <p className="text-sm text-gray-400 mt-1">
                        Last login: {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-purple-400">{user.credits}</span>
                    <p className="text-xs text-gray-400">credits</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🔒 Security Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="text-green-400">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Messages:</span>
                    <span className="text-blue-400">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Subscribers:</span>
                    <span className="text-purple-400">
                      {users.filter(u => u.isNewSubscriber).length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full p-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors">
                    Export User Data
                  </button>
                  <button className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                    Generate Report
                  </button>
                  <button className="w-full p-2 bg-green-600 rounded hover:bg-green-700 transition-colors">
                    System Health Check
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;