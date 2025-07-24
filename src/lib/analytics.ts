import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Analytics configuration
const ANALYTICS_CONFIG = {
  // In production, you would set these to your actual analytics endpoints
  GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  VERCEL_ANALYTICS: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  // Custom analytics endpoint for collecting Web Vitals
  WEB_VITALS_ENDPOINT: '/api/analytics/web-vitals'
};

// Web Vitals thresholds (in milliseconds)
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },     // Largest Contentful Paint
  INP: { good: 200, poor: 500 },       // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, poor: 0.25 },      // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },     // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }      // Time to First Byte
};

// Performance rating helper
function getPerformanceRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metric as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Send metric data to analytics
async function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: getPerformanceRating(metric.name, metric.value),
    url: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    // Additional context
    connectionType: (navigator as any).connection?.effectiveType,
    deviceMemory: (navigator as any).deviceMemory,
    isBot: /bot|crawler|spider/i.test(navigator.userAgent)
  };

  try {
    // Send to custom analytics endpoint
    if (ANALYTICS_CONFIG.WEB_VITALS_ENDPOINT) {
      await fetch(ANALYTICS_CONFIG.WEB_VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    // Send to Google Analytics 4 if configured
    if (ANALYTICS_CONFIG.GA_MEASUREMENT_ID && typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: getPerformanceRating(metric.name, metric.value),
      });
    }

    console.log(`📊 Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: getPerformanceRating(metric.name, metric.value),
      id: metric.id
    });

  } catch (error) {
    console.error('Failed to send analytics:', error);
  }
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Track custom events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  try {
    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        custom_parameter: JSON.stringify(properties),
        ...properties
      });
    }

    // Send to custom analytics endpoint
    if (ANALYTICS_CONFIG.WEB_VITALS_ENDPOINT) {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          url: window.location.pathname,
          timestamp: Date.now()
        }),
      }).catch(error => console.error('Failed to track event:', error));
    }

    console.log('📈 Event tracked:', eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Track page views
export function trackPageView(url?: string) {
  const pageUrl = url || window.location.pathname + window.location.search;
  
  try {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', ANALYTICS_CONFIG.GA_MEASUREMENT_ID, {
        page_path: pageUrl,
      });
    }

    // Custom tracking
    trackEvent('page_view', {
      page_path: pageUrl,
      page_title: document.title,
      referrer: document.referrer
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Performance monitoring utilities
export const PerformanceMonitor = {
  // Measure custom metrics
  mark: (name: string) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        const duration = entries[entries.length - 1]?.duration;
        
        if (duration !== undefined) {
          trackEvent('custom_timing', {
            name,
            duration,
            rating: duration < 1000 ? 'good' : duration < 2000 ? 'needs-improvement' : 'poor'
          });
        }
        
        return duration;
      } catch (error) {
        console.error('Failed to measure performance:', error);
      }
    }
  },

  // Monitor specific interactions
  trackInteraction: (element: string, action: string) => {
    trackEvent('user_interaction', {
      element,
      action,
      page: window.location.pathname
    });
  },

  // Monitor errors
  trackError: (error: Error, context?: string) => {
    trackEvent('javascript_error', {
      message: error.message,
      stack: error.stack,
      context,
      page: window.location.pathname,
      userAgent: navigator.userAgent
    });
  }
};

// Initialize analytics when the module loads
if (typeof window !== 'undefined') {
  // Initialize Web Vitals monitoring
  initWebVitals();
  
  // Track initial page view
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', () => trackPageView());
  }

  // Track navigation changes for SPA
  let currentUrl = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentUrl) {
      currentUrl = window.location.pathname;
      trackPageView();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Global error tracking
  window.addEventListener('error', (event) => {
    PerformanceMonitor.trackError(event.error, 'global_error_handler');
  });

  window.addEventListener('unhandledrejection', (event) => {
    PerformanceMonitor.trackError(
      new Error(event.reason), 
      'unhandled_promise_rejection'
    );
  });
}