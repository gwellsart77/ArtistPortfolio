import type { Express, Request, Response, NextFunction } from "express";

interface SecurityEvent {
  timestamp: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ip: string;
  userAgent?: string;
  path: string;
  details: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events
  private suspiciousIPs = new Map<string, number>();
  private blockedIPs = new Set<string>();

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Track suspicious activity
    if (event.severity === "HIGH" || event.severity === "CRITICAL") {
      const count = this.suspiciousIPs.get(event.ip) || 0;
      this.suspiciousIPs.set(event.ip, count + 1);

      // Auto-block IPs with too many high-severity events (increased threshold)
      if (count >= 15) {
        this.blockedIPs.add(event.ip);
        console.warn(`🚨 SECURITY: Auto-blocked IP ${event.ip} for suspicious activity`);
      }
    }

    // Log to console for immediate visibility
    const emoji = this.getSeverityEmoji(event.severity);
    console.log(`${emoji} SECURITY [${event.severity}]: ${event.details} (IP: ${event.ip})`);
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case "CRITICAL": return "🔴";
      case "HIGH": return "🟠";
      case "MEDIUM": return "🟡";
      default: return "🔵";
    }
  }

  getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(0, limit);
  }

  getStats() {
    const now = Date.now();
    const last24h = this.events.filter(e => 
      now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalEvents: this.events.length,
      last24Hours: last24h.length,
      criticalEvents: last24h.filter(e => e.severity === "CRITICAL").length,
      highEvents: last24h.filter(e => e.severity === "HIGH").length,
      suspiciousIPs: Array.from(this.suspiciousIPs.entries()),
      blockedIPs: Array.from(this.blockedIPs),
      recentEvents: this.getRecentEvents(10)
    };
  }

  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
  }

  clearAllBlocks(): void {
    this.blockedIPs.clear();
    this.suspiciousIPs.clear();
    console.log(`🟢 SECURITY: Cleared all IP blocks`);
  }
}

const securityMonitor = new SecurityMonitor();

export function setupSecurityMonitoring(app: Express) {
  // IP blocking middleware (temporarily disabled for owner access)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    
    // Temporarily disable blocking to allow owner access
    // if (securityMonitor.isBlocked(clientIP)) {
    //   securityMonitor.logEvent({
    //     type: "BLOCKED_ACCESS_ATTEMPT",
    //     severity: "HIGH",
    //     ip: clientIP,
    //     userAgent: req.get("User-Agent"),
    //     path: req.path,
    //     details: "Blocked IP attempted access"
    //   });
    //   
    //   return res.status(403).json({ 
    //     error: "Access denied", 
    //     message: "Your IP has been blocked due to suspicious activity" 
    //   });
    // }
    
    next();
  });

  // Failed login monitoring
  app.use("/api/admin/login", (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      
      try {
        const responseData = JSON.parse(body);
        if (!responseData.success) {
          securityMonitor.logEvent({
            type: "FAILED_LOGIN",
            severity: "MEDIUM",
            ip: clientIP,
            userAgent: req.get("User-Agent"),
            path: req.path,
            details: `Failed admin login attempt`
          });
        } else {
          securityMonitor.logEvent({
            type: "SUCCESSFUL_LOGIN",
            severity: "LOW",
            ip: clientIP,
            userAgent: req.get("User-Agent"),
            path: req.path,
            details: "Successful admin login"
          });
        }
      } catch (e) {
        // Non-JSON response, ignore
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  });

  // Suspicious request monitoring
  app.use((req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    const path = req.path.toLowerCase();
    const userAgent = req.get("User-Agent") || "";

    // Detect common attack patterns (reduced sensitivity for legitimate traffic)
    const suspiciousPatterns = [
      /\.(php|asp|aspx|jsp)$/,
      /\/wp-admin/,
      /\/phpmyadmin/,
      /\/admin\.php/,
      /\.\.\//,
      /<script[^>]*>/i,
      /union.*select.*from/i,
      /\bor\b.*\b1=1\b.*\band\b/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(path) || pattern.test(req.query.toString())
    );

    if (isSuspicious) {
      securityMonitor.logEvent({
        type: "SUSPICIOUS_REQUEST",
        severity: "MEDIUM", // Reduced from HIGH to prevent auto-blocking
        ip: clientIP,
        userAgent,
        path: req.path,
        details: `Suspicious request pattern detected: ${req.method} ${req.path}`
      });
    }

    // Detect bot traffic
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      securityMonitor.logEvent({
        type: "BOT_TRAFFIC",
        severity: "LOW",
        ip: clientIP,
        userAgent,
        path: req.path,
        details: `Bot traffic detected`
      });
    }

    next();
  });

  // Security monitoring API endpoint
  app.get("/api/admin/security-monitoring", (req: Request, res: Response) => {
    try {
      const stats = securityMonitor.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Security monitoring error:", error);
      res.status(500).json({ error: "Failed to retrieve security stats" });
    }
  });

  // Unblock IP endpoint
  app.post("/api/admin/unblock-ip", (req: Request, res: Response) => {
    try {
      securityMonitor.clearAllBlocks();
      res.json({ success: true, message: "All IP blocks cleared" });
    } catch (error) {
      console.error("Error clearing IP blocks:", error);
      res.status(500).json({ error: "Failed to clear IP blocks" });
    }
  });

  // Unblock IP endpoint (for admin use)
  app.post("/api/admin/unblock-ip", (req: Request, res: Response) => {
    try {
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ error: "IP address required" });
      }
      
      securityMonitor.unblockIP(ip);
      
      securityMonitor.logEvent({
        type: "IP_UNBLOCKED",
        severity: "MEDIUM",
        ip: req.ip || "unknown",
        path: req.path,
        details: `Admin unblocked IP: ${ip}`
      });
      
      res.json({ success: true, message: `IP ${ip} has been unblocked` });
    } catch (error) {
      console.error("Unblock IP error:", error);
      res.status(500).json({ error: "Failed to unblock IP" });
    }
  });

  console.log("🔐 Security monitoring initialized");
}

export { securityMonitor };