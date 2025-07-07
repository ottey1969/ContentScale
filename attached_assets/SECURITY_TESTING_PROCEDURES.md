# 🧪 SECURE EMAIL SYSTEM TESTING PROCEDURES

## 📋 **COMPREHENSIVE TESTING GUIDE**

This document provides detailed testing procedures to validate the security, functionality, and compliance of the secure email system before production deployment. All tests must pass before handling real subscriber data.

---

## 🔒 **SECURITY TESTING PROCEDURES**

### **Test 1: Email Encryption Validation**

**Objective**: Verify that email addresses are properly encrypted and can be decrypted only with the correct key.

**Prerequisites**:
- Secure email system installed
- Environment variables configured
- Node.js environment available

**Test Steps**:

```bash
# Test 1.1: Basic Encryption/Decryption
node -e "
const { secureEmailService } = require('./server/services/secureEmailService');

// Test email addresses
const testEmails = [
  'test@example.com',
  'user.name+tag@domain.co.uk',
  'special.chars_123@test-domain.org'
];

console.log('🔒 Testing Email Encryption/Decryption');
console.log('=====================================');

testEmails.forEach((email, index) => {
  try {
    console.log(\`\\nTest \${index + 1}: \${email}\`);
    
    // Encrypt email
    const { encrypted, hash } = secureEmailService.encryptEmail(email);
    console.log('✅ Encryption successful');
    console.log('   Encrypted length:', encrypted.length);
    console.log('   Hash length:', hash.length);
    
    // Decrypt email
    const decrypted = secureEmailService.decryptEmail(encrypted);
    console.log('✅ Decryption successful');
    
    // Verify integrity
    if (email === decrypted) {
      console.log('✅ Integrity verified');
    } else {
      console.log('❌ Integrity check failed');
      console.log('   Original:', email);
      console.log('   Decrypted:', decrypted);
    }
    
    // Test masking
    const masked = secureEmailService.maskEmail(email);
    console.log('✅ Masking successful:', masked);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
});

console.log('\\n🎯 Encryption test completed');
"
```

**Expected Results**:
- All test emails encrypt successfully
- Encrypted data is different from original
- Decryption returns original email exactly
- Masking shows partial email (e.g., t***@ex*****.com)
- No errors or exceptions

**Test 1.2: Encryption Key Validation**

```bash
# Test invalid encryption scenarios
node -e "
const { secureEmailService } = require('./server/services/secureEmailService');

console.log('🔑 Testing Encryption Key Security');
console.log('==================================');

// Test with invalid email formats
const invalidEmails = ['invalid', '@domain.com', 'user@', 'user@domain', ''];

invalidEmails.forEach(email => {
  try {
    secureEmailService.encryptEmail(email);
    console.log(\`❌ Should have failed for: \${email}\`);
  } catch (error) {
    console.log(\`✅ Correctly rejected: \${email}\`);
  }
});

console.log('\\n🎯 Key validation test completed');
"
```

---

### **Test 2: Rate Limiting Validation**

**Objective**: Verify that rate limiting prevents abuse and protects against attacks.

**Test Steps**:

```bash
# Test 2.1: Email Campaign Rate Limiting
echo "🚦 Testing Email Campaign Rate Limiting"
echo "======================================="

# Send multiple requests quickly (should be rate limited)
for i in {1..5}; do
  echo "Request $i:"
  curl -X POST "http://localhost:3000/api/admin/emails/send" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    -d '{
      "subject": "Test Campaign '$i'",
      "message": "This is a test message",
      "recipients": "all"
    }' \
    -w "Status: %{http_code}, Time: %{time_total}s\n" \
    -s -o /dev/null
  sleep 1
done
```

```bash
# Test 2.2: Export Rate Limiting
echo -e "\n📊 Testing Export Rate Limiting"
echo "==============================="

# Attempt multiple exports (should be limited to 5 per day)
for i in {1..7}; do
  echo "Export attempt $i:"
  curl -X GET "http://localhost:3000/api/admin/emails/export?format=csv" \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    -w "Status: %{http_code}\n" \
    -s -o /dev/null
done
```

