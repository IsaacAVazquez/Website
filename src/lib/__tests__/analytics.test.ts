/**
 * Analytics is gated on NEXT_PUBLIC_GA_MEASUREMENT_ID, which is inlined at build
 * time. These tests exercise the always-on behaviour: with no id configured
 * every helper must be a safe no-op, and the event catalogue must stay valid.
 */
import {
  ANALYTICS_EVENTS,
  GA_EVENT,
  isAnalyticsEnabled,
  trackEvent,
  trackNavigationClick,
  trackScrollDepth,
} from "@/lib/analytics";

describe("analytics core", () => {
  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("is disabled when no measurement id is configured", () => {
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("never calls gtag while disabled", () => {
    const gtag = jest.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;

    trackEvent("navigation_click", { link_text: "Home" });
    trackNavigationClick({ link_text: "Home", link_url: "/", nav_location: "header_primary" });
    trackScrollDepth({ percent_scrolled: 50, page_path: "/" });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("exposes a catalogue whose names match the GA_EVENT constants", () => {
    const declared = new Set(Object.values(GA_EVENT));
    for (const event of ANALYTICS_EVENTS) {
      expect(declared.has(event.name as (typeof GA_EVENT)[keyof typeof GA_EVENT])).toBe(true);
      // GA4 naming conventions: lower snake_case, <= 40 chars.
      expect(event.name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(event.name.length).toBeLessThanOrEqual(40);
      expect(event.parameters.length).toBeGreaterThan(0);
      for (const param of event.parameters) {
        expect(param.name).toMatch(/^[a-z][a-z0-9_]*$/);
        expect(param.name.length).toBeLessThanOrEqual(40);
      }
    }
  });
});
