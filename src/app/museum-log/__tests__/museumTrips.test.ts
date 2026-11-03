import { museumExhibitsDuring, addMuseumToTrip } from "../museumTrips";
import type { Trip } from "@/types/travel";
import type { Museum } from "@/types/museum";

const museum = { id: "m-test", name: "Museum", city: "New York", admissionUSD: 30, websiteUrl: "https://example.org", exhibits: [{ id: "show", title: "Selected show", startDate: "2026-10-01", endDate: "2026-10-31" }] } as Museum;
const trip: Trip = { id: "trip", name: "NYC", destination: "New York", startDate: "2026-10-30", endDate: "2026-11-02", budget: 0, notes: "", activities: [], journal: [] };

it("matches inclusive exhibition boundaries and rejects impossible trip dates", () => {
  expect(museumExhibitsDuring(museum, "2026-10-31", "2026-11-02")).toHaveLength(1);
  expect(museumExhibitsDuring(museum, "2026-11-01", "2026-11-02")).toHaveLength(0);
  expect(museumExhibitsDuring(museum, "2026-02-30", "2026-10-03")).toHaveLength(0);
});

it("adds one dated museum stop and preserves the rest of a trip", () => {
  const result = addMuseumToTrip(trip, museum, "2026-10-31");
  expect(result.activities[0]).toMatchObject({ date: "2026-10-31", title: "Museum", cost: null, category: "sight" });
  expect(result.activities[0].notes).toContain("https://example.org");
  expect(result.activities[0].notes).toContain("30");
  expect(addMuseumToTrip(result, museum, "2026-10-31").activities).toHaveLength(1);
  expect(addMuseumToTrip(trip, museum, "2026-11-03")).toBe(trip);
});
