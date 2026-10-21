import { buildHref, readEnum } from "../searchParams";

describe("readEnum", () => {
  const options = ["lines", "advisories"] as const;

  it("returns the param when it is an option, from a record or URLSearchParams", () => {
    expect(readEnum({ view: "advisories" }, "view", options, "lines")).toBe("advisories");
    expect(readEnum(new URLSearchParams("view=advisories"), "view", options, "lines")).toBe(
      "advisories"
    );
  });

  it("falls back when the param is missing or not an option", () => {
    expect(readEnum({}, "view", options, "lines")).toBe("lines");
    expect(readEnum({ view: "stations" }, "view", options, "lines")).toBe("lines");
    expect(readEnum({ view: "stations" }, "view", options, null)).toBeNull();
  });
});

describe("buildHref", () => {
  it("omits defaults and nulls and keeps the route bare when nothing is set", () => {
    expect(buildHref("/golf", { view: "leaderboard", player: null }, { view: "leaderboard" })).toBe(
      "/golf"
    );
    expect(buildHref("/golf", { view: "players", player: "x-y" }, { view: "leaderboard" })).toBe(
      "/golf?view=players&player=x-y"
    );
  });

  it("stringifies numbers and writes a param with no default whenever it is set", () => {
    expect(buildHref("/t", { teams: 12, q: "" }, { q: "" })).toBe("/t?teams=12");
  });

  it("copies the base, keeps unrelated params, and drops a param set to its default", () => {
    const base = new URLSearchParams("sort=stars&view=topic&repo=7");
    expect(
      buildHref("/r", { view: "language", sort: "stars", repo: null }, { view: "language" }, base)
    ).toBe("/r?sort=stars");
    expect(base.toString()).toBe("sort=stars&view=topic&repo=7");
  });
});
