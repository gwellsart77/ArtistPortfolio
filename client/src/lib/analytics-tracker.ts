import { apiRequest } from "@/lib/queryClient";

// Generate a unique session ID
function generateSessionId(): string {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Get browser info
function getBrowserInfo(): { browser: string; os: string } {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return { browser, os };
}

// Track page view
export async function trackPageView(path: string): Promise<void> {
  try {
    const sessionId = getSessionId();
    const { browser, os } = getBrowserInfo();
    
    await apiRequest('POST', '/api/analytics/track', {
      sessionId,
      path,
      referer: document.referrer || null,
      userAgent: navigator.userAgent,
      device: getDeviceType(),
      browser,
      os,
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Track custom events (artwork views, product views, etc.)
export async function trackEvent(eventType: string, eventData?: any, path?: string): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    await apiRequest('POST', '/api/analytics/event', {
      sessionId,
      eventType,
      eventData,
      path: path || window.location.pathname,
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Track time spent on page
let pageStartTime = Date.now();
let currentPath = window.location.pathname;

export function trackPageDuration(): void {
  const duration = Math.round((Date.now() - pageStartTime) / 1000);
  
  if (duration > 5) { // Only track if user spent more than 5 seconds
    apiRequest('POST', '/api/analytics/duration', {
      sessionId: getSessionId(),
      path: currentPath,
      duration,
    }).catch(error => {
      console.error('Failed to track page duration:', error);
    });
  }
}

// Initialize tracking for a new page
export function initPageTracking(path: string): void {
  // Track previous page duration before switching
  if (currentPath !== path) {
    trackPageDuration();
  }
  
  // Reset for new page
  pageStartTime = Date.now();
  currentPath = path;
  
  // Track new page view
  trackPageView(path);
}

// Track when user leaves the page
window.addEventListener('beforeunload', trackPageDuration);
window.addEventListener('pagehide', trackPageDuration);