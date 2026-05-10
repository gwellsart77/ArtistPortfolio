import { queryClient } from "./queryClient";

/**
 * Cache invalidation utilities for admin operations
 * These functions ensure the frontend stays in sync with backend changes
 */

export const cacheInvalidation = {
  // Invalidate artwork-related queries
  artworks: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/artworks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/artworks/featured'] });
    queryClient.invalidateQueries({ queryKey: ['/api/artworks/categories'] });
  },

  // Invalidate product-related queries
  products: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/categories'] });
  },

  // Invalidate settings-related queries
  settings: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    // Invalidate all settings queries that start with /api/settings/
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/settings/')
    });
  },

  // Invalidate commission-related queries
  commissions: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/commission'] });
    queryClient.invalidateQueries({ queryKey: ['/api/commission/settings'] });
  },

  // Invalidate analytics-related queries
  analytics: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    queryClient.invalidateQueries({ queryKey: ['/api/analytics/'] });
  },

  // Invalidate all cache - use sparingly
  all: () => {
    queryClient.invalidateQueries();
  },

  // Force complete cache refresh for gallery/shop content
  galleryAndShop: () => {
    // Clear all gallery/shop related queries
    queryClient.removeQueries({ queryKey: ['/api/artworks'] });
    queryClient.removeQueries({ queryKey: ['/api/products'] });
    queryClient.removeQueries({ queryKey: ['/api/products/featured'] });
    queryClient.removeQueries({ queryKey: ['/api/artworks/featured'] });
    
    // Invalidate to force refetch
    queryClient.invalidateQueries({ queryKey: ['/api/artworks'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    queryClient.invalidateQueries({ queryKey: ['/api/artworks/featured'] });
    
    // Force immediate refetch of critical data
    queryClient.refetchQueries({ queryKey: ['/api/artworks'] });
    queryClient.refetchQueries({ queryKey: ['/api/products/featured'] });
  }
};

// Enhanced API request function with automatic cache invalidation
export async function apiRequestWithInvalidation(
  method: string,
  url: string,
  data?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  // Automatic cache invalidation based on URL patterns
  if (method !== 'GET') {
    if (url.includes('/api/artworks') || url.includes('/api/admin/artworks')) {
      cacheInvalidation.artworks();
    }
    if (url.includes('/api/products') || url.includes('/api/admin/products')) {
      cacheInvalidation.products();
    }
    if (url.includes('/api/settings') || url.includes('/api/admin/settings')) {
      cacheInvalidation.settings();
    }
    if (url.includes('/api/commission') || url.includes('/api/admin/commission')) {
      cacheInvalidation.commissions();
    }
    if (url.includes('/api/analytics') || url.includes('/api/admin/analytics')) {
      cacheInvalidation.analytics();
    }
  }

  return response;
}