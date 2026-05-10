/**
 * Comprehensive Logging and Monitoring System
 * Implements centralized error handling and performance monitoring
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

interface PerformanceMetric {
  timestamp: string;
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

class Logger {
  private requestTracking = new Map<string, { startTime: number; metadata: any }>();

  /**
   * Log an informational message
   */
  info(message: string, metadata?: Record<string, any>, requestId?: string): void {
    this.writeLog('info', message, metadata, requestId);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>, requestId?: string): void {
    this.writeLog('warn', message, metadata, requestId);
  }

  /**
   * Log an error with full context
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, any>, requestId?: string): void {
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    };
    this.writeLog('error', message, errorMetadata, requestId);
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, metadata?: Record<string, any>, requestId?: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, metadata, requestId);
    }
  }

  /**
   * Start tracking a performance metric
   */
  startPerformanceTracking(operation: string, requestId: string, metadata?: Record<string, any>): void {
    this.requestTracking.set(requestId, {
      startTime: Date.now(),
      metadata: { operation, ...metadata }
    });
  }

  /**
   * End performance tracking and log the result
   */
  endPerformanceTracking(requestId: string, success: boolean = true, additionalMetadata?: Record<string, any>): void {
    const tracking = this.requestTracking.get(requestId);
    if (tracking) {
      const duration = Date.now() - tracking.startTime;
      const metric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        operation: tracking.metadata.operation,
        duration,
        success,
        metadata: { ...tracking.metadata, ...additionalMetadata }
      };

      // Log performance metrics
      if (duration > 1000) {
        this.warn(`Slow operation detected: ${metric.operation}`, { duration, success }, requestId);
      } else {
        this.debug(`Performance: ${metric.operation}`, { duration, success }, requestId);
      }

      this.requestTracking.delete(requestId);
    }
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, requestId?: string): void {
    const metadata = { operation, table, duration, success };
    
    if (!success) {
      this.error(`Database operation failed: ${operation} on ${table}`, undefined, metadata, requestId);
    } else if (duration > 500) {
      this.warn(`Slow database query: ${operation} on ${table}`, metadata, requestId);
    } else {
      this.debug(`Database: ${operation} on ${table}`, metadata, requestId);
    }
  }

  /**
   * Log API requests and responses
   */
  logApiRequest(method: string, path: string, statusCode: number, duration: number, requestId?: string, userId?: string): void {
    const metadata = { method, path, statusCode, duration, userId };
    
    if (statusCode >= 500) {
      this.error(`Server error: ${method} ${path}`, undefined, metadata, requestId);
    } else if (statusCode >= 400) {
      this.warn(`Client error: ${method} ${path}`, metadata, requestId);
    } else if (duration > 2000) {
      this.warn(`Slow API response: ${method} ${path}`, metadata, requestId);
    } else {
      this.info(`API: ${method} ${path}`, metadata, requestId);
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', metadata?: Record<string, any>, requestId?: string): void {
    const securityMetadata = { event, severity, ...metadata };
    
    if (severity === 'high') {
      this.error(`Security Alert: ${event}`, undefined, securityMetadata, requestId);
    } else if (severity === 'medium') {
      this.warn(`Security Warning: ${event}`, securityMetadata, requestId);
    } else {
      this.info(`Security Event: ${event}`, securityMetadata, requestId);
    }
  }

  /**
   * Write log entry to console and potentially external services
   */
  private writeLog(level: LogEntry['level'], message: string, metadata?: Record<string, any>, requestId?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: metadata || {},
      requestId
    };

    // Console output with color coding
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    };
    const reset = '\x1b[0m';

    const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
    const timestamp = `\x1b[90m${logEntry.timestamp}${reset}`;
    
    console.log(`${timestamp} ${prefix} ${message}`);
    
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(`${timestamp} ${prefix} Metadata:`, metadata);
    }
  }
}

// Singleton logger instance
export const logger = new Logger();

/**
 * Error handling middleware for Express
 */
export function errorHandler(error: Error, req: any, res: any, _next: any): void {
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  logger.error('Unhandled server error', error, {
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body
  }, requestId);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    requestId: requestId
  });
}

/**
 * Request logging middleware
 */
export function requestLogger(req: any, res: any, next: any): void {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  const startTime = Date.now();
  
  logger.startPerformanceTracking('api_request', requestId, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - startTime;
    logger.logApiRequest(req.method, req.path, res.statusCode, duration, requestId);
    logger.endPerformanceTracking(requestId, res.statusCode < 400);
    originalEnd.call(res, chunk, encoding);
  };

  next();
}

/**
 * Database query wrapper with logging
 */
export function loggedDatabaseQuery<T>(
  operation: string,
  table: string,
  queryFunction: () => Promise<T>,
  requestId?: string
): Promise<T> {
  const startTime = Date.now();
  
  return queryFunction()
    .then(result => {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation(operation, table, duration, true, requestId);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation(operation, table, duration, false, requestId);
      logger.error(`Database error in ${operation} on ${table}`, error, undefined, requestId);
      throw error;
    });
}

/**
 * Application health monitoring
 */
export function startHealthMonitoring(): void {
  const checkInterval = 30000; // 30 seconds
  
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    logger.debug('Health check', {
      memoryUsage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      uptime: `${Math.round(uptime)}s`
    });

    // Alert on high memory usage
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
      });
    }
  }, checkInterval);
}