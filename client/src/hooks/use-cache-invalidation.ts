import { useEffect } from 'react';
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
  useEffect(() => {
    // Only set up WebSocket in browser environment
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
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
          reconnectTimer = setTimeout(connect, 3000);
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
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, []);
}