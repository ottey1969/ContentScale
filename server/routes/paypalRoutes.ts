import express from 'express';
import { Request, Response } from 'express';

const router = express.Router();

// PayPal SDK for server-side operations
// npm install @paypal/checkout-server-sdk
import paypal from '@paypal/checkout-server-sdk';

// PayPal Environment Configuration for PRODUCTION
const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not found in environment variables');
  }
  
  // Use LiveEnvironment for production
  return new paypal.core.LiveEnvironment(clientId, clientSecret);
};

const client = () => {
  return new paypal.core.PayPalHttpClient(environment());
};

// Interfaces
interface PayPalOrder {
  id: string;
  userEmail: string;
  amount: number;
  credits: number;
  currency: string;
  status: 'created' | 'approved' | 'captured' | 'failed';
  paypalOrderId?: string;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface PayPalIssue {
  id: string;
  userEmail: string;
  issueType: 'payment_failed' | 'credits_not_received' | 'duplicate_charge' | 'refund_request' | 'other';
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  orderID?: string;
  transactionID?: string;
  amount?: number;
  createdAt: Date;
  resolvedAt?: Date;
  adminNotes?: string;
}

// Mock database functions (replace with your actual database implementation)
const db = {
  async createPayPalOrder(orderData: Partial<PayPalOrder>): Promise<PayPalOrder> {
    const newOrder: PayPalOrder = {
      id: Date.now().toString(),
      userEmail: orderData.userEmail!,
      amount: orderData.amount!,
      credits: orderData.credits!,
      currency: orderData.currency || 'USD',
      status: 'created',
      paypalOrderId: orderData.paypalOrderId,
      createdAt: new Date()
    };
    // Save to database
    return newOrder;
  },

  async updatePayPalOrder(orderId: string, updates: Partial<PayPalOrder>): Promise<boolean> {
    // Update order in database
    return true;
  },

  async getPayPalOrder(orderId: string): Promise<PayPalOrder | null> {
    // Get order from database
    return null;
  },

  async getUserByEmail(email: string): Promise<any> {
    // Get user from database
    return null;
  },

  async updateUserCredits(email: string, credits: number): Promise<boolean> {
    // Update user credits in database
    return true;
  },

  async createUser(userData: { email: string; credits: number; isNewSubscriber: boolean }): Promise<any> {
    // Create new user
    return {
      id: Date.now().toString(),
      email: userData.email,
      credits: userData.credits,
      isNewSubscriber: userData.isNewSubscriber,
      createdAt: new Date()
    };
  },

  async createCreditTransaction(transactionData: any): Promise<any> {
    // Create credit transaction
    return {
      id: Date.now().toString(),
      ...transactionData,
      timestamp: new Date()
    };
  },

  async createPayPalIssue(issueData: Partial<PayPalIssue>): Promise<PayPalIssue> {
    const newIssue: PayPalIssue = {
      id: Date.now().toString(),
      userEmail: issueData.userEmail!,
      issueType: issueData.issueType!,
      description: issueData.description!,
      priority: issueData.priority || 'normal',
      status: 'open',
      orderID: issueData.orderID,
      transactionID: issueData.transactionID,
      amount: issueData.amount,
      createdAt: new Date()
    };
    // Save to database
    return newIssue;
  },

  async updatePayPalIssue(issueId: string, updates: Partial<PayPalIssue>): Promise<boolean> {
    // Update issue in database
    return true;
  },

  async getPayPalIssues(): Promise<PayPalIssue[]> {
    // Get all issues from database
    return [];
  },

  async getUserPayPalIssues(userEmail: string): Promise<PayPalIssue[]> {
    // Get user's issues from database
    return [];
  }
};

// Get PayPal client token for frontend
router.get('/paypal/setup', async (req: Request, res: Response) => {
  try {
    res.json({
      clientId: process.env.PAYPAL_CLIENT_ID,
      currency: 'USD',
      environment: 'production' // Changed from 'sandbox' to 'production'
    });
  } catch (error) {
    console.error('PayPal setup error:', error);
    res.status(500).json({ error: 'Failed to get PayPal configuration' });
  }
});

// Create PayPal order
router.post('/paypal/order', async (req: Request, res: Response) => {
  try {
    const { userEmail, amount, credits, currency = 'USD' } = req.body;

    // Validation
    if (!userEmail || !amount || !credits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount < 0.01 || amount > 1000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create PayPal order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        description: `ContentScale Credits - ${credits} credits`,
        custom_id: userEmail,
        invoice_id: `CS-${Date.now()}-${userEmail.split('@')[0]}`
      }],
      application_context: {
        brand_name: 'ContentScale',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${req.protocol}://${req.get('host')}/payment-success`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancel`
      }
    });

