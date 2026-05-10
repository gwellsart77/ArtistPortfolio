import { Request, Response, NextFunction } from 'express';
import { WebSocket } from 'ws';

interface CacheInvalidationMessage {
  type: 'cache_invalidation';
  data: {
    operation: string;
    path: string;
    invalidateKeys: string[];
  };
}

/**
 * Middleware to automatically trigger cache invalidation on the frontend
 * when admin operations modify data that affects the public website
 */
export class CacheInvalidationMiddleware {
  private static connectedClients: Set<WebSocket> = new Set();
  
  static addClient(ws: WebSocket) {
    this.connectedClients.add(ws);
    ws.on('close', () => {
      this.connectedClients.delete(ws);
    });
  }

  static broadcastInvalidation(operation: string, path: string, invalidateKeys: string[]) {
    const message: CacheInvalidationMessage = {
      type: 'cache_invalidation',
      data: { operation, path, invalidateKeys }
    };

    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Track successful responses
      res.send = function(data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheInvalidationMiddleware.handleSuccessfulResponse(req, res);
        }
        return originalSend.call(this, data);
      };

      res.json = function(data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheInvalidationMiddleware.handleSuccessfulResponse(req, res);
        }
        return originalJson.call(this, data);
      };

      next();
    };
  }

  private static handleSuccessfulResponse(req: Request, res: Response) {
    const method = req.method;
    const path = req.path;
    
    // Only process non-GET requests (CREATE, UPDATE, DELETE operations)
    if (method === 'GET') return;

    const invalidateKeys: string[] = [];
    
    // Artwork-related operations
    if (path.includes('/api/admin/artworks') || path.includes('/api/artworks')) {
      invalidateKeys.push('/api/artworks', '/api/artworks/featured', '/api/artworks/categories');
    }
    
    // Product-related operations
    if (path.includes('/api/admin/products') || path.includes('/api/products')) {
      invalidateKeys.push('/api/products', '/api/products/featured', '/api/products/categories');
    }
    
    // Settings-related operations
    if (path.includes('/api/admin/settings') || path.includes('/api/settings')) {
      invalidateKeys.push('/api/settings');
      // Add specific settings keys
      if (path.includes('/api/settings/')) {
        invalidateKeys.push(path.replace('/api/admin/', '/api/'));
      }
    }
    
    // Commission-related operations
    if (path.includes('/api/admin/commission') || path.includes('/api/commission')) {
      invalidateKeys.push('/api/commission', '/api/commission/settings');
    }
    
    // Analytics-related operations
    if (path.includes('/api/admin/analytics') || path.includes('/api/analytics')) {
      invalidateKeys.push('/api/analytics');
    }

    // Broadcast invalidation if we have keys to invalidate
    if (invalidateKeys.length > 0) {
      this.broadcastInvalidation(method, path, invalidateKeys);
    }
  }
}