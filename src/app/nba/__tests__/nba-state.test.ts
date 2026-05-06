import { nbaSnapshot } from "@/data/nbaSnapshot";
import {
  buildNbaHref,
  canonicalizeNbaTeamId,
  DEFAULT_NBA_STATE,
  filterTeamsForView,
  getConferenceForView,
  getDefaultTeamForView,
  normalizeNbaState,
} from "../nba-state";

describe("nba-state", () => {
  it("canonicalizes team ids and abbreviations", () => {
    const firstTeam = nbaSnapshot.teamsByConference.east[0];
    expect(canonicalizeNbaTeamId(firstTeam.id.toUpperCase())).toBe(firstTeam.id);
    expect(canonicalizeNbaTeamId(firstTeam.abbreviation.toLowerCase())).toBe(firstTeam.id);
    expect(canonicalizeNbaTeamId("missing")).toBeNull();
  });

  it("normalizes route params with defaults for invalid values", () => {
    const westTeam = nbaSnapshot.teamsByConference.west[0];
    expect(normalizeNbaState({ view: "division", team: "missing" })).toEqual(DEFAULT_NBA_STATE);
    expect(
      normalizeNbaState({
        view: "west",
        team: [westTeam.abbreviation],
      })
    ).toEqual({
      view: "west",
      team: westTeam.id,
    });
  });

  it("maps views to conference slices", () => {
    expect(getConferenceForView("east")).toBe("east");
    expect(getConferenceForView("west")).toBe("west");
    expect(getConferenceForView("playoff")).toBe("both");
    expect(filterTeamsForView("east")).toEqual(nbaSnapshot.teamsByConference.east);
    expect(filterTeamsForView("west")).toEqual(nbaSnapshot.teamsByConference.west);
    expect(filterTeamsForView("playoff")).toHaveLength(12);
    expect(filterTeamsForView("play-in")).toHaveLength(8);
    expect(getDefaultTeamForView("play-in")).toBe(filterTeamsForView("play-in")[0]?.id);
  });

  it("builds hrefs while preserving unrelated params and clearing defaults", () => {
    const westTeam = nbaSnapshot.teamsByConference.west[0];
    expect(
      buildNbaHref(
        {
          view: "west",
          team: westTeam.abbreviation,
        },
        new URLSearchParams("ref=nav")
      )
    ).toBe(`/nba?ref=nav&view=west&team=${westTeam.id}`);

    expect(
      buildNbaHref(
        DEFAULT_NBA_STATE,
        new URLSearchParams(`ref=nav&view=west&team=${westTeam.id}`)
      )
    ).toBe("/nba?ref=nav");
  });
});
