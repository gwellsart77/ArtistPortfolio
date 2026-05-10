// Google Analytics integration utilities

// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGoogleAnalytics = (measurementId: string) => {
  if (!measurementId) {
    console.warn('Google Analytics Measurement ID not provided');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);

  console.log('Google Analytics initialized with ID:', measurementId);
};

// Track page views - useful for single-page applications
export const trackGAPageView = (url: string, measurementId: string) => {
  if (typeof window === 'undefined' || !window.gtag || !measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackGAEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track conversions (for e-commerce)
export const trackGAConversion = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items?: any[]
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items
  });
};

// Track custom conversions
export const trackGACustomEvent = (eventName: string, parameters: any = {}) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
};