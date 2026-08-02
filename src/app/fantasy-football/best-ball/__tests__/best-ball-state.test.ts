import {
  buildBestBallHref,
  normalizeBestBallState,
} from "../best-ball-state";

describe("best ball route state", () => {
  it("normalizes an empty request to the main contest", () => {
    expect(normalizeBestBallState({})).toEqual({
      contest: "bbm-vii",
      position: "all",
      query: "",
    });
  });

  it("keeps supported contest, position, and search values", () => {
    expect(
      normalizeBestBallState({
        contest: "weekly-winners",
        position: "wr",
        q: "  Jaxon   Smith-Njigba  ",
      }),
    ).toEqual({
      contest: "weekly-winners",
      position: "WR",
      query: "Jaxon Smith-Njigba",
    });
  });

  it("drops unsupported values", () => {
    expect(
      normalizeBestBallState({
        contest: "auction",
        position: "dst",
      }),
    ).toEqual({
      contest: "bbm-vii",
      position: "all",
      query: "",
    });
  });

  it("builds a canonical deep link while preserving unrelated parameters", () => {
    const base = new URLSearchParams("ref=nav&position=qb&q=old");
    expect(
      buildBestBallHref(
        { contest: "eliminator", position: "RB", query: "Bijan" },
        base,
      ),
    ).toBe("/fantasy-football/best-ball?ref=nav&position=rb&q=Bijan&contest=eliminator");
  });
});
