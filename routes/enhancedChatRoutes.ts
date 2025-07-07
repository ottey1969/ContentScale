import type { Express } from 'express';
import { enhancedChatService } from '../services/enhancedChatService';
import { emailSecurityMiddleware } from '../middleware/emailSecurity';
import { secureEmailService } from '../services/secureEmailService';

export function setupEnhancedChatRoutes(app: Express): void {
  
  // Get chat statistics (admin only)
  app.get('/api/admin/chat/stats',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const stats = enhancedChatService.getStatistics();
        res.json(stats);
      } catch (error) {
        console.error('Error getting chat statistics:', error);
        res.status(500).json({ 
          error: 'Failed to get chat statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Send message to specific subscriber (admin only)
  app.post('/api/admin/chat/message-subscriber',
    emailSecurityMiddleware.requireAdminAuth,
    emailSecurityMiddleware.validateEmailInput,
    emailSecurityMiddleware.sanitizeInput,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const { subscriberEmail, message } = req.body;

        if (!subscriberEmail || !message) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: 'subscriberEmail and message are required'
          });
        }

        const result = await enhancedChatService.sendMessageToSubscriber(
          adminId,
          subscriberEmail,
          message
        );

        res.json(result);
      } catch (error) {
        console.error('Error sending message to subscriber:', error);
        res.status(500).json({ 
          error: 'Failed to send message to subscriber',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Broadcast message to multiple subscribers (admin only)
  app.post('/api/admin/chat/broadcast',
    emailSecurityMiddleware.requireAdminAuth,
    emailSecurityMiddleware.emailCampaignLimiter,
    emailSecurityMiddleware.validateEmailInput,
    emailSecurityMiddleware.sanitizeInput,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const { recipients, message, specificEmails } = req.body;

        if (!recipients || !message) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: 'recipients and message are required'
          });
        }

        // Validate recipients parameter
        const validRecipients = ['all', 'verified', 'subscribed', 'specific'];
        if (!validRecipients.includes(recipients)) {
          return res.status(400).json({
            error: 'Invalid recipients parameter',
            message: 'recipients must be one of: all, verified, subscribed, specific'
          });
        }

        // Validate specific emails if recipients is 'specific'
        if (recipients === 'specific') {
          if (!specificEmails || !Array.isArray(specificEmails) || specificEmails.length === 0) {
            return res.status(400).json({
              error: 'Missing specific emails',
              message: 'specificEmails array is required when recipients is "specific"'
            });
          }

          // Validate email formats
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const invalidEmails = specificEmails.filter(email => !emailRegex.test(email));
          if (invalidEmails.length > 0) {
            return res.status(400).json({
              error: 'Invalid email addresses',
              message: `Invalid emails: ${invalidEmails.join(', ')}`
            });
          }
        }

        const result = await enhancedChatService.broadcastToSubscribers(
          adminId,
          recipients,
          message,
          specificEmails
        );

        res.json(result);
      } catch (error) {
        console.error('Error broadcasting to subscribers:', error);
        res.status(500).json({ 
          error: 'Failed to broadcast message',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Get subscriber list for messaging (admin only)
  app.get('/api/admin/chat/subscribers',
    emailSecurityMiddleware.requireAdminAuth,
    emailSecurityMiddleware.viewLimiter,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const showFullEmails = req.query.full === 'true';

        // Get subscribers with appropriate email visibility
        const subscribers = await secureEmailService.getSubscribersForAdmin(adminId, showFullEmails);

        // Add chat-specific information
        const chatStats = enhancedChatService.getStatistics();
        const subscribersWithChatInfo = subscribers.map((subscriber: any) => ({
          ...subscriber,
          isOnline: false, // TODO: Check if subscriber is currently connected
          lastChatActivity: null, // TODO: Get last chat activity
          unreadMessages: 0 // TODO: Get unread message count
        }));

        res.json({
          subscribers: subscribersWithChatInfo,
          totalCount: subscribers.length,
          onlineCount: chatStats.connections.subscribers,
          chatStats: chatStats
        });
      } catch (error) {
        console.error('Error getting subscribers for chat:', error);
        res.status(500).json({ 
          error: 'Failed to get subscribers',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Get chat conversations (admin only)
  app.get('/api/admin/chat/conversations',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const conversationType = req.query.type as string;

        // This would be implemented in the chat service
        // For now, return basic structure
        const conversations = [
          {
            id: 'conv_1',
            type: 'support',
            participantEmail: 'user@example.com',
            lastMessage: 'Hello, I need help with...',
            lastActivity: new Date().toISOString(),
            unreadCount: 2,
            status: 'active'
          }
        ];

        res.json({
          conversations: conversations,
          totalCount: conversations.length,
          unreadTotal: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
        });
      } catch (error) {
        console.error('Error getting chat conversations:', error);
        res.status(500).json({ 
          error: 'Failed to get conversations',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Get messages for specific conversation (admin only)
  app.get('/api/admin/chat/conversations/:conversationId/messages',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const conversationId = req.params.conversationId;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // This would be implemented in the chat service
        // For now, return basic structure
        const messages = [
          {
            id: 'msg_1',
            conversationId: conversationId,
            senderId: 'user123',
            senderType: 'user',
            senderEmail: 'user@example.com',
            message: 'Hello, I need help with my account',
            timestamp: new Date().toISOString(),
            isRead: false
          }
        ];

        res.json({
          messages: messages,
          conversationId: conversationId,
          totalCount: messages.length,
          hasMore: false
        });
      } catch (error) {
        console.error('Error getting conversation messages:', error);
        res.status(500).json({ 
          error: 'Failed to get messages',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Mark conversation messages as read (admin only)
  app.post('/api/admin/chat/conversations/:conversationId/mark-read',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const conversationId = req.params.conversationId;

        // This would be implemented in the chat service
        const result = {
          conversationId: conversationId,
          markedCount: 0,
          success: true
        };

        res.json(result);
      } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ 
          error: 'Failed to mark messages as read',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Send quick reply templates (admin only)
  app.get('/api/admin/chat/quick-replies',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const quickReplies = [
          {
            id: 'welcome',
            title: 'Welcome Message',
            message: 'Welcome to ContentScale! How can we help you today?'
          },
          {
            id: 'support',
            title: 'Support Available',
            message: 'Our support team is here to help. Please describe your issue and we\'ll get back to you shortly.'
          },
          {
            id: 'thanks',
            title: 'Thank You',
            message: 'Thank you for contacting us. Is there anything else we can help you with?'
          },
          {
            id: 'follow_up',
            title: 'Follow Up',
            message: 'Hi! Just following up on your previous message. Do you need any additional assistance?'
          },
          {
            id: 'resolved',
            title: 'Issue Resolved',
            message: 'Great! I\'m glad we could resolve your issue. Feel free to reach out if you need anything else.'
          }
        ];

        res.json({
          quickReplies: quickReplies,
          totalCount: quickReplies.length
        });
      } catch (error) {
        console.error('Error getting quick replies:', error);
        res.status(500).json({ 
          error: 'Failed to get quick replies',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Create or update quick reply template (admin only)
  app.post('/api/admin/chat/quick-replies',
    emailSecurityMiddleware.requireAdminAuth,
    emailSecurityMiddleware.sanitizeInput,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const { title, message } = req.body;

        if (!title || !message) {
          return res.status(400).json({
            error: 'Missing required fields',
            message: 'title and message are required'
          });
        }

        // This would be implemented to save quick reply templates
        const quickReply = {
          id: `qr_${Date.now()}`,
          title: title,
          message: message,
          createdBy: adminId,
          createdAt: new Date().toISOString()
        };

        res.json({
          success: true,
          quickReply: quickReply,
          message: 'Quick reply template created'
        });
      } catch (error) {
        console.error('Error creating quick reply:', error);
        res.status(500).json({ 
          error: 'Failed to create quick reply',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Get chat activity logs (admin only)
  app.get('/api/admin/chat/activity',
    emailSecurityMiddleware.requireAdminAuth,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const activityType = req.query.type as string;

        // This would be implemented to get chat activity logs
        const activities = [
          {
            id: 'activity_1',
            type: 'user_connected',
            userId: 'user123',
            userEmail: 'user@example.com',
            timestamp: new Date().toISOString(),
            details: {
              userAgent: 'Mozilla/5.0...',
              ipAddress: '192.168.1.1'
            }
          }
        ];

        res.json({
          activities: activities,
          totalCount: activities.length,
          hasMore: false
        });
      } catch (error) {
        console.error('Error getting chat activity:', error);
        res.status(500).json({ 
          error: 'Failed to get chat activity',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Export chat data (admin only)
  app.get('/api/admin/chat/export',
    emailSecurityMiddleware.requireAdminAuth,
    emailSecurityMiddleware.exportLimiter,
    async (req: any, res) => {
      try {
        const adminId = req.user.claims.sub;
        const format = req.query.format as 'json' | 'csv' || 'json';
        const dateFrom = req.query.from as string;
        const dateTo = req.query.to as string;

        // This would be implemented to export chat data
        const exportData = {
          exportDate: new Date().toISOString(),
          format: format,
          dateRange: { from: dateFrom, to: dateTo },
          conversations: [],
          messages: [],
          statistics: enhancedChatService.getStatistics()
        };

        const filename = `chat_export_${Date.now()}.${format}`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
        
        if (format === 'csv') {
          // Convert to CSV format
          const csvData = 'Date,Type,User,Message\n'; // Basic CSV structure
          res.send(csvData);
        } else {
          res.json(exportData);
        }
      } catch (error) {
        console.error('Error exporting chat data:', error);
        res.status(500).json({ 
          error: 'Failed to export chat data',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  console.log('🚀 Enhanced Chat Routes initialized');
}

