import crypto from 'crypto';

/**
 * Device fingerprinting and trusted device utilities
 * Separated from UI logic for better testing and security
 */

export interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  ip: string;
}

export interface TrustedDeviceToken {
  deviceId: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Generate a stable device fingerprint from request headers
 * Uses only stable headers that won't change frequently
 */
export function generateDeviceFingerprint(req: any): string {
  const components: DeviceFingerprint = {
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    ip: req.ip || req.connection.remoteAddress || ''
  };

  // Create a stable hash from the components
  const fingerprintString = JSON.stringify(components);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Generate a secure device ID that's stored server-side
 * This is separate from the fingerprint for better security
 */
export function generateDeviceId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a signed, opaque trusted device token
 * Only contains the device ID, not the fingerprint
 */
export function createTrustedDeviceToken(deviceId: string, expirationDays: number = 30): TrustedDeviceToken {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  return {
    deviceId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  };
}

/**
 * Validate a trusted device token
 */
export function validateTrustedDeviceToken(tokenData: any): boolean {
  if (!tokenData || typeof tokenData !== 'object') {
    return false;
  }

  if (!tokenData.deviceId || !tokenData.expiresAt || !tokenData.createdAt) {
    return false;
  }

  // Check if token has expired
  const expiresAt = new Date(tokenData.expiresAt);
  const now = new Date();
  
  return now < expiresAt;
}

/**
 * Encode token data to base64 for cookie storage
 */
export function encodeTokenForCookie(token: TrustedDeviceToken): string {
  return Buffer.from(JSON.stringify(token)).toString('base64');
}

/**
 * Decode token data from cookie
 */
export function decodeTokenFromCookie(cookieValue: string): TrustedDeviceToken | null {
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Get secure cookie options based on environment
 */
export function getSecureCookieOptions(maxAgeMs: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    maxAge: maxAgeMs,
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' as const : 'lax' as const,
    path: '/',
    // Don't set domain to let browser handle it automatically
  };
}