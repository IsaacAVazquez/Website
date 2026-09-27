import type {
  Museum,
  MuseumExhibit,
  MuseumRegion,
  MuseumSort,
  MuseumType,
  MuseumTypeFilter,
  MuseumRegionFilter,
} from "@/types/museum";

export interface AdmissionStubLines {
  name: string;
  city: string;
  /** "Est. <founded>", or null when the founding year is unknown (0 or non-finite). */
  founded: string | null;
  admission: string;
  curatorRating: number;
  /** Whether any exhibit is running today, per `getMuseumExhibitStatus`. */
  exhibitNow: boolean;
}

export interface VisitStampParts {
  month: string;
  day: string;
  year: string;
}

const STAMP_MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });

export type MuseumExhibitStatus = "current" | "upcoming" | "ended";

/**
 * Classifies an exhibit against a local calendar date. `today` is null until the
 * client knows its local date (it is not computed during SSR, where the server
 * timezone can disagree with the visitor's) — return null so no status renders.
 */
export function getMuseumExhibitStatus(
  exhibit: Pick<MuseumExhibit, "startDate" | "endDate">,
  today: string | null
): MuseumExhibitStatus | null {
  if (today === null) return null;
  if (exhibit.startDate > today) return "upcoming";
  if (exhibit.endDate !== null && exhibit.endDate < today) return "ended";
  return "current";
}

// ─── Date formatters ──────────────────────────────────────────────────────────

const FULL_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const UPDATED_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// Date-only ISO strings ("2026-06-15") parse as UTC midnight, which the local
// Intl formatters can shift to the previous day. Parse those as local dates so
// the displayed day matches what the user logged.
function parseDateOnly(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
}

export function formatDate(iso: string): string {
  const d = parseDateOnly(iso);
  return Number.isNaN(d.getTime()) ? iso : FULL_DATE_FMT.format(d);
}

export function formatShortDate(iso: string): string {
  const d = parseDateOnly(iso);
  return Number.isNaN(d.getTime()) ? iso : SHORT_DATE_FMT.format(d);
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Unavailable" : UPDATED_FMT.format(d);
}

export function formatRuntime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatAdmission(usd: number | null): string {
  if (usd === null) return "Free";
  return `$${usd}`;
}

/** The printed lines of an admission ticket stub. */
export function admissionStub(museum: Museum, today: string | null): AdmissionStubLines {
  return {
    name: museum.name,
    city: museum.city,
    founded:
      Number.isFinite(museum.founded) && museum.founded > 0 ? `Est. ${museum.founded}` : null,
    admission: formatAdmission(museum.admissionUSD),
    curatorRating: museum.curatorRating,
    exhibitNow: museum.exhibits.some((ex) => getMuseumExhibitStatus(ex, today) === "current"),
  };
}

/** The date parts a visit's rubber stamp prints, or null for an unparseable date. */
export function visitStamp(iso: string): VisitStampParts | null {
  const d = parseDateOnly(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: STAMP_MONTH_FMT.format(d).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
    year: String(d.getFullYear()),
  };
}

// ─── Type / region labels and palettes ───────────────────────────────────────

export const TYPE_LABEL: Record<MuseumType, string> = {
  art: "Art",
  history: "History",
  science: "Science",
  "natural-history": "Natural History",
  design: "Design",
  photography: "Photography",
  specialty: "Specialty",
};

export const REGION_LABEL: Record<MuseumRegion, string> = {
  northeast: "Northeast US",
  south: "South US",
  midwest: "Midwest US",
  west: "West US",
  europe: "Europe",
  asia: "Asia",
  "latin-america": "Latin America",
};

export const TYPE_FILTER_OPTIONS: Array<{ value: MuseumTypeFilter; label: string }> = [
  { value: "all", label: "All types" },
  ...(Object.entries(TYPE_LABEL) as Array<[MuseumType, string]>).map(([value, label]) => ({
    value,
    label,
  })),
];

export const REGION_FILTER_OPTIONS: Array<{ value: MuseumRegionFilter; label: string }> = [
  { value: "all", label: "All regions" },
  ...(Object.entries(REGION_LABEL) as Array<[MuseumRegion, string]>).map(([value, label]) => ({
    value,
    label,
  })),
];

export const SORT_LABEL: Record<MuseumSort, string> = {
  rating: "Curator rating",
  popular: "Popularity",
  recent: "Recently visited",
  alpha: "A → Z",
};

export const SORT_OPTIONS: MuseumSort[] = ["rating", "popular", "recent", "alpha"];

// ─── Filtering / sorting helpers ─────────────────────────────────────────────

export function filterMuseums(
  museums: Museum[],
  type: MuseumTypeFilter,
  region: MuseumRegionFilter,
): Museum[] {
  return museums.filter((m) => {
    if (type !== "all" && m.type !== type) return false;
    if (region !== "all" && m.region !== region) return false;
    return true;
  });
}

export function sortMuseums(
  museums: Museum[],
  sort: MuseumSort,
  visitDateByMuseumId: Record<string, string | undefined>,
): Museum[] {
  const copy = [...museums];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => {
        if (b.curatorRating !== a.curatorRating) return b.curatorRating - a.curatorRating;
        return b.popularity - a.popularity;
      });
    case "popular":
      return copy.sort((a, b) => b.popularity - a.popularity);
    case "alpha":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "recent":
      return copy.sort((a, b) => {
        const aDate = visitDateByMuseumId[a.id];
        const bDate = visitDateByMuseumId[b.id];
        if (aDate && bDate) return bDate.localeCompare(aDate);
        if (aDate) return -1;
        if (bDate) return 1;
        return a.name.localeCompare(b.name);
      });
  }
}

// ─── Star rendering helpers ──────────────────────────────────────────────────

/**
 * Returns five-star fill ratios for a 0–5 rating, in half-star steps.
 * Each entry is 0, 0.5, or 1 — used to render five star icons.
 */
export function starFractions(rating: number): number[] {
  const clamped = Math.max(0, Math.min(5, rating));
  const halves = Math.round(clamped * 2); // 0–10 half-stars
  const stars: number[] = [];
  let remaining = halves;
  for (let i = 0; i < 5; i++) {
    if (remaining >= 2) {
      stars.push(1);
      remaining -= 2;
    } else if (remaining === 1) {
      stars.push(0.5);
      remaining = 0;
    } else {
      stars.push(0);
    }
  }
  return stars;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return sum / ratings.length;
}
