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