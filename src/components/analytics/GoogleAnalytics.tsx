"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Loads the GA4 gtag.js library and initialises the data layer.
 *
 * Renders nothing unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a valid measurement
 * id, so dev / CI / tests stay script-free. Scripts use the `afterInteractive`
 * strategy so analytics never blocks first paint.
 */
export function GoogleAnalytics() {
  if (!isAnalyticsEnabled()) return null;

  return (
    <>
      <Script
        id="ga4-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}
