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

describe("analytics with a measurement id configured", () => {
  const previousId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  let gtag: jest.Mock;

  // GA_MEASUREMENT_ID is read once at import, so each case loads a fresh copy
  // of the module under the env value it needs.
  function loadAnalytics(measurementId: string | undefined): typeof import("@/lib/analytics") {
    if (measurementId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = measurementId;
    let loaded!: typeof import("@/lib/analytics");
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.isolateModules requires a synchronous callback; dynamic import() would not work here
      loaded = require("@/lib/analytics");
    });
    return loaded;
  }

  beforeEach(() => {
    gtag = jest.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
    if (previousId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previousId;
  });

  it("trims the id and enables only a G- measurement id", () => {
    const enabled = loadAnalytics("  G-ABC123XYZ  ");
    expect(enabled.GA_MEASUREMENT_ID).toBe("G-ABC123XYZ");
    expect(enabled.isAnalyticsEnabled()).toBe(true);

    expect(loadAnalytics("UA-12345-1").isAnalyticsEnabled()).toBe(false);
    expect(loadAnalytics("G-").isAnalyticsEnabled()).toBe(false);
    expect(loadAnalytics("   ").GA_MEASUREMENT_ID).toBe("");
  });

  it("drops empty parameters and clamps long strings to 100 characters", () => {
    const analytics = loadAnalytics("G-TEST1");

    analytics.trackEvent("custom_event", {
      long_text: "x".repeat(150),
      empty: "",
      missing: undefined,
      count: 0,
      flag: false,
    });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "custom_event", {
      long_text: "x".repeat(100),
      count: 0,
      flag: false,
    });
  });

  it("sends nothing before gtag has loaded", () => {
    const analytics = loadAnalytics("G-TEST1");
    // A stub that is not yet a function would throw if it were called.
    (window as unknown as { gtag: unknown }).gtag = { queued: true };
    expect(() => analytics.trackEvent("custom_event")).not.toThrow();

    delete (window as unknown as { gtag?: unknown }).gtag;
    expect(() => analytics.trackEvent("custom_event")).not.toThrow();
    expect(gtag).not.toHaveBeenCalled();
  });

  it("routes each helper to its canonical GA4 event name", () => {
    const analytics = loadAnalytics("G-TEST1");

    analytics.trackNavigationClick({ link_text: "Home", link_url: "/", nav_location: "header_brand" });
    analytics.trackCodeCopy({ code_location: "article", code_language: "ts", char_count: 42 });
    analytics.trackListingFilter({ listing_id: "writing", filter_type: "tag", filter_value: "data" });
    analytics.trackListingSearch({ listing_id: "writing", search_term: "draft", results_count: 3 });
    analytics.trackScrollDepth({ percent_scrolled: 75, page_path: "/writing" });
    analytics.trackNewsletterSubscribe({ signup_location: "footer" });

    expect(gtag.mock.calls.map((call) => call[1])).toEqual([
      analytics.GA_EVENT.navigationClick,
      analytics.GA_EVENT.codeCopy,
      analytics.GA_EVENT.listingFilter,
      analytics.GA_EVENT.listingSearch,
      analytics.GA_EVENT.scrollDepth,
      analytics.GA_EVENT.newsletterSubscribe,
    ]);
    expect(gtag.mock.calls[1][2]).toEqual({ code_location: "article", code_language: "ts", char_count: 42 });
    expect(gtag.mock.calls[4][2]).toEqual({ percent_scrolled: 75, page_path: "/writing" });
  });
});
