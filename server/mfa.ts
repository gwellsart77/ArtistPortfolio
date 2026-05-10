import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { log } from './vite';

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
}

// Service for handling MFA operations
export class MfaService {
  private serviceName = 'Admin Portal';
  
  /**
   * Generate a new MFA secret and QR code for setup
   * @param username The username to associate with this MFA setup
   * @returns MFA setup data including secret and QR code
   */
  async generateSetup(username: string): Promise<MfaSetupResponse> {
    try {
      log('Generating MFA setup', 'mfa');
      
      // Generate a new secret
      const secret = authenticator.generateSecret();
      
      // Create the OTP auth URL
      const otpAuthUrl = authenticator.keyuri(username, this.serviceName, secret);
      
      // Generate a QR code as a data URL
      const qrCode = await QRCode.toDataURL(otpAuthUrl);
      
      log('MFA setup generated successfully', 'mfa');
      
      return {
        secret,
        qrCode
      };
    } catch (error) {
      log(`Error generating MFA setup: ${error}`, 'mfa');
      throw error;
    }
  }
  
  /**
   * Verify a token against a secret
   * @param token The token to verify
   * @param secret The secret to verify against
   * @returns Boolean indicating if token is valid
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      log('Verifying MFA token', 'mfa');
      const isValid = authenticator.verify({ token, secret });
      log(`Token verification result: ${isValid}`, 'mfa');
      return isValid;
    } catch (error) {
      log(`Error verifying token: ${error}`, 'mfa');
      return false;
    }
  }
}

// Create and export a singleton instance
export const mfaService = new MfaService();