import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';
import { initPageTracking } from '../lib/analytics-tracker';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      // Track with Google Analytics (if configured)
      trackPageView(location);
      // Track with database analytics
      initPageTracking(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};