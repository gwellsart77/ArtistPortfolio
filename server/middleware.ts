import { Request, Response, NextFunction } from 'express';
import 'express-session';

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
    username?: string;
  }
}

// Admin authentication middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.isAuthenticated) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: "Unauthorized - Admin access required. Please log in."
    });
  }
};
/**
 * Settings that must never be readable by the public: the admin login, the 2-step
 * secret, password-reset codes and any API keys/tokens/passwords.
 * A signed-in admin can still read them (the settings pages need some of them).
 */
export const isSensitiveSettingKey = (key: string): boolean =>
  /^admin_|secret|password|passwd|token|api_?key|private|mfa|reset_code|reset_expires|credential/i.test(key) ||
  // Gabe's studio / shipping address and shipping contact (2026-11-18)
  /^shipping_(studio_address|drop_address|contact_)/i.test(key) ||
  // Full resume holds Gabe's phone number; it is never shown on the public site
  key === "about_full_resume" ||
  /^(smtp|email)_(user|pass|host|port)/i.test(key);
