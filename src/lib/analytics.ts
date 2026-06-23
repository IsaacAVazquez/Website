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
 * string values are clamped to <= 100 chars (`clampValue`). The canonical list
 * of events lives in `ANALYTICS_EVENTS` below and powers the human-readable
 * reference page at `/analytics-reference`.
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
} as const;

export type NavLocation =
  | "header_primary"
  | "header_brand"
  | "header_mobile"
  | "header_mobile_toggle"
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

// ---------------------------------------------------------------------------
// Reference catalogue — drives /analytics-reference
// ---------------------------------------------------------------------------

export interface AnalyticsEventDoc {
  name: string;
  category: "Navigation" | "Code samples" | "Listings" | "Engagement";
  description: string;
  trigger: string;
  parameters: { name: string; description: string; example: string }[];
}

export const ANALYTICS_EVENTS: AnalyticsEventDoc[] = [
  {
    name: GA_EVENT.navigationClick,
    category: "Navigation",
    description:
      "Fires when a navigation element is clicked — primary header links, the brand wordmark, the mobile menu toggle and its links, and footer links.",
    trigger: "Click on any link in the header, mobile menu, or footer.",
    parameters: [
      { name: "link_text", description: "Visible label of the element.", example: "Writing" },
      { name: "link_url", description: "Destination href.", example: "/writing" },
      {
        name: "nav_location",
        description:
          "Where the element lives: header_primary, header_brand, header_mobile, header_mobile_toggle, footer_social, footer_links.",
        example: "header_primary",
      },
    ],
  },
  {
    name: GA_EVENT.codeCopy,
    category: "Code samples",
    description:
      "Fires when a visitor copies a code sample to the clipboard, either from a CodeSample block or from a fenced code block inside a long-form article.",
    trigger: "Click the copy button on a code sample.",
    parameters: [
      { name: "code_location", description: "Surface the sample lives on.", example: "analytics_reference" },
      { name: "code_language", description: "Language hint when known.", example: "ts" },
      { name: "snippet_id", description: "Stable id/label for the sample.", example: "track-nav-click" },
      { name: "char_count", description: "Length of the copied text.", example: "184" },
    ],
  },
  {
    name: GA_EVENT.listingFilter,
    category: "Listings",
    description:
      "Fires when a filter, category, or sort control changes on a component listing (search, writing archive, portfolio).",
    trigger: "Select a filter chip, category, or sort option.",
    parameters: [
      { name: "listing_id", description: "Which listing.", example: "portfolio" },
      { name: "filter_type", description: "Kind of control.", example: "category" },
      { name: "filter_value", description: "Selected value.", example: "fintech" },
    ],
  },
  {
    name: GA_EVENT.listingSearch,
    category: "Listings",
    description:
      "Fires when a search query is entered on a component listing. Debounced so it reports completed searches rather than individual keystrokes.",
    trigger: "Type into a listing's search box (debounced).",
    parameters: [
      { name: "listing_id", description: "Which listing.", example: "writing_archive" },
      { name: "search_term", description: "The query text.", example: "product strategy" },
      { name: "results_count", description: "Matches for the query when available.", example: "7" },
    ],
  },
  {
    name: GA_EVENT.scrollDepth,
    category: "Engagement",
    description:
      "Fires once per milestone as a visitor scrolls a long page. Short pages that do not scroll are excluded.",
    trigger: "Reach 25%, 50%, 75%, or 100% scroll depth on a long page.",
    parameters: [
      { name: "percent_scrolled", description: "Milestone reached.", example: "50" },
      { name: "page_path", description: "Path of the page.", example: "/writing/some-post" },
    ],
  },
];
