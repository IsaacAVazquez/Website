import type { Museum } from "@/types/museum";
import {
  admissionStub,
  averageRating,
  filterMuseums,
  formatAdmission,
  getMuseumExhibitStatus,
  formatRuntime,
  formatUpdated,
  sortMuseums,
  starFractions,
  visitStamp,
} from "../museum-log-helpers";

function museum(overrides: Partial<Museum>): Museum {
  return {
    id: "base",
    slug: "base",
    name: "Base Museum",
    city: "New York",
    country: "United States",
    region: "northeast",
    type: "art",
    founded: 1900,
    blurb: "A fixture museum.",
    highlights: [],
    curatorRating: 4,
    curatorBlurb: "Worth the trip.",
    popularity: 50,
    visitMinutesAvg: 90,
    admissionUSD: 20,
    exhibits: [],
    ...overrides,
  };
}

const museums = [
  museum({
    id: "art-west",
    slug: "art-west",
    name: "Western Art Museum",
    region: "west",
    type: "art",
    curatorRating: 4,
    popularity: 70,
  }),
  museum({
    id: "history-ne",
    slug: "history-ne",
    name: "Northeast History Hall",
    region: "northeast",
    type: "history",
    curatorRating: 4,
    popularity: 90,
  }),
  museum({
    id: "science-west",
    slug: "science-west",
    name: "Science West",
    region: "west",
    type: "science",
    curatorRating: 3.5,
    popularity: 95,
  }),
  museum({
    id: "design-eu",
    slug: "design-eu",
    name: "Design Archive",
    region: "europe",
    type: "design",
    curatorRating: 5,
    popularity: 60,
  }),
];

describe("museum-log-helpers", () => {
  it("filters museums by type and region", () => {
    expect(filterMuseums(museums, "art", "all").map((entry) => entry.id)).toEqual([
      "art-west",
    ]);
    expect(filterMuseums(museums, "all", "west").map((entry) => entry.id)).toEqual([
      "art-west",
      "science-west",
    ]);
    expect(filterMuseums(museums, "science", "west").map((entry) => entry.id)).toEqual([
      "science-west",
    ]);
  });

  it("sorts museums by rating, popularity, recency, and name", () => {
    expect(sortMuseums(museums, "rating", {}).map((entry) => entry.id)).toEqual([
      "design-eu",
      "history-ne",
      "art-west",
      "science-west",
    ]);
    expect(sortMuseums(museums, "popular", {}).map((entry) => entry.id)[0]).toBe(
      "science-west"
    );
    expect(sortMuseums(museums, "alpha", {}).map((entry) => entry.id)).toEqual([
      "design-eu",
      "history-ne",
      "science-west",
      "art-west",
    ]);
    expect(
      sortMuseums(museums, "recent", {
        "art-west": "2026-01-01",
        "design-eu": "2026-03-01",
      }).map((entry) => entry.id)
    ).toEqual(["design-eu", "art-west", "history-ne", "science-west"]);
  });

  it("formats compact museum metrics", () => {
    expect(formatRuntime(45)).toBe("45 min");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(125)).toBe("2h 5m");
    expect(formatAdmission(null)).toBe("Free");
    expect(formatAdmission(18)).toBe("$18");
    expect(averageRating([])).toBe(0);
    expect(averageRating([4, 5])).toBe(4.5);
  });

  it("converts ratings into half-star fill fractions", () => {
    expect(starFractions(4.25)).toEqual([1, 1, 1, 1, 0.5]);
    expect(starFractions(-1)).toEqual([0, 0, 0, 0, 0]);
    expect(starFractions(5.4)).toEqual([1, 1, 1, 1, 1]);
  });

  it("classifies exhibitions against a calendar date", () => {
    expect(
      getMuseumExhibitStatus(
        { startDate: "2026-06-01", endDate: "2026-08-01" },
        "2026-07-10"
      )
    ).toBe("current");
    expect(
      getMuseumExhibitStatus(
        { startDate: "2026-08-10", endDate: null },
        "2026-07-10"
      )
    ).toBe("upcoming");
    expect(
      getMuseumExhibitStatus(
        { startDate: "2026-01-01", endDate: "2026-04-01" },
        "2026-07-10"
      )
    ).toBe("ended");
  });

  it("returns no status before the local calendar date is known", () => {
    expect(
      getMuseumExhibitStatus({ startDate: "2026-06-01", endDate: "2026-08-01" }, null)
    ).toBeNull();
  });

  it("prints an admission stub's lines from a museum and today's date", () => {
    const withCurrentExhibit = museum({
      founded: 1929,
      admissionUSD: 30,
      curatorRating: 4,
      city: "New York, NY",
      exhibits: [
        { id: "x1", title: "Now showing", startDate: "2026-06-01", endDate: "2026-08-01", blurb: "", ticketed: false },
      ],
    });
    expect(admissionStub(withCurrentExhibit, "2026-07-10")).toEqual({
      name: "Base Museum",
      city: "New York, NY",
      founded: "Est. 1929",
      admission: "$30",
      curatorRating: 4,
      exhibitNow: true,
    });
  });

  it("handles free admission, no exhibits, and an unknown founding year", () => {
    const stub = admissionStub(
      museum({ founded: 0, admissionUSD: null, curatorRating: 0, exhibits: [] }),
      "2026-07-10"
    );
    expect(stub.admission).toBe("Free");
    expect(stub.founded).toBeNull();
    expect(stub.exhibitNow).toBe(false);
    expect(stub.curatorRating).toBe(0);
  });

  it("reads no exhibit as current before the local date is known", () => {
    const withExhibit = museum({
      exhibits: [
        { id: "x1", title: "Now showing", startDate: "2026-06-01", endDate: "2026-08-01", blurb: "", ticketed: false },
      ],
    });
    expect(admissionStub(withExhibit, null).exhibitNow).toBe(false);
  });

  it("carries a very long museum name through unmodified", () => {
    const longName =
      "The Grand Metropolitan Museum of Natural History, Fine Art, Design, and Applied Sciences of the Western Hemisphere";
    expect(admissionStub(museum({ name: longName }), "2026-07-10").name).toBe(longName);
  });

  it("stamps a visit date into month, day, and year parts", () => {
    expect(visitStamp("2026-09-26")).toEqual({ month: "SEP", day: "26", year: "2026" });
    expect(visitStamp("2026-01-05")).toEqual({ month: "JAN", day: "05", year: "2026" });
  });

  it("returns null for an invalid visit date", () => {
    expect(visitStamp("not-a-date")).toBeNull();
  });
});

describe("formatUpdated", () => {
  it("names the year, so the as-of line still reads a year later", () => {
    expect(formatUpdated("2026-04-27T23:00:00")).toMatch(/2026/);
  });
});
