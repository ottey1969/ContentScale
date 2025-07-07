// Enhanced admin routes to add to the main routes.ts file

// Admin email management endpoints
app.get("/api/admin/emails", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Get all email subscribers
    const subscribers = await storage.getAllEmailSubscribers();
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching email subscribers:", error);
    res.status(500).json({ message: "Failed to fetch email subscribers" });
  }
});

app.post("/api/admin/emails/send", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { subject, message, recipients } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }
    
    // Get recipient list based on filter
    let recipientEmails = [];
    const allSubscribers = await storage.getAllEmailSubscribers();
    
    switch (recipients) {
      case 'verified':
        recipientEmails = allSubscribers.filter(s => s.verified).map(s => s.email);
        break;
      case 'subscribed':
        recipientEmails = allSubscribers.filter(s => s.subscribed).map(s => s.email);
        break;
      default:
        recipientEmails = allSubscribers.map(s => s.email);
    }
    
    // Send emails (mock implementation - replace with actual email service)
    console.log(`Sending email to ${recipientEmails.length} recipients:`, { subject, message });
    
    // Create activity log
    await storage.createActivity({
      userId,
      type: "email_campaign_sent",
      title: `Email campaign sent: "${subject}"`,
      description: `Sent to ${recipientEmails.length} recipients`,
      metadata: { subject, recipientCount: recipientEmails.length },
    });
    
    res.json({ 
      success: true, 
      recipientCount: recipientEmails.length,
      message: "Email campaign sent successfully" 
    });
  } catch (error) {
    console.error("Error sending email campaign:", error);
    res.status(500).json({ message: "Failed to send email campaign" });
  }
});

// Admin credit management endpoints
app.post("/api/admin/credits/give", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { userEmail, credits, reason } = req.body;
    
    if (!userEmail || !credits || credits < 1) {
      return res.status(400).json({ message: "Valid user email and credit amount are required" });
    }
    
    // Find user by email
    const targetUser = await storage.getUserByEmail(userEmail);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found. User must have logged in at least once." });
    }
    
    // Add credits to user account
    const currentCredits = targetUser.credits || 0;
    const newCredits = currentCredits + credits;
    await storage.updateUserCredits(targetUser.id, newCredits);
    
    // Create activity log for admin
    await storage.createActivity({
      userId,
      type: "admin_credits_given",
      title: `Gave ${credits} credits to ${userEmail}`,
      description: reason || "Admin credit grant",
      metadata: { targetUserId: targetUser.id, creditsGiven: credits, newBalance: newCredits },
    });
    
    // Create activity log for recipient
    await storage.createActivity({
      userId: targetUser.id,
      type: "credits_received",
      title: `Received ${credits} credits from admin`,
      description: reason || "Admin credit grant for customer support",
      metadata: { creditsReceived: credits, newBalance: newCredits },
    });
    
    res.json({ 
      success: true, 
      message: `Successfully gave ${credits} credits to ${userEmail}`,
      newBalance: newCredits
    });
  } catch (error) {
    console.error("Error giving credits:", error);
    res.status(500).json({ message: "Failed to give credits" });
  }
});

// Admin chat management endpoints
app.get("/api/admin/chat/conversations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Get active chat conversations
    const conversations = await storage.getAdminChatConversations();
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching chat conversations:", error);
    res.status(500).json({ message: "Failed to fetch chat conversations" });
  }
});

app.post("/api/admin/chat/send", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ message: "Chat ID and message are required" });
    }
    
    // Send message to user (mock implementation - replace with actual chat service)
    const chatMessage = await storage.sendAdminChatMessage(chatId, message, userId);
    
    // Create activity log
    await storage.createActivity({
      userId,
      type: "admin_message_sent",
      title: `Sent message to user`,
      description: `Chat ID: ${chatId}`,
      metadata: { chatId, messageLength: message.length },
    });
    
    res.json({ 
      success: true, 
      message: "Message sent successfully",
      chatMessage
    });
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ message: "Failed to send chat message" });
  }
});

// Enhanced video settings with proper save functionality
app.post("/api/admin/video/save", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const { demoVideoId, demoVideoTitle } = req.body;
    
    if (!demoVideoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }
    
    // Validate YouTube video ID format
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!videoIdRegex.test(demoVideoId)) {
      return res.status(400).json({ message: "Invalid YouTube video ID format" });
    }
    
    // Update video settings
    const updatedSettings = await storage.updateAdminSettings({
      demoVideoId,
      demoVideoTitle: demoVideoTitle || "ContentScale Demo"
    });
    
    // Create activity log
    await storage.createActivity({
      userId,
      type: "video_settings_updated",
      title: `Updated demo video settings`,
      description: `Video ID: ${demoVideoId}, Title: ${demoVideoTitle}`,
      metadata: { demoVideoId, demoVideoTitle },
    });
    
    res.json({ 
      success: true, 
      message: "Video settings saved successfully",
      settings: updatedSettings
    });
  } catch (error) {
    console.error("Error saving video settings:", error);
    res.status(500).json({ message: "Failed to save video settings" });
  }
});

// Admin dashboard metrics
app.get("/api/admin/metrics", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Check if user is admin
    if (user?.email !== "ottmar.francisca1969@gmail.com" && userId !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    // Get comprehensive admin metrics
    const metrics = {
      users: {
        total: await storage.getTotalUsers(),
        active: await storage.getActiveUsers(),
        newToday: await storage.getNewUsersToday()
      },
      content: {
        totalGenerated: await storage.getTotalContentGenerated(),
        generatedToday: await storage.getContentGeneratedToday()
      },
      revenue: {
        totalRevenue: await storage.getTotalRevenue(),
        revenueToday: await storage.getRevenueToday(),
        averageOrderValue: await storage.getAverageOrderValue()
      },
      engagement: {
        totalSessions: await storage.getTotalSessions(),
        averageSessionDuration: await storage.getAverageSessionDuration(),
        bounceRate: await storage.getBounceRate()
      }
    };
    
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    res.status(500).json({ message: "Failed to fetch admin metrics" });
  }
});

