import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import crypto from 'crypto';
import { secureEmailService } from './secureEmailService';
import { gdprComplianceService } from './gdprCompliance';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'subscriber';
  senderEmail?: string;
  recipientId?: string;
  recipientEmail?: string;
  message: string;
  timestamp: string;
  messageType: 'text' | 'notification' | 'system';
  isRead: boolean;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    platform?: string;
  };
}

interface ChatConversation {
  id: string;
  participants: string[];
  participantEmails: string[];
  type: 'support' | 'subscriber_message' | 'broadcast';
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  lastActivity: string;
  unreadCount: number;
  tags: string[];
}

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId: string;
  userType: 'user' | 'admin' | 'subscriber';
  email?: string;
  isSubscriber?: boolean;
  connectionTime: string;
  lastActivity: string;
}

class EnhancedChatService {
  private wss: WebSocketServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private conversations: Map<string, ChatConversation> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private adminClients: Set<string> = new Set();

  /**
   * Initialize WebSocket server for real-time chat
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat',
      verifyClient: (info) => {
        // Basic verification - in production, add proper authentication
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    console.log('🚀 Enhanced Chat Service initialized with WebSocket support');
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: any): Promise<void> {
    const clientId = crypto.randomUUID();
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userType = url.searchParams.get('type') as 'user' | 'admin' | 'subscriber' || 'user';
    const userId = url.searchParams.get('userId') || 'anonymous';
    const email = url.searchParams.get('email') || undefined;

    // Check if user is a subscriber
    let isSubscriber = false;
    if (email && userType !== 'admin') {
      try {
        // Check if email exists in subscriber database
        const subscribers = await secureEmailService.getSubscribersForAdmin('system', false);
        isSubscriber = subscribers.some((sub: any) => 
          secureEmailService.decryptEmail(sub.encryptedEmail) === email
        );
      } catch (error) {
        console.error('Error checking subscriber status:', error);
      }
    }

    const client: ConnectedClient = {
      id: clientId,
      ws: ws,
      userId: userId,
      userType: userType,
      email: email,
      isSubscriber: isSubscriber,
      connectionTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.connectedClients.set(clientId, client);

    // Track admin clients
    if (userType === 'admin') {
      this.adminClients.add(clientId);
    }

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection_established',
      data: {
        clientId: clientId,
        userType: userType,
        isSubscriber: isSubscriber,
        serverTime: new Date().toISOString()
      }
    });

    // Notify admins of new connection
    if (userType !== 'admin') {
      this.notifyAdmins({
        type: 'user_connected',
        data: {
          userId: userId,
          userType: userType,
          email: email,
          isSubscriber: isSubscriber,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: 'Invalid message format' }
        });
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error for client', clientId, ':', error);
      this.handleDisconnection(clientId);
    });

    console.log(`💬 New chat connection: ${userType} (${email || userId}) - Subscriber: ${isSubscriber}`);
  }

  /**
   * Handle incoming chat message
   */
  private async handleMessage(clientId: string, message: any): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client) {
      return;
    }

    client.lastActivity = new Date().toISOString();

    switch (message.type) {
      case 'chat_message':
        await this.handleChatMessage(clientId, message.data);
        break;
      case 'admin_message_subscriber':
        await this.handleAdminToSubscriberMessage(clientId, message.data);
        break;
      case 'admin_broadcast':
        await this.handleAdminBroadcast(clientId, message.data);
        break;
      case 'mark_read':
        await this.markMessagesAsRead(clientId, message.data.conversationId);
        break;
      case 'get_conversations':
        await this.sendConversations(clientId);
        break;
      case 'get_messages':
        await this.sendMessages(clientId, message.data.conversationId);
        break;
      case 'typing':
        this.handleTypingIndicator(clientId, message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Handle regular chat message (support)
   */
  private async handleChatMessage(clientId: string, data: any): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    const conversationId = data.conversationId || this.getOrCreateConversation(
      client.userId,
      client.email || 'anonymous',
      'support'
    );

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId,
      senderId: client.userId,
      senderType: client.userType,
      senderEmail: client.email,
      message: data.message,
      timestamp: new Date().toISOString(),
      messageType: 'text',
      isRead: false,
      metadata: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        platform: data.platform
      }
    };

    // Store message
    this.addMessage(conversationId, chatMessage);

    // Send to all participants in conversation
    await this.broadcastToConversation(conversationId, {
      type: 'new_message',
      data: chatMessage
    });

    // Send sound notification to admins if user message
    if (client.userType !== 'admin') {
      this.notifyAdmins({
        type: 'sound_notification',
        data: {
          sound: 'message_received',
          message: 'New support message received',
          conversationId: conversationId,
          senderEmail: client.email
        }
      });
    }

    // Log for GDPR compliance
    if (client.email) {
      await gdprComplianceService.recordConsent(
        client.email,
        'analytics',
        true,
        'chat_interaction',
        data.ipAddress || 'unknown',
        data.userAgent || 'unknown'
      );
    }

    console.log(`💬 Chat message: ${client.userType} -> conversation ${conversationId}`);
  }

  /**
   * Handle admin message to specific subscriber
   */
  private async handleAdminToSubscriberMessage(clientId: string, data: any): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client || client.userType !== 'admin') {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Admin access required' }
      });
      return;
    }

    const { subscriberEmail, message } = data;

    // Verify subscriber exists
    try {
      const subscribers = await secureEmailService.getSubscribersForAdmin(client.userId, false);
      const subscriber = subscribers.find((sub: any) => 
        secureEmailService.decryptEmail(sub.encryptedEmail) === subscriberEmail
      );

      if (!subscriber) {
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: 'Subscriber not found' }
        });
        return;
      }

      // Create conversation for this subscriber
      const conversationId = this.getOrCreateConversation(
        subscriberEmail,
        subscriberEmail,
        'subscriber_message'
      );

      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: conversationId,
        senderId: client.userId,
        senderType: 'admin',
        senderEmail: client.email,
        recipientEmail: subscriberEmail,
        message: message,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        isRead: false,
        metadata: {}
      };

      // Store message
      this.addMessage(conversationId, chatMessage);

      // Send to subscriber if connected
      const subscriberClient = Array.from(this.connectedClients.values())
        .find(c => c.email === subscriberEmail);

      if (subscriberClient) {
        this.sendToClient(subscriberClient.id, {
          type: 'admin_message',
          data: chatMessage
        });

        // Send sound notification to subscriber
        this.sendToClient(subscriberClient.id, {
          type: 'sound_notification',
          data: {
            sound: 'admin_message',
            message: 'Message from admin',
            conversationId: conversationId
          }
        });
      }

      // Confirm to admin
      this.sendToClient(clientId, {
        type: 'message_sent',
        data: {
          conversationId: conversationId,
          recipientEmail: subscriberEmail,
          messageId: chatMessage.id,
          delivered: !!subscriberClient
        }
      });

      console.log(`📧 Admin message sent to subscriber: ${subscriberEmail}`);

    } catch (error) {
      console.error('Error sending admin message to subscriber:', error);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Failed to send message to subscriber' }
      });
    }
  }

  /**
   * Handle admin broadcast to multiple subscribers
   */
  private async handleAdminBroadcast(clientId: string, data: any): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client || client.userType !== 'admin') {
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Admin access required' }
      });
      return;
    }

    const { recipients, message, messageType = 'broadcast' } = data;
    let targetEmails: string[] = [];

    try {
      // Get subscriber list based on recipients filter
      const subscribers = await secureEmailService.getSubscribersForAdmin(client.userId, true);
      
      switch (recipients) {
        case 'all':
          targetEmails = subscribers.map((sub: any) => sub.email);
          break;
        case 'verified':
          targetEmails = subscribers
            .filter((sub: any) => sub.verified)
            .map((sub: any) => sub.email);
          break;
        case 'subscribed':
          targetEmails = subscribers
            .filter((sub: any) => sub.subscribed)
            .map((sub: any) => sub.email);
          break;
        case 'specific':
          targetEmails = data.specificEmails || [];
          break;
        default:
          targetEmails = [];
      }

      let deliveredCount = 0;
      const messageId = crypto.randomUUID();

      // Send to each target subscriber
      for (const email of targetEmails) {
        const conversationId = this.getOrCreateConversation(
          email,
          email,
          'broadcast'
        );

        const chatMessage: ChatMessage = {
          id: crypto.randomUUID(),
          conversationId: conversationId,
          senderId: client.userId,
          senderType: 'admin',
          senderEmail: client.email,
          recipientEmail: email,
          message: message,
          timestamp: new Date().toISOString(),
          messageType: messageType,
          isRead: false,
          metadata: {
            broadcastId: messageId,
            broadcastType: recipients
          }
        };

        // Store message
        this.addMessage(conversationId, chatMessage);

        // Send to subscriber if connected
        const subscriberClient = Array.from(this.connectedClients.values())
          .find(c => c.email === email);

        if (subscriberClient) {
          this.sendToClient(subscriberClient.id, {
            type: 'broadcast_message',
            data: chatMessage
          });

          // Send sound notification
          this.sendToClient(subscriberClient.id, {
            type: 'sound_notification',
            data: {
              sound: 'broadcast_message',
              message: 'Broadcast message from admin',
              conversationId: conversationId
            }
          });

          deliveredCount++;
        }
      }

      // Confirm to admin
      this.sendToClient(clientId, {
        type: 'broadcast_sent',
        data: {
          messageId: messageId,
          totalRecipients: targetEmails.length,
          deliveredCount: deliveredCount,
          recipients: recipients
        }
      });

      console.log(`📢 Admin broadcast sent to ${deliveredCount}/${targetEmails.length} subscribers`);

    } catch (error) {
      console.error('Error sending admin broadcast:', error);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Failed to send broadcast message' }
      });
    }
  }

  /**
   * Get or create conversation
   */
  private getOrCreateConversation(userId: string, email: string, type: ChatConversation['type']): string {
    // Look for existing conversation
    const existingConversation = Array.from(this.conversations.values())
      .find(conv => 
        conv.participantEmails.includes(email) && 
        conv.type === type
      );

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation
    const conversationId = crypto.randomUUID();
    const conversation: ChatConversation = {
      id: conversationId,
      participants: [userId],
      participantEmails: [email],
      type: type,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      tags: []
    };

    this.conversations.set(conversationId, conversation);
    this.messages.set(conversationId, []);

    return conversationId;
  }

  /**
   * Add message to conversation
   */
  private addMessage(conversationId: string, message: ChatMessage): void {
    const messages = this.messages.get(conversationId) || [];
    messages.push(message);
    this.messages.set(conversationId, messages);

    // Update conversation
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.lastActivity = message.timestamp;
      conversation.unreadCount++;
      this.conversations.set(conversationId, conversation);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: any): void {
    const client = this.connectedClients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all participants in conversation
   */
  private async broadcastToConversation(conversationId: string, message: any): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    // Send to all connected clients in conversation
    for (const client of this.connectedClients.values()) {
      if (conversation.participantEmails.includes(client.email || '') ||
          client.userType === 'admin') {
        this.sendToClient(client.id, message);
      }
    }
  }

  /**
   * Notify all admin clients
   */
  private notifyAdmins(message: any): void {
    for (const adminClientId of this.adminClients) {
      this.sendToClient(adminClientId, message);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      console.log(`💬 Chat disconnection: ${client.userType} (${client.email || client.userId})`);
      
      // Notify admins of disconnection
      if (client.userType !== 'admin') {
        this.notifyAdmins({
          type: 'user_disconnected',
          data: {
            userId: client.userId,
            userType: client.userType,
            email: client.email,
            timestamp: new Date().toISOString()
          }
        });
      }

      this.connectedClients.delete(clientId);
      this.adminClients.delete(clientId);
    }
  }

  /**
   * Mark messages as read
   */
  private async markMessagesAsRead(clientId: string, conversationId: string): Promise<void> {
    const messages = this.messages.get(conversationId) || [];
    let markedCount = 0;

    for (const message of messages) {
      if (!message.isRead) {
        message.isRead = true;
        markedCount++;
      }
    }

    // Update conversation unread count
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = Math.max(0, conversation.unreadCount - markedCount);
      this.conversations.set(conversationId, conversation);
    }

    this.sendToClient(clientId, {
      type: 'messages_marked_read',
      data: {
        conversationId: conversationId,
        markedCount: markedCount
      }
    });
  }

  /**
   * Send conversations to client
   */
  private async sendConversations(clientId: string): Promise<void> {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    let conversations: ChatConversation[] = [];

    if (client.userType === 'admin') {
      // Admin sees all conversations
      conversations = Array.from(this.conversations.values());
    } else {
      // Users see only their conversations
      conversations = Array.from(this.conversations.values())
        .filter(conv => conv.participantEmails.includes(client.email || ''));
    }

    this.sendToClient(clientId, {
      type: 'conversations_list',
      data: conversations
    });
  }

  /**
   * Send messages for specific conversation
   */
  private async sendMessages(clientId: string, conversationId: string): Promise<void> {
    const messages = this.messages.get(conversationId) || [];
    
    this.sendToClient(clientId, {
      type: 'conversation_messages',
      data: {
        conversationId: conversationId,
        messages: messages
      }
    });
  }

  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(clientId: string, data: any): void {
    const client = this.connectedClients.get(clientId);
    if (!client) return;

    // Broadcast typing indicator to conversation participants
    this.broadcastToConversation(data.conversationId, {
      type: 'typing_indicator',
      data: {
        userId: client.userId,
        userType: client.userType,
        email: client.email,
        isTyping: data.isTyping,
        conversationId: data.conversationId
      }
    });
  }

  /**
   * Get chat statistics for admin
   */
  getStatistics(): any {
    const totalConnections = this.connectedClients.size;
    const adminConnections = this.adminClients.size;
    const userConnections = totalConnections - adminConnections;
    const subscriberConnections = Array.from(this.connectedClients.values())
      .filter(client => client.isSubscriber).length;

    const totalConversations = this.conversations.size;
    const activeConversations = Array.from(this.conversations.values())
      .filter(conv => conv.status === 'active').length;

    const totalMessages = Array.from(this.messages.values())
      .reduce((total, messages) => total + messages.length, 0);

    return {
      connections: {
        total: totalConnections,
        admins: adminConnections,
        users: userConnections,
        subscribers: subscriberConnections
      },
      conversations: {
        total: totalConversations,
        active: activeConversations,
        support: Array.from(this.conversations.values()).filter(c => c.type === 'support').length,
        subscriber_messages: Array.from(this.conversations.values()).filter(c => c.type === 'subscriber_message').length,
        broadcasts: Array.from(this.conversations.values()).filter(c => c.type === 'broadcast').length
      },
      messages: {
        total: totalMessages,
        unread: Array.from(this.messages.values())
          .flat()
          .filter(msg => !msg.isRead).length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send message to specific subscriber by email
   */
  async sendMessageToSubscriber(adminId: string, subscriberEmail: string, message: string): Promise<any> {
    try {
      // Verify subscriber exists
      const subscribers = await secureEmailService.getSubscribersForAdmin(adminId, false);
      const subscriber = subscribers.find((sub: any) => 
        secureEmailService.decryptEmail(sub.encryptedEmail) === subscriberEmail
      );

      if (!subscriber) {
        throw new Error('Subscriber not found');
      }

      // Find admin client
      const adminClient = Array.from(this.connectedClients.values())
        .find(client => client.userType === 'admin' && client.userId === adminId);

      if (adminClient) {
        await this.handleAdminToSubscriberMessage(adminClient.id, {
          subscriberEmail: subscriberEmail,
          message: message
        });

        return {
          success: true,
          message: 'Message sent to subscriber',
          subscriberEmail: subscriberEmail
        };
      } else {
        throw new Error('Admin not connected to chat');
      }
    } catch (error) {
      console.error('Error sending message to subscriber:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to multiple subscribers
   */
  async broadcastToSubscribers(adminId: string, recipients: string, message: string, specificEmails?: string[]): Promise<any> {
    try {
      // Find admin client
      const adminClient = Array.from(this.connectedClients.values())
        .find(client => client.userType === 'admin' && client.userId === adminId);

      if (adminClient) {
        await this.handleAdminBroadcast(adminClient.id, {
          recipients: recipients,
          message: message,
          specificEmails: specificEmails
        });

        return {
          success: true,
          message: 'Broadcast sent',
          recipients: recipients
        };
      } else {
        throw new Error('Admin not connected to chat');
      }
    } catch (error) {
      console.error('Error broadcasting to subscribers:', error);
      throw error;
    }
  }
}

export const enhancedChatService = new EnhancedChatService();

