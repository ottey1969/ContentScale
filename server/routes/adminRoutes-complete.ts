import express from 'express';
import { Request, Response } from 'express';

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

// Mock database functions (replace with your actual database implementation)
const db = {
  async getUsers(): Promise<User[]> {
    // Replace with actual database query
    return [];
  },

  async getUserByEmail(email: string): Promise<User | null> {
    // Replace with actual database query
    return null;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    // Replace with actual database query
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email!,
      credits: userData.credits || 0,
      isNewSubscriber: userData.isNewSubscriber || true,
      createdAt: new Date(),
      lastLogin: userData.lastLogin
    };
    return newUser;
  },

  async updateUserCredits(email: string, credits: number): Promise<boolean> {
    // Replace with actual database query
    return true;
  },

  async getMessages(): Promise<Message[]> {
    // Replace with actual database query
    return [];
  },

  async createMessage(messageData: Partial<Message>): Promise<Message> {
    // Replace with actual database query
    const newMessage: Message = {
      id: Date.now().toString(),
      from: messageData.from!,
      to: messageData.to!,
      content: messageData.content!,
      timestamp: new Date(),
      type: messageData.type || 'outgoing',
      isRead: false
    };
    return newMessage;
  },

  async markMessageAsRead(messageId: string): Promise<boolean> {
    // Replace with actual database query
    return true;
  },

  async createCreditTransaction(transactionData: Partial<CreditTransaction>): Promise<CreditTransaction> {
    // Replace with actual database query
    const newTransaction: CreditTransaction = {
      id: Date.now().toString(),
      userEmail: transactionData.userEmail!,
      credits: transactionData.credits!,
      reason: transactionData.reason || '',
      adminEmail: transactionData.adminEmail!,
      timestamp: new Date(),
      isNewSubscriber: transactionData.isNewSubscriber || false
    };
    return newTransaction;
  }
};

// Admin Authentication Middleware
const requireAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  // Replace with your actual admin authentication logic
  const adminEmail = req.headers['admin-email'] || 'ottmar.francisca1969@gmail.com';
  if (!adminEmail) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  (req as any).adminEmail = adminEmail;
  next();
};

// Get all users
router.get('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Grant credits to user
router.post('/admin/grant-credits', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userEmail, credits, reason, isNewSubscriber } = req.body;
    const adminEmail = (req as any).adminEmail;

    // Validation
    if (!userEmail || !credits || credits <= 0) {
      return res.status(400).json({ error: 'Invalid user email or credit amount' });
    }

    if (credits > 1000) {
      return res.status(400).json({ error: 'Cannot grant more than 1000 credits at once' });
    }

    // Check if user exists
    let user = await db.getUserByEmail(userEmail);
    
    // Create user if they don't exist (new subscriber)
    if (!user) {
      user = await db.createUser({
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
    const success = await db.updateUserCredits(userEmail, user.credits + finalCredits);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update user credits' });
    }

    // Log the transaction
    await db.createCreditTransaction({
      userEmail,
      credits: finalCredits,
      reason: reason || 'Admin credit grant',
      adminEmail,
      isNewSubscriber: isNewSubscriber && user.isNewSubscriber
    });

    // Send notification to user
    await db.createMessage({
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
    const messages = await db.getMessages();
    // Sort by timestamp, newest first
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversations (grouped messages)
router.get('/admin/conversations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await db.getMessages();
    
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

// Send message
router.post('/admin/send-message', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { to, content, type } = req.body;
    const adminEmail = (req as any).adminEmail;

    // Validation
    if (!to || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message content too long (max 5000 characters)' });
    }

    // Create message
    const message = await db.createMessage({
      from: type === 'internal' ? `admin-internal:${adminEmail}` : adminEmail,
      to,
      content,
      type: type || 'outgoing'
    });

    // If it's an outgoing message to a user, also send email notification
    if (type === 'outgoing') {
      // Here you would integrate with your email service
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
    
    const success = await db.markMessageAsRead(messageId);
    
    if (!success) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ success: true, message: 'Message marked as read' });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Chat widget endpoint for users to send messages to admin
router.post('/api/chat/send', async (req: Request, res: Response) => {
  try {
    const { userEmail, content } = req.body;

    // Validation
    if (!userEmail || !content) {
      return res.status(400).json({ error: 'User email and content are required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message content too long (max 1000 characters)' });
    }

    // Create incoming message from user
    const message = await db.createMessage({
      from: userEmail,
      to: 'admin@contentscale.com',
      content,
      type: 'incoming'
    });

    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: message.id
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat history for user
router.get('/api/chat/history/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const messages = await db.getMessages();
    
    // Filter messages for this user
    const userMessages = messages.filter(msg => 
      msg.from === userEmail || msg.to === userEmail
    );
    
    // Sort by timestamp
    userMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    res.json(userMessages);

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

export default router;