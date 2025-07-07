import express from 'express';
import { Request, Response } from 'express';
import { storage } from '../storage';

const router = express.Router();

// Interfaces
interface User {
  id: string;
  email: string;
  credits: number;
  isNewSubscriber: boolean;
  lastLogin?: Date;
  createdAt: Date;
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

interface CreditTransaction {
  id: string;
  userEmail: string;
  credits: number;
  reason: string;
  adminEmail: string;
  timestamp: Date;
  isNewSubscriber: boolean;
}

// Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  // Check if user is admin - implement your admin check logic here
  const isAdmin = true; // For now, allow all requests
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Get all users
router.get('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Grant credits to user with enhanced logic from your backend-routes.ts
router.post('/admin/grant-credits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userEmail, credits, reason, isNewSubscriber } = req.body;
    const adminEmail = (req as any).adminEmail || 'admin@contentscale.com';

    // Validation
    if (!userEmail || !credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid user email or credit amount' });
    }

    if (credits > 1000) {
      return res.status(400).json({ error: 'Cannot grant more than 1000 credits at once' });
    }

    // Check if user exists
    let user = await storage.getUserByEmail(userEmail);
    
    // Create user if they don't exist (new subscriber)
    if (!user) {
      user = await storage.createUser({
        email: userEmail,
        credits: 0,
        isNewSubscriber: true
      });
    }

    // Apply new subscriber bonus if applicable
    let finalCredits = credits;
    if (isNewSubscriber && user.isNewSubscriber) {
      finalCredits = Math.floor(credits * 1.5); // 50% bonus for new subscribers
    }

    // Update user credits
    const success = await storage.updateUserCredits(userEmail, user.credits + finalCredits);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update user credits' });
    }

    // Log the transaction
    await storage.createCreditTransaction({
      userEmail,
      credits: finalCredits,
      reason: reason || 'Admin credit grant',
      adminEmail,
      isNewSubscriber: isNewSubscriber && user.isNewSubscriber
    });

    // Send notification to user
    await storage.createMessage({
      from: 'admin@contentscale.com',
      to: userEmail,
      content: `You have received ${finalCredits} credits! ${isNewSubscriber ? '(New subscriber bonus applied)' : ''} Reason: ${reason || 'Admin credit grant'}`,
      type: 'outgoing'
    });

    res.json({ 
      success: true, 
      message: `Successfully granted ${finalCredits} credits to ${userEmail}`,
      creditsGranted: finalCredits,
      bonusApplied: isNewSubscriber && user.isNewSubscriber
    });

  } catch (error) {
    console.error('Error granting credits:', error);
    res.status(500).json({ error: 'Failed to grant credits' });
  }
});

// Get all messages
router.get('/admin/messages', requireAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await storage.getMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Get conversations (grouped messages) - enhanced from your backend-routes.ts
router.get('/admin/conversations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await storage.getMessages();
    
    // Group messages by participant
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const participantEmail = message.type === 'incoming' ? message.from : message.to;
      
      if (!conversationMap.has(participantEmail)) {
        conversationMap.set(participantEmail, {
          id: participantEmail,
          participantEmail,
          messages: [],
          unreadCount: 0,
          lastActivity: new Date(0)
        });
      }
      
      const conversation = conversationMap.get(participantEmail);
      conversation.messages.push(message);
      
      if (!message.isRead && message.type === 'incoming') {
        conversation.unreadCount++;
      }
      
      if (new Date(message.timestamp) > conversation.lastActivity) {
        conversation.lastActivity = new Date(message.timestamp);
        conversation.lastMessage = message.content;
      }
    });
    
    // Convert to array and sort by last activity
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Send message - enhanced from your backend-routes.ts
router.post('/admin/send-message', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { to, content, type } = req.body;
    const adminEmail = (req as any).adminEmail || 'admin@contentscale.com';

    // Validation
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message content too long (max 5000 characters)' });
    }

    // Create message
    const message = await storage.createMessage({
      from: type === 'internal' ? `admin-internal:${adminEmail}` : adminEmail,
      to,
      content,
      type: type || 'outgoing'
    });

    // If it's an outgoing message to a user, also send email notification
    if (type === 'outgoing') {
      console.log(`Email notification sent to ${to}: ${content}`);
    }

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: message.id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.put('/admin/messages/:messageId/read', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    const success = await storage.markMessageAsRead(messageId);
    
    if (success) {
      res.json({ success: true, message: 'Message marked as read' });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Send chat message (public endpoint)
router.post('/api/chat/send', async (req: Request, res: Response) => {
  try {
    const { userEmail, message, type } = req.body;
    
    if (!userEmail || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chatMessage = await storage.createMessage({
      from: userEmail,
      to: 'admin@contentscale.com',
      content: message,
      type: type || 'incoming'
    });

    res.json({ 
      success: true, 
      message: chatMessage,
      response: 'Thank you for your message. Our support team will get back to you soon!' 
    });

  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat history
router.get('/api/chat/history/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    
    // Get messages for this user
    const messages = await storage.getMessages();
    const userMessages = messages.filter(m => 
      m.from === userEmail || m.to === userEmail
    );

    res.json({ messages: userMessages });

  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Bulk credit operations
router.post('/admin/bulk-credits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations must be an array' });
    }

    const results = [];
    
    for (const operation of operations) {
      try {
        const { userEmail, credits, reason } = operation;
        
        const user = await storage.getUserByEmail(userEmail);
        
        if (user) {
          const newCredits = user.credits + credits;
          await storage.updateUserCredits(user.id, newCredits);
          
          await storage.createCreditTransaction({
            userEmail,
            credits,
            reason: reason || 'Bulk credit operation',
            adminEmail: 'admin@contentscale.com',
            isNewSubscriber: false
          });
          
          results.push({ userEmail, success: true });
        } else {
          results.push({ userEmail, success: false, error: 'User not found' });
        }
      } catch (error) {
        results.push({ userEmail: operation.userEmail, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });

  } catch (error) {
    console.error('Error with bulk credit operations:', error);
    res.status(500).json({ error: 'Failed to process bulk operations' });
  }
});

// Get credit history
router.get('/admin/credit-history', requireAdmin, async (req: Request, res: Response) => {
  try {
    // This would need to be implemented based on your credit transaction storage
    const transactions = []; // Placeholder
    res.json(transactions);
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({ error: 'Failed to get credit history' });
  }
});

// Health check
router.get('/admin/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ContentScale Admin API'
  });
});

export default router;