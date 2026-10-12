import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaRouteState, LaLigaView } from "@/types/la-liga";
import * as core from "../la-liga-state.core";

const { clubs } = laLigaSnapshot;
const aliasMap = core.buildClubAliasMap(laLigaSnapshot.teams);
const DEFAULT_LA_LIGA_STATE = core.resolveDefaultState(clubs);
const canonicalizeLaLigaClubId = (id: string) => core.canonicalizeClubId(id, aliasMap);
const filterClubsForView = (view: LaLigaView) => core.filterClubs(clubs, view);
const getDefaultClubForView = (view: LaLigaView) =>
  core.getDefaultClub(clubs, view, DEFAULT_LA_LIGA_STATE.club);
const normalizeLaLigaState = (input: Record<string, string | string[]>) =>
  core.normalizeState(input, DEFAULT_LA_LIGA_STATE, aliasMap);
const buildLaLigaHref = (state: LaLigaRouteState, base?: URLSearchParams) =>
  core.buildHref(state, DEFAULT_LA_LIGA_STATE, aliasMap, base);

describe("la-liga-state", () => {
  it("normalizes invalid params back to the default route state", () => {
    expect(
      normalizeLaLigaState({
        view: "unknown",
        club: "unknown-club",
      })
    ).toEqual(DEFAULT_LA_LIGA_STATE);
  });

  it("keeps valid params intact", () => {
    expect(
      normalizeLaLigaState({
        view: "europe",
        club: "bet",
      })
    ).toEqual({
      view: "europe",
      club: "bet",
      detail: "fixtures",
    });
  });

  it("normalizes the detail tab and falls back on an invalid value", () => {
    expect(normalizeLaLigaState({ detail: "scorers" }).detail).toBe("scorers");
    expect(normalizeLaLigaState({ detail: "fixtures" }).detail).toBe("fixtures");
    expect(normalizeLaLigaState({ detail: "nope" }).detail).toBe(
      DEFAULT_LA_LIGA_STATE.detail
    );
    // The Club detail tab was cut on 2026-10-11 (the drawer is the club
    // detail), so an old ?detail=club link lands on the default tab.
    expect(normalizeLaLigaState({ detail: "club" }).detail).toBe("fixtures");
  });

  it("canonicalizes football-data team ids back to the shareable club ids", () => {
    expect(canonicalizeLaLigaClubId("81")).toBe("fcb");
    expect(
      normalizeLaLigaState({
        view: "table",
        club: "81",
      })
    ).toEqual({
      view: "table",
      club: "fcb",
      detail: "fixtures",
    });
  });

  it("returns the expected club slices for focused views", () => {
    expect(filterClubsForView("title-race")).toEqual(laLigaSnapshot.clubs.slice(0, 4));
    expect(filterClubsForView("europe")).toEqual(laLigaSnapshot.clubs.slice(0, 6));
    expect(filterClubsForView("relegation")).toEqual(laLigaSnapshot.clubs.slice(-5));
    expect(getDefaultClubForView("relegation")).toBe(laLigaSnapshot.clubs.slice(-5)[0]?.id);
  });

  it("builds clean hrefs while preserving unrelated query params", () => {
    expect(
      buildLaLigaHref(
        {
          view: "europe",
          club: "90",
          detail: "fixtures",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe("/la-liga?ref=portfolio&view=europe&club=bet");

    expect(
      buildLaLigaHref(
        DEFAULT_LA_LIGA_STATE,
        new URLSearchParams("ref=portfolio&view=europe&club=bet")
      )
    ).toBe("/la-liga?ref=portfolio");
  });

  it("serializes a non-default detail tab and strips the default", () => {
    expect(
      buildLaLigaHref({
        view: "table",
        club: DEFAULT_LA_LIGA_STATE.club,
        detail: "scorers",
      })
    ).toBe("/la-liga?detail=scorers");

    expect(
      buildLaLigaHref(
        { view: "table", club: DEFAULT_LA_LIGA_STATE.club, detail: "fixtures" },
        new URLSearchParams("detail=scorers")
      )
    ).toBe("/la-liga");
  });
});
