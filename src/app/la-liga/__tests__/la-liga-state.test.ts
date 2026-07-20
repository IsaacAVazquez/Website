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
      detail: "club",
    });
  });

  it("normalizes the detail tab and falls back on an invalid value", () => {
    expect(normalizeLaLigaState({ detail: "scorers" }).detail).toBe("scorers");
    expect(normalizeLaLigaState({ detail: "fixtures" }).detail).toBe("fixtures");
    expect(normalizeLaLigaState({ detail: "nope" }).detail).toBe(
      DEFAULT_LA_LIGA_STATE.detail
    );
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
      detail: "club",
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
          detail: "club",
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
        { view: "table", club: DEFAULT_LA_LIGA_STATE.club, detail: "club" },
        new URLSearchParams("detail=scorers")
      )
    ).toBe("/la-liga");
  });
});
