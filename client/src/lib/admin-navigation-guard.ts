import { queryClient } from "./queryClient";
import { cacheInvalidation } from "./cache-invalidation";

/**
 * Navigation guard for admin sections to ensure cache consistency
 * This prevents stale data from appearing when users navigate between admin and public areas
 */

let hasAdminChanges = false;

export const adminNavigationGuard = {
  // Mark that admin changes have been made
  markChanges: () => {
    hasAdminChanges = true;
    // Store in sessionStorage as backup
    sessionStorage.setItem('admin_changes_pending', 'true');
  },

  // Clear admin changes flag
  clearChanges: () => {
    hasAdminChanges = false;
    sessionStorage.removeItem('admin_changes_pending');
  },

  // Check if there are pending admin changes
  hasPendingChanges: () => {
    return hasAdminChanges || sessionStorage.getItem('admin_changes_pending') === 'true';
  },

  // Force cache refresh if navigating from admin to public areas
  handleNavigation: (fromPath: string, toPath: string) => {
    const isLeavingAdmin = fromPath.includes('/admin/') && !toPath.includes('/admin/');
    const hasPending = adminNavigationGuard.hasPendingChanges();
    
    if (isLeavingAdmin && hasPending) {
      console.log('🔄 Admin navigation guard: Clearing cache after admin changes');
      
      // Force comprehensive cache invalidation
      cacheInvalidation.galleryAndShop();
      cacheInvalidation.settings();
      
      // Clear the pending changes flag
      adminNavigationGuard.clearChanges();
      
      // Force immediate reload of critical data
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/artworks'] });
        queryClient.refetchQueries({ queryKey: ['/api/products/featured'] });
      }, 100);
    }
  },

  // Emergency cache reset - for when things go really wrong
  emergencyReset: () => {
    console.log('🚨 Emergency cache reset triggered');
    
    // Clear all React Query cache
    queryClient.clear();
    
    // Clear browser cache for API calls
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('api')) {
            caches.delete(cacheName);
          }
        });
      });
    }
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force page reload as last resort
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};

// Auto-trigger cache clearing when leaving admin areas
if (typeof window !== 'undefined') {
  let currentPath = window.location.pathname;
  
  // Monitor for navigation changes
  const handlePathChange = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      adminNavigationGuard.handleNavigation(currentPath, newPath);
      currentPath = newPath;
    }
  };
  
  // Listen for both popstate and pushstate/replacestate events
  window.addEventListener('popstate', handlePathChange);
  
  // Override history methods to catch programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(handlePathChange, 0);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(handlePathChange, 0);
  };
}