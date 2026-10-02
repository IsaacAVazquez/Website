import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaRouteState, NbaView } from "@/types/nba";
import * as core from "../nba-state.core";

const { east, west } = nbaSnapshot.teamsByConference;
const aliasMap = core.buildTeamAliasMap([...east, ...west]);
const DEFAULT_NBA_STATE = core.resolveDefaultState(east, west);
const canonicalizeNbaTeamId = (id: string) => core.canonicalizeTeamId(id, aliasMap);
const filterTeamsForView = (view: NbaView) => core.filterTeams(east, west, view);
const getDefaultTeamForView = (view: NbaView) =>
  core.getDefaultTeam(east, west, view, DEFAULT_NBA_STATE.team);
const normalizeNbaState = (input: Record<string, string | string[]>) =>
  core.normalizeState(input, DEFAULT_NBA_STATE, aliasMap);
const buildNbaHref = (state: NbaRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_NBA_STATE, aliasMap, base);

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
    expect(filterTeamsForView("east")).toEqual(nbaSnapshot.teamsByConference.east);
    expect(filterTeamsForView("west")).toEqual(nbaSnapshot.teamsByConference.west);
    expect(filterTeamsForView("playoff")).toHaveLength(12);
    expect(filterTeamsForView("play-in")).toHaveLength(8);
    expect(getDefaultTeamForView("play-in")).toBe(
      filterTeamsForView("play-in")[0]?.id ?? DEFAULT_NBA_STATE.team
    );
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
