/**
 * Test encryption system before proceeding with API key testing
 */

import { validateEncryptionSetup, encryptApiKey, decryptApiKey } from "./utils/simple-encryption";

async function testEncryption() {
  console.log('🔧 Testing encryption system...');
  
  // Set a temporary encryption key for testing
  process.env.API_ENCRYPTION_KEY = "test-encryption-key-32-characters-long-12345";
  
  try {
    // Test 1: Validate encryption setup
    const validation = validateEncryptionSetup();
    console.log('✅ Encryption validation:', validation);
    
    if (!validation.valid) {
      throw new Error(`Encryption setup invalid: ${validation.error}`);
    }
    
    // Test 2: Test with sample API key
    const testApiKey = "sk_test_1234567890abcdef";
    console.log('🔑 Testing with sample API key:', testApiKey);
    
    const encrypted = encryptApiKey(testApiKey);
    console.log('🔒 Encrypted value length:', encrypted.length);
    console.log('🔒 Encrypted value (first 50 chars):', encrypted.substring(0, 50) + '...');
    
    const decrypted = decryptApiKey(encrypted);
    console.log('🔓 Decrypted value:', decrypted);
    
    if (decrypted === testApiKey) {
      console.log('✅ Encryption/Decryption test PASSED');
      return true;
    } else {
      console.log('❌ Encryption/Decryption test FAILED');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

// Run the test
testEncryption().then(success => {
  if (success) {
    console.log('🚀 Encryption system ready for API key testing!');
  } else {
    console.log('❌ Encryption system needs fixing before proceeding');
  }
});