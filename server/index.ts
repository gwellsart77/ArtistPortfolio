console.log("***** SERVER PROCESS STARTED AT: " + new Date().toISOString() + " *****");

import express from "express";
import path from "path";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { verifyEmailConnection } from "./email";
import { logger, errorHandler, requestLogger, startHealthMonitoring } from "./utils/logger";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { timingLoggerMiddleware, errorLoggerMiddleware } from "./middleware/timing-logger.js";
import { startBackupScheduler } from "./backup-scheduler.js";

const app = express();

// Expert diagnostic: Add unique ID to Express app instance
(app as any)._id = Math.random().toString(36).slice(2, 7);
console.log('🆔 [APP INSTANCE] Created Express app with ID:', (app as any)._id);

// Enable trust proxy for rate limiting and proper IP detection
// This is required when behind proxies (Replit, load balancers, CDNs)
// Use 1 instead of true to indicate single proxy hop (more secure)
app.set('trust proxy', 1);

// Environment setup with fallback for cross-platform compatibility
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === "production";
if (isProduction) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    console.error("❌ SECURITY ERROR: SESSION_SECRET must be at least 32 characters in production");
    process.exit(1);
  }
  console.log("✅ Production security checks passed");
}

// Configure CORS for production
// Get Replit deployment domains from environment
const replitDomains = process.env.REPLIT_DOMAINS 
  ? process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d.trim()}`)
  : [];

const allowedOrigins = isProduction 
  ? [
      "https://gabewells.com",
      "https://www.gabewells.com", 
      "https://gabewells.art",
      "https://www.gabewells.art",
      ...replitDomains // Include Replit deployment domains
    ]
  : true;

console.log(`🌐 CORS Configuration: ${isProduction ? 'Production' : 'Development'}`);
if (isProduction && Array.isArray(allowedOrigins)) {
  console.log(`✅ Allowed origins:`, allowedOrigins);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};

// Security middleware stack
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://www.google-analytics.com"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Environment-aware rate limiting configuration
const isDevelopment = !isProduction;
console.log(`🔧 RATE LIMITING CONFIG: isDevelopment=${isDevelopment}, NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  max: isDevelopment ? 10000 : 100, // Much higher limits in development for testing
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip general rate limiting for admin settings routes - they have their own higher-limit limiter
    // Note: req.path is relative to the mount point ('/api/'), so check for '/admin/settings' not '/api/admin/settings'
    return req.path.startsWith('/admin/settings');
  },
});

const authLimiter = rateLimit({
  windowMs: isDevelopment ? 2 * 60 * 1000 : 15 * 60 * 1000, // 2 min dev, 15 min prod  
  max: isDevelopment ? 50 : 5, // 50 attempts in dev, 5 in prod
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

// Specific rate limiter for MFA attempts - Enhanced security per external AI review
const mfaLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5 min dev, 30 min prod
  max: isDevelopment ? 20 : 5, // 20 attempts in dev, 5 in prod
  message: { error: 'Too many MFA verification attempts, please try again later.' },
  keyGenerator: (req) => {
    // Rate limit by IP + user agent for MFA attempts
    return `mfa_${req.ip}_${req.headers['user-agent'] || 'unknown'}`;
  },
  skipSuccessfulRequests: true,
});

// Special high-limit rate limiter for admin settings to prevent 429 errors during bulk saves
const settingsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: isDevelopment ? 1000 : 200, // Very high limits for settings operations
  message: { error: 'Too many settings requests, please try again later.' },
  keyGenerator: (req) => {
    // Rate limit by IP for settings operations
    return `settings_${req.ip}`;
  },
  skipSuccessfulRequests: true,
});

