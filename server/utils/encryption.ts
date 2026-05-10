/**
 * AES-256 Encryption Utilities for API Key Storage
 * Implements enterprise-grade encryption for sensitive credentials
 */

import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get or generate master encryption key from environment
 */
function getMasterKey(): Buffer {
  const envKey = process.env.API_ENCRYPTION_KEY;
  
  if (!envKey) {
    throw new Error('API_ENCRYPTION_KEY environment variable is required for API key encryption');
  }
  
  // Derive a 32-byte key from the environment variable
  return crypto.scryptSync(envKey, 'api-key-salt', KEY_LENGTH);
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
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', masterKey);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // For CBC mode, we just need IV + encrypted data
    const combined = iv.toString('hex') + encrypted;
    
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
    throw new Error('Cannot decrypt empty encrypted value');
  }

  try {
    const masterKey = getMasterKey();
    
    // Extract IV, tag, and encrypted data
    const ivHex = encryptedValue.slice(0, IV_LENGTH * 2);
    const tagHex = encryptedValue.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2);
    const encryptedHex = encryptedValue.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, masterKey) as any;
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key - key may be corrupted or encryption key changed');
  }
}

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < (IV_LENGTH + TAG_LENGTH) * 2) {
    return false;
  }
  
  // Check if it's a valid hex string of appropriate length
  const hexPattern = /^[0-9a-f]+$/i;
  return hexPattern.test(value);
}

/**
 * Migrate plain text API key to encrypted format
 */
export function migrateToEncrypted(plainTextValue: string): string {
  if (isEncrypted(plainTextValue)) {
    console.log('Value already appears to be encrypted, skipping migration');
    return plainTextValue;
  }
  
  console.log('Migrating plain text API key to encrypted format');
  return encryptApiKey(plainTextValue);
}

/**
 * Validate encryption setup
 */
export function validateEncryptionSetup(): { valid: boolean; error?: string } {
  try {
    const testValue = 'test-api-key-validation';
    const encrypted = encryptApiKey(testValue);
    const decrypted = decryptApiKey(encrypted);
    
    if (decrypted !== testValue) {
      return { valid: false, error: 'Encryption/decryption cycle failed' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown encryption error' };
  }
}