**Expected Results**:
- First few requests succeed (200 status)
- Subsequent requests return 429 (Too Many Requests)
- Rate limit headers present in response
- Appropriate retry-after values provided

---

### **Test 3: Input Validation and Sanitization**

**Objective**: Verify that malicious input is properly sanitized and rejected.

**Test Steps**:

```bash
# Test 3.1: XSS Prevention
echo "🛡️ Testing XSS Prevention"
echo "========================"

# Test malicious email campaign content
curl -X POST "http://localhost:3000/api/admin/emails/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "subject": "<script>alert(\"XSS\")</script>Test Subject",
    "message": "Hello <script>document.cookie</script> World",
    "recipients": "all"
  }' \
  -w "Status: %{http_code}\n"
```

```bash
# Test 3.2: SQL Injection Prevention
echo -e "\n💉 Testing SQL Injection Prevention"
echo "==================================="

# Test malicious email input
curl -X POST "http://localhost:3000/api/gdpr/access-request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com; DROP TABLE users; --"
  }' \
  -w "Status: %{http_code}\n"
```

**Expected Results**:
- Malicious scripts are removed or escaped
- SQL injection attempts are blocked
- 400 status for invalid/suspicious content
- Error messages don't reveal system details

---

## 📋 **GDPR COMPLIANCE TESTING**

### **Test 4: Data Subject Rights**

**Objective**: Verify that all GDPR data subject rights are properly implemented.

**Test Steps**:

```bash
# Test 4.1: Access Request
echo "📋 Testing GDPR Access Request"
echo "=============================="

# Submit access request
ACCESS_RESPONSE=$(curl -X POST "http://localhost:3000/api/gdpr/access-request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }' \
  -s)

echo "Access request response:"
echo "$ACCESS_RESPONSE" | jq .

# Extract request ID for verification test
REQUEST_ID=$(echo "$ACCESS_RESPONSE" | jq -r '.requestId')
echo "Request ID: $REQUEST_ID"
```

```bash
# Test 4.2: Erasure Request
echo -e "\n🗑️ Testing GDPR Erasure Request"
echo "==============================="

curl -X POST "http://localhost:3000/api/gdpr/erasure-request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }' \
  -s | jq .
```

```bash
# Test 4.3: Data Portability Request
echo -e "\n📦 Testing GDPR Data Portability"
echo "==============================="

curl -X POST "http://localhost:3000/api/gdpr/portability-request" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }' \
  -s | jq .
```

**Expected Results**:
- All requests return unique request IDs
- Verification tokens are generated
- Estimated completion times provided
- Appropriate status messages returned

---

### **Test 5: Consent Management**

**Objective**: Verify that consent is properly recorded and managed.

**Test Steps**:

```bash
# Test 5.1: Consent Recording
node -e "
const { gdprComplianceService } = require('./server/services/gdprCompliance');

console.log('📝 Testing Consent Management');
console.log('=============================');

async function testConsent() {
  try {
    // Record marketing consent
    await gdprComplianceService.recordConsent(
      'test@example.com',
      'marketing',
      true,
      'checkbox',
      '127.0.0.1',
      'Test-Agent'
    );
    console.log('✅ Marketing consent recorded');
    
    // Check consent status
    const hasConsent = await gdprComplianceService.hasConsent('test@example.com', 'marketing');
    console.log('✅ Consent check:', hasConsent ? 'GRANTED' : 'NOT GRANTED');
    
    // Withdraw consent
    await gdprComplianceService.recordConsent(
      'test@example.com',
      'marketing',
      false,
      'email_confirmation',
      '127.0.0.1',
      'Test-Agent'
    );
    console.log('✅ Consent withdrawn');
    
    // Verify withdrawal
    const hasConsentAfter = await gdprComplianceService.hasConsent('test@example.com', 'marketing');
    console.log('✅ Consent after withdrawal:', hasConsentAfter ? 'GRANTED' : 'NOT GRANTED');
    
  } catch (error) {
    console.log('❌ Consent test failed:', error.message);
  }
}

testConsent();
"
```

