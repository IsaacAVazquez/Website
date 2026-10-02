/**
 * Analytics is gated on NEXT_PUBLIC_GA_MEASUREMENT_ID, which is inlined at build
 * time. These tests exercise the always-on behaviour: with no id configured
 * every helper must be a safe no-op.
 */
import {
  isAnalyticsEnabled,
  trackEvent,
  trackNavigationClick,
  trackNewsletterSubscribe,
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
    trackNewsletterSubscribe({ signup_location: "writing" });
    trackScrollDepth({ percent_scrolled: 50, page_path: "/" });

    expect(gtag).not.toHaveBeenCalled();
  });
});
