/**
 * Core Web Vitals Monitoring Component
 * Tracks performance metrics for SEO optimization
 */

import { useEffect } from 'react';

export function CoreWebVitalsMonitor(): null {
  useEffect(() => {
    // Performance monitoring logic available
    // Only monitor in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !localStorage.getItem('monitor-cwv')) {
      return;
    }

    // Monitor Core Web Vitals using Performance Observer API
    if ('PerformanceObserver' in window) {
      try {
        // Monitor Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry && lastEntry.startTime > 2500) {
            console.warn(`⚠️ Poor LCP detected: ${lastEntry.startTime}ms (should be < 2.5s)`);
          } else if (lastEntry) {
            console.log(`✅ Good LCP: ${lastEntry.startTime}ms`);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            
            if (fid > 100) {
              console.warn(`⚠️ Poor FID detected: ${fid}ms (should be < 100ms)`);
            } else {
              console.log(`✅ Good FID: ${fid}ms`);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Monitor Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          if (clsValue > 0.1) {
            console.warn(`⚠️ Poor CLS detected: ${clsValue} (should be < 0.1)`);
          } else if (clsValue > 0) {
            console.log(`✅ Good CLS: ${clsValue}`);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Cleanup observers
        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}

// Add CSS for skip navigation and accessibility
export function AccessibilityStyles(): null {
  useEffect(() => {
    // Add skip navigation styles if not already present
    if (!document.querySelector('#accessibility-styles')) {
      const style = document.createElement('style');
      style.id = 'accessibility-styles';
      style.textContent = `
        /* Skip navigation link */
        .skip-nav {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          border-radius: 0 0 4px 4px;
          z-index: 1000;
          transition: top 0.3s;
        }
        
        .skip-nav:focus {
          top: 0;
        }

        /* Screen reader only text */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Focus indicators */
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          button, input, select, textarea {
            border: 2px solid;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Print styles for better accessibility */
        @media print {
          .no-print {
            display: none !important;
          }
          
          a[href^="http"]:after {
            content: " (" attr(href) ")";
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
}