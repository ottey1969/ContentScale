import type { Express } from "express";
import { storage } from "../storage";
import { chatService } from "../services/chatService";

export function registerChatRoutes(app: Express) {
  // Get chat messages for user
  app.get("/api/chat/messages", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      const messages = await storage.getChatMessages(userId, isAdmin);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get chat messages for specific user (admin only)
  app.get("/api/chat/messages/:targetUserId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const targetUserId = req.params.targetUserId;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const messages = await storage.getChatMessagesBetweenUsers(userId, targetUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send chat message
  app.post("/api/chat/send", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { message } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: userId,
        senderEmail: user.email,
        senderName: user.name || user.email.split('@')[0],
        message: message.trim(),
        timestamp: new Date(),
        isAdmin: user.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin',
        isRead: false
      };

      await storage.saveChatMessage(chatMessage);
      
      // Create activity log
      await storage.createActivity({
        userId,
        type: "chat_message_sent",
        title: "Sent chat message",
        description: `Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        metadata: { messageLength: message.length },
      });

      res.json({ 
        success: true, 
        message: "Message sent successfully",
        messageId: chatMessage.id
      });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Send admin message to specific user
  app.post("/api/chat/send-admin", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { message, targetUserId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }

      if (!targetUserId) {
        return res.status(400).json({ message: "Target user ID is required" });
      }

      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: userId,
        senderEmail: user.email,
        senderName: user.name || user.email.split('@')[0],
        targetUserId: targetUserId,
        message: message.trim(),
        timestamp: new Date(),
        isAdmin: true,
        isRead: false
      };

      await storage.saveChatMessage(chatMessage);
      
      // Create activity log
      await storage.createActivity({
        userId,
        type: "admin_message_sent",
        title: `Sent message to ${targetUser.email}`,
        description: `Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        metadata: { targetUserId, messageLength: message.length },
      });

      res.json({ 
        success: true, 
        message: "Admin message sent successfully",
        messageId: chatMessage.id
      });
    } catch (error) {
      console.error("Error sending admin message:", error);
      res.status(500).json({ message: "Failed to send admin message" });
    }
  });

  // Get online users (admin only)
  app.get("/api/chat/users", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const onlineUsers = await chatService.getOnlineUsers();
      
      // Add unread message counts
      const usersWithUnread = await Promise.all(
        onlineUsers.map(async (chatUser) => {
          const unreadCount = await storage.getUnreadMessageCount(chatUser.id);
          return {
            ...chatUser,
            unreadCount
          };
        })
      );

      res.json(usersWithUnread);
    } catch (error) {
      console.error("Error fetching online users:", error);
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  // Mark messages as read
  app.post("/api/chat/mark-read", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { messageIds } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!messageIds || !Array.isArray(messageIds)) {
        return res.status(400).json({ message: "Message IDs array is required" });
      }

      await storage.markChatMessagesAsRead(userId, messageIds);

      res.json({ 
        success: true, 
        message: "Messages marked as read"
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Get chat statistics (admin only)
  app.get("/api/chat/stats", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = {
        connectedUsers: chatService.getConnectedUsersCount(),
        connectedAdmins: chatService.getAdminUsersCount(),
        totalMessages: await storage.getTotalChatMessages(),
        messagesLast24h: await storage.getChatMessagesLast24h(),
        activeConversations: await storage.getActiveChatConversations()
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching chat statistics:", error);
      res.status(500).json({ message: "Failed to fetch chat statistics" });
    }
  });

  // Delete chat message (admin only)
  app.delete("/api/chat/message/:messageId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const messageId = req.params.messageId;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user?.email === 'ottmar.francisca1969@gmail.com' || userId === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteChatMessage(messageId);

      // Create activity log
      await storage.createActivity({
        userId,
        type: "chat_message_deleted",
        title: "Deleted chat message",
        description: `Message ID: ${messageId}`,
        metadata: { messageId },
      });

      res.json({ 
        success: true, 
        message: "Message deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
}

