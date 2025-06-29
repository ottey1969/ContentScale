// API Key Verification Script for ContentScale
const https = require('https');

console.log('🔍 Verifying API Keys for ContentScale SEO Insight Engine...\n');

// Check environment variables
const requiredKeys = [
  'ANTHROPIC_API_KEY',
  'PAYPAL_CLIENT_ID', 
  'PAYPAL_CLIENT_SECRET',
  'DATABASE_URL'
];

const optionalKeys = [
  'REPLIT_DOMAINS',
  'REPLIT_CLIENT_ID',
  'REPLIT_CLIENT_SECRET'
];

console.log('📋 REQUIRED API KEYS:');
requiredKeys.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅ SET' : '❌ MISSING';
  const preview = value ? `${value.substring(0, 10)}...` : 'Not found';
  console.log(`   ${key}: ${status} (${preview})`);
});

console.log('\n📋 OPTIONAL KEYS (for Replit):');
optionalKeys.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅ SET' : '⚠️ NOT SET';
  const preview = value ? `${value.substring(0, 15)}...` : 'Not configured';
  console.log(`   ${key}: ${status} (${preview})`);
});

// Test Anthropic API if key is available
const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (anthropicKey) {
  console.log('\n🤖 Testing Anthropic API...');
  
  const postData = JSON.stringify({
    model: "claude-3-sonnet-20240229",
    max_tokens: 10,
    messages: [{"role": "user", "content": "Hello"}]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('   ✅ Anthropic API: WORKING');
    } else {
      console.log(`   ❌ Anthropic API: ERROR (Status: ${res.statusCode})`);
    }
  });

  req.on('error', (e) => {
    console.log(`   ❌ Anthropic API: CONNECTION ERROR (${e.message})`);
  });

  req.write(postData);
  req.end();
} else {
  console.log('\n🤖 Anthropic API: ❌ KEY NOT SET - Cannot test');
}

console.log('\n🎯 SETUP INSTRUCTIONS:');
console.log('1. Go to your Replit project');
console.log('2. Click on "Secrets" tab (lock icon)');
console.log('3. Add each missing API key');
console.log('4. Restart your application');
console.log('5. Run this script again to verify');
