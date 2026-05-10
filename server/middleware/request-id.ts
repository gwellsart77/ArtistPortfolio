/**
 * Request ID Middleware - Phase 5 Observability
 * Adds correlation tracking without external dependencies
 */

import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

let requestCounter = 0;

function generateRequestId(): string {
  try {
    // Use crypto.randomUUID if available (Node 14.17+)
    return randomUUID();
  } catch {
    // Fallback for older Node versions
    const timestamp = Date.now();
    const counter = ++requestCounter;
    return `req_${timestamp}_${counter}`;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  const requestId = generateRequestId();
  
  // Attach to request and response locals
  (req as any).id = requestId;
  res.locals.reqId = requestId;
  
  // Add response header for client correlation
  res.setHeader('X-Request-Id', requestId);
  
  next();
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}