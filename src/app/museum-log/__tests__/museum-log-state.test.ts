import {
  buildMuseumHref,
  DEFAULT_MUSEUM_STATE,
  normalizeMuseumState,
} from "../museum-log-state";

describe("museum-log-state", () => {
  it("normalizes empty and invalid params to defaults", () => {
    expect(normalizeMuseumState({})).toEqual(DEFAULT_MUSEUM_STATE);
    expect(
      normalizeMuseumState({
        view: "bad",
        sort: "newest",
        type: "dinosaurs",
        region: "moon",
        museum: "Not A Slug",
        list: "Also Bad",
      })
    ).toEqual(DEFAULT_MUSEUM_STATE);
  });

  it("forces detail views from valid museum and list deep links", () => {
    expect(
      normalizeMuseumState({
        view: "journal",
        museum: " moma ",
        sort: "recent",
        type: "art",
        region: "northeast",
      })
    ).toEqual({
      view: "museum",
      museum: "moma",
      list: null,
      sort: "recent",
      type: "art",
      region: "northeast",
    });

    expect(
      normalizeMuseumState({
        view: "discover",
        list: "nyc-weekend",
      })
    ).toEqual({
      ...DEFAULT_MUSEUM_STATE,
      view: "lists",
      list: "nyc-weekend",
    });
  });

  it("builds hrefs while clearing default and implied params", () => {
    expect(
      buildMuseumHref(
        {
          view: "museum",
          museum: "moma",
          list: null,
          sort: "popular",
          type: "art",
          region: "northeast",
        },
        new URLSearchParams("ref=nav&view=journal")
      )
    ).toBe("/museum-log?ref=nav&sort=popular&type=art&region=northeast&museum=moma");

    expect(
      buildMuseumHref({
        ...DEFAULT_MUSEUM_STATE,
        view: "lists",
        list: "nyc-weekend",
      })
    ).toBe("/museum-log?list=nyc-weekend");

    expect(
      buildMuseumHref(
        DEFAULT_MUSEUM_STATE,
        new URLSearchParams("ref=nav&view=journal&sort=popular&type=art&region=europe")
      )
    ).toBe("/museum-log?ref=nav");
  });
});
