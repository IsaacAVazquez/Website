"use client";

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

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