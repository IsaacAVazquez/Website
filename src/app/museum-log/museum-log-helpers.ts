import type {
  Museum,
  MuseumRegion,
  MuseumSort,
  MuseumType,
  MuseumTypeFilter,
  MuseumRegionFilter,
} from "@/types/museum";

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

export function ratingBadgeStyle(rating: number) {
  if (rating >= 4.5)
    return { background: "color-mix(in srgb, var(--home-acid) 28%, var(--home-paper))", color: "var(--home-ink)" };
  if (rating >= 3.5)
    return { background: "color-mix(in srgb, var(--home-haze) 30%, var(--home-paper))", color: "var(--home-ink)" };
  if (rating >= 2.5)
    return { background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))", color: "var(--home-ink)" };
  return { background: "color-mix(in srgb, var(--home-stone) 30%, var(--home-paper))", color: "var(--home-ink-muted)" };
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return sum / ratings.length;
}
