/**
 * Simple, working encryption system for API keys
 * Uses AES-256-CBC which is well-supported in Node.js
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get the master encryption key from environment
 */
function getMasterKey(): Buffer {
  const key = process.env.API_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('API_ENCRYPTION_KEY environment variable is required');
  }
  
  // Create a 32-byte key from the environment variable
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt an API key value
 */
export function encryptApiKey(value: string): string {
  if (!value) {
    throw new Error('Cannot encrypt empty API key value');
  }

  try {
    const masterKey = getMasterKey();
    const _iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, masterKey);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV + encrypted data for storage
    const combined = _iv.toString('hex') + encrypted;
    
    return combined;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt an API key value
 */
export function decryptApiKey(encryptedValue: string): string {
  if (!encryptedValue) {
    throw new Error('Cannot decrypt empty value');
  }

  try {
    const masterKey = getMasterKey();
    
    // Extract IV (first 32 chars) and encrypted data
    const iv = Buffer.from(encryptedValue.substring(0, IV_LENGTH * 2), 'hex');
    const encrypted = encryptedValue.substring(IV_LENGTH * 2);
    
    const decipher = crypto.createDecipher(ALGORITHM, masterKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Validate the encryption setup
 */
export function validateEncryptionSetup(): { valid: boolean; error?: string } {
  try {
    // Test with a sample value
    const testValue = 'test-api-key-validation';
    const encrypted = encryptApiKey(testValue);
    const decrypted = decryptApiKey(encrypted);
    
    if (decrypted === testValue) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Encryption/decryption test failed' };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown encryption error' 
    };
  }
}