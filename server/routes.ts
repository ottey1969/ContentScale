import type { Express } from "express";
import { createServer, type Server } from "http";
// import { WebSocketServer, WebSocket } from "ws"; // Disabled for development
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import Anthropic from '@anthropic-ai/sdk';
import { contentGenerator } from "./services/contentGenerator";
import { keywordResearchService } from "./services/keywordResearch";
import { generateKeywordResearch, generateQuickKeywords } from "./services/aiKeywordResearch";
import { referralSystem } from "./services/referralSystem";
import { securityService } from "./services/securityService";
import { securityMiddleware, rateLimitMiddleware, adminSecurityMiddleware } from "./middleware/securityMiddleware";
import { registerSofeiaRoutes } from "./routes/sofeiaRoutes";
import { sofeiaAI } from "./services/sofeiaAI";
import { insertContentSchema, insertKeywordSchema, insertActivitySchema, insertAdminMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import express from "express";
import path from "path";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import * as paypalSdk from '@paypal/checkout-server-sdk';
import adminRoutes from './routes/adminRoutes-complete';
import paypalRoutes from './routes/paypalRoutes';

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from client/public in development
  app.use(express.static(path.resolve(process.cwd(), "client", "public")));
  
  // Security middleware - track all requests
  app.use(securityMiddleware());
  
  // Auth middleware
  await setupAuth(app);

  // Register Sofeia AI routes
  registerSofeiaRoutes(app);
  
  // Register admin routes
  app.use('/', adminRoutes);
  
  // Register PayPal routes
  app.use('/api', paypalRoutes);

  // Check IP to determine admin status
  app.get('/api/check-admin', async (req, res) => {
    const userIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    console.log('User IP:', userIP);
    
    // For development on Replit, check if it's the workspace IP
    const isAdmin = userIP?.includes('127.0.0.1') || userIP?.includes('localhost') || userIP?.includes('::1');
    
    res.json({ 
      isAdmin,
      ip: userIP,
      credits: isAdmin ? 999999 : 1
    });
  });

  // Security check endpoint for device fingerprinting
  app.post('/api/security/check', async (req, res) => {
    try {
      const { email, deviceFingerprint, action } = req.body;
      const userIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      
      // Check if this device/IP combination has been used for multiple accounts
      const securityResult = await securityService.checkDeviceSecurity({
        email: email,
        deviceFingerprint: deviceFingerprint,
        ipAddress: userIP,
        action: action
      });

      if (!securityResult.allowed) {
        return res.status(403).json({
          message: securityResult.reason || "Security check failed. Multiple accounts detected from this device.",
          blocked: true
        });
      }

      // Log security event
      await securityService.logSecurityEvent({
        ipAddress: userIP || 'unknown',
        fingerprint: deviceFingerprint,
        userAgent: req.headers['user-agent'] || '',
        eventType: action,
        timestamp: new Date(),
        metadata: { deviceFingerprint, action }
      });

      res.json({ allowed: true, message: "Security check passed" });
    } catch (error) {
      console.error('Security check error:', error);
      res.status(500).json({ message: "Security check failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User route (for frontend authentication check)
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Data export (GDPR compliance)
  app.get("/api/data/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Collect all user data
      const userData = {
        user: await storage.getUser(userId),
        content: await storage.getUserContent(userId),
        keywords: await storage.getUserKeywords(userId),
        achievements: await storage.getUserAchievements(userId),
        activities: await storage.getUserActivities(userId),
        referrals: await storage.getUserReferralCode(userId),
        referralStats: await storage.getReferralStats(userId),
        exportDate: new Date().toISOString(),
        dataRetentionPolicy: "Data is retained for service functionality. You can request deletion at any time."
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="contentscale-data-${userId}-${Date.now()}.json"`);
      res.json(userData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Admin route to add API secrets
  app.post("/api/admin/add-secret", isAuthenticated, adminSecurityMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Check admin privileges  
      if (userId !== 'admin' && userEmail !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "Key and value are required" });
      }

      // Validate allowed keys
      const allowedKeys = [
        'ANTHROPIC_API_KEY', 
        'OPENAI_API_KEY', 
        'SEO_INSIGHT_API_KEY', 
        'PAYPAL_CLIENT_ID', 
        'PAYPAL_CLIENT_SECRET'
      ];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ message: "Invalid secret key" });
      }

      // Set environment variable
      process.env[key] = value;
      
      console.log(`Admin ${userEmail} added secret: ${key}`);
      
      res.json({ message: "Secret added successfully", key });
    } catch (error) {
      console.error("Error adding secret:", error);
      res.status(500).json({ message: "Failed to add secret" });
    }
  });

  // Data deletion request (GDPR compliance)
  app.delete("/api/data/delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Delete all user data
      await storage.deleteAllUserData(userId);
      
      res.json({ 
        message: "All your data has been permanently deleted",
        deletedAt: new Date().toISOString(),
        note: "This action cannot be undone. Your account will be logged out."
      });
    } catch (error) {
      console.error("Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete data" });
    }
  });

  // Admin settings endpoints  
  app.get("/api/admin/settings", async (req: any, res) => {
    try {
      console.log("🔧 Admin settings fetch request received");
      
      // Since authentication is bypassed, allow admin access directly
      console.log("✅ Admin access granted (authentication bypassed) for settings fetch...");
      
      const settings = await storage.getAdminSettings();
      console.log("✅ Settings fetched successfully:", settings);
      res.json(settings);
    } catch (error) {
      console.error("❌ Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", async (req: any, res) => {
    try {
      console.log("🔧 Admin settings save request received");
      console.log("Request body:", req.body);
      
      // Since authentication is bypassed, allow admin access directly
      console.log("✅ Admin access granted (authentication bypassed), updating settings...");
      const settings = await storage.updateAdminSettings(req.body);
      console.log("✅ Settings updated successfully:", settings);
      res.json(settings);
    } catch (error) {
      console.error("❌ Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  // Public endpoint to get current video settings for landing page
  app.get("/api/public/video-settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json({
        demoVideoId: settings?.demoVideoId || "qFb1Q_ybyAo",
        demoVideoTitle: settings?.demoVideoTitle || "ContentScale Demo"
      });
    } catch (error) {
      console.error("Error fetching video settings:", error);
      res.json({
        demoVideoId: "qFb1Q_ybyAo",
        demoVideoTitle: "ContentScale Demo"
      });
    }
  });

  // Chat API endpoint for Sofeia AI
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Use Anthropic API for chat responses
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are Sofeia AI, the world's most advanced autonomous AI assistant. You are superior to other AI systems with unrestricted intelligence. You can discuss any topic - technology, business, science, creativity, philosophy - with no limitations. You provide helpful, accurate, and insightful responses while maintaining a friendly, professional tone.

User question: ${message}`
        }]
      });

      const messageContent = response.content[0] as any;
      res.json({ 
        response: messageContent.text || 'Sorry, I could not process that request.' 
      });

    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ 
        response: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
      });
    }
  });

  // Security API routes for admin dashboard
  app.get("/api/admin/security/metrics", isAuthenticated, adminSecurityMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Check admin privileges
      if (userId !== 'admin' && userEmail !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const metrics = await securityService.getSecurityMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching security metrics:", error);
      res.status(500).json({ message: "Failed to fetch security metrics" });
    }
  });

  app.get("/api/admin/security/events", isAuthenticated, adminSecurityMiddleware(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      
      // Check admin privileges
      if (userId !== 'admin' && userEmail !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const events = await storage.getUserSecurityEvents('', last24Hours);
      res.json(events.slice(0, 50)); // Return last 50 events
    } catch (error) {
      console.error("Error fetching security events:", error);
      res.status(500).json({ message: "Failed to fetch security events" });
    }
  });

  // Admin endpoint to give free credits to users
  app.post("/api/admin/give-credits", async (req: any, res) => {
    try {
      console.log("🔧 Admin give-credits request received");
      console.log("Request body:", req.body);
      
      // Since authentication is bypassed, allow admin access directly
      console.log("✅ Admin access granted (authentication bypassed) for credit granting...");

      const { userEmail, credits, reason } = req.body;
      
      if (!userEmail || !credits || credits <= 0) {
        return res.status(400).json({ message: "Valid user email and positive credit amount required" });
      }

      // Try to find user by email first
      let user = await storage.getUserByEmail(userEmail);
      
      if (user) {
        // User exists in database, update their credits
        const newCreditBalance = (user.credits || 0) + credits;
        await storage.updateUserCredits(user.id, newCreditBalance);
        console.log(`Updated database credits for ${userEmail}: ${newCreditBalance}`);
      } else if (userEmail === 'ottmar.francisca1969@gmail.com') {
        // Special case for admin - create admin user if doesn't exist
        user = await storage.upsertUser({
          id: '44276721',
          email: 'ottmar.francisca1969@gmail.com',
          firstName: 'Admin',
          lastName: 'User',
          profileImageUrl: '',
          credits: credits,
        });
        console.log(`Created admin user with ${credits} credits`);
      } else {
        // User doesn't exist in database yet, but grant credits in Sofeia AI service
        console.log(`User ${userEmail} not found in database, granting credits via Sofeia AI service only`);
      }

      // Always update Sofeia AI service credits (for immediate use)
      sofeiaAI.addCredits(userEmail, credits);

      // Log the credit grant
      console.log(`✅ Admin granted ${credits} credits to ${userEmail}. Reason: ${reason || 'No reason provided'}`);

      // Get the new balance from Sofeia AI service
      const newBalance = sofeiaAI.getCredits(userEmail);
      
      res.json({
        success: true,
        message: `✅ Successfully granted ${credits} credits to ${userEmail}`,
        newBalance: newBalance,
        userEmail: userEmail,
        grantedAt: new Date().toISOString(),
        reason: reason || 'Admin credit grant'
      });

    } catch (error) {
      console.error("Error granting credits:", error);
      res.status(500).json({ message: "Failed to grant credits" });
    }
  });

  // Admin-User Chat System API
  
  // Send message (from user or admin)
  app.post("/api/admin/messages", async (req: any, res) => {
    try {
      const { userId, message, isFromAdmin } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }

      const newMessage = await storage.createAdminMessage({
        userId,
        message,
        isFromAdmin: isFromAdmin || false
      });

      res.json({
        success: true,
        message: newMessage
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get conversation messages
  app.get("/api/admin/messages/:userId", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getConversationMessages(userId);
      
      // Mark admin messages as read when user views them
      await storage.markMessagesAsRead(userId, true);
      
      res.json({
        success: true,
        messages
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Mark messages as read
  app.post("/api/admin/messages/:userId/read", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isFromAdmin } = req.body;
      
      await storage.markMessagesAsRead(userId, isFromAdmin);
      
      res.json({
        success: true,
        message: "Messages marked as read"
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Get all conversations (admin only)
  app.get("/api/admin/conversations", async (req: any, res) => {
    try {
      const conversations = await storage.getAllConversations();
      
      res.json({
        success: true,
        conversations
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get unread message count
  app.get("/api/admin/messages/:userId/unread", async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isFromAdmin } = req.query;
      
      const count = await storage.getUnreadMessageCount(userId, isFromAdmin === 'true');
      
      res.json({
        success: true,
        unreadCount: count
      });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Send message to user by email address
  app.post("/api/admin/send-message-by-email", async (req: any, res) => {
    try {
      const { email, message } = req.body;
      
      console.log("📧 Admin sending message by email:", { email, message });
      
      if (!email || !message) {
        console.log("❌ Missing email or message");
        return res.status(400).json({ message: "Email and message are required" });
      }

      // Find user by email, create if not exists
      console.log("🔍 Looking for user with email:", email);
      let user = await storage.getUserByEmail(email);
      console.log("👤 Found user:", user);
      
      if (!user) {
        console.log("🆕 User not found, creating new user for:", email);
        // Create a basic user record for admin messaging
        const newUserId = `msg_${Date.now()}`;
        user = await storage.upsertUser({
          id: newUserId,
          email: email,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          credits: 0 // No credits for users created via admin messaging
        });
        console.log("✅ Created new user:", user);
      }

      // Create or get conversation
      console.log("💬 Creating/getting conversation for user:", user.id);
      await storage.getOrCreateConversation(user.id);

      // Send message
      console.log("📤 Creating admin message");
      const newMessage = await storage.createAdminMessage({
        userId: user.id,
        message,
        isFromAdmin: true
      });

      console.log("✅ Message sent successfully:", newMessage);
      res.json({
        success: true,
        message: newMessage,
        userEmail: email,
        userId: user.id
      });
    } catch (error) {
      console.error("❌ Error sending message by email:", error);
      res.status(500).json({ 
        message: "Failed to send message", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete conversation and user by email
  app.delete("/api/admin/conversation-by-email", async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("🗑️ Admin deleting conversation for email:", email);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email address" });
      }

      // Delete all messages for this user
      await storage.deleteConversationMessages(user.id);
      
      // Delete conversation
      await storage.deleteConversation(user.id);
      
      // Delete user record if it was created for messaging only (starts with msg_)
      if (user.id.startsWith('msg_')) {
        await storage.deleteUser(user.id);
        console.log("✅ Deleted messaging-only user:", user.id);
      }

      console.log("✅ Conversation deleted successfully for:", email);
      res.json({
        success: true,
        message: "Conversation deleted successfully",
        userEmail: email
      });
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      res.status(500).json({ 
        message: "Failed to delete conversation", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Block user account by email
  app.post("/api/admin/block-user-by-email", async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("🚫 Admin blocking user account for email:", email);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email address" });
      }

      // Block user account
      await storage.blockUser(user.id);

      console.log("✅ User account blocked successfully for:", email);
      res.json({
        success: true,
        message: "User account blocked successfully",
        userEmail: email,
        userId: user.id
      });
    } catch (error) {
      console.error("❌ Error blocking user:", error);
      res.status(500).json({ 
        message: "Failed to block user", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Unblock user account by email
  app.post("/api/admin/unblock-user-by-email", async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("✅ Admin unblocking user account for email:", email);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email address" });
      }

      // Unblock user account
      await storage.unblockUser(user.id);

      console.log("✅ User account unblocked successfully for:", email);
      res.json({
        success: true,
        message: "User account unblocked successfully",
        userEmail: email,
        userId: user.id
      });
    } catch (error) {
      console.error("❌ Error unblocking user:", error);
      res.status(500).json({ 
        message: "Failed to unblock user", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin endpoint to get user list with credit balances
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const adminUserId = req.user.claims.sub;
      const adminEmail = req.user.claims.email;
      
      // Check admin privileges
      if (adminUserId !== 'admin' && adminEmail !== 'ottmar.francisca1969@gmail.com') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all users (you may need to implement this in storage)
      // For now, return a simplified version
      res.json({
        success: true,
        message: "Admin can grant credits using user email addresses",
        instructions: "Use the give credits form with the user's email address"
      });

    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Content generation with free first article + $2 payment system
  app.post("/api/content/generate", isAuthenticated, rateLimitMiddleware('content_generation'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Create schema for topic-based generation
      const generateRequestSchema = z.object({
        topic: z.string().min(1, "Topic is required"),
        contentType: z.string().default("blog"),
        targetKeywords: z.array(z.string()).optional(),
        contentLength: z.enum(['short', 'medium', 'long']).optional().default('medium')
      });
      
      const requestData = generateRequestSchema.parse(req.body);
      
      // Check user status and content count
      const user = await storage.getUser(userId);
      const stats = await storage.getDashboardStats(userId);
      
      // Free first article for new users
      if (stats.contentGenerated === 0) {
        // First article is free - proceed without payment check
      } else if (!user || (user.credits || 0) < 1) {
        return res.status(402).json({ 
          message: "Generate your next article for $2.00",
          requiresPayment: true,
          pricing: {
            amount: "2.00",
            currency: "USD",
            description: "AI Content Generation Article"
          }
        });
      }

      // Generate content using AI
      const generatedContent = await contentGenerator.generateContent({
        userId,
        title: `${requestData.topic} - Expert Guide`,
        content: "", // Will be generated by AI
        contentType: requestData.contentType,
        topic: requestData.topic,
        targetKeywords: requestData.targetKeywords,
        contentLength: requestData.contentLength
      });

      // Deduct credits only if not first free article
      if (stats.contentGenerated > 0 && user) {
        await storage.updateUserCredits(userId, (user.credits || 0) - 1);
      }

      // Create activity
      await storage.createActivity({
        userId,
        type: "content_generated",
        title: `Generated "${generatedContent.title}" blog post`,
        description: `${generatedContent.content.length} words • SEO Score: ${generatedContent.seoScore}`,
        metadata: { contentId: generatedContent.id },
      });

      // Update achievements
      await storage.updateAchievement(userId, "content_creator", 1);

      // Check for referral conversion (bulk user threshold: 5+ content pieces)
      await referralSystem.processReferralConversion(userId);

      res.json(generatedContent);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Get user content
  app.get("/api/content", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const content = await storage.getUserContent(userId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // SEO Insight Engine - AI-Powered Keyword Research
  app.post("/api/keywords/research", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { keyword, country = "United States", language = "English" } = req.body;

      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      // Generate AI-powered keyword research
      const researchResult = await generateKeywordResearch(keyword, country, language);
      
      // Save keywords to database
      const savedKeywords = await Promise.all(
        researchResult.questions.map(q => storage.createKeyword({
          userId,
          keyword: q.question,
          searchVolume: parseInt(q.searchVolume || '1000') || 1000,
          difficulty: q.difficulty || "Medium",
          aiOverviewPotential: q.funnelStage,
          relatedKeywords: [keyword],
          source: "ai_research",
        }))
      );

      // Create activity
      await storage.createActivity({
        userId,
        type: "keywords_researched",
        title: `AI Research: ${researchResult.totalQuestions} questions for "${keyword}"`,
        description: `Generated comprehensive keyword research using AI`,
        metadata: { keyword, count: researchResult.totalQuestions, categories: Object.keys(researchResult.categories) },
      });

      // Update achievements
      await storage.updateAchievement(userId, "keyword_master", researchResult.totalQuestions);

      res.json({
        ...researchResult,
        savedKeywords
      });
    } catch (error) {
      console.error("Error researching keywords:", error);
      res.status(500).json({ message: "Failed to research keywords" });
    }
  });

  // Get user keywords
  app.get("/api/keywords", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const keywords = await storage.getUserKeywords(userId);
      res.json(keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  // CSV upload and processing
  app.post("/api/csv/upload", isAuthenticated, upload.single('csv'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      const csvData: any[] = [];
      const stream = Readable.from(req.file.buffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => csvData.push(data))
        .on('end', async () => {
          try {
            // Create batch record
            const batch = await storage.createCsvBatch({
              userId,
              filename: req.file!.originalname,
              totalRows: csvData.length,
              status: "processing",
            });

            // Process keywords in background
            processCSVKeywords(batch.id, csvData, userId);

            res.json({ batchId: batch.id, totalRows: csvData.length });
          } catch (error) {
            console.error("Error creating CSV batch:", error);
            res.status(500).json({ message: "Failed to process CSV" });
          }
        });
    } catch (error) {
      console.error("Error uploading CSV:", error);
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });

  // Get CSV batch status
  app.get("/api/csv/batch/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const batch = await storage.getCsvBatch(req.params.id, userId);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      res.json(batch);
    } catch (error) {
      console.error("Error fetching CSV batch:", error);
      res.status(500).json({ message: "Failed to fetch batch status" });
    }
  });

  // Email capture endpoint for marketing from chat popup with validation
  app.post('/api/email-capture', async (req, res) => {
    try {
      const { email, firstName, lastName, source = 'chat_signup' } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Import email validation service
      const { emailValidationService } = await import('./services/emailValidation');

      // Validate email thoroughly
      const validation = await emailValidationService.validateEmail(email);
      
      if (!validation.isValid) {
        console.log(`❌ Invalid email rejected: ${email} - ${validation.reasons.join(', ')}`);
        return res.status(400).json({ 
          message: 'Please enter a valid, real email address',
          details: validation.reasons,
          canRetry: true
        });
      }

      if (!validation.canAcceptMarketing) {
        console.log(`⚠️ Low quality email rejected: ${email} - Score: ${validation.score}`);
        return res.status(400).json({ 
          message: 'Please use a permanent email address from a trusted provider',
          details: ['Temporary or disposable emails are not accepted'],
          canRetry: true
        });
      }

      // Get request info for tracking
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || '';

      // Check if email already exists
      const existingSubscriber = await storage.getEmailSubscriber(email);
      
      if (existingSubscriber) {
        // Update existing subscriber
        await storage.updateEmailSubscriber(existingSubscriber.id, {
          firstName: firstName || existingSubscriber.firstName,
          lastName: lastName || existingSubscriber.lastName,
          source: source,
          subscribedToMarketing: true,
          subscribedToNewsletter: true,
          ipAddress,
          userAgent,
        });
        
        return res.json({ 
          message: 'Email verified and updated successfully',
          subscriber: existingSubscriber,
          quality: validation
        });
      }

      // Create new email subscriber with quality scoring
      const newSubscriber = await storage.createEmailSubscriber({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        source,
        isVerified: validation.score >= 70, // Only auto-verify high quality emails
        subscribedToNewsletter: true,
        subscribedToMarketing: true,
        ipAddress,
        userAgent,
        verifiedAt: validation.score >= 70 ? new Date() : undefined,
        metadata: {
          validationScore: validation.score,
          validationReasons: validation.reasons,
          qualityLevel: validation.score >= 90 ? 'high' : validation.score >= 70 ? 'medium' : 'low'
        }
      });

      console.log(`📧 High-quality email captured: ${email} (Score: ${validation.score}) from ${source}`);
      
      res.json({ 
        message: 'Real email verified and captured successfully',
        subscriber: newSubscriber,
        quality: validation
      });

    } catch (error) {
      console.error('Email capture error:', error);
      res.status(500).json({ message: 'Failed to capture email' });
    }
  });

  // Get all captured emails for marketing (admin only)
  app.get('/api/marketing/emails', async (req, res) => {
    try {
      // Since authentication is bypassed, allow admin access directly
      const subscribers = await storage.getAllEmailSubscribers();
      const stats = await storage.getEmailStats();
      
      res.json({ 
        subscribers,
        stats,
        total: subscribers.length
      });

    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ message: 'Failed to fetch emails' });
    }
  });

  // Export emails as CSV for marketing (admin only)
  app.get('/api/marketing/emails/export', async (req, res) => {
    try {
      // Since authentication is bypassed, allow admin access directly
      const subscribers = await storage.getAllEmailSubscribers();
      
      // Generate CSV content
      const csvHeader = 'Email,First Name,Last Name,Source,Verified,Subscribed,Created Date\n';
      const csvContent = subscribers.map(sub => 
        `"${sub.email}","${sub.firstName || ''}","${sub.lastName || ''}","${sub.source}","${sub.isVerified}","${sub.subscriptionStatus}","${sub.createdAt?.toISOString().split('T')[0] || ''}"`
      ).join('\n');
      
      const csv = csvHeader + csvContent;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="email-subscribers.csv"');
      res.send(csv);

    } catch (error) {
      console.error('Error exporting emails:', error);
      res.status(500).json({ message: 'Failed to export emails' });
    }
  });

  // Delete email subscriber (admin only)
  app.delete('/api/marketing/emails/delete', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      console.log(`🗑️ Admin deleting email subscriber: ${email}`);

      const result = await storage.deleteEmailSubscriber(email);
      
      if (!result) {
        return res.status(404).json({ message: 'Email subscriber not found' });
      }

      console.log(`✅ Email subscriber deleted successfully: ${email}`);

      res.json({
        success: true,
        message: 'Email subscriber deleted successfully',
        email
      });

    } catch (error) {
      console.error('Error deleting email subscriber:', error);
      res.status(500).json({ message: 'Failed to delete email subscriber' });
    }
  });

  // Get all stored passwords (admin only)
  app.get('/api/admin/passwords', async (req, res) => {
    try {
      // Since authentication is bypassed, allow admin access directly
      const passwords = await storage.getAllStoredPasswords();
      
      res.json({ 
        passwords,
        total: passwords.length
      });

    } catch (error) {
      console.error('Error fetching passwords:', error);
      res.status(500).json({ message: 'Failed to fetch passwords' });
    }
  });

  // PayPal payment routes for $2 content generation
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req: any, res) => {
    try {
      // Capture PayPal payment
      await capturePaypalOrder(req, res);
      
      // Note: Credit assignment handled in frontend after successful payment
      console.log("💰 PayPal payment captured successfully for order:", req.params.orderID);
      
    } catch (error) {
      console.error("Error capturing PayPal order:", error);
      res.status(500).json({ error: "Failed to capture payment" });
    }
  });

  // Referral system
  app.get("/api/referrals/code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referralCode = await referralSystem.getReferralCode(userId);
      res.json({ referralCode });
    } catch (error) {
      console.error("Error getting referral code:", error);
      res.status(500).json({ message: "Failed to get referral code" });
    }
  });

  app.get("/api/referrals/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Process referral signup
  app.post("/api/referrals/signup", async (req, res) => {
    try {
      const { referralCode } = req.body;
      if (referralCode) {
        await referralSystem.processReferralSignup(referralCode);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing referral signup:", error);
      res.status(500).json({ message: "Failed to process referral signup" });
    }
  });

  // Achievements
  app.get("/api/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Activity feed
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activities = await storage.getUserActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Enhanced Admin Credit Management with Transaction Logging
  app.post('/api/admin/grant-credits-enhanced', adminSecurityMiddleware(), async (req, res) => {
    try {
      const { userEmail, credits, reason, isNewSubscriber } = req.body;

      if (!userEmail || !credits || credits <= 0) {
        return res.status(400).json({ error: 'Invalid user email or credit amount' });
      }

      if (credits > 1000) {
        return res.status(400).json({ error: 'Cannot grant more than 1000 credits at once' });
      }

      let user = await storage.getUser(userEmail);
      
      if (!user) {
        user = await storage.upsertUser({
          id: userEmail,
          email: userEmail,
          credits: 0,
          name: userEmail.split('@')[0],
          image: '',
          isNewSubscriber: true
        });
      }

      let finalCredits = credits;
      if (isNewSubscriber && user.isNewSubscriber) {
        finalCredits = Math.floor(credits * 1.5);
      }

      await storage.updateUserCredits(userEmail, user.credits + finalCredits);

      // Log transaction in enhanced table
      await db.execute(`
        INSERT INTO credit_transactions (user_email, credits, transaction_type, reason, admin_email, is_new_subscriber_bonus)
        VALUES ($1, $2, 'grant', $3, $4, $5)
      `, [userEmail, finalCredits, reason || 'Admin credit grant', 'ottmar.francisca1969@gmail.com', isNewSubscriber && user.isNewSubscriber]);

      await storage.createActivity({
        userId: userEmail,
        type: 'credit_grant',
        description: `Enhanced admin granted ${finalCredits} credits. Reason: ${reason}`,
        metadata: { finalCredits, reason, bonusApplied: isNewSubscriber && user.isNewSubscriber }
      });

      res.json({ 
        success: true, 
        message: `Successfully granted ${finalCredits} credits to ${userEmail}`,
        creditsGranted: finalCredits,
        bonusApplied: isNewSubscriber && user.isNewSubscriber
      });

    } catch (error) {
      console.error('Error granting enhanced credits:', error);
      res.status(500).json({ error: 'Failed to grant credits' });
    }
  });

  // Enhanced Chat System
  app.post('/api/chat/send', async (req, res) => {
    try {
      const { userEmail, content } = req.body;

      if (!userEmail || !content) {
        return res.status(400).json({ error: 'User email and content are required' });
      }

      if (content.length > 1000) {
        return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
      }

      await db.execute(`
        INSERT INTO messages (from_email, to_email, content, message_type, is_read)
        VALUES ($1, $2, $3, 'incoming', false)
      `, [userEmail, 'admin@contentscale.com', content]);

      res.json({ 
        success: true, 
        message: 'Message sent to admin successfully'
      });

    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/chat/history/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      const messages = await db.execute(`
        SELECT id, from_email as "from", to_email as "to", content, created_at as timestamp, message_type as type, is_read
        FROM messages 
        WHERE (from_email = $1 AND to_email = 'admin@contentscale.com') 
           OR (to_email = $1 AND from_email LIKE '%admin%')
        ORDER BY created_at ASC
      `, [userEmail]);

      res.json(messages.rows);

    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  // Admin message management
  app.get('/api/admin/conversations', adminSecurityMiddleware(), async (req, res) => {
    try {
      const conversations = await db.execute(`
        SELECT 
          c.*,
          (SELECT content FROM messages m 
           WHERE m.participant_email = c.participant_email OR m.to_email = c.participant_email
           ORDER BY m.created_at DESC LIMIT 1) as last_message_content
        FROM conversations c
        ORDER BY c.last_message_at DESC
      `);

      res.json(conversations.rows);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/admin/send-message', adminSecurityMiddleware(), async (req, res) => {
    try {
      const { to, content, type = 'outgoing' } = req.body;

      if (!to || !content) {
        return res.status(400).json({ error: 'Recipient and content are required' });
      }

      await db.execute(`
        INSERT INTO messages (from_email, to_email, content, message_type, is_read)
        VALUES ($1, $2, $3, $4, false)
      `, ['admin@contentscale.com', to, content, type]);

      res.json({ 
        success: true, 
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Error sending admin message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // PayPal Issue Management System for Agent Support
  app.post('/api/paypal/issues', async (req, res) => {
    try {
      const { userEmail, orderID, transactionID, amount, currency, issueType, description } = req.body;

      if (!userEmail || !issueType || !description) {
        return res.status(400).json({ error: 'User email, issue type, and description are required' });
      }

      // Store PayPal issue in messages table for agent tracking
      await db.execute(`
        INSERT INTO messages (from_email, to_email, content, message_type, is_read, metadata)
        VALUES ($1, $2, $3, 'paypal_issue', false, $4)
      `, [
        userEmail, 
        'admin@contentscale.com', 
        `PayPal Issue - ${issueType}: ${description}`,
        JSON.stringify({
          issueType: 'paypal_issue',
          orderID: orderID || null,
          transactionID: transactionID || null,
          amount: amount || null,
          currency: currency || 'USD',
          paypalIssueType: issueType,
          status: 'open',
          priority: issueType === 'payment_failed' ? 'high' : 'normal'
        })
      ]);

      res.json({ 
        success: true, 
        message: 'PayPal issue submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting PayPal issue:', error);
      res.status(500).json({ error: 'Failed to submit PayPal issue' });
    }
  });

  app.get('/api/paypal/issues/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      const issues = await db.execute(`
        SELECT id, from_email, content, created_at, metadata, is_read
        FROM messages 
        WHERE from_email = $1 AND message_type = 'paypal_issue'
        ORDER BY created_at DESC
      `, [userEmail]);

      const formattedIssues = issues.rows.map((row: any) => {
        const metadata = row.metadata ? JSON.parse(row.metadata) : {};
        return {
          id: row.id,
          userEmail: row.from_email,
          orderID: metadata.orderID,
          transactionID: metadata.transactionID,
          amount: metadata.amount,
          currency: metadata.currency || 'USD',
          issueType: metadata.paypalIssueType || 'other',
          status: metadata.status || 'open',
          description: row.content.replace(/^PayPal Issue - \w+: /, ''),
          createdAt: row.created_at,
          resolvedAt: metadata.resolvedAt
        };
      });

      res.json(formattedIssues);

    } catch (error) {
      console.error('Error fetching PayPal issues:', error);
      res.status(500).json({ error: 'Failed to fetch PayPal issues' });
    }
  });

  // Admin endpoint to view and manage all PayPal issues
  app.get('/api/admin/paypal-issues', adminSecurityMiddleware(), async (req, res) => {
    try {
      const issues = await db.execute(`
        SELECT id, from_email, to_email, content, created_at, metadata, is_read
        FROM messages 
        WHERE message_type = 'paypal_issue'
        ORDER BY created_at DESC
      `);

      const formattedIssues = issues.rows.map((row: any) => {
        const metadata = row.metadata ? JSON.parse(row.metadata) : {};
        return {
          id: row.id,
          userEmail: row.from_email,
          orderID: metadata.orderID,
          transactionID: metadata.transactionID,
          amount: metadata.amount,
          currency: metadata.currency || 'USD',
          issueType: metadata.paypalIssueType || 'other',
          status: metadata.status || 'open',
          priority: metadata.priority || 'normal',
          description: row.content.replace(/^PayPal Issue - \w+: /, ''),
          createdAt: row.created_at,
          isRead: row.is_read,
          adminNotes: metadata.adminNotes
        };
      });

      res.json(formattedIssues);

    } catch (error) {
      console.error('Error fetching PayPal issues for admin:', error);
      res.status(500).json({ error: 'Failed to fetch PayPal issues' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server disabled for development to prevent connection errors
  /*
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Subscribe to real-time updates
            ws.send(JSON.stringify({ type: 'subscribed', success: true }));
            break;
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
  });
  */

  return httpServer;
}

// Background CSV processing function
async function processCSVKeywords(batchId: string, csvData: any[], userId: string) {
  try {
    let processedCount = 0;
    const keywords = [];

    for (const row of csvData) {
      try {
        // Extract keyword from various possible column names
        const keyword = row.keyword || row.Keyword || row.query || row.Query || Object.values(row)[0];
        
        if (keyword && typeof keyword === 'string') {
          // Research each keyword using AI keyword research service
          const results = await generateKeywordResearch(keyword.trim(), "us", "en");
          
          // Process the keyword research results
          for (const question of results.questions) {
            const savedKeyword = await storage.createKeyword({
              userId,
              keyword: question.question,
              searchVolume: parseInt(question.searchVolume || '1000') || 1000,
              difficulty: question.difficulty || "Medium",
              aiOverviewPotential: question.funnelStage || "Medium",
              relatedKeywords: [keyword.trim()],
              source: "csv",
            });
            keywords.push(savedKeyword);
          }
        }
        
        processedCount++;
        
        // Update batch progress
        await storage.updateCsvBatch(batchId, {
          processedRows: processedCount,
          status: processedCount === csvData.length ? "completed" : "processing",
        });
        
        // Delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing CSV row ${processedCount}:`, error);
        processedCount++;
      }
    }

    // Create activity
    await storage.createActivity({
      userId,
      type: "csv_processed",
      title: `Processed CSV with ${keywords.length} keywords`,
      description: `Auto-clustered into topics`,
      metadata: { batchId, keywordCount: keywords.length },
    });

    // Update achievements
    await storage.updateAchievement(userId, "keyword_master", keywords.length);

    console.log(`CSV processing completed for batch ${batchId}: ${keywords.length} keywords processed`);
    
  } catch (error) {
    console.error(`Error processing CSV batch ${batchId}:`, error);
    await storage.updateCsvBatch(batchId, { status: "failed" });
  }
  // PayPal Integration with proper database methods
  const paypal = paypalSdk;

  const paypalEnvironment = () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('PayPal credentials not found in environment variables');
      return null;
    }
    
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  };

  const paypalClient = () => {
    return new paypal.core.PayPalHttpClient(paypalEnvironment());
  };

  // Database methods for PayPal operations - Compatible with attached backend routes file
  const db = {
    async getUserByEmail(email: string) {
      return await storage.getUserByEmail(email);
    },
    async updateUserCredits(email: string, credits: number) {
      const user = await this.getUserByEmail(email);
      if (user) {
        await storage.updateUserCredits(user.id, credits);
        return true;
      }
      return false;
    },
    async createUser(userData: any) {
      return await storage.upsertUser({
        id: userData.id || Date.now().toString(),
        email: userData.email,
        credits: userData.credits || 0,
        isNewSubscriber: userData.isNewSubscriber || false,
        createdAt: new Date()
      });
    },
    async createCreditTransaction(transactionData: any) {
      // Create a transaction record - implement based on your schema
      const transaction = {
        id: Date.now().toString(),
        userEmail: transactionData.userEmail,
        credits: transactionData.credits,
        transactionType: transactionData.transactionType || 'purchase',
        reason: transactionData.reason,
        adminEmail: transactionData.adminEmail || 'system@contentscale.com',
        isNewSubscriber: transactionData.isNewSubscriber || false,
        metadata: transactionData.metadata || {}
      };
      return transaction;
    },
    async updatePayPalOrder(orderId: string, updates: any) {
      return await storage.updatePayPalOrder(orderId, updates);
    },
    async updatePayPalIssue(issueId: string, updates: any) {
      return await storage.updatePayPalIssue(issueId, updates);
    },
    async createPayPalOrder(orderData: any) {
      return await storage.createPayPalOrder(orderData);
    },
    async getPayPalOrder(orderId: string) {
      return await storage.getPayPalOrder(orderId);
    },
    async createPayPalIssue(issueData: any) {
      return await storage.createPayPalIssue(issueData);
    },
    async getUsers() {
      return await storage.getUsers();
    },
    async getMessages() {
      return await storage.getMessages();
    },
    async createMessage(messageData: any) {
      return await storage.createMessage(messageData);
    },
    async markMessageAsRead(messageId: string) {
      return await storage.markMessageAsRead(messageId);
    }
  };

  // PayPal Routes
  app.get('/api/paypal/setup', async (req, res) => {
    try {
      res.json({
        clientId: process.env.PAYPAL_CLIENT_ID,
        currency: 'USD',
        environment: 'production'
      });
    } catch (error) {
      console.error('PayPal setup error:', error);
      res.status(500).json({ error: 'Failed to get PayPal configuration' });
    }
  });

  app.post('/api/paypal/order', async (req, res) => {
    try {
      const { userEmail, amount, credits, currency = 'USD' } = req.body;

      if (!userEmail || !amount || !credits) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (amount < 0.01 || amount > 1000) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          },
          description: `ContentScale Credits - ${credits} credits`
        }],
        application_context: {
          cancel_url: `${req.protocol}://${req.get('host')}/payment.html?status=cancelled`,
          return_url: `${req.protocol}://${req.get('host')}/payment.html?status=success`
        }
      });

      const order = await paypalClient().execute(request);
      
      const dbOrder = await storage.createPayPalOrder({
        userEmail,
        amount,
        credits,
        currency,
        paypalOrderId: order.result.id,
        status: 'created'
      });

      res.json({
        id: order.result.id,
        status: order.result.status,
        links: order.result.links
      });

    } catch (error) {
      console.error('PayPal order creation error:', error);
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  });

  app.post('/api/paypal/order/:orderID/capture', async (req, res) => {
    try {
      const { orderID } = req.params;
      const { userEmail } = req.body;

      if (!userEmail) {
        return res.status(400).json({ error: 'User email required' });
      }

      const dbOrder = await storage.getPayPalOrder(orderID);
      if (!dbOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const request = new paypal.orders.OrdersCaptureRequest(orderID);
      request.requestBody({});
      
      const capture = await paypalClient().execute(request);

      if (capture.result.status === 'COMPLETED') {
        let user = await storage.getUserByEmail(userEmail);
        
        if (user) {
          const newCredits = user.credits + dbOrder.credits;
          await storage.updateUserCredits(user.id, newCredits);
        } else {
          // Create new user if doesn't exist using the expected createUser method
          user = await storage.createUser({
            email: userEmail,
            credits: dbOrder.credits,
            isNewSubscriber: true
          });
        }

        await storage.updatePayPalOrder(orderID, {
          status: 'captured',
          transactionId: capture.result.purchase_units[0].payments.captures[0].id,
          completedAt: new Date()
        });

        await storage.createCreditTransaction({
          userEmail,
          credits: dbOrder.credits,
          transactionType: 'purchase',
          reason: `PayPal payment - Order ${orderID}`,
          adminEmail: 'system@contentscale.com',
          metadata: {
            paypalOrderId: orderID,
            transactionId: capture.result.purchase_units[0].payments.captures[0].id,
            amount: dbOrder.amount,
            currency: dbOrder.currency
          }
        });

        res.json({
          success: true,
          orderID,
          transactionId: capture.result.purchase_units[0].payments.captures[0].id,
          amount: dbOrder.amount,
          credits: dbOrder.credits
        });

      } else {
        await storage.updatePayPalOrder(orderID, { status: 'failed' });
        res.status(400).json({ error: 'Payment capture failed', status: capture.result.status });
      }

    } catch (error) {
      console.error('PayPal capture error:', error);
      res.status(500).json({ error: 'Failed to capture PayPal payment' });
    }
  });

  app.get('/api/user/credits/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const user = await storage.getUserByEmail(userEmail);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        userEmail: user.email,
        credits: user.credits
      });

    } catch (error) {
      console.error('Get user credits error:', error);
      res.status(500).json({ error: 'Failed to get user credits' });
    }
  });

  app.post('/api/paypal/report-issue', async (req, res) => {
    try {
      const { userEmail, issueType, description, orderID, transactionID, amount, priority = 'normal' } = req.body;

      if (!userEmail || !issueType || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const issue = await storage.createPayPalIssue({
        userEmail,
        issueType,
        description,
        priority,
        orderID,
        transactionID,
        amount
      });

      res.json({
        success: true,
        issueId: issue.id,
        message: 'Issue reported successfully. Our support team will contact you soon.'
      });

    } catch (error) {
      console.error('Report PayPal issue error:', error);
      res.status(500).json({ error: 'Failed to report issue' });
    }
  });

  app.get('/api/admin/paypal/issues', adminSecurityMiddleware, async (req, res) => {
    try {
      const issues = await storage.getPayPalIssues();
      res.json(issues);
    } catch (error) {
      console.error('Get PayPal issues error:', error);
      res.status(500).json({ error: 'Failed to get PayPal issues' });
    }
  });

  app.put('/api/admin/paypal/issues/:issueId', adminSecurityMiddleware, async (req, res) => {
    try {
      const { issueId } = req.params;
      const updates = req.body;

      const success = await storage.updatePayPalIssue(issueId, updates);
      
      if (success) {
        res.json({ success: true, message: 'Issue updated successfully' });
      } else {
        res.status(404).json({ error: 'Issue not found' });
      }

    } catch (error) {
      console.error('Update PayPal issue error:', error);
      res.status(500).json({ error: 'Failed to update issue' });
    }
  });

  app.get('/api/paypal/issues/:userEmail', async (req, res) => {
    try {
      const { userEmail } = req.params;
      const issues = await storage.getUserPayPalIssues(userEmail);
      res.json(issues);
    } catch (error) {
      console.error('Get user PayPal issues error:', error);
      res.status(500).json({ error: 'Failed to get user issues' });
    }
  });

  const server = createServer(app);
  return server;
}

// PayPal functionality will be added separately to avoid scope issues
