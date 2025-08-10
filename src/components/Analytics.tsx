"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { initWebVitals, PerformanceMonitor } from '@/lib/analytics';

// Google Analytics 4 Configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
      page_title: title,
    });
  }
}

// Track fantasy football specific events
export function trackFantasyEvent(action: string, parameters: {
  position?: string;
  player_name?: string;
  tier?: number;
  event_category?: string;
  value?: number;
}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: parameters.event_category || 'fantasy_football',
      fantasy_position: parameters.position,
      player_name: parameters.player_name,
      tier_level: parameters.tier,
      value: parameters.value,
    });
  }
}

// Track user interactions
export function trackInteraction(action: string, category = 'engagement', label?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}

interface AnalyticsProps {
  children?: React.ReactNode;
}

export function Analytics({ children }: AnalyticsProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageView(window.location.href, document.title);
    }
  }, [pathname]);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    initWebVitals();
    PerformanceMonitor.mark('analytics_initialized');
    
    // Track engagement metrics
    let engagementTimer: NodeJS.Timeout;
    const trackEngagement = () => {
      PerformanceMonitor.trackInteraction('user', 'engaged');
    };

    // Track scroll depth milestones
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        if ([25, 50, 75, 90].includes(scrollPercent)) {
          trackInteraction(`scroll_${scrollPercent}`, 'engagement', pathname);
        }
      }
    };

    // Track form submissions and button clicks
    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (event.type === 'submit') {
        const form = target as HTMLFormElement;
        trackInteraction('form_submit', 'conversion', form.id || form.className);
      } else if (target.tagName === 'BUTTON') {
        const button = target as HTMLButtonElement;
        const buttonText = button.textContent?.trim().toLowerCase().replace(/\s+/g, '_') || 'unknown';
        trackInteraction(`button_click_${buttonText}`, 'interaction', pathname);
      }
    };

    // Add event listeners
    const events = ['mousedown', 'keypress', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackEngagement, { passive: true, once: true });
    });
    
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    document.addEventListener('submit', handleInteraction);
    document.addEventListener('click', handleInteraction);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackEngagement);
      });
      window.removeEventListener('scroll', trackScrollDepth);
      document.removeEventListener('submit', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      clearTimeout(engagementTimer);
    };
  }, [pathname]);

  // Don't load analytics in development or if no measurement ID
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== 'production') {
    return <>{children}</>;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          gtag('config', '${GA_MEASUREMENT_ID}', {
            // Privacy-focused configuration
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            
            // Enhanced measurement
            send_page_view: false, // We handle this manually
            
            // Custom parameters for fantasy football tracking
            custom_map: {
              'custom_parameter_1': 'fantasy_position',
              'custom_parameter_2': 'player_name',
              'custom_parameter_3': 'tier_level'
            }
          });

          // Track initial page view
          gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            content_group1: 'fantasy_football'
          });

          // Track fantasy football specific interactions
          window.trackFantasyInteraction = function(action, position, player) {
            gtag('event', action, {
              event_category: 'fantasy_interaction',
              fantasy_position: position,
              player_name: player,
              page_location: window.location.href
            });
          };

          // Track tier interactions
          window.trackTierInteraction = function(action, tier, position) {
            gtag('event', action, {
              event_category: 'tier_interaction', 
              tier_level: tier,
              fantasy_position: position,
              page_location: window.location.href
            });
          };
        `}
      </Script>
      {children}
    </>
  );
}

// Hook for analytics in components
export function useAnalytics() {
  return {
    trackPageView,
    trackFantasyEvent,
    trackInteraction,
  };
}