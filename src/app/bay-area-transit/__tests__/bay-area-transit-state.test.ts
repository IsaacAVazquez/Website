import {
  buildTransitHref,
  DEFAULT_TRANSIT_STATE,
  normalizeTransitState,
  TRANSIT_ROUTE,
} from "../bay-area-transit-state";

describe("bay-area-transit-state", () => {
  describe("normalizeTransitState", () => {
    it("keeps valid views and falls back to the default otherwise", () => {
      expect(normalizeTransitState({ view: "stations" }).view).toBe("stations");
      expect(normalizeTransitState({ view: "advisories" }).view).toBe(
        "advisories"
      );
      expect(normalizeTransitState({ view: "unknown" }).view).toBe(
        DEFAULT_TRANSIT_STATE.view
      );
      expect(normalizeTransitState({}).view).toBe(DEFAULT_TRANSIT_STATE.view);
    });

    it("normalizes the station param to a lowercase code", () => {
      expect(normalizeTransitState({ station: "MONT" }).station).toBe("mont");
      expect(normalizeTransitState({ station: "  12th  " }).station).toBe("12th");
    });

    it("rejects station codes outside the allowed length or charset", () => {
      expect(normalizeTransitState({ station: "a" }).station).toBeNull();
      expect(normalizeTransitState({ station: "toolongcode" }).station).toBeNull();
      expect(normalizeTransitState({ station: "no-dash" }).station).toBeNull();
      expect(normalizeTransitState({ station: null }).station).toBeNull();
    });

    it("reads from URLSearchParams instances", () => {
      const params = new URLSearchParams("view=stations&station=embr");
      expect(normalizeTransitState(params)).toEqual({
        view: "stations",
        station: "embr",
      });
    });

    it("reads the first entry from array-valued record params", () => {
      expect(
        normalizeTransitState({ view: ["advisories", "lines"], station: ["woak"] })
      ).toEqual({ view: "advisories", station: "woak" });
    });
  });

  describe("buildTransitHref", () => {
    it("omits the default view and empty station", () => {
      expect(buildTransitHref({ view: "lines", station: null })).toBe(
        TRANSIT_ROUTE
      );
    });

    it("encodes non-default view and station", () => {
      expect(buildTransitHref({ view: "stations", station: "mont" })).toBe(
        `${TRANSIT_ROUTE}?view=stations&station=mont`
      );
    });

    it("preserves unrelated base params and clears defaults", () => {
      const base = new URLSearchParams("ref=nav&view=stations&station=old");
      expect(buildTransitHref({ view: "lines", station: null }, base)).toBe(
        `${TRANSIT_ROUTE}?ref=nav`
      );
    });
  });
});