    // Execute PayPal request
    const order = await client().execute(request);
    
    // Save order to database
    await db.createPayPalOrder({
      userEmail,
      amount,
      credits,
      currency,
      paypalOrderId: order.result.id,
      status: 'created'
    });

    res.json({
      orderID: order.result.id,
      status: order.result.status
    });

  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Capture PayPal payment
router.post('/paypal/order/:orderID/capture', async (req: Request, res: Response) => {
  try {
    const { orderID } = req.params;
    const { userEmail } = req.body;

    if (!orderID || !userEmail) {
      return res.status(400).json({ error: 'Missing orderID or userEmail' });
    }

    // Get order from database
    const dbOrder = await db.getPayPalOrder(orderID);
    if (!dbOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Capture the payment
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client().execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Payment successful - add credits to user
      const user = await db.getUserByEmail(userEmail);
      if (user) {
        const newCredits = user.credits + dbOrder.credits;
        await db.updateUserCredits(userEmail, newCredits);
      } else {
        // Create new user if doesn't exist
        await db.createUser({
          email: userEmail,
          credits: dbOrder.credits,
          isNewSubscriber: true
        });
      }

      // Update order status
      await db.updatePayPalOrder(orderID, {
        status: 'captured',
        transactionId: capture.result.purchase_units[0].payments.captures[0].id,
        completedAt: new Date()
      });

      // Log successful transaction
      await db.createCreditTransaction({
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
        transactionID: capture.result.purchase_units[0].payments.captures[0].id,
        creditsAdded: dbOrder.credits,
        message: `Successfully added ${dbOrder.credits} credits to your account`
      });

    } else {
      // Payment failed
      await db.updatePayPalOrder(orderID, {
        status: 'failed'
      });

      res.status(400).json({
        error: 'Payment capture failed',
        status: capture.result.status
      });
    }

  } catch (error) {
    console.error('PayPal capture error:', error);
    
    // Update order status to failed
    try {
      await db.updatePayPalOrder(req.params.orderID, {
        status: 'failed'
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
    }

    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// Get user credits
router.get('/user/credits/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const user = await db.getUserByEmail(userEmail);
    
    if (!user) {
      return res.json({ credits: 0, lastUpdated: new Date() });
    }

    res.json({
      credits: user.credits,
      lastUpdated: user.updatedAt || user.createdAt
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
});

// Submit PayPal issue
router.post('/paypal/issues', async (req: Request, res: Response) => {
  try {
    const { userEmail, issueType, description, orderID, transactionID, amount, priority = 'normal' } = req.body;

    if (!userEmail || !issueType || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const issue = await db.createPayPalIssue({
      userEmail,
      issueType,
      description,
      orderID,
      transactionID,
      amount,
      priority
    });

    // Send notification to admin (implement your notification system)
    console.log(`New PayPal issue reported: ${issue.id} - ${issueType} for ${userEmail}`);

    res.json({
      success: true,
      issueId: issue.id,
      message: 'Issue reported successfully. Our team will investigate and contact you shortly.'
    });

  } catch (error) {
    console.error('Error creating PayPal issue:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// Get user's PayPal issues
router.get('/paypal/issues/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const issues = await db.getUserPayPalIssues(userEmail);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching user PayPal issues:', error);
    res.status(500).json({ error: 'Failed to fetch user issues' });
  }
});

// Admin: Get all PayPal issues
router.get('/admin/paypal/issues', async (req: Request, res: Response) => {
  try {
    const issues = await db.getPayPalIssues();
    res.json(issues);
  } catch (error) {
    console.error('Error fetching PayPal issues:', error);
    res.status(500).json({ error: 'Failed to fetch PayPal issues' });
  }
});

// Admin: Update PayPal issue
router.put('/admin/paypal/issues/:issueId', async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const { status, adminNotes, priority } = req.body;

    const success = await db.updatePayPalIssue(issueId, {
      status,
      adminNotes,
      priority,
      resolvedAt: status === 'resolved' ? new Date() : undefined
    });

    if (success) {
      res.json({ success: true, message: 'Issue updated successfully' });
    } else {
      res.status(404).json({ error: 'Issue not found' });
    }

  } catch (error) {
    console.error('Error updating PayPal issue:', error);
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

export default router;