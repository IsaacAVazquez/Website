import type { MuseumExhibit } from "@/types/museum";

// Selected current and upcoming shows, read from the linked museum sources on 2026-10-23.
// This is a selection, not a complete exhibition calendar for every museum.
export const MUSEUM_EXHIBITIONS_CHECKED_AT = "2026-10-23";

export const selectedMuseumExhibitions: Record<string, MuseumExhibit[]> = {
  "m-met": [
    {
      id: "met-krasner-pollock-2026",
      title: "Krasner and Pollock: Past Continuous",
      startDate: "2026-10-04",
      endDate: "2027-01-31",
      ticketed: false,
      blurb: "Paintings from the careers of Lee Krasner and Jackson Pollock.",
      sourceUrl:
        "https://store.metmuseum.org/blog/celebrate-lee-krasner-and-jackson-pollock-at-the-met-store",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
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
    {
      id: "moma-brancusi-2026",
      title: "Brancusi: The Artist and His Studio",
      startDate: "2026-10-25",
      endDate: "2027-02-27",
      ticketed: false,
      blurb: "",
      sourceUrl: "https://press.moma.org/exhibitions/index.html",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
  "m-whitney": [
    {
      id: "whitney-lichtenstein-2026",
      title: "Roy Lichtenstein: Like New",
      startDate: "2026-10-11",
      endDate: "2027-05-10",
      ticketed: false,
      blurb: "A retrospective of Lichtenstein’s work across six decades.",
      sourceUrl: "https://whitney.org/exhibitions/lichtenstein",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
  "m-sfmoma": [
    {
      id: "sfmoma-iturbide-2026",
      title: "Graciela Iturbide: Between Two Worlds",
      startDate: "2026-07-11",
      endDate: "2026-11-29",
      ticketed: false,
      blurb: "A survey of Iturbide’s photography.",
      sourceUrl:
        "https://www.sfmoma.org/exhibition/graciela-iturbide-between-two-worlds/",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
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
  "m-deyoung": [
    {
      id: "deyoung-pharaohs-2026",
      title: "Treasures of the Pharaohs",
      startDate: "2026-08-01",
      endDate: "2027-01-31",
      ticketed: false,
      blurb:
        "Ancient Egyptian objects on loan from museums and archaeological sites in Egypt. Check the museum for ticket requirements.",
      sourceUrl:
        "https://shop.famsf.org/collections/the-treasures-of-the-pharaohs",
      checkedAt: MUSEUM_EXHIBITIONS_CHECKED_AT,
    },
  ],
};
