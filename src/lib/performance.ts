// Performance monitoring utilities

interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  firstInputDelay: number | null;
  cumulativeLayoutShift: number | null;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics = {
    navigation: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    firstInputDelay: null,
    cumulativeLayoutShift: null,
  };

  static init() {
    if (typeof window === 'undefined') return;

    // Navigation timing
    this.captureNavigationTiming();

    // Web Vitals
    this.captureWebVitals();

    // Log metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.logMetrics(), 2000);
    });
  }

  private static captureNavigationTiming() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.navigation = navigation;
    } catch (error) {
      console.warn('Navigation timing not supported');
    }
  }

  private static captureWebVitals() {
    try {
      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.firstContentfulPaint = fcpEntry.startTime;
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cumulativeLayoutShift = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Web Vitals monitoring not fully supported');
    }
  }

  static logMetrics() {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      
      if (this.metrics.navigation) {
        const nav = this.metrics.navigation;
        console.log('📊 Navigation Timing:');
        console.log(`  DNS Lookup: ${nav.domainLookupEnd - nav.domainLookupStart}ms`);
        console.log(`  Connection: ${nav.connectEnd - nav.connectStart}ms`);
        console.log(`  Request: ${nav.responseStart - nav.requestStart}ms`);
        console.log(`  Response: ${nav.responseEnd - nav.responseStart}ms`);
        console.log(`  DOM Load: ${nav.domContentLoadedEventEnd - nav.startTime}ms`);
        console.log(`  Page Load: ${nav.loadEventEnd - nav.startTime}ms`);
      }

      console.log('⚡ Web Vitals:');
      console.log(`  FCP: ${this.metrics.firstContentfulPaint?.toFixed(2)}ms`);
      console.log(`  LCP: ${this.metrics.largestContentfulPaint?.toFixed(2)}ms`);
      console.log(`  FID: ${this.metrics.firstInputDelay?.toFixed(2)}ms`);
      console.log(`  CLS: ${this.metrics.cumulativeLayoutShift?.toFixed(4)}`);

      // Performance recommendations
      this.generateRecommendations();
      
      console.groupEnd();
    }
  }

  private static generateRecommendations() {
    const recommendations: string[] = [];

    if (this.metrics.firstContentfulPaint && this.metrics.firstContentfulPaint > 2000) {
      recommendations.push('🔄 Consider optimizing above-the-fold content for faster FCP');
    }

    if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) {
      recommendations.push('🖼️ Optimize largest content element (images, videos) for better LCP');
    }

    if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
      recommendations.push('⚡ Reduce JavaScript execution time for better FID');
    }

    if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('📐 Add size attributes to images and reserve space for dynamic content');
    }

    if (recommendations.length > 0) {
      console.log('💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  ${rec}`));
    } else {
      console.log('✅ All Web Vitals look good!');
    }
  }

  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// Image loading performance utilities
export function measureImageLoad(src: string, callback?: (time: number) => void) {
  const startTime = performance.now();
  const img = new Image();
  
  img.onload = () => {
    const loadTime = performance.now() - startTime;
    callback?.(loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🖼️ Image loaded in ${loadTime.toFixed(2)}ms: ${src}`);
    }
  };
  
  img.onerror = () => {
    const errorTime = performance.now() - startTime;
    console.warn(`❌ Image failed to load after ${errorTime.toFixed(2)}ms: ${src}`);
  };
  
  img.src = src;
  return img;
}

// Bundle size monitoring
export function logBundleInfo() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  // This will be filled by webpack or build tools in real implementation
  console.log('📦 Bundle Analysis: Check build output for detailed bundle sizes');
}

// Critical Resource hints
export function addResourceHints(resources: Array<{ href: string; as: string; type?: string }>) {
  if (typeof document === 'undefined') return;

  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    document.head.appendChild(link);
  });
}