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
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Grant Credits
              </button>
            </form>

            {/* User List */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Recent Users</h3>
              <div className="space-y-2">
                {filteredUsers.slice(0, 10).map((user) => (
                  <div key={user.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-400">
                        Credits: {user.credits} | {user.isNewSubscriber ? 'New Subscriber' : 'Existing User'}
                      </p>
                    </div>
                    <button
                      onClick={() => setCreditForm({...creditForm, userEmail: user.email})}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                    >
                      Grant Credits
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unified Messaging Tab */}
        {activeTab === 'messages' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">💬 Unified Messaging Center</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-bold mb-4">Active Conversations</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-purple-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{conversation.participantEmail}</p>
                          <p className="text-xs text-gray-300 truncate">{conversation.lastMessage}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conversation.lastActivity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Thread */}
              <div className="lg:col-span-2">
                {selectedConversation ? (
                  <div>
                    <h3 className="text-lg font-bold mb-4">
                      Conversation with {selectedConversation}
                    </h3>
                    <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                      {getConversationMessages(selectedConversation).map((message) => (
                        <div
                          key={message.id}
                          className={`mb-3 p-3 rounded-lg ${
                            message.type === 'outgoing'
                              ? 'bg-purple-600 ml-8'
                              : 'bg-gray-600 mr-8'
                          }`}
                          onClick={() => !message.isRead && markMessageAsRead(message.id)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">
                              {message.type === 'outgoing' ? 'You' : message.from}
                            </span>
                            <span className="text-xs text-gray-300">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                          {!message.isRead && message.type === 'incoming' && (
                            <span className="text-xs text-yellow-400">● Unread</span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Reply */}
                    <form onSubmit={handleSendMessage}>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={messageForm.content}
                          onChange={(e) => setMessageForm({...messageForm, content: e.target.value, to: selectedConversation})}
                          placeholder="Type your reply..."
                          className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <p>Select a conversation to view messages</p>
                  </div>
                )}
              </div>
            </div>

            {/* Send New Message */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h3 className="text-lg font-bold mb-4">Send New Message</h3>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipient Email</label>
                    <input
                      type="email"
                      value={messageForm.to}
                      onChange={(e) => setMessageForm({...messageForm, to: e.target.value})}
                      placeholder="user@example.com"
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
                      <option value="internal">Internal (admin note)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message Content</label>
                  <textarea
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                    placeholder="Type your message here..."
                    rows={4}
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Recent Messages */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Recent Messages</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredMessages.slice(0, 20).map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.isRead ? 'bg-gray-700' : 'bg-gray-600 border-l-4 border-yellow-400'
                    }`}
                    onClick={() => !message.isRead && markMessageAsRead(message.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">
                        {message.type === 'incoming' ? `From: ${message.from}` : `To: ${message.to}`}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          message.type === 'incoming' ? 'bg-green-600' : 
                          message.type === 'outgoing' ? 'bg-blue-600' : 'bg-purple-600'
                        }`}>
                          {message.type}
                        </span>
                        <span className="text-xs text-gray-300">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{message.content}</p>
                    {!message.isRead && (
                      <span className="text-xs text-yellow-400 mt-1 block">● Unread - Click to mark as read</span>
                    )}
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
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-400">
                        Credits: {user.credits} | Status: {user.isNewSubscriber ? 'New Subscriber' : 'Existing User'}
                      </p>
                      {user.lastLogin && (
                        <p className="text-xs text-gray-500">
                          Last login: {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCreditForm({...creditForm, userEmail: user.email})}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        Grant Credits
                      </button>
                      <button
                        onClick={() => setMessageForm({...messageForm, to: user.email})}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Send Message
                      </button>
                    </div>
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
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Security Monitoring:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Encryption:</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate Limiting:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-2">Recent Activity</h3>
                <p className="text-sm text-gray-400">Security logs and monitoring data would appear here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

