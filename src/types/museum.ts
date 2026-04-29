// ─── Museum catalog types ──────────────────────────────────────────────────────

export type MuseumType =
  | "art"
  | "history"
  | "science"
  | "natural-history"
  | "design"
  | "photography"
  | "specialty";

export type MuseumRegion =
  | "northeast"
  | "south"
  | "midwest"
  | "west"
  | "europe"
  | "asia"
  | "latin-america";

export interface MuseumExhibit {
  id: string;
  title: string;
  startDate: string; // ISO date
  endDate: string | null; // null = permanent
  blurb: string;
  ticketed: boolean;
}

export interface Museum {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  region: MuseumRegion;
  type: MuseumType;
  founded: number;
  blurb: string;
  websiteUrl?: string;
  highlights: string[];
  curatorRating: number; // 0–5, half-star steps
  curatorBlurb: string;
  popularity: number; // 0–100, used for sorting
  visitMinutesAvg: number;
  admissionUSD: number | null; // null = free
  exhibits: MuseumExhibit[];
}

// ─── Curator review (snapshot-curated) ────────────────────────────────────────

export interface CuratorReview {
  id: string;
  museumId: string;
  rating: number; // 0–5
  headline: string;
  body: string;
  dateVisited: string; // ISO date
  exhibitTitle?: string;
  tags: string[];
  liked?: boolean;
  recommendedFor?: string;
}

// ─── Visit log (curator's quick-hit diary) ────────────────────────────────────

export interface VisitLogEntry {
  id: string;
  museumId: string;
  date: string; // ISO date
  rating: number;
  exhibitTitle?: string;
  note?: string;
}

// ─── Curated lists (Letterboxd-style) ─────────────────────────────────────────

export interface CuratedList {
  id: string;
  slug: string;
  title: string;
  description: string;
  curator: string;
  museumIds: string[];
  updatedAt: string; // ISO date
}

// ─── Snapshot top-level ───────────────────────────────────────────────────────

export interface MuseumSnapshot {
  generatedAt: string; // ISO datetime
  sourceLabel: string;
  curatorName: string;
  curatorBio: string;
  museums: Museum[];
  reviews: CuratorReview[];
  visitLog: VisitLogEntry[];
  lists: CuratedList[];
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type MuseumView = "discover" | "journal" | "lists" | "museum";

export type MuseumSort = "rating" | "popular" | "recent" | "alpha";

export type MuseumTypeFilter = MuseumType | "all";
export type MuseumRegionFilter = MuseumRegion | "all";

export interface MuseumRouteState {
  view: MuseumView;
  museum: string | null; // museum slug
  list: string | null;   // list slug
  sort: MuseumSort;
  type: MuseumTypeFilter;
  region: MuseumRegionFilter;
}

// ─── Personal user state (browser-local) ──────────────────────────────────────

export type UserStatus = "visited" | "watchlist" | "liked";

export interface UserVisit {
  museumId: string;
  date: string; // ISO date
  rating: number; // 0–5
  note?: string;
}

export interface UserMuseumState {
  visited: UserVisit[];
  watchlist: string[]; // museum ids
  liked: string[];     // museum ids
}
