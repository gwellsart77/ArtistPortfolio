/**
 * Timing & Error Logging Middleware - Phase 5 Observability
 * Structured logging with request correlation
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function timingLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req as any).id || 'unknown';
  
  // Log request start in development only
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Request started', {
      reqId: requestId,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent')?.substring(0, 100)
    });
  }
  
  // Override res.end to capture timing and status
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    const duration = Date.now() - startTime;
    
    // Log completion in development, errors always
    const logData = {
      reqId: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    };
    
    if (res.statusCode >= 400) {
      // Always log errors
      logger.error('Request failed', {
        ...logData,
        userAgent: req.get('User-Agent')?.substring(0, 100),
        ip: req.ip || req.connection.remoteAddress
      });
    } else if (process.env.NODE_ENV === 'development') {
      // Log successful requests only in development
      logger.debug('Request completed', logData);
    }
    
    // Call original end method
    return originalEnd.apply(this, args);
  };
  
  next();
}

export function errorLoggerMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).id || 'unknown';
  const duration = Date.now() - (res.locals.startTime || Date.now());
  
  // Structure error log for correlation
  logger.error('Request error', {
    reqId: requestId,
    method: req.method,
    path: req.path,
    status: res.statusCode || 500,
    duration: `${duration}ms`,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    userAgent: req.get('User-Agent')?.substring(0, 100),
    ip: req.ip || req.connection.remoteAddress
  });
  
  next(err);
}