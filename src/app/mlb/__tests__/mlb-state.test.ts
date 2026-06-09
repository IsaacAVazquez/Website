import { mlbSnapshot } from "@/data/mlbSnapshot";
import {
  buildMlbHref,
  canonicalizeMlbTeamId,
  DEFAULT_MLB_STATE,
  filterStandingsForView,
  getDefaultTeamForView,
  normalizeMlbState,
} from "../mlb-state";

describe("mlb-state", () => {
  it("canonicalizes team ids and abbreviations", () => {
    const firstTeam = mlbSnapshot.teams[0];
    expect(canonicalizeMlbTeamId(firstTeam.id)).toBe(firstTeam.id);
    expect(canonicalizeMlbTeamId(firstTeam.abbreviation.toLowerCase())).toBe(firstTeam.id);
    expect(canonicalizeMlbTeamId("missing")).toBeNull();
  });

  it("normalizes route params with defaults for invalid values", () => {
    const firstTeam = mlbSnapshot.teams[0];
    expect(normalizeMlbState({ view: "division", team: "missing" })).toEqual(DEFAULT_MLB_STATE);
    expect(
      normalizeMlbState({
        view: "al",
        team: [firstTeam.abbreviation],
      })
    ).toEqual({
      view: "al",
      team: firstTeam.id,
    });
  });

  it("filters standings for league and wildcard views", () => {
    expect(filterStandingsForView("al").every((row) => row.league === "AL")).toBe(true);
    expect(filterStandingsForView("nl").every((row) => row.league === "NL")).toBe(true);
    expect(
      filterStandingsForView("wildcard").every(
        (row) => row.divisionRank > 1 && row.wildCardRank !== null && row.wildCardRank <= 6
      )
    ).toBe(true);
    expect(getDefaultTeamForView("wildcard")).toBe(filterStandingsForView("wildcard")[0]?.id);
  });

  it("builds hrefs while preserving unrelated params and clearing defaults", () => {
    const alTeam = filterStandingsForView("al")[0];
    expect(
      buildMlbHref(
        {
          view: "al",
          team: alTeam.id,
        },
        new URLSearchParams("ref=nav")
      )
    ).toBe(`/mlb?ref=nav&view=al&team=${alTeam.id}`);

    expect(
      buildMlbHref(
        DEFAULT_MLB_STATE,
        new URLSearchParams(`ref=nav&view=al&team=${alTeam.id}`)
      )
    ).toBe("/mlb?ref=nav");
  });
});
