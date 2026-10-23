import type { MuseumExhibit } from "@/types/museum";

// Shows the 2026-10-22 calendar pass in museumSnapshot.ts does not list, read from the linked
// museum pages on 2026-10-23. This is a selection, not a complete exhibition calendar.
export const MUSEUM_EXHIBITIONS_CHECKED_AT = "2026-10-23";

export const selectedMuseumExhibitions: Record<string, MuseumExhibit[]> = {
  "m-moma": [
    {
      id: "moma-surrealist-book-2026",
      title: "The Surrealist Book: Tomorrow Lives in Mirrors",
      startDate: "2026-10-04",
      endDate: "2027-01-23",
      ticketed: false,
      blurb: "Books and printed work associated with Surrealism.",
      sourceUrl: "https://www.moma.org/calendar/exhibitions/5918",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
  "m-sfmoma": [
    {
      id: "sfmoma-chacon-2026",
      title: "New Work: Raven Chacon",
      startDate: "2026-10-24",
      endDate: "2027-11-07",
      ticketed: false,
      blurb: "A video and sound installation by Raven Chacon.",
      sourceUrl: "https://www.sfmoma.org/exhibition/new-work-raven-chacon/",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
};