---

### **Test 6: Unsubscribe Mechanism**

**Objective**: Verify that unsubscribe links work correctly and securely.

**Test Steps**:

```bash
# Test 6.1: Unsubscribe Link Generation
node -e "
const { gdprComplianceService } = require('./server/services/gdprCompliance');

console.log('🔗 Testing Unsubscribe Links');
console.log('============================');

const email = 'test@example.com';
const consentType = 'marketing';

// Generate unsubscribe link
const unsubscribeLink = gdprComplianceService.generateUnsubscribeLink(email, consentType);
console.log('✅ Unsubscribe link generated:');
console.log(unsubscribeLink);

// Extract token from link
const url = new URL(unsubscribeLink);
const token = url.searchParams.get('token');
console.log('✅ Token extracted:', token);
"
```

```bash
# Test 6.2: Unsubscribe Processing
echo -e "\n📧 Testing Unsubscribe Processing"
echo "================================="

# Test valid unsubscribe
curl -X GET "http://localhost:3000/api/unsubscribe?email=test@example.com&type=marketing&token=VALID_TOKEN" \
  -s | jq .

# Test invalid token
curl -X GET "http://localhost:3000/api/unsubscribe?email=test@example.com&type=marketing&token=INVALID_TOKEN" \
  -s | jq .
```

**Expected Results**:
- Valid tokens process successfully
- Invalid tokens are rejected
- Consent is properly withdrawn
- Appropriate success/error messages

---

## 🔍 **SECURITY MONITORING TESTING**

### **Test 7: Audit Logging**

**Objective**: Verify that all security-relevant actions are properly logged.

**Test Steps**:

```bash
# Test 7.1: Admin Access Logging
echo "📊 Testing Audit Logging"
echo "======================="

# Perform various admin actions and check logs
curl -X GET "http://localhost:3000/api/admin/emails" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -s > /dev/null

curl -X GET "http://localhost:3000/api/admin/emails/export?format=csv" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -s > /dev/null

# Check security statistics
curl -X GET "http://localhost:3000/api/admin/security/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -s | jq .
```

**Expected Results**:
- All admin actions are logged
- Security statistics are updated
- Event timestamps are accurate
- User identification is recorded

---

### **Test 8: Suspicious Activity Detection**

**Objective**: Verify that suspicious activity is detected and blocked.

**Test Steps**:

```bash
# Test 8.1: High-Frequency Access Detection
echo "🚨 Testing Suspicious Activity Detection"
echo "======================================="

# Rapid-fire requests to trigger detection
for i in {1..15}; do
  curl -X GET "http://localhost:3000/api/admin/emails" \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    -w "Request $i: %{http_code}\n" \
    -s -o /dev/null
  sleep 0.1
done
```

**Expected Results**:
- Initial requests succeed
- Subsequent requests are blocked (429 status)
- Security events are logged
- Temporary restrictions are applied

---

## 🎯 **FUNCTIONAL TESTING**

### **Test 9: Email Management Functionality**

**Objective**: Verify that all email management features work correctly.

**Test Steps**:

```bash
# Test 9.1: Subscriber Retrieval
echo "👥 Testing Subscriber Management"
echo "==============================="

# Get subscribers (should show masked emails by default)
curl -X GET "http://localhost:3000/api/admin/emails" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -s | jq '.[] | {id, email, verified, subscribed}'
```

```bash
# Test 9.2: Secure Export
echo -e "\n📤 Testing Secure Export"
echo "======================="

# Test encrypted export
curl -X GET "http://localhost:3000/api/admin/emails/export?format=encrypted" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -s -D headers.txt -o export_encrypted.json

echo "Export headers:"
cat headers.txt | grep -E "(Content-Type|Content-Disposition)"

echo "Export file size:"
ls -lh export_encrypted.json
```

