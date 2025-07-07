import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import type { Server } from "http";

interface ChatUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  ws: WebSocket;
  lastSeen: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  targetUserId?: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
  isRead: boolean;
}

class ChatService {
  private wss: WebSocketServer | null = null;
  private connectedUsers: Map<string, ChatUser> = new Map();
  private messageHistory: ChatMessage[] = [];

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/chat',
      verifyClient: (info) => {
        // Basic verification - in production, verify JWT token
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('New chat WebSocket connection');
      
      let user: ChatUser | null = null;

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'auth':
              user = await this.authenticateUser(data, ws);
              if (user) {
                this.connectedUsers.set(user.id, user);
                this.broadcastUserStatus(user.id, 'online');
                
                // Send recent messages to user
                const recentMessages = await this.getRecentMessages(user.id, user.isAdmin);
                ws.send(JSON.stringify({
                  type: 'message_history',
                  messages: recentMessages
                }));
              }
              break;
              
            case 'send_message':
              if (user) {
                await this.handleSendMessage(user, data);
              }
              break;
              
            case 'typing':
              if (user) {
                this.handleTyping(user, data);
              }
              break;
              
            case 'mark_read':
              if (user) {
                await this.markMessagesAsRead(user.id, data.messageIds);
              }
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      });

      ws.on('close', () => {
        if (user) {
          this.connectedUsers.delete(user.id);
          this.broadcastUserStatus(user.id, 'offline');
          console.log(`Chat user disconnected: ${user.email}`);
        }
      });

      ws.on('error', (error) => {
        console.error('Chat WebSocket error:', error);
      });
    });

    console.log('Chat WebSocket server initialized');
  }

  private async authenticateUser(authData: any, ws: WebSocket): Promise<ChatUser | null> {
    try {
      const { userId, email, isAdmin } = authData;
      
      if (!userId || !email) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid authentication data'
        }));
        return null;
      }

      // Get user from database
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'User not found'
        }));
        return null;
      }

      const user: ChatUser = {
        id: userId,
        email: email,
        name: dbUser.name || email.split('@')[0],
        isAdmin: isAdmin || email === 'ottmar.francisca1969@gmail.com',
        ws: ws,
        lastSeen: new Date()
      };

      ws.send(JSON.stringify({
        type: 'auth_success',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        }
      }));

      console.log(`Chat user authenticated: ${user.email} (Admin: ${user.isAdmin})`);
      return user;
    } catch (error) {
      console.error('Error authenticating chat user:', error);
      return null;
    }
  }

  private async handleSendMessage(sender: ChatUser, data: any) {
    try {
      const { message, targetUserId } = data;
      
      if (!message || !message.trim()) {
        sender.ws.send(JSON.stringify({
          type: 'error',
          message: 'Message cannot be empty'
        }));
        return;
      }

      // Create message object
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: sender.id,
        senderEmail: sender.email,
        senderName: sender.name,
        targetUserId: targetUserId,
        message: message.trim(),
        timestamp: new Date(),
        isAdmin: sender.isAdmin,
        isRead: false
      };

      // Save message to database
      await storage.saveChatMessage(chatMessage);
      
      // Add to memory history
      this.messageHistory.push(chatMessage);
      
      // Keep only last 1000 messages in memory
      if (this.messageHistory.length > 1000) {
        this.messageHistory = this.messageHistory.slice(-1000);
      }

      // Determine recipients
      let recipients: ChatUser[] = [];
      
      if (sender.isAdmin && targetUserId) {
        // Admin sending to specific user
        const targetUser = this.connectedUsers.get(targetUserId);
        if (targetUser) {
          recipients = [targetUser];
        }
      } else if (sender.isAdmin && !targetUserId) {
        // Admin broadcasting to all users
        recipients = Array.from(this.connectedUsers.values()).filter(u => !u.isAdmin);
      } else {
        // Regular user sending to admins
        recipients = Array.from(this.connectedUsers.values()).filter(u => u.isAdmin);
      }

      // Send message to recipients
      const messageData = {
        type: 'new_message',
        message: chatMessage
      };

      recipients.forEach(recipient => {
        if (recipient.ws.readyState === WebSocket.OPEN) {
          recipient.ws.send(JSON.stringify(messageData));
        }
      });

      // Confirm message sent to sender
      sender.ws.send(JSON.stringify({
        type: 'message_sent',
        messageId: chatMessage.id,
        timestamp: chatMessage.timestamp
      }));

      console.log(`Chat message sent from ${sender.email} to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Error handling send message:', error);
      sender.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  private handleTyping(sender: ChatUser, data: any) {
    const { isTyping, targetUserId } = data;
    
    // Determine recipients for typing indicator
    let recipients: ChatUser[] = [];
    
    if (sender.isAdmin && targetUserId) {
      const targetUser = this.connectedUsers.get(targetUserId);
      if (targetUser) {
        recipients = [targetUser];
      }
    } else if (sender.isAdmin) {
      recipients = Array.from(this.connectedUsers.values()).filter(u => !u.isAdmin);
    } else {
      recipients = Array.from(this.connectedUsers.values()).filter(u => u.isAdmin);
    }

    const typingData = {
      type: 'typing',
      userId: sender.id,
      userEmail: sender.email,
      userName: sender.name,
      isTyping: isTyping
    };

    recipients.forEach(recipient => {
      if (recipient.ws.readyState === WebSocket.OPEN) {
        recipient.ws.send(JSON.stringify(typingData));
      }
    });
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    const statusData = {
      type: status === 'online' ? 'user_online' : 'user_offline',
      userId: userId
    };

    this.connectedUsers.forEach(user => {
      if (user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(JSON.stringify(statusData));
      }
    });
  }

  private async getRecentMessages(userId: string, isAdmin: boolean): Promise<ChatMessage[]> {
    try {
      // Get recent messages from database
      const messages = await storage.getChatMessages(userId, isAdmin);
      return messages.slice(-50); // Return last 50 messages
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  private async markMessagesAsRead(userId: string, messageIds: string[]) {
    try {
      await storage.markChatMessagesAsRead(userId, messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Public methods for API endpoints
  async getOnlineUsers(): Promise<any[]> {
    const users = Array.from(this.connectedUsers.values()).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      isOnline: true,
      lastSeen: user.lastSeen,
      unreadCount: 0 // TODO: Calculate from database
    }));

    return users;
  }

  async sendAdminMessage(adminId: string, targetUserId: string, message: string): Promise<any> {
    const admin = this.connectedUsers.get(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Error('Admin not found or not authorized');
    }

    await this.handleSendMessage(admin, {
      message: message,
      targetUserId: targetUserId
    });

    return {
      success: true,
      message: 'Message sent successfully'
    };
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getAdminUsersCount(): number {
    return Array.from(this.connectedUsers.values()).filter(u => u.isAdmin).length;
  }
}

export const chatService = new ChatService();

