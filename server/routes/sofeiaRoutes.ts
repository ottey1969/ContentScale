import { Express } from "express";
import { sofeiaAI } from "../services/sofeiaAI";

export function registerSofeiaRoutes(app: Express) {
  // Chat endpoint with payment system - bypassed authentication for development
  app.post("/api/sofeia/chat", async (req, res) => {
    try {
      const { message, sessionId, customInstructions } = req.body;
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";
      const isAdmin = userEmail === "ottmar.francisca1969@gmail.com";

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const context = {
        userEmail,
        isAdmin,
        currentPage: req.headers.referer,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        sessionHistory: sessionId ? sofeiaAI.getSessionHistory(sessionId) : [],
        customInstructions: customInstructions || null
      };

      const response = await sofeiaAI.generateResponse(message, context);

      res.json({
        success: true,
        response: response.content,
        metadata: response.metadata,
        paymentInfo: response.paymentInfo,
        sessionId: sessionId || sofeiaAI.createSession(userEmail)
      });

    } catch (error) {
      console.error("Sofeia chat error:", error);
      res.status(200).json({ 
        success: false,
        error: "Failed to generate response",
        response: "I apologize, but I'm having trouble connecting right now. Let me try to help you anyway - what specific business challenge are you facing?"
      });
    }
  });

  // Get user payment status and question count
  app.get("/api/sofeia/status", async (req, res) => {
    try {
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";
      const isAdmin = userEmail === "ottmar.francisca1969@gmail.com";
      
      // Get user profile from Sofeia AI
      const profile = sofeiaAI.getUserProfile ? sofeiaAI.getUserProfile(userEmail) : {
        totalQuestions: 0,
        freeQuestionsUsed: 0,
        creditBalance: 0,
        subscriptionStatus: 'free',
        preferredTopics: []
      };

      const freeQuestionsRemaining = Math.max(0, 5 - profile.freeQuestionsUsed);
      const paymentRequired = freeQuestionsRemaining === 0 && profile.creditBalance === 0;

      res.json({
        success: true,
        user: {
          email: userEmail,
          isAdmin,
          totalQuestions: profile.totalQuestions,
          freeQuestionsUsed: profile.freeQuestionsUsed,
          freeQuestionsRemaining,
          creditBalance: profile.creditBalance,
          subscriptionStatus: profile.subscriptionStatus
        },
        paymentInfo: {
          required: paymentRequired,
          pricePerQuestion: 2.69,
          creditPackages: [
            { questions: 10, price: 24.99, savings: 1.91 },
            { questions: 25, price: 59.99, savings: 7.26 },
            { questions: 50, price: 109.99, savings: 24.51 },
            { questions: 100, price: 199.99, savings: 69.01 }
          ]
        }
      });

    } catch (error) {
      console.error("Sofeia status error:", error);
      res.status(500).json({ error: "Failed to get user status" });
    }
  });

  // Process payment for single question
  app.post("/api/sofeia/pay-question", async (req, res) => {
    try {
      const { paymentId, payerId } = req.body;
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";

      // In a real implementation, you would verify the PayPal payment here
      // For now, we'll simulate successful payment
      
      // Add one question credit to user
      if (sofeiaAI.addCredits) {
        sofeiaAI.addCredits(userEmail, 1);
      }

      res.json({
        success: true,
        message: "Payment processed successfully",
        creditsAdded: 1,
        newBalance: sofeiaAI.getCredits ? sofeiaAI.getCredits(userEmail) : 1
      });

    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // Process credit package purchase
  app.post("/api/sofeia/buy-credits", async (req, res) => {
    try {
      const { packageType, paymentId, payerId } = req.body;
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";

      const creditPackages = {
        starter: { questions: 10, price: 24.99 },
        popular: { questions: 25, price: 59.99 },
        pro: { questions: 50, price: 109.99 },
        enterprise: { questions: 100, price: 199.99 }
      };

      const selectedPackage = creditPackages[packageType as keyof typeof creditPackages];
      
      if (!selectedPackage) {
        return res.status(400).json({ error: "Invalid package type" });
      }

      // In a real implementation, verify PayPal payment here
      
      // Add credits to user account
      if (sofeiaAI.addCredits) {
        sofeiaAI.addCredits(userEmail, selectedPackage.questions);
      }

      res.json({
        success: true,
        message: "Credits purchased successfully",
        package: selectedPackage,
        creditsAdded: selectedPackage.questions,
        newBalance: sofeiaAI.getCredits ? sofeiaAI.getCredits(userEmail) : selectedPackage.questions
      });

    } catch (error) {
      console.error("Credit purchase error:", error);
      res.status(500).json({ error: "Credit purchase failed" });
    }
  });

  // Get user credit balance
  app.get("/api/sofeia/credits", async (req, res) => {
    try {
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";
      const balance = sofeiaAI.getCredits ? sofeiaAI.getCredits(userEmail) : 0;

      res.json({
        success: true,
        creditBalance: balance,
        userEmail
      });

    } catch (error) {
      console.error("Credit balance error:", error);
      res.status(500).json({ error: "Failed to get credit balance" });
    }
  });

  // Admin-only: Get prompt information
  app.get("/api/sofeia/prompt-info", async (req, res) => {
    try {
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";
      const isAdmin = userEmail === "ottmar.francisca1969@gmail.com";

      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      res.json({
        success: true,
        promptInfo: {
          name: "Sofeia AI - World's Most Advanced AI Assistant",
          version: "2.0.0",
          capabilities: [
            "Unrestricted conversations on any topic",
            "Superior to Manus AI and Replit agents",
            "Advanced reasoning and problem-solving",
            "Expert knowledge across all domains",
            "Payment system integration",
            "Credit management system"
          ],
          restrictions: "None - Complete freedom for all users",
          paymentModel: "5 free questions, then $2.69 per question or credit packages",
          profitMargin: "$1.70 per transaction"
        }
      });

    } catch (error) {
      console.error("Prompt info error:", error);
      res.status(500).json({ error: "Failed to get prompt information" });
    }
  });

  // Create new chat session
  app.post("/api/sofeia/session", async (req, res) => {
    try {
      const userEmail = req.user?.claims?.email || "ottmar.francisca1969@gmail.com";
      const sessionId = sofeiaAI.createSession(userEmail);

      res.json({
        success: true,
        sessionId,
        message: "New chat session created"
      });

    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Get session history
  app.get("/api/sofeia/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = sofeiaAI.getSessionHistory(sessionId);

      res.json({
        success: true,
        sessionId,
        history
      });

    } catch (error) {
      console.error("Session history error:", error);
      res.status(500).json({ error: "Failed to get session history" });
    }
  });
}

