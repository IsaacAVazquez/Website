import { selectedMuseumExhibitions } from "../museumExhibitions";
import { museumSnapshot } from "../museumSnapshot";
import { isMuseumTripDate, museumExhibitsDuring } from "@/app/museum-log/museumTrips";

it("ships sourced exhibition dates that connect to the museum catalog", () => {
  const museumIds = new Set(museumSnapshot.museums.map(museum => museum.id));
  for (const [id, exhibits] of Object.entries(selectedMuseumExhibitions)) {
    expect(museumIds.has(id)).toBe(true);
    for (const exhibit of exhibits) {
      expect(isMuseumTripDate(exhibit.startDate)).toBe(true);
      expect(exhibit.endDate && isMuseumTripDate(exhibit.endDate)).toBe(true);
      expect(exhibit.endDate! >= exhibit.startDate).toBe(true);
      expect(exhibit.sourceUrl).toMatch(/^https:\/\//);
      expect(exhibit.checkedAt).toBe("2026-10-23");
    }
  }
  expect(museumSnapshot.museums.filter(museum => museumExhibitsDuring(museum, "2026-10-23", "2026-10-23").length > 0)).toHaveLength(5);
});
