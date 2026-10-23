import type { MuseumSnapshot } from "@/types/museum";
import { selectedMuseumExhibitions } from "./museumExhibitions";

export const MUSEUM_SNAPSHOT_VERIFIED = false;

/**
 * Curated, snapshot-driven museum catalog. The catalog itself is the "film
 * database" equivalent. Curator reviews + visit log + lists are authored
 * inline; user-side state (visited / watchlist / liked / personal ratings)
 * lives in browser localStorage via useMuseumLog.
 */
const baseMuseumSnapshot: MuseumSnapshot = {
  generatedAt: "2026-10-22T06:00:00Z",
  sourceLabel: "Curated by Isaac Vazquez",
  curatorName: "Isaac Vazquez",
  curatorBio:
    "Tracking museum visits the way I track films — exhibits, ratings, and the rooms worth coming back for.",

  museums: [
    {
      id: "m-met",
      slug: "the-met",
      name: "The Metropolitan Museum of Art",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "art",
      founded: 1870,
      blurb:
        "Encyclopedic museum on Fifth Avenue spanning 5,000 years of art across two million objects.",
      websiteUrl: "https://www.metmuseum.org",
      highlights: ["Egyptian Wing", "American Wing", "European Paintings 1300–1800"],
      curatorRating: 4.5,
      curatorBlurb:
        "The closest thing to a complete art education in a single building. Skip the Great Hall scrum and start in the Lehman Wing.",
      popularity: 96,
      visitMinutesAvg: 240,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-met-x3",
          title: "Krasner and Pollock: Past Continuous",
          // Dates from https://www.metmuseum.org/press-releases/krasner-pollock-past-continuous, read 2026-10-22.
          startDate: "2026-10-04",
          endDate: "2027-01-31",
          blurb: "More than 120 works that follow Lee Krasner's and Jackson Pollock's careers side by side.",
          ticketed: false,
        },
        {
          id: "m-met-x4",
          title: "Costume Art",
          // Dates from https://www.metmuseum.org/press-releases/costume-institute-spring-2026, read 2026-10-22.
          startDate: "2026-05-10",
          endDate: "2027-01-10",
          blurb: "The Costume Institute pairs garments with works from across the Met, in new galleries off the Great Hall.",
          ticketed: false,
        },
        {
          id: "m-met-x5",
          title: "Across Wine-Dark Seas: Art and Identity beyond Ancient Greece",
          // Dates from https://www.metmuseum.org/exhibitions/across-wine-dark-seas-art-and-identity-beyond-ancient-greece, read 2026-10-22.
          startDate: "2026-12-20",
          endDate: "2027-04-11",
          blurb: "More than 180 Mediterranean works from the eighth to early fifth century BCE on Greek contact with other cultures.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-moma",
      slug: "moma",
      name: "Museum of Modern Art",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "art",
      founded: 1929,
      blurb:
        "The institutional spine of modernism — Cézanne to Cy Twombly, with film, design, and architecture wings.",
      websiteUrl: "https://www.moma.org",
      highlights: ["Starry Night", "Demoiselles d'Avignon", "Architecture & Design"],
      curatorRating: 4.0,
      curatorBlurb:
        "Greatest hits gallery is a meat-grinder on weekends. Go on a Friday evening — the Marron Atrium feels almost civilized.",
      popularity: 92,
      visitMinutesAvg: 180,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-moma-x2",
          title: "Brancusi: The Artist and His Studio",
          // Dates from https://www.moma.org/calendar/exhibitions/5910, read 2026-10-22.
          startDate: "2026-10-25",
          endDate: "2027-02-27",
          blurb: "Sculpture, photographs, film, furniture, and tools from Brancusi's Paris studio, lent by the Centre Pompidou.",
          ticketed: false,
        },
        {
          id: "m-moma-x3",
          title: "Architects of Liberation: Modernism in Western Africa",
          // Dates from https://press.moma.org/exhibition/architects-of-liberation-modernism-in-western-africa/, read 2026-10-22.
          startDate: "2026-07-05",
          endDate: "2027-01-02",
          blurb: "About 400 objects on the modern architecture of seven West African countries after independence.",
          ticketed: false,
        },
        {
          id: "m-moma-x4",
          title: "Na Mira: NO SMOKING",
          // Dates from https://www.moma.org/calendar/exhibitions/5869, read 2026-10-22.
          startDate: "2026-11-14",
          endDate: "2027-02-15",
          blurb: "A commissioned video, hologram, and sound installation on the military origins of imaging technology.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-whitney",
      slug: "whitney",
      name: "Whitney Museum of American Art",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "art",
      founded: 1930,
      blurb:
        "Renzo Piano's stepped Meatpacking palazzo dedicated to 20th- and 21st-century American art.",
      websiteUrl: "https://whitney.org",
      highlights: ["Edward Hopper Collection", "Whitney Biennial", "Outdoor terraces"],
      curatorRating: 4.0,
      curatorBlurb:
        "The terraces are half the museum. Time a visit so you finish the top floor at golden hour.",
      popularity: 78,
      visitMinutesAvg: 150,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-whit-x1",
          title: "Whitney Biennial 2026",
          // Dates and edition from https://whitney.org/exhibitions/2026-biennial, read 2026-09-28.
          startDate: "2026-03-08",
          endDate: "2026-08-23",
          blurb: "The 82nd edition of the survey of contemporary American art.",
          ticketed: false,
        },
        {
          id: "m-whit-x2",
          title: "Roy Lichtenstein: Like New",
          // Dates from https://whitney.org/exhibitions/lichtenstein, read 2026-10-22.
          startDate: "2026-10-11",
          endDate: "2027-05-10",
          blurb: "A six-decade Lichtenstein retrospective that includes four re-created murals.",
          ticketed: false,
        },
        {
          id: "m-whit-x3",
          title: "The Lost World: The Art of Minnie Evans",
          // Dates from https://whitney.org/exhibitions/the-lost-world, read 2026-10-22.
          startDate: "2026-08-22",
          endDate: "2027-01-10",
          blurb: "Minnie Evans's drawings, paintings, and collages, drawn from religion, myth, and coastal North Carolina.",
          ticketed: false,
        },
        {
          id: "m-whit-x4",
          title: "Coumba Samba: Stars and Stripes",
          // Dates from https://whitney.org/exhibitions/coumba-samba, read 2026-10-22.
          startDate: "2026-09-19",
          endDate: "2027-01-18",
          blurb: "Sculptures in flag colors that connect mineral extraction, colonialism, and military power.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-guggenheim",
      slug: "guggenheim",
      name: "Solomon R. Guggenheim Museum",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "art",
      founded: 1939,
      blurb: "Frank Lloyd Wright's spiral rotunda, holding non-objective and modern art.",
      websiteUrl: "https://www.guggenheim.org",
      highlights: ["The rotunda itself", "Kandinsky holdings", "Thannhauser Collection"],
      curatorRating: 3.5,
      curatorBlurb:
        "The building outranks the program in any given month, but that's still a high bar.",
      popularity: 74,
      visitMinutesAvg: 120,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-gugg-x1",
          title: "Taryn Simon / Father Country / I Do Love You",
          // Dates from https://www.guggenheim.org/exhibition/taryn-simon, read 2026-10-22.
          startDate: "2026-09-18",
          endDate: "2027-03-14",
          blurb: "An interactive installation of unseen photographs, text, video, and sculpture by Taryn Simon.",
          ticketed: false,
        },
        {
          id: "m-gugg-x2",
          title: "Guggenheim Pop: 1960 to Now",
          // Dates from https://www.guggenheim.org/exhibition/guggenheim-pop, read 2026-10-22.
          startDate: "2026-06-05",
          endDate: "2027-01-10",
          blurb: "Pop art from the collection, Warhol through Cattelan, and what later artists took from it.",
          ticketed: false,
        },
        {
          id: "m-gugg-x3",
          title: "Collection in Focus | Modern European Currents",
          // Dates from https://www.guggenheim.org/exhibition/collection-in-focus-modern-european-currents, read 2026-10-22.
          startDate: "2025-07-15",
          endDate: "2027-01-10",
          blurb: "Early twentieth-century European painting from the collection, including Goncharova, Kandinsky, and Marc.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-frick",
      slug: "frick",
      name: "The Frick Collection",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "art",
      founded: 1935,
      blurb: "Old Masters in a Gilded Age mansion — recently re-opened after a Selldorf renovation.",
      websiteUrl: "https://www.frick.org",
      highlights: ["Vermeer trio", "Bellini's St. Francis", "Living Hall"],
      curatorRating: 5.0,
      curatorBlurb:
        "Best small museum in America. The renovation opened the second floor — it's a different museum now, in the right way.",
      popularity: 68,
      visitMinutesAvg: 90,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-frick-x1",
          title: "Siena: The Art of Bronze, 1450–1500",
          // Dates from https://www.frick.org/exhibitions/siena, read 2026-10-22.
          startDate: "2026-10-15",
          endDate: "2027-01-18",
          blurb: "Nearly forty Renaissance bronzes by Donatello, Vecchietta, Francesco di Giorgio, and others.",
          ticketed: false,
        },
        {
          id: "m-frick-x2",
          title: "Kent Monkman: Officer and Laughing Girl",
          // Dates from https://www.frick.org/exhibitions/monkman, read 2026-10-22.
          startDate: "2026-11-12",
          endDate: "2027-02-22",
          blurb: "New Monkman paintings that answer the Frick's Vermeer from an Indigenous point of view.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-aic",
      slug: "art-institute-chicago",
      name: "Art Institute of Chicago",
      city: "Chicago, IL",
      country: "USA",
      region: "midwest",
      type: "art",
      founded: 1879,
      blurb:
        "One of the oldest and largest art museums in the U.S., with a famously deep Impressionist room.",
      websiteUrl: "https://www.artic.edu",
      highlights: ["American Gothic", "Nighthawks", "Sunday on La Grande Jatte"],
      curatorRating: 4.5,
      curatorBlurb:
        "If you only have an afternoon, do Impressionism, then American Modern, then leave through the Modern Wing bridge.",
      popularity: 88,
      visitMinutesAvg: 200,
      admissionUSD: 32,
      exhibits: [
        {
          id: "m-aic-x2",
          title: "Mary Cassatt: After Impressionism",
          // Dates from https://www.artic.edu/exhibitions/10487/mary-cassatt-after-impressionism, read 2026-10-22.
          startDate: "2026-09-06",
          endDate: "2027-01-03",
          blurb: "Cassatt's paintings, pastels, and prints from after the last Impressionist group show in 1886.",
          ticketed: true,
        },
        {
          id: "m-aic-x3",
          title: "Lee Miller: Fearless",
          // Dates from https://www.artic.edu/exhibitions/10521/lee-miller-fearless, read 2026-10-22.
          startDate: "2026-08-29",
          endDate: "2026-12-07",
          blurb: "Lee Miller's photographs across fashion, Surrealism, portraiture, and her work as a war correspondent.",
          ticketed: false,
        },
        {
          id: "m-aic-x4",
          title: "Zurbarán: Divine Light",
          // Dates from https://www.artic.edu/exhibitions/10208/zurbaran-divine-light, read 2026-10-22.
          startDate: "2027-02-28",
          endDate: "2027-06-20",
          blurb: "About 50 works by the seventeenth-century Spanish painter, borrowed from about 30 lenders.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-mfah",
      slug: "mfah",
      name: "Museum of Fine Arts, Houston",
      city: "Houston, TX",
      country: "USA",
      region: "south",
      type: "art",
      founded: 1900,
      blurb:
        "The Texas behemoth — three buildings, two sculpture gardens, and the underground Turrell tunnel between them.",
      websiteUrl: "https://www.mfah.org",
      highlights: ["The Light Inside (Turrell)", "Latin American collection", "Glassell School"],
      curatorRating: 4.5,
      curatorBlurb:
        "Underrated nationally, rightly worshipped locally. The Kinder Building re-opened the postwar collection in a way the old Beck Building never could.",
      popularity: 60,
      visitMinutesAvg: 180,
      admissionUSD: 25,
      exhibits: [
        {
          id: "m-mfah-x1",
          title: "American Modernism from the Charles Butt Collection",
          // Dates from https://www.mfah.org/art/exhibitions/american-modernism-from-the-charles-butt-collection, read 2026-10-22.
          startDate: "2026-10-25",
          endDate: "2027-01-18",
          blurb: "More than 90 American modernist works from a Texas collection, including Benton, O'Keeffe, and Pollock.",
          ticketed: false,
        },
        {
          id: "m-mfah-x2",
          title: "Of Light and Air: Winslow Homer from the Museum of Fine Arts, Boston",
          // Dates from https://www.mfah.org/art/exhibitions/of-light-and-air-winslow-homer-from-the-mfa-boston, read 2026-10-22.
          startDate: "2026-11-01",
          endDate: "2027-02-07",
          blurb: "More than 45 Homer watercolors lent by MFA Boston, with some of his oils, drawings, and prints.",
          ticketed: false,
        },
        {
          id: "m-mfah-x3",
          title: "David Hockney: Bigger & Closer (not smaller & further away)",
          // Dates from https://www.mfah.org/art/exhibitions/david-hockney-bigger-closer-not-smaller-and-further-away, read 2026-10-22.
          startDate: "2027-03-07",
          endDate: "2027-09-06",
          blurb: "The first US showing of a David Hockney exhibition, opening in Houston.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-menil",
      slug: "menil-collection",
      name: "The Menil Collection",
      city: "Houston, TX",
      country: "USA",
      region: "south",
      type: "art",
      founded: 1987,
      blurb:
        "Renzo Piano's daylit pavilion in Montrose, plus the Rothko Chapel and the Cy Twombly Gallery across the campus.",
      websiteUrl: "https://www.menil.org",
      highlights: ["Rothko Chapel", "Cy Twombly Gallery", "Surrealism rooms"],
      curatorRating: 5.0,
      curatorBlurb:
        "Always free, always quiet, and the closest a museum has come to feeling like a private library. Plan an entire afternoon for the campus.",
      popularity: 55,
      visitMinutesAvg: 150,
      admissionUSD: null,
      exhibits: [
        {
          id: "m-menil-x1",
          title: "Terry Winters: Vitalized Geometry",
          // Dates from https://www.menil.org/exhibition/terry-winters-vitalized-geometry, read 2026-10-22.
          startDate: "2026-09-25",
          endDate: "2027-04-04",
          blurb: "44 prints and works on paper by Terry Winters, whose work draws on math and natural structures.",
          ticketed: false,
        },
        {
          id: "m-menil-x2",
          title: "Fragility",
          // Dates from https://www.menil.org/exhibition/fragility, read 2026-10-22.
          startDate: "2026-09-10",
          endDate: "2027-01-24",
          blurb: "Work by 24 artists who treat paper as the material itself, at the Menil Drawing Institute.",
          ticketed: false,
        },
        {
          id: "m-menil-x3",
          title: "How to Make an Exhibition: The Story of Jermayne MacAgy",
          // Dates from https://www.menil.org/exhibition/how-to-make-an-exhibition-the-story-of-jermayne-macagy, read 2026-10-22.
          startDate: "2026-12-11",
          endDate: "2027-07-18",
          blurb: "The curator Jermayne MacAgy, her installations, and her work with the de Menils.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-getty",
      slug: "getty-center",
      name: "The Getty Center",
      city: "Los Angeles, CA",
      country: "USA",
      region: "west",
      type: "art",
      founded: 1997,
      blurb:
        "Richard Meier's travertine acropolis above the 405 — European paintings, drawings, photography, and a garden.",
      websiteUrl: "https://www.getty.edu",
      highlights: ["Irises (Van Gogh)", "Central Garden", "Photography galleries"],
      curatorRating: 4.5,
      curatorBlurb:
        "The tram ride is part of the experience. Hit photography first while it's empty, then everything else.",
      popularity: 84,
      visitMinutesAvg: 240,
      admissionUSD: null,
      exhibits: [
        {
          id: "m-getty-x1",
          title: "Instante/revelación: Moments in Mexican Photography",
          // Dates from https://www.getty.edu/exhibitions/mexican-photography, read 2026-10-22.
          startDate: "2026-09-01",
          endDate: "2027-01-03",
          blurb: "Thirteen Mexican photographers, including Lola and Manuel Álvarez Bravo and Graciela Iturbide, from one gift.",
          ticketed: false,
        },
        {
          id: "m-getty-x2",
          title: "A Light in the Dark: Joseph Wright of Derby",
          // Dates from https://www.getty.edu/exhibitions/wright-of-derby, read 2026-10-22.
          startDate: "2026-11-24",
          endDate: "2027-03-14",
          blurb: "Wright of Derby's paintings of scenes lit by a single candle or lamp.",
          ticketed: false,
        },
        {
          id: "m-getty-x3",
          title: "Paul R. Williams: Architecture Across the Color Line",
          // Dates from https://www.getty.edu/exhibitions/paul-r-williams, read 2026-10-22.
          startDate: "2026-12-15",
          endDate: "2027-03-14",
          blurb: "The first public showing of the archive of the first Black architect licensed in the western US.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-broad",
      slug: "the-broad",
      name: "The Broad",
      city: "Los Angeles, CA",
      country: "USA",
      region: "west",
      type: "art",
      founded: 2015,
      blurb:
        "DTLA contemporary collection in a Diller Scofidio + Renfro \"veil and vault\" building.",
      websiteUrl: "https://www.thebroad.org",
      highlights: ["Infinity Mirrored Room", "Koons Tulips", "Basquiat holdings"],
      curatorRating: 3.5,
      curatorBlurb:
        "More photo-op than museum, but the Kusama room earns its line if you reserve in advance.",
      popularity: 81,
      visitMinutesAvg: 90,
      admissionUSD: null,
      exhibits: [
        {
          id: "m-broad-x1",
          title: "Has the myth been shattered",
          // Dates from https://www.thebroad.org/art/collection-exhibitions/has-myth-been-shattered, read 2026-10-22.
          startDate: "2026-11-21",
          endDate: "2027-04-04",
          blurb: "Six decades of the Broad's collection on how media shapes history and memory.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-sfmoma",
      slug: "sfmoma",
      name: "SFMOMA",
      city: "San Francisco, CA",
      country: "USA",
      region: "west",
      type: "art",
      founded: 1935,
      blurb:
        "Snøhetta-expanded modern and contemporary survey with a serious photography program.",
      websiteUrl: "https://www.sfmoma.org",
      highlights: ["Photography galleries", "Living Wall", "Doris and Donald Fisher Collection"],
      curatorRating: 4.0,
      curatorBlurb:
        "Photography on level 3 is the sleeper highlight. Skip the seventh-floor sculpture terrace only if it's foggy.",
      popularity: 72,
      visitMinutesAvg: 180,
      admissionUSD: 30,
      exhibits: [
        {
          id: "m-sfmoma-x1",
          title: "RM x SFMOMA: Between You and Me",
          // Dates from https://www.sfmoma.org/exhibition/rm-x-sfmoma/, read 2026-10-22.
          startDate: "2026-10-03",
          endDate: "2027-02-07",
          blurb: "Nearly 150 works from RM's own collection, mostly modern and contemporary Korean art, beside SFMOMA's.",
          ticketed: true,
        },
        {
          id: "m-sfmoma-x2",
          title: "Graciela Iturbide: Between Two Worlds",
          // Dates from https://www.sfmoma.org/exhibition/graciela-iturbide-between-two-worlds/, read 2026-10-22.
          startDate: "2026-07-11",
          endDate: "2026-11-29",
          blurb: "More than fifty years of Iturbide's photographs, mostly black and white and mostly made in Mexico.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-deyoung",
      slug: "de-young",
      name: "de Young Museum",
      city: "San Francisco, CA",
      country: "USA",
      region: "west",
      type: "art",
      founded: 1895,
      blurb: "Herzog & de Meuron's copper-clad fine arts museum in Golden Gate Park.",
      websiteUrl: "https://www.famsf.org/de-young",
      highlights: ["Hamon Tower viewing platform", "American art", "Textile collection"],
      curatorRating: 4.0,
      curatorBlurb:
        "The free Hamon Tower is the best free view in the city. Worth a stop even if you're skipping the galleries.",
      popularity: 65,
      visitMinutesAvg: 150,
      admissionUSD: 20,
      exhibits: [
        {
          id: "m-dey-x1",
          title: "Treasures of the Pharaohs",
          // Dates from https://www.famsf.org/exhibitions/treasures-pharaohs, read 2026-10-22.
          startDate: "2026-08-01",
          endDate: "2027-01-31",
          blurb: "About 130 Egyptian objects across 3,000 years, including the first US showing of finds from near Luxor.",
          ticketed: true,
        },
        {
          id: "m-dey-x2",
          title: "Rose B. Simpson: LEXICON",
          // Dates from https://www.famsf.org/exhibitions/rose-b-simpson, read 2026-10-22.
          startDate: "2025-08-30",
          endDate: "2027-02-07",
          blurb: "Two cars Rose B. Simpson customized with Pueblo pottery designs, in Wilsey Court.",
          ticketed: false,
        },
        {
          id: "m-dey-x3",
          title: "Spectacular Freedom: Andrew Wyeth and the Modern American Watercolor",
          // Dates from https://www.famsf.org/exhibitions/andrew-wyeth-watercolor, read 2026-10-22.
          startDate: "2027-02-13",
          endDate: "2027-07-18",
          blurb: "Nearly 80 works in the first exhibition about Wyeth's watercolors.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-natlgallery",
      slug: "national-gallery-art-dc",
      name: "National Gallery of Art",
      city: "Washington, DC",
      country: "USA",
      region: "south",
      type: "art",
      founded: 1937,
      blurb:
        "The country's national art museum — West Building (Pope) and East Building (Pei), free, on the Mall.",
      websiteUrl: "https://www.nga.gov",
      highlights: ["Ginevra de' Benci (only Leonardo in the Americas)", "East Building Calder", "Sculpture Garden"],
      curatorRating: 5.0,
      curatorBlurb:
        "It's free, it's on the Mall, and the sole Leonardo painting in the Western Hemisphere is hanging in it. Non-negotiable when you're in DC.",
      popularity: 86,
      visitMinutesAvg: 210,
      admissionUSD: null,
      exhibits: [
        {
          id: "m-nga-x1",
          title: "American Icon: The US Flag in Art",
          // Dates from https://www.nga.gov/exhibitions/american-icon, read 2026-10-22.
          startDate: "2026-06-06",
          endDate: "2026-12-06",
          blurb: "About 30 works from the late 1800s to now on how artists have used the US flag.",
          ticketed: false,
        },
        {
          id: "m-nga-x2",
          title: "Remember Me: Picturing African Americans in Early Photography",
          // Dates from https://www.nga.gov/exhibitions/remember-me, read 2026-10-22.
          startDate: "2026-11-07",
          endDate: "2027-03-14",
          blurb: "About 70 early photographs of and by Black Americans from the collection, many shown for the first time.",
          ticketed: false,
        },
        {
          id: "m-nga-x3",
          title: "Broken: The Power of the Fragment in Sculpture",
          // Dates from https://www.nga.gov/exhibitions/broken, read 2026-10-22.
          startDate: "2027-03-13",
          endDate: "2027-06-27",
          blurb: "Some 75 damaged or fragmentary sculptures from 2,500 BCE to now, on loss, war, and restitution.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-amnh",
      slug: "amnh",
      name: "American Museum of Natural History",
      city: "New York, NY",
      country: "USA",
      region: "northeast",
      type: "natural-history",
      founded: 1869,
      blurb:
        "Dinosaurs, Rose Center planetarium, and the new Gilder Center by Studio Gang.",
      websiteUrl: "https://www.amnh.org",
      highlights: ["Tyrannosaurus", "Hayden Planetarium", "Gilder Center insectarium"],
      curatorRating: 4.5,
      curatorBlurb:
        "The Gilder Center addition put a real architectural set piece on the Columbus Ave side. The dinosaur halls are still the headline.",
      popularity: 89,
      visitMinutesAvg: 240,
      admissionUSD: 28,
      exhibits: [
        {
          id: "m-amnh-x1",
          title: "For the Win: Objects of Sports Excellence",
          // Dates from https://www.amnh.org/exhibitions/for-the-win, read 2026-10-22.
          startDate: "2026-05-18",
          endDate: "2027-01-03",
          blurb: "About 70 trophies, medals, and other objects from more than 15 sports.",
          ticketed: false,
        },
      ],
    },
    {
      id: "m-tate-modern",
      slug: "tate-modern",
      name: "Tate Modern",
      city: "London",
      country: "United Kingdom",
      region: "europe",
      type: "art",
      founded: 2000,
      blurb:
        "Bankside power station turned international modern and contemporary museum, free to enter.",
      websiteUrl: "https://www.tate.org.uk/visit/tate-modern",
      highlights: ["Turbine Hall commissions", "Boiler House collections", "Switch House viewing level"],
      curatorRating: 4.5,
      curatorBlurb:
        "Turbine Hall first, then climb up. The Switch House top floor is the best free panorama of the Thames.",
      popularity: 90,
      visitMinutesAvg: 180,
      admissionUSD: null,
      exhibits: [
        {
          id: "m-tate-x1",
          title: "Hyundai Commission Tarek Atoui",
          // Dates from https://www.tate.org.uk/whats-on/tate-modern/tarek-atoui, read 2026-10-22.
          startDate: "2026-10-13",
          endDate: "2027-04-11",
          blurb: "A sound installation in the Turbine Hall built from instruments, electronics, and textiles moved by air.",
          ticketed: false,
        },
        {
          id: "m-tate-x2",
          title: "Frida: The Making of an Icon",
          // Dates from https://www.tate.org.uk/whats-on/tate-modern/frida-kahlo-the-making-of-an-icon, read 2026-10-22.
          startDate: "2026-06-25",
          endDate: "2027-01-03",
          blurb: "How Frida Kahlo became both an artist and a global commercial image, with more than 30 of her paintings.",
          ticketed: true,
        },
        {
          id: "m-tate-x3",
          title: "Monet: Painting Time",
          // Dates from https://www.tate.org.uk/whats-on/tate-modern/monet, read 2026-10-22.
          startDate: "2027-02-25",
          endDate: "2027-06-27",
          blurb: "Tate Modern's first exhibition given only to Monet, organized around how his work treats time.",
          ticketed: true,
        },
      ],
    },
    {
      id: "m-rijks",
      slug: "rijksmuseum",
      name: "Rijksmuseum",
      city: "Amsterdam",
      country: "Netherlands",
      region: "europe",
      type: "art",
      founded: 1800,
      blurb:
        "Dutch national museum housing the Golden Age — Vermeer, Rembrandt, and the Cuypers building itself.",
      websiteUrl: "https://www.rijksmuseum.nl",
      highlights: ["The Night Watch", "Vermeers", "Cuypers Library"],
      curatorRating: 5.0,
      curatorBlurb:
        "If you can only do one museum in Europe, do this. The Vermeer room rewards a slow second loop.",
      popularity: 87,
      visitMinutesAvg: 210,
      admissionUSD: 25,
      exhibits: [
        {
          id: "m-rijks-x1",
          title: "Willem de Kooning at work",
          // Dates from https://www.rijksmuseum.nl/en/whats-on/exhibitions/willem-de-kooning-at-work, read 2026-10-22.
          startDate: "2026-10-09",
          endDate: "2027-01-17",
          blurb: "De Kooning's drawings, with some paintings and sculpture, a century after he left for New York.",
          ticketed: false,
        },
        {
          id: "m-rijks-x2",
          title: "Document Netherlands: New Energy",
          // Dates from https://www.rijksmuseum.nl/en/whats-on/exhibitions/document-netherlands-new-energy, read 2026-10-22.
          startDate: "2026-10-09",
          endDate: "2027-01-17",
          blurb: "Kadir van Lohuizen's photographs of the energy transition around the North Sea.",
          ticketed: false,
        },
        {
          id: "m-rijks-x3",
          title: "Drawing!",
          // Dates from https://www.rijksmuseum.nl/en/whats-on/exhibitions/draw, read 2026-10-22.
          startDate: "2027-02-12",
          endDate: "2027-05-23",
          blurb: "More than 100 drawings on how Northern Netherlandish artists around 1600 changed drawing.",
          ticketed: false,
        },
      ],
    },
  ],

  // ─── Curator's reviews (the "Letterboxd reviews" surface) ──────────────────
  reviews: [
    {
      id: "r-1",
      museumId: "m-frick",
      rating: 5,
      headline: "Reopens at the top of its game",
      body:
        "The Selldorf renovation was the rare upgrade that didn't smooth away the thing it was upgrading. Now the second-floor family bedrooms read as galleries without losing the house's bones. The Vermeer wall finally has the air it deserves, and the new café means you can actually spend an afternoon here.",
      dateVisited: "2026-04-12",
      tags: ["old masters", "house museum", "favorite"],
      liked: true,
      recommendedFor: "Anyone who wants the opposite of museum fatigue",
    },
    {
      id: "r-3",
      museumId: "m-menil",
      rating: 5,
      headline: "Still the most generous museum in America",
      body:
        "Free, low-light, no gift shop ambush at the exit. The Surrealism rooms run hotter than they have any right to. End at the Rothko Chapel even if you've been a hundred times.",
      dateVisited: "2026-03-08",
      tags: ["free", "favorite", "houston"],
      liked: true,
      recommendedFor: "A slow Sunday with one museum and nothing else",
    },
    {
      id: "r-4",
      museumId: "m-mfah",
      rating: 4.5,
      headline: "The Kinder Building changed the game",
      body:
        "The new postwar wing finally lets the MFAH show contemporary art at the scale the collection deserves. The Turrell tunnel between buildings remains underrated nationally and rightly worshipped locally.",
      dateVisited: "2026-02-22",
      tags: ["houston", "modern"],
    },
    {
      id: "r-5",
      museumId: "m-broad",
      rating: 3,
      headline: "The Kusama room earns the queue. The rest is fine.",
      body:
        "The collection is real. The hang is fine. But the building reads as a stage set for the Infinity Room photo, and most of the rest of the galleries feel like consolation prizes. Reserve the Kusama slot or skip.",
      dateVisited: "2026-01-30",
      tags: ["contemporary", "los angeles"],
    },
    {
      id: "r-6",
      museumId: "m-aic",
      rating: 4.5,
      headline: "The Impressionist room still stops you in your tracks",
      body:
        "There are bigger Impressionist rooms in the world but not many denser. Caillebotte's Paris Street; Rainy Day is the actual headline; everything else is the supporting cast. Modern Wing is a separate visit.",
      dateVisited: "2025-12-12",
      tags: ["impressionism", "chicago", "favorite"],
      liked: true,
    },
    {
      id: "r-7",
      museumId: "m-tate-modern",
      rating: 4.5,
      headline: "Turbine Hall first, always",
      body:
        "The current Hyundai commission rewards a first loop without context, then a second one with the wall text. Take the elevator straight to the Switch House top floor afterward — best free skyline in central London.",
      dateVisited: "2025-11-04",
      tags: ["london", "contemporary"],
      liked: true,
    },
    {
      id: "r-8",
      museumId: "m-rijks",
      rating: 5,
      headline: "The Night Watch is more interesting under restoration",
      body:
        "Operation Night Watch turned the central gallery into a working conservation lab — you can watch the painting being studied through glass. The Vermeer cabinet is its own pilgrimage.",
      dateVisited: "2025-10-18",
      tags: ["amsterdam", "old masters", "favorite"],
      liked: true,
    },
    {
      id: "r-9",
      museumId: "m-natlgallery",
      rating: 5,
      headline: "Free, on the Mall, holds the only Leonardo in the Americas",
      body:
        "Ginevra de' Benci alone is the trip. The East Building's Calder mobile is a separate kind of pilgrimage. Plan two visits — one each building — not one combined.",
      dateVisited: "2025-09-21",
      tags: ["dc", "free", "old masters"],
      liked: true,
    },
    {
      id: "r-10",
      museumId: "m-getty",
      rating: 4,
      headline: "The architecture earns top billing",
      body:
        "Photography first, then European paintings, then the garden. The Irises room is doing real work. Time golden hour for the central plaza on the way out.",
      dateVisited: "2025-08-30",
      tags: ["los angeles", "photography"],
    },
  ],

  // ─── Visit log (the curator's "diary" view) ────────────────────────────────
  visitLog: [
    { id: "v-2", museumId: "m-frick", date: "2026-04-12", rating: 5 },
    {
      id: "v-3",
      museumId: "m-moma",
      date: "2026-04-04",
      rating: 4,
      note: "Mostly came for the design wing this time.",
    },
    { id: "v-4", museumId: "m-whitney", date: "2026-03-21", rating: 4, exhibitTitle: "Whitney Biennial 2026" },
    { id: "v-5", museumId: "m-menil", date: "2026-03-08", rating: 5 },
    { id: "v-6", museumId: "m-mfah", date: "2026-02-22", rating: 4.5 },
    { id: "v-7", museumId: "m-broad", date: "2026-01-30", rating: 3 },
    { id: "v-8", museumId: "m-getty", date: "2026-01-18", rating: 4 },
    { id: "v-9", museumId: "m-aic", date: "2025-12-12", rating: 4.5 },
    { id: "v-10", museumId: "m-tate-modern", date: "2025-11-04", rating: 4.5 },
    { id: "v-11", museumId: "m-rijks", date: "2025-10-18", rating: 5 },
    { id: "v-12", museumId: "m-natlgallery", date: "2025-09-21", rating: 5 },
    { id: "v-13", museumId: "m-deyoung", date: "2025-09-02", rating: 4 },
    { id: "v-14", museumId: "m-sfmoma", date: "2025-08-31", rating: 4 },
    { id: "v-15", museumId: "m-amnh", date: "2025-07-19", rating: 4.5 },
  ],

  // ─── Curated lists (Letterboxd-style collections) ──────────────────────────
  lists: [
    {
      id: "l-1",
      slug: "the-essentials",
      title: "The Essentials",
      description:
        "If you only do ten museums in your life, these are the ten. Heavily weighted toward generosity of program over fame of holdings.",
      curator: "Isaac Vazquez",
      museumIds: [
        "m-met",
        "m-frick",
        "m-natlgallery",
        "m-rijks",
        "m-tate-modern",
        "m-aic",
        "m-menil",
        "m-getty",
        "m-amnh",
        "m-mfah",
      ],
      updatedAt: "2026-04-21",
    },
    {
      id: "l-2",
      slug: "best-free-museums",
      title: "Best free museums in America",
      description:
        "No-ticket, no-gatekeeping museums where the program is good enough that admission isn't even the point.",
      curator: "Isaac Vazquez",
      museumIds: ["m-natlgallery", "m-menil", "m-getty"],
      updatedAt: "2026-04-14",
    },
    {
      id: "l-3",
      slug: "great-buildings",
      title: "Visit the building, then the art",
      description:
        "Museums where the architecture is half the program. Read these as buildings first, collections second.",
      curator: "Isaac Vazquez",
      museumIds: [
        "m-guggenheim",
        "m-getty",
        "m-broad",
        "m-deyoung",
        "m-tate-modern",
        "m-whitney",
        "m-amnh",
      ],
      updatedAt: "2026-03-30",
    },
    {
      id: "l-4",
      slug: "best-in-texas",
      title: "Best in Texas",
      description:
        "An argument that Houston quietly runs the strongest museum row in the country relative to its size.",
      curator: "Isaac Vazquez",
      museumIds: ["m-mfah", "m-menil"],
      updatedAt: "2026-02-25",
    },
    {
      id: "l-5",
      slug: "rainy-day-nyc",
      title: "Rainy day in NYC",
      description:
        "Six museums for when the day collapses on you. Sequenced east-to-west so you can string two together on a single subway swipe.",
      curator: "Isaac Vazquez",
      museumIds: ["m-met", "m-guggenheim", "m-frick", "m-whitney", "m-moma", "m-amnh"],
      updatedAt: "2026-04-02",
    },
    {
      id: "l-6",
      slug: "old-masters-pilgrimage",
      title: "Old Masters pilgrimage",
      description:
        "The shortlist for anyone who wants Vermeer, Rembrandt, Velázquez, and Leonardo on the same trip.",
      curator: "Isaac Vazquez",
      museumIds: ["m-frick", "m-met", "m-natlgallery", "m-rijks"],
      updatedAt: "2026-01-12",
    },
  ],
};

export const museumSnapshot: MuseumSnapshot = {
  ...baseMuseumSnapshot,
  museums: baseMuseumSnapshot.museums.map(museum => ({
    ...museum,
    exhibits: [...(Object.hasOwn(selectedMuseumExhibitions, museum.id) ? selectedMuseumExhibitions[museum.id] : []), ...museum.exhibits],
  })),
};