// Performance optimization - Compression middleware
app.use(compression({
  level: 6, // Good balance of compression vs CPU usage
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress already compressed files or images
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use('/api/', apiLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/settings', settingsLimiter);
app.use('/api/admin/mfa/verify', mfaLimiter);

// CRITICAL: Parse request bodies and cookies FIRST before any middleware tries to use them
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization middleware (now req.body is available)
const sanitizeInput = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().slice(0, 10000); // Limit string length
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

app.use(sanitizeInput);

// Phase 5: Add observability middleware - request ID and timing
app.use(requestIdMiddleware);
app.use(timingLoggerMiddleware);

// Add comprehensive logging and monitoring middleware
app.use(requestLogger);

app.use(cors(corsOptions));

// Add middleware to help Safari accept cookies and log cookie debugging info (now req.cookies is available)
app.use((req, res, next) => {
  // Safari-specific headers to ensure cookies are accepted
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Debug logging for cookie issues (especially Safari)
  if (req.path.startsWith('/api/admin')) {
    console.log(`🍪 [${req.method}] ${req.path}`);
    console.log('🍪 Cookies received:', Object.keys(req.cookies || {}).join(', ') || 'NONE');
    console.log('🍪 SessionID:', req.sessionID || 'NO SESSION');
    console.log('🍪 Session authenticated:', req.session?.isAuthenticated || false);
  }
  
  next();
});

// Enhanced session management with database storage
import ConnectPgSimple from 'connect-pg-simple';
const pgStore = ConnectPgSimple(session);

app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60, // 7 days
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'artist-portal-secret',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Custom session name for security
  cookie: { 
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax', // Use 'lax' for better compatibility with published domains
    path: '/', // Explicit path for Safari compatibility
    domain: undefined // Let Express set domain automatically based on request
  },
  rolling: true, // Reset expiration on activity
  unset: 'destroy', // Clear session completely on logout
  proxy: isProduction // Trust proxy in production for secure cookies
}));

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup security monitoring
  try {
    const { setupSecurityMonitoring } = await import('./security-monitoring');
    setupSecurityMonitoring(app);
    console.log("🔐 Security monitoring initialized");
  } catch (error) {
    console.error("Security monitoring setup failed:", error);
  }

  // Run database migrations to ensure schema is up-to-date
  try {
    const { runMigrations } = await import('./migrations');
    await runMigrations();
    console.log("Database setup completed");
  } catch (error) {
    console.error("Database migration error:", error);
    console.log("Warning: Your data may not persist between deployments!");
  }

  // Verify email connection on startup
  try {
    await verifyEmailConnection();
  } catch (error) {
    console.error("Failed to verify email connection:", error);
  }
  
  const server = await registerRoutes(app);

  // Expert diagnostic: Print routing table to identify handler conflicts
  const listEndpoints = await import('express-list-endpoints');
  console.log('\n🔍 EXPERT DIAGNOSTIC: Current routing table:');
  console.table(listEndpoints.default(app).filter(route => route.path.includes('mfa')));
  
  // CRITICAL: Check if MFA disable route is registered
  const allRoutes = listEndpoints.default(app);
  const mfaDisableRoute = allRoutes.find(route => 
    route.path === '/api/admin/mfa/disable' && route.methods.includes('POST')
  );
  console.log('🔍 MFA DISABLE ROUTE FOUND:', mfaDisableRoute ? '✅ YES' : '❌ NO');
  if (mfaDisableRoute) {
    console.log('🔍 MFA DISABLE ROUTE DETAILS:', mfaDisableRoute);
  } else {
    console.log('🔍 ALL MFA ROUTES FOUND:', allRoutes.filter(route => route.path.includes('mfa')));
  }
  console.log('🔍 END ROUTING TABLE\n');

  // Phase 5: Add error correlation middleware before default handler
  app.use(errorLoggerMiddleware);
  
  // Replace default error handler with comprehensive logging system
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start comprehensive health monitoring system
    logger.info('Starting comprehensive error handling and monitoring system');
    startHealthMonitoring();
    logger.info('Health monitoring system activated - tracking memory usage and performance');
    
    // Phase 5: Start backup scheduler for production
    startBackupScheduler();
  });
})();
