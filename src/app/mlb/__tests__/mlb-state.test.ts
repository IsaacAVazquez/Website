import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbRouteState, MlbView } from "@/types/mlb";
import * as core from "../mlb-state.core";

const { standings, teams } = mlbSnapshot;
const aliasMap = core.buildTeamAliasMap(teams);
const DEFAULT_MLB_STATE = core.resolveDefaultState(standings, teams);
const canonicalizeMlbTeamId = (id: string) => core.canonicalizeTeamId(id, aliasMap);
const filterStandingsForView = (view: MlbView) => core.filterStandings(standings, view);
const getDefaultTeamForView = (view: MlbView) =>
  core.getDefaultTeam(standings, view, DEFAULT_MLB_STATE.team);
const normalizeMlbState = (input: Record<string, string | string[]>) =>
  core.normalizeState(input, DEFAULT_MLB_STATE, aliasMap);
const buildMlbHref = (state: MlbRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_MLB_STATE, aliasMap, base);

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
    // An empty wildcard view (offseason snapshot) falls back to the default team.
    expect(getDefaultTeamForView("wildcard")).toBe(
      filterStandingsForView("wildcard")[0]?.id ?? DEFAULT_MLB_STATE.team
    );
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
