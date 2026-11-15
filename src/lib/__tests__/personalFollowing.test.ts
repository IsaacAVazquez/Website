import {
  parseFollowedIds,
  toggleFollowedId,
  isSourceUrl,
  observeReadings,
} from "../personalFollowing";

it("bounds and validates followed identifiers without losing unavailable identifiers", () => {
  expect(
    parseFollowedIds(
      JSON.stringify([
        "senate-mi",
        "senate-mi",
        "unavailable",
        "<script>",
        null,
        1,
      ]),
    ),
  ).toEqual(["senate-mi", "unavailable"]);
  expect(parseFollowedIds("broken")).toEqual([]);
  expect(
    parseFollowedIds(
      JSON.stringify(Array.from({ length: 25 }, (_, i) => `id-${i}`)),
    ),
  ).toHaveLength(20);
  expect(toggleFollowedId(["one", "two"], "one")).toEqual(["two"]);
  expect(toggleFollowedId(["one", "two"], "three")).toEqual([
    "one",
    "two",
    "three",
  ]);
});

it("keeps two source readings per item and never rolls a saved observation backward", () => {
  const a = { id: "one", sourceAt: "2026-10-20T00:00:00Z", value: 1 };
  const b = { ...a, sourceAt: "2026-10-21T00:00:00Z", value: 2 };
  const c = { ...a, sourceAt: "2026-10-22T00:00:00Z", value: 3 };
  const latest = observeReadings([b, a], [c]);
  expect(latest).toEqual([c, b]);
  expect(observeReadings(latest, [a])).toBe(latest);
  expect(observeReadings(latest, [c])).toBe(latest);
});

it("accepts source links only with https and without embedded credentials", () => {
  expect(isSourceUrl("https://example.com/funding")).toBe(true);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.com",
    "https://user:password@example.com",
  ])
    expect(isSourceUrl(url)).toBe(false);
});
