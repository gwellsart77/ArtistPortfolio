/**
 * Accessibility Enhancement Component
 * Implements comprehensive accessibility features and ARIA labels
 */

import { useEffect } from 'react';

interface AccessibilityEnhancerProps {
  children: React.ReactNode;
}

export function AccessibilityEnhancer({ children }: AccessibilityEnhancerProps) {
  useEffect(() => {
    // Add skip navigation link if not present
    const addSkipNavigation = () => {
      if (!document.querySelector('.skip-nav')) {
        const skipNav = document.createElement('a');
        skipNav.href = '#main-content';
        skipNav.className = 'skip-nav absolute left-0 top-0 z-50 bg-blue-600 text-white px-4 py-2 transform -translate-y-full focus:translate-y-0 transition-transform duration-200';
        skipNav.textContent = 'Skip to main content';
        skipNav.setAttribute('aria-label', 'Skip to main content');
        document.body.insertBefore(skipNav, document.body.firstChild);
      }
    };

    // Enhance form accessibility
    const enhanceFormAccessibility = () => {
      // Find inputs without proper labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        if (htmlInput.type === 'hidden') return;
        
        const label = document.querySelector(`label[for="${htmlInput.id}"]`);
        if (!label && htmlInput.placeholder) {
          // Use placeholder as aria-label if no label exists
          htmlInput.setAttribute('aria-label', htmlInput.placeholder);
        }
      });

      // Enhance button accessibility
      const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      buttons.forEach((button) => {
        const buttonText = button.textContent?.trim();
        const icon = button.querySelector('svg, i, [class*="icon"]');
        
        if (!buttonText && icon) {
          // Try to determine button purpose from context
          const parentForm = button.closest('form');
          const isSubmit = button.getAttribute('type') === 'submit';
          const isClose = button.classList.contains('close') || button.querySelector('[class*="close"]');
          const isMenu = button.classList.contains('menu') || button.querySelector('[class*="menu"]');
          
          if (isSubmit && parentForm) {
            button.setAttribute('aria-label', 'Submit form');
          } else if (isClose) {
            button.setAttribute('aria-label', 'Close');
          } else if (isMenu) {
            button.setAttribute('aria-label', 'Open menu');
          } else {
            button.setAttribute('aria-label', 'Action button');
          }
        }
      });
    };

    // Enhance image accessibility
    const enhanceImageAccessibility = () => {
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        // For decorative images, add empty alt text
        if (htmlImg.closest('[role="presentation"]') || htmlImg.classList.contains('decorative')) {
          htmlImg.setAttribute('alt', '');
        } else {
          // Try to generate meaningful alt text from context
          const figcaption = htmlImg.closest('figure')?.querySelector('figcaption');
          const title = htmlImg.getAttribute('title');
          const filename = htmlImg.src.split('/').pop()?.split('.')[0];
          
          const altText = figcaption?.textContent || title || `Image: ${filename}` || 'Image';
          htmlImg.setAttribute('alt', altText);
        }
      });
    };

    // Add focus management for modals and dialogs
    const enhanceFocusManagement = () => {
      const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup');
      dialogs.forEach((dialog) => {
        if (!dialog.getAttribute('aria-labelledby') && !dialog.getAttribute('aria-label')) {
          const title = dialog.querySelector('h1, h2, h3, .title, .modal-title');
          if (title) {
            const titleId = title.id || `dialog-title-${Math.random().toString(36).substr(2, 9)}`;
            title.id = titleId;
            dialog.setAttribute('aria-labelledby', titleId);
          } else {
            dialog.setAttribute('aria-label', 'Dialog');
          }
        }
      });
    };

    // Enhance keyboard navigation
    const enhanceKeyboardNavigation = () => {
      // Make sure all interactive elements are keyboard accessible
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      interactiveElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.tabIndex === -1 && !(htmlElement as HTMLInputElement | HTMLButtonElement).disabled) {
          // Only add tabindex if element should be keyboard accessible
          if (element.tagName === 'A' || element.tagName === 'BUTTON') {
            htmlElement.tabIndex = 0;
          }
        }
      });

      // Add keyboard support for custom interactive elements
      const customInteractive = document.querySelectorAll('[role="button"], [role="link"], [onclick]');
      customInteractive.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.tabIndex || htmlElement.tabIndex < 0) {
          htmlElement.tabIndex = 0;
        }
        
        // Add keyboard event listeners if not present
        if (!htmlElement.dataset.keyboardEnhanced) {
          htmlElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              htmlElement.click();
            }
          });
          htmlElement.dataset.keyboardEnhanced = 'true';
        }
      });
    };

    // Add live region for dynamic content announcements
    const addLiveRegion = () => {
      if (!document.querySelector('#aria-live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }
    };

    // Run all enhancements
    addSkipNavigation();
    enhanceFormAccessibility();
    enhanceImageAccessibility();
    enhanceFocusManagement();
    enhanceKeyboardNavigation();
    addLiveRegion();

    // Set up mutation observer to enhance dynamically added content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Small delay to allow React to finish rendering
          setTimeout(() => {
            enhanceFormAccessibility();
            enhanceImageAccessibility();
            enhanceFocusManagement();
            enhanceKeyboardNavigation();
          }, 100);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}

// Utility function to announce messages to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const liveRegion = document.querySelector('#aria-live-region');
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Component for proper heading hierarchy
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Heading({ level, children, className = '', id }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag 
      className={className} 
      id={id}
      tabIndex={-1} // Allow programmatic focus for skip links
    >
      {children}
    </Tag>
  );
}

// Component for accessible form labels
interface AccessibleLabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleLabel({ htmlFor, required = false, children, className = '' }: AccessibleLabelProps) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={className}
    >
      {children}
      {required && (
        <span 
          className="text-red-500 ml-1" 
          aria-label="required"
        >
          *
        </span>
      )}
    </label>
  );
}

// Component for accessible error messages
interface AccessibleErrorProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleError({ id, children, className = '' }: AccessibleErrorProps) {
  return (
    <div 
      id={id}
      role="alert"
      aria-live="polite"
      className={`text-red-500 text-sm mt-1 ${className}`}
    >
      {children}
    </div>
  );
}