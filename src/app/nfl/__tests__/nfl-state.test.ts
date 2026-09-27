import { nflSnapshot } from "@/data/nflSnapshot";
import { nflSeeds } from "@/components/football/seedLadder";
import {
  buildNflHref,
  canonicalizeNflTeamId,
  DEFAULT_NFL_STATE,
  filterTeamsForView,
  getDefaultTeamForView,
  normalizeNflState,
} from "../nfl-state";

describe("nfl-state", () => {
  it("canonicalizes team ids and abbreviations", () => {
    const firstTeam = nflSnapshot.teams[0];
    expect(canonicalizeNflTeamId(firstTeam.id.toUpperCase())).toBe(firstTeam.id);
    expect(canonicalizeNflTeamId(firstTeam.abbr.toLowerCase())).toBe(firstTeam.id);
    expect(canonicalizeNflTeamId("missing")).toBeNull();
    expect(canonicalizeNflTeamId(undefined)).toBeNull();
  });

  it("normalizes route params with defaults for invalid values", () => {
    const firstTeam = nflSnapshot.teams[0];
    expect(normalizeNflState({ view: "division", team: "missing" })).toEqual(DEFAULT_NFL_STATE);
    expect(
      normalizeNflState({
        view: "afc",
        team: [firstTeam.abbr],
      })
    ).toEqual({
      view: "afc",
      team: firstTeam.id,
    });
  });

  it("filters teams for conference and playoff views", () => {
    expect(filterTeamsForView("afc").every((team) => team.conference === "AFC")).toBe(true);
    expect(filterTeamsForView("nfc").every((team) => team.conference === "NFC")).toBe(true);

    // The NFLverse snapshot leaves `seed` null all season, so the playoffs
    // view is built from the same derived seeding the seed-ladder signature
    // uses (division leaders, then the best wildcards), not the raw field.
    const derivedSeeds = nflSeeds(nflSnapshot.teams);
    const playoffTeams = filterTeamsForView("playoffs");
    expect(playoffTeams).toHaveLength(derivedSeeds.size);
    expect(playoffTeams.every((team) => derivedSeeds.has(team.id))).toBe(true);
    expect(getDefaultTeamForView("playoffs")).toBe(
      playoffTeams[0]?.id ?? DEFAULT_NFL_STATE.team
    );
  });

  it("builds hrefs while preserving unrelated params and clearing defaults", () => {
    const afcTeam = filterTeamsForView("afc")[0];
    expect(
      buildNflHref(
        {
          view: "afc",
          team: afcTeam.abbr,
        },
        new URLSearchParams("ref=nav")
      )
    ).toBe(`/nfl?ref=nav&view=afc&team=${afcTeam.id}`);

    expect(
      buildNflHref(
        DEFAULT_NFL_STATE,
        new URLSearchParams(`ref=nav&view=afc&team=${afcTeam.id}`)
      )
    ).toBe("/nfl?ref=nav");
  });
});
