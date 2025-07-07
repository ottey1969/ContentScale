# ContentScale PayPal Integration Guide

## PayPal API Paths & Endpoints

### Backend API Routes
- **`/api/paypal/setup`** - PayPal configuration and client token generation
- **`/api/paypal/order`** - Create new PayPal payment orders ($2.00 for content generation)
- **`/api/paypal/order/:orderID/capture`** - Capture completed PayPal payments

### Frontend Components
- **`client/src/components/PayPalButton.tsx`** - Main PayPal payment button integration
- **`client/src/components/PaymentPopup.tsx`** - Payment modal interface
- **`client/src/components/PayPalIssueManager.tsx`** - PayPal issue reporting and management

### Server Files
- **`server/paypal.ts`** - Core PayPal SDK integration and controllers
- **`paypal.ts`** (root) - PayPal configuration backup

### Environment Variables
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
NODE_ENV=development|production (determines sandbox vs live)
```

### Database Integration
- **Credit Transactions**: `credit_transactions` table logs all PayPal payments
- **User Credits**: Auto-updated after successful payments
- **PayPal Issues**: Stored in `messages` table with `paypal_issue` type

## PayPal Payment Flow

### 1. User Payment Process
```
Landing Page → Content Generation → PayPal Button → Payment → Credits Added
```

### 2. API Flow
```
Frontend: PayPalButton.tsx
    ↓
Backend: /api/paypal/order (create)
    ↓
PayPal SDK: Create order
    ↓
Frontend: PayPal checkout
    ↓
Backend: /api/paypal/order/:id/capture
    ↓
Database: Update user credits
```

### 3. Error Handling Paths
- Payment failures logged to console
- User notified via UI alerts
- Admin can track via PayPal dashboard
- Issue reporting system available

## PayPal Issue Types Supported

### 1. Payment Failed
- Transaction declined
- Payment processing errors
- Network timeouts

### 2. Credits Not Received
- Payment successful but credits not added
- Database update failures
- Sync issues

### 3. Duplicate Charges
- Multiple charges for single order
- Double-click payment issues
- Browser refresh problems

### 4. Refund Requests
- Customer refund requests
- Dispute management
- Chargeback handling

### 5. Other Issues
- General PayPal problems
- Account linking issues
- Currency conversion problems

## Admin Management Paths

### Chat Widget Integration
- Users can report PayPal issues directly in chat
- Issues automatically categorized and tracked
- Admin receives real-time notifications

### Admin Panel Paths
- **`/admin`** - Main admin dashboard
- **Messages tab** - View all PayPal issue reports
- **Security tab** - Monitor payment security events

### Admin API Endpoints
- **`/api/admin/paypal-issues`** - Get all PayPal issues
- **`/api/admin/paypal-issues/:id/resolve`** - Resolve PayPal issues
- **`/api/admin/grant-credits-enhanced`** - Manual credit adjustments

## PayPal Configuration Paths

### Development Environment
- Uses PayPal Sandbox
- Test credit card numbers accepted
- Fake transaction IDs generated

### Production Environment
- Uses PayPal Live environment
- Real payments processed
- Live transaction tracking

## Troubleshooting Paths

### Common Issues
1. **Missing API Keys**: Check environment variables
2. **Sandbox vs Live**: Verify NODE_ENV setting
3. **Credit Updates**: Check database connectivity
4. **Button Loading**: Verify PayPal SDK loading

### Debug Endpoints
- **`/api/paypal/setup`** - Test PayPal configuration
- Console logs show PayPal SDK status
- Network tab shows API calls

### Issue Resolution Workflow
1. User reports issue via chat widget
2. Issue logged in database with metadata
3. Admin receives notification
4. Admin investigates using PayPal dashboard
5. Resolution provided to user
6. Issue marked as resolved

## Security Considerations

### API Key Protection
- Environment variables only
- Never exposed to frontend
- Rotation procedures documented

### Transaction Validation
- Server-side order verification
- Amount validation ($2.00 fixed)
- Duplicate payment prevention

### Fraud Prevention
- IP address logging
- User fingerprinting
- Rate limiting on payments

## Agent Support Features

### Real-Time Monitoring
- PayPal transaction logs
- Error tracking and alerts
- User payment history

### Issue Management
- Categorized issue types
- Status tracking (open/investigating/resolved)
- Admin response templates

### Manual Interventions
- Credit adjustments
- Refund processing
- Account reconciliation

## Integration Status
- ✅ PayPal SDK properly configured
- ✅ Payment button functional
- ✅ Credit system integrated
- ✅ Issue reporting system
- ✅ Admin management interface
- ✅ Database logging complete