import { adminNavigationGuard } from "./admin-navigation-guard";

/**
 * Emergency cache reset utility for troubleshooting cache-related issues
 * Users can call these functions from the browser console if images disappear
 */

export const emergencyCacheReset = {
  // Level 1: Soft reset - just clear React Query cache
  softReset: () => {
    console.log('🔧 Emergency Cache Reset: Level 1 (Soft)');
    adminNavigationGuard.emergencyReset();
    return 'Cache cleared successfully. Refresh the page if issues persist.';
  },

  // Level 2: Hard reset - clear all browser cache
  hardReset: async () => {
    console.log('🔧 Emergency Cache Reset: Level 2 (Hard)');
    
    // Clear all browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log('✅ Browser caches cleared');
    }
    
    // Clear local and session storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Browser storage cleared');
    
    // Clear React Query cache
    adminNavigationGuard.emergencyReset();
    
    return 'Complete cache reset performed. The page will reload automatically.';
  },

  // Level 3: Nuclear option - force page reload
  nuclearReset: () => {
    console.log('🚨 Emergency Cache Reset: Level 3 (Nuclear)');
    emergencyCacheReset.hardReset().then(() => {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
    return 'Nuclear reset initiated. Page will reload in 1 second.';
  }
};

// Make emergency functions available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).emergencyCacheReset = emergencyCacheReset;
  
  // Provide helpful console message
  console.log(`
🔧 Emergency Cache Reset Utilities Available:
   emergencyCacheReset.softReset()   - Clear React Query cache only
   emergencyCacheReset.hardReset()   - Clear all browser cache
   emergencyCacheReset.nuclearReset() - Complete reset + page reload
   
Use these if images disappear or data seems stale after admin changes.
  `);
}