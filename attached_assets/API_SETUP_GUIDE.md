# 🔑 API Keys Setup Guide - ContentScale SEO Insight Engine

## 🚨 **REQUIRED API KEYS**

Your ContentScale platform needs these API keys to function properly:

---

## 1. 🤖 **ANTHROPIC API KEY** (REQUIRED)

**Purpose:** Powers the SEO Insight Engine AI keyword research and content generation

**How to get it:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)

**Current Status:** ✅ **CONFIGURED**
- Key: `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`

---

## 2. 💳 **PAYPAL API KEYS** (REQUIRED)

**Purpose:** Handles payment processing for Sofeia AI credits

**How to get them:**
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Log in to your PayPal account
3. Go to "My Apps & Credentials"
4. Create a new app or use existing
5. Copy both Client ID and Client Secret

**Current Status:** ✅ **CONFIGURED**
- Client ID: `ATuQHaYcopJ4KZUozxw8kuk1W1fl6cHRTQayIn_D5UVMET_WAKo36e5f62EmJF_WDL3JqCHf2DxH8up7`
- Client Secret: `EHAIe1uxypF7RV2twtau26JAc4jUvHVAgsrrL8IAMv1iwcmPSWVhGeyvjGQkWMbjI6eEO83ET1vWg-Xj`

---

## 3. 🔐 **REPLIT AUTHENTICATION** (REQUIRED for Replit)

**Purpose:** User authentication and login system

**How to get them:**
1. In your Replit project, go to "Secrets" tab
2. Add these environment variables:
   - `REPLIT_DOMAINS`: Your Replit app domain
   - `REPLIT_CLIENT_ID`: From Replit OAuth settings
   - `REPLIT_CLIENT_SECRET`: From Replit OAuth settings

**Current Status:** ⚠️ **NEEDS CONFIGURATION**

---

## 🛠️ **HOW TO SET API KEYS IN REPLIT**

### **Method 1: Using Replit Secrets (Recommended)**

1. **Open your Replit project**
2. **Click on "Secrets" tab** (lock icon in sidebar)
3. **Add each key individually:**

```
Key: ANTHROPIC_API_KEY
Value: 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

Key: PAYPAL_CLIENT_ID
Value: ATuQHaYcopJ4KZUozxw8kuk1W1fl6cHRTQayIn_D5UVMET_WAKo36e5f62EmJF_WDL3JqCHf2DxH8up7

Key: PAYPAL_CLIENT_SECRET
Value: EHAIe1uxypF7RV2twtau26JAc4jUvHVAgsrrL8IAMv1iwcmPSWVhGeyvjGQkWMbjI6eEO83ET1vWg-Xj

Key: DATABASE_URL
Value: file:./local.db

Key: REPLIT_DOMAINS
Value: your-app-name.your-username.repl.co

Key: REPLIT_CLIENT_ID
Value: [Get from Replit OAuth settings]

Key: REPLIT_CLIENT_SECRET
Value: [Get from Replit OAuth settings]
```

### **Method 2: Using .env file**

1. **Create/update `.env` file** in your project root
2. **Copy the contents** from `.env.production` file I created
3. **Update the Replit-specific values**

---

## 🔍 **TESTING API KEYS**

### **Test Anthropic API:**
```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"Hello"}]}'
```

### **Test in Your App:**
1. **Start your application**
2. **Go to dashboard**
3. **Try SEO Insight Engine** keyword research
4. **Check for any error messages**

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

**1. "API Key not found" errors:**
- ✅ Check Replit Secrets are set correctly
- ✅ Restart your Replit application
- ✅ Verify key names match exactly

**2. "Authentication failed" errors:**
- ✅ Verify API keys are valid and active
- ✅ Check for extra spaces or characters
- ✅ Ensure keys haven't expired

**3. "Payment processing failed":**
- ✅ Verify PayPal keys are from correct environment
- ✅ Check PayPal app is approved and live
- ✅ Ensure webhook URLs are configured

**4. "Database connection failed":**
- ✅ Set `DATABASE_URL=file:./local.db` in Replit Secrets
- ✅ Restart application after setting

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] **Anthropic API Key** set in Replit Secrets
- [ ] **PayPal Client ID** set in Replit Secrets  
- [ ] **PayPal Client Secret** set in Replit Secrets
- [ ] **Database URL** set in Replit Secrets
- [ ] **Replit Domain** configured
- [ ] **Replit OAuth** keys configured
- [ ] **Application restarted** after setting keys
- [ ] **SEO Insight Engine** tested and working
- [ ] **Payment system** tested (optional)

---

## 🎯 **NEXT STEPS**

1. **Set all required keys** in Replit Secrets
2. **Restart your application**
3. **Test SEO Insight Engine** functionality
4. **Verify payment processing** (if needed)
5. **Check error logs** for any remaining issues

**Once all API keys are properly configured, your ContentScale platform with SEO Insight Engine will be fully functional!** 🚀

