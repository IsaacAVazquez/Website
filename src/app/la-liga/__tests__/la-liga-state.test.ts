import {
  buildLaLigaHref,
  canonicalizeLaLigaClubId,
  DEFAULT_LA_LIGA_STATE,
  filterClubsForView,
  getDefaultClubForView,
  normalizeLaLigaState,
} from "../la-liga-state";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";

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
    });
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
});
