import {
  buildWorldCupHref,
  DEFAULT_WORLD_CUP_STATE,
  normalizeTeamParam,
  normalizeWorldCupState,
  WORLD_CUP_ROUTE,
} from "../world-cup-state";

describe("world-cup-state", () => {
  describe("normalizeTeamParam", () => {
    it("lowercases and trims valid slugs", () => {
      expect(normalizeTeamParam("  United-States  ")).toBe("united-states");
      expect(normalizeTeamParam("BRAZIL")).toBe("brazil");
    });

    it("returns null for empty or malformed ids", () => {
      expect(normalizeTeamParam(null)).toBeNull();
      expect(normalizeTeamParam("")).toBeNull();
      expect(normalizeTeamParam("-leading-hyphen")).toBeNull();
      expect(normalizeTeamParam("trailing-hyphen-")).toBeNull();
      expect(normalizeTeamParam("has space")).toBeNull();
      expect(normalizeTeamParam("a".repeat(65))).toBeNull();
    });

    it("accepts a single-character slug", () => {
      expect(normalizeTeamParam("x")).toBe("x");
    });
  });

  describe("normalizeWorldCupState", () => {
    it("keeps valid views and falls back to the default otherwise", () => {
      expect(normalizeWorldCupState({ view: "knockout" }).view).toBe("knockout");
      expect(normalizeWorldCupState({ view: "schedule" }).view).toBe("schedule");
      expect(normalizeWorldCupState({ view: "bogus" }).view).toBe(
        DEFAULT_WORLD_CUP_STATE.view
      );
      expect(normalizeWorldCupState({}).view).toBe(DEFAULT_WORLD_CUP_STATE.view);
    });

    it("normalizes the team param", () => {
      expect(normalizeWorldCupState({ view: "groups", team: "USA" }).team).toBe(
        "usa"
      );
      expect(normalizeWorldCupState({ team: "not valid!" }).team).toBeNull();
    });

    it("reads from URLSearchParams instances", () => {
      const params = new URLSearchParams("view=knockout&team=mexico");
      expect(normalizeWorldCupState(params)).toEqual({
        view: "knockout",
        team: "mexico",
      });
    });

    it("reads the first entry from array-valued record params", () => {
      expect(
        normalizeWorldCupState({ view: ["schedule", "groups"], team: ["canada"] })
      ).toEqual({ view: "schedule", team: "canada" });
    });

    it("treats an empty array param as absent", () => {
      expect(normalizeWorldCupState({ view: [], team: [] })).toEqual(
        DEFAULT_WORLD_CUP_STATE
      );
    });
  });

  describe("buildWorldCupHref", () => {
    it("omits the default view and empty team", () => {
      expect(buildWorldCupHref({ view: "groups", team: null })).toBe(
        WORLD_CUP_ROUTE
      );
    });

    it("encodes non-default view and valid team", () => {
      expect(buildWorldCupHref({ view: "knockout", team: "brazil" })).toBe(
        `${WORLD_CUP_ROUTE}?view=knockout&team=brazil`
      );
    });

    it("drops an invalid team from the href", () => {
      expect(buildWorldCupHref({ view: "schedule", team: "bad team" })).toBe(
        `${WORLD_CUP_ROUTE}?view=schedule`
      );
    });

    it("preserves unrelated base params and clears defaults", () => {
      const base = new URLSearchParams("ref=nav&view=knockout&team=old");
      expect(
        buildWorldCupHref({ view: "groups", team: null }, base)
      ).toBe(`${WORLD_CUP_ROUTE}?ref=nav`);
    });
  });
});
