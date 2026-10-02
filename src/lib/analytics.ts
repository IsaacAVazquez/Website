/**
 * Google Analytics 4 (GA4) event tracking — framework-free core.
 *
 * Everything here is a safe no-op unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
 * to a real measurement id (e.g. "G-XXXXXXXXXX"). That keeps local dev, CI, and
 * the test suite free of third-party scripts while letting production opt in via
 * a single environment variable. No analytics calls run on the server or before
 * gtag has loaded — each helper guards on `window` and on `window.gtag`.
 *
 * Naming follows GA4 conventions: event and parameter names are lower
 * snake_case, event names are <= 40 chars, parameter names <= 40 chars, and
 * string values are clamped to <= 100 chars (`clampValue`).
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

/** A measurement id looks like "G-XXXXXXXXXX". Anything else is treated as off. */
export function isAnalyticsEnabled(): boolean {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 caps string parameter values at 100 characters. */
function clampValue<T>(value: T): T | string {
  if (typeof value === "string" && value.length > 100) {
    return value.slice(0, 100);
  }
  return value;
}

function cleanParams(params: GtagParams): GtagParams {
  const out: GtagParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = clampValue(value) as string | number | boolean;
  }
  return out;
}

/**
 * Low-level event dispatch. Safe to call anywhere — it does nothing on the
 * server, when analytics is disabled, or before gtag has finished loading.
 */
export function trackEvent(eventName: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, cleanParams(params));
}

// ---------------------------------------------------------------------------
// Canonical event names (single source of truth, also used by the reference page)
// ---------------------------------------------------------------------------

export const GA_EVENT = {
  navigationClick: "navigation_click",
  codeCopy: "code_copy",
  listingFilter: "listing_filter",
  listingSearch: "listing_search",
  scrollDepth: "scroll_depth",
  newsletterSubscribe: "newsletter_subscribe",
} as const;

type NavLocation =
  | "header_primary"
  | "header_brand"
  | "header_mobile"
  | "header_mobile_toggle"
  | "header_search_result"
  | "header_search_view_all"
  | "footer_social"
  | "footer_links";

/** Navigation clicks: header links, brand wordmark, mobile menu, footer links. */
export function trackNavigationClick(params: {
  link_text: string;
  link_url: string;
  nav_location: NavLocation;
}): void {
  trackEvent(GA_EVENT.navigationClick, params);
}

/** Copy-to-clipboard on a code sample. */
export function trackCodeCopy(params: {
  code_location: string;
  code_language?: string;
  snippet_id?: string;
  char_count?: number;
}): void {
  trackEvent(GA_EVENT.codeCopy, params);
}

/** A filter / sort control on a component listing changed. */
export function trackListingFilter(params: {
  listing_id: string;
  filter_type: string;
  filter_value: string;
}): void {
  trackEvent(GA_EVENT.listingFilter, params);
}

/** A search query was entered on a component listing. */
export function trackListingSearch(params: {
  listing_id: string;
  search_term: string;
  results_count?: number;
}): void {
  trackEvent(GA_EVENT.listingSearch, params);
}

/** Scroll-depth milestone (25 / 50 / 75 / 100) on a long page. */
export function trackScrollDepth(params: {
  percent_scrolled: 25 | 50 | 75 | 100;
  page_path: string;
}): void {
  trackEvent(GA_EVENT.scrollDepth, params);
}

/** Successful opt-in through one of the site's email signup forms. */
export function trackNewsletterSubscribe(params: {
  signup_location: string;
}): void {
  trackEvent(GA_EVENT.newsletterSubscribe, params);
}
