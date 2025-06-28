import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { contentGenerator } from "./services/contentGenerator";
import { keywordResearch } from "./services/keywordResearch";
import { referralSystem } from "./services/referralSystem";
import { securityService } from "./services/securityService";
import { securityMiddleware, rateLimitMiddleware, adminSecurityMiddleware } from "./middleware/securityMiddleware";
import { insertContentSchema, insertKeywordSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import express from "express";
import path from "path";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from client/public in development
  app.use(express.static(path.resolve(process.cwd(), "client", "public")));
  
  // Security middleware - track all requests
  app.use(securityMiddleware());
  
  // Auth middleware
  await setupAuth(app);

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
        'ANSWER_SOCRATES_API_KEY', 
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
  app.get("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin (you can modify this logic)
      if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin
      if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: "Failed to update admin settings" });
    }
  });

  // Public endpoint to get current video settings for landing page
  app.get("/api/public/video-settings", async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json({
        demoVideoId: settings?.demoVideoId || "",
        demoVideoTitle: settings?.demoVideoTitle || "ContentScale Demo"
      });
    } catch (error) {
      console.error("Error fetching video settings:", error);
      res.json({
        demoVideoId: "",
        demoVideoTitle: "ContentScale Demo"
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

  // Content generation with free first article + $2 payment system
  app.post("/api/content/generate", isAuthenticated, rateLimitMiddleware('content_generation'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = insertContentSchema.parse(req.body);
      
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
        ...body,
        userId,
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

  // Keyword research
  app.post("/api/keywords/research", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { keyword, country = "us" } = req.body;

      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }

      const results = await keywordResearch.researchKeywords(keyword, country);
      
      // Save keywords to database
      const savedKeywords = await Promise.all(
        results.map(k => storage.createKeyword({
          userId,
          keyword: k.keyword,
          searchVolume: k.searchVolume,
          difficulty: k.difficulty,
          aiOverviewPotential: k.aiOverviewPotential,
          relatedKeywords: k.relatedKeywords,
          source: "answer_socrates",
        }))
      );

      // Create activity
      await storage.createActivity({
        userId,
        type: "keywords_researched",
        title: `Researched ${results.length} keywords via Answer Socrates`,
        description: `Topic: "${keyword}"`,
        metadata: { keyword, count: results.length },
      });

      // Update achievements
      await storage.updateAchievement(userId, "keyword_master", results.length);

      res.json(savedKeywords);
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

  // PayPal payment routes for $2 content generation
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Capture PayPal payment
      await capturePaypalOrder(req, res);
      
      // If payment successful, add 1 credit to user account
      const user = await storage.getUser(userId);
      await storage.updateUserCredits(userId, (user?.credits || 0) + 1);
      
      // Create activity for payment
      await storage.createActivity({
        userId,
        type: "payment_completed",
        title: "Payment Successful - $2.00",
        description: "1 content generation credit added to account",
        metadata: { orderId: req.params.orderID, amount: "2.00" },
      });
      
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

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
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
          // Research each keyword
          const results = await keywordResearch.researchKeywords(keyword.trim(), "us");
          
          for (const result of results) {
            const savedKeyword = await storage.createKeyword({
              userId,
              keyword: result.keyword,
              searchVolume: result.searchVolume,
              difficulty: result.difficulty,
              aiOverviewPotential: result.aiOverviewPotential,
              relatedKeywords: result.relatedKeywords,
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
}
