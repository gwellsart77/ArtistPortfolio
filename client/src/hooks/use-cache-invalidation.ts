import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';

interface CacheInvalidationMessage {
  type: 'cache_invalidation';
  data: {
    operation: string;
    path: string;
    invalidateKeys: string[];
  };
}

/**
 * Hook to listen for cache invalidation messages from the server
 * and automatically invalidate the appropriate query cache
 */
export function useCacheInvalidation() {
  // Live updates only matter while Gabe is editing in the admin area.
  // Public visitors never open this connection (it used to retry every 3 s forever).
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');

  useEffect(() => {
    // Only set up WebSocket in browser environment, and only in the admin area
    if (typeof window === 'undefined' || !isAdmin) return;
    let attempts = 0;
    let stopped = false;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          attempts = 0;
          // Debug level logging only
          if (import.meta.env.DEV) {
            console.debug('Cache invalidation WebSocket connected');
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const message: CacheInvalidationMessage = JSON.parse(event.data);
            
            if (message.type === 'cache_invalidation') {
              const { operation, path, invalidateKeys } = message.data;
              
              console.log(`Cache invalidation triggered: ${operation} ${path}`, invalidateKeys);
              
              // Invalidate all specified query keys
              invalidateKeys.forEach(key => {
                queryClient.invalidateQueries({ queryKey: [key] });
              });
              
              // Also invalidate queries that start with the key
              invalidateKeys.forEach(key => {
                queryClient.invalidateQueries({ 
                  predicate: (query) => 
                    typeof query.queryKey[0] === 'string' && 
                    query.queryKey[0].startsWith(key)
                });
              });
            }
          } catch (error) {
            console.error('Error parsing cache invalidation message:', error);
          }
        };
        
        ws.onclose = () => {
          // Silently reconnect without console spam
          if (import.meta.env.DEV) {
            console.debug('Cache invalidation WebSocket disconnected, attempting to reconnect...');
          }
          if (stopped) return;
          attempts += 1;
          // Back off: 3 s, 6 s, 12 s ... up to 60 s; give up after 8 tries
          if (attempts <= 8) reconnectTimer = setTimeout(connect, Math.min(3000 * 2 ** (attempts - 1), 60000));
        };
        
        ws.onerror = (error) => {
          // Only log non-connection related errors
          if (error.type !== 'close' && import.meta.env.DEV) {
            console.debug('Cache invalidation WebSocket error:', error);
          }
        };
        
      } catch (error) {
        // Silent retry for expected connection failures
        if (import.meta.env.DEV) {
          console.debug('Error connecting to cache invalidation WebSocket:', error);
        }
        reconnectTimer = setTimeout(connect, 3000);
      }
    };
    
    connect();
    
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [isAdmin]);
}