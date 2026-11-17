import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initGoogleAnalytics } from '../lib/google-analytics';

/**
 * Google Analytics 4.
 *
 * The server writes the GA tag into every page's HTML when it is switched on in
 * Admin → Analytics (server/seo.ts), so visits count from the first moment.
 * Page changes inside the app are counted by GA4's "enhanced measurement"
 * (browser history events), which is on by default, so there is no manual
 * page_view here (that would count every page twice).
 *
 * This hook only adds the tag if the server did not (for example when the
 * setting was switched on after the page loaded).
 */
export const useGoogleAnalytics = () => {
  const { data: googleAnalyticsEnabled } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/google_analytics_enabled"],
    retry: false,
  });

  const { data: googleAnalyticsId } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/google_analytics_id"],
    retry: false,
  });

  const isEnabled = googleAnalyticsEnabled?.value === "true";
  const measurementId = googleAnalyticsId?.value?.trim();

  useEffect(() => {
    if (!isEnabled || !measurementId || !/^G-[A-Z0-9]{4,20}$/.test(measurementId)) return;
    if (typeof window === 'undefined' || (window as any).__GA_ID__) return; // server already added it
    // Admin pages are not counted as visitors
    if (window.location.pathname.startsWith('/admin')) return;
    initGoogleAnalytics(measurementId);
    (window as any).__GA_ID__ = measurementId;
  }, [isEnabled, measurementId]);

  return { isGoogleAnalyticsEnabled: isEnabled, measurementId };
};
