import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { initGoogleAnalytics, trackGAPageView } from '../lib/google-analytics';

export const useGoogleAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  const initializationRef = useRef<boolean>(false);

  // Fetch Google Analytics settings
  const { data: googleAnalyticsEnabled } = useQuery({
    queryKey: ["/api/settings/google_analytics_enabled"],
  });

  const { data: googleAnalyticsId } = useQuery({
    queryKey: ["/api/settings/google_analytics_id"],
  });

  // Initialize Google Analytics once when enabled and ID is available
  useEffect(() => {
    const isEnabled = googleAnalyticsEnabled?.value === "true";
    const measurementId = googleAnalyticsId?.value;

    if (isEnabled && measurementId && !initializationRef.current) {
      initGoogleAnalytics(measurementId);
      initializationRef.current = true;
    }
  }, [googleAnalyticsEnabled?.value, googleAnalyticsId?.value]);

  // Track page views when location changes
  useEffect(() => {
    const isEnabled = googleAnalyticsEnabled?.value === "true";
    const measurementId = googleAnalyticsId?.value;

    if (isEnabled && measurementId && location !== prevLocationRef.current) {
      trackGAPageView(location, measurementId);
      prevLocationRef.current = location;
    }
  }, [location, googleAnalyticsEnabled?.value, googleAnalyticsId?.value]);

  return {
    isGoogleAnalyticsEnabled: googleAnalyticsEnabled?.value === "true",
    measurementId: googleAnalyticsId?.value
  };
};