**Expected Results**:
- Subscribers are retrieved with masked emails
- Export files are generated correctly
- Appropriate headers are set
- File contents are properly formatted

---

### **Test 10: Frontend Security Integration**

**Objective**: Verify that the frontend properly implements security features.

**Test Steps**:

1. **Manual UI Testing**:
   - Navigate to admin panel
   - Verify masked email display
   - Test "View Full Emails" security warning
   - Test export functionality
   - Test email composer with validation

2. **Browser Console Testing**:
```javascript
// Test in browser console
// Verify security warnings are shown
console.log('Testing security warnings...');

// Simulate full email access
// Should show security confirmation dialog
```

**Expected Results**:
- Security warnings are displayed
- Full email access requires confirmation
- Export actions are logged
- Rate limiting is enforced in UI

---

## 📊 **PERFORMANCE TESTING**

### **Test 11: Encryption Performance**

**Objective**: Verify that encryption operations perform adequately under load.

**Test Steps**:

```bash
# Test 11.1: Encryption Performance
node -e "
const { secureEmailService } = require('./server/services/secureEmailService');

console.log('⚡ Testing Encryption Performance');
console.log('================================');

const testEmail = 'performance.test@example.com';
const iterations = 1000;

console.time('Encryption Performance');
for (let i = 0; i < iterations; i++) {
  const { encrypted, hash } = secureEmailService.encryptEmail(testEmail);
  const decrypted = secureEmailService.decryptEmail(encrypted);
  
  if (decrypted !== testEmail) {
    console.log('❌ Performance test failed at iteration', i);
    break;
  }
}
console.timeEnd('Encryption Performance');

console.log(\`✅ Successfully processed \${iterations} encryption/decryption cycles\`);
"
```

**Expected Results**:
- Operations complete within reasonable time
- No memory leaks or performance degradation
- Consistent performance across iterations

---

## ✅ **TEST VALIDATION CHECKLIST**

Before production deployment, ensure all tests pass:

### **Security Tests**
- [ ] ✅ Email encryption/decryption works correctly
- [ ] ✅ Invalid emails are rejected
- [ ] ✅ Rate limiting prevents abuse
- [ ] ✅ Input sanitization blocks malicious content
- [ ] ✅ Audit logging captures all actions

### **GDPR Compliance Tests**
- [ ] ✅ Access requests process correctly
- [ ] ✅ Erasure requests work properly
- [ ] ✅ Data portability functions correctly
- [ ] ✅ Consent management is accurate
- [ ] ✅ Unsubscribe mechanism works securely

### **Functional Tests**
- [ ] ✅ Subscriber management works
- [ ] ✅ Email campaigns send successfully
- [ ] ✅ Export functionality operates correctly
- [ ] ✅ Frontend security features work
- [ ] ✅ Admin panel displays properly

### **Performance Tests**
- [ ] ✅ Encryption performance is acceptable
- [ ] ✅ Database operations are efficient
- [ ] ✅ API responses are timely
- [ ] ✅ Memory usage is stable

---

## 🚨 **FAILURE HANDLING**

If any test fails:

1. **Stop immediately** - Do not proceed to production
2. **Document the failure** - Record exact error messages
3. **Investigate root cause** - Check logs and configuration
4. **Fix the issue** - Update code or configuration
5. **Re-run all tests** - Ensure fix doesn't break other features
6. **Update documentation** - Record any changes made

---

## 📞 **TESTING SUPPORT**

For testing issues:

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Confirm database connectivity
5. Review security configuration

---

## 🎯 **FINAL VALIDATION**

After all tests pass:

1. **Document test results** - Save all test outputs
2. **Create test report** - Summarize findings and recommendations
3. **Schedule regular testing** - Set up automated test runs
4. **Train admin users** - Ensure they understand security features
5. **Monitor production** - Watch for any issues after deployment

**Your secure email system is ready for production when all tests pass!** ✅

