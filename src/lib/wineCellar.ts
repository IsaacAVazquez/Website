import type {
  WineEntry,
  WineSummary,
  WineType,
  WineTypeBreakdown,
} from "@/types/wine";

export const WINE_CELLAR_STORAGE_KEY = "wine_cellar_entries_v1";

export const WINE_TYPES: WineType[] = [
  "red",
  "white",
  "rose",
  "sparkling",
  "dessert",
  "fortified",
  "orange",
];

export const WINE_TYPE_LABELS: Record<WineType, string> = {
  red: "Red",
  white: "White",
  rose: "Rosé",
  sparkling: "Sparkling",
  dessert: "Dessert",
  fortified: "Fortified",
  orange: "Orange",
};

export const MIN_RATING = 0.5;
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isWineType(value: unknown): value is WineType {
  return typeof value === "string" && (WINE_TYPES as string[]).includes(value);
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `wine-${crypto.randomUUID()}`;
  }
  return `wine-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function roundTwo(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function clampRating(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return MIN_RATING;
  const stepped = Math.round(numeric / RATING_STEP) * RATING_STEP;
  return Math.min(MAX_RATING, Math.max(MIN_RATING, roundTwo(stepped)));
}

function sanitizePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return roundTwo(numeric);
}

function sanitizeVintage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const year = Math.round(numeric);
  if (year < 1800 || year > 2100) return null;
  return year;
}

function sanitizeIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return value;
}

function sanitizeTimestamp(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

export function getTodayIsoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface WineDraft {
  name: string;
  producer: string;
  vintage: number | null;
  region: string;
  varietal: string;
  type: WineType;
  price: number | null;
  rating: number;
  notes: string;
  tastedOn: string;
}

export function createWineEntry(draft: WineDraft, now = new Date()): WineEntry {
  return {
    id: createId(),
    name: draft.name.trim(),
    producer: draft.producer.trim(),
    vintage: sanitizeVintage(draft.vintage),
    region: draft.region.trim(),
    varietal: draft.varietal.trim(),
    type: draft.type,
    price: sanitizePrice(draft.price),
    rating: clampRating(draft.rating),
    notes: draft.notes.trim().slice(0, 1000),
    tastedOn: sanitizeIsoDate(draft.tastedOn, getTodayIsoDate(now)),
    createdAt: now.toISOString(),
  };
}

export function applyWineDraft(entry: WineEntry, draft: WineDraft): WineEntry {
  return {
    ...entry,
    name: draft.name.trim(),
    producer: draft.producer.trim(),
    vintage: sanitizeVintage(draft.vintage),
    region: draft.region.trim(),
    varietal: draft.varietal.trim(),
    type: draft.type,
    price: sanitizePrice(draft.price),
    rating: clampRating(draft.rating),
    notes: draft.notes.trim().slice(0, 1000),
    tastedOn: sanitizeIsoDate(draft.tastedOn, entry.tastedOn),
  };
}

function sanitizeWineEntry(input: unknown): WineEntry | null {
  if (!isRecord(input)) return null;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return null;
  if (!isWineType(input.type)) return null;

  const fallbackTimestamp = new Date().toISOString();
  const fallbackDate = getTodayIsoDate();

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId(),
    name,
    producer: typeof input.producer === "string" ? input.producer.trim() : "",
    vintage: sanitizeVintage(input.vintage),
    region: typeof input.region === "string" ? input.region.trim() : "",
    varietal: typeof input.varietal === "string" ? input.varietal.trim() : "",
    type: input.type,
    price: sanitizePrice(input.price),
    rating: clampRating(input.rating),
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "",
    tastedOn: sanitizeIsoDate(input.tastedOn, fallbackDate),
    createdAt: sanitizeTimestamp(input.createdAt, fallbackTimestamp),
  };
}

export function parseWineEntries(raw: string | null): WineEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeWineEntry(item))
      .filter((entry): entry is WineEntry => entry !== null);
  } catch {
    return [];
  }
}

export function loadWineEntries(storage?: Pick<Storage, "getItem">): WineEntry[] {
  if (storage) return parseWineEntries(storage.getItem(WINE_CELLAR_STORAGE_KEY));
  if (typeof window === "undefined") return [];
  return parseWineEntries(window.localStorage.getItem(WINE_CELLAR_STORAGE_KEY));
}

export function saveWineEntries(
  entries: WineEntry[],
  storage?: Pick<Storage, "setItem">
) {
  const payload = JSON.stringify(entries);
  if (storage) {
    storage.setItem(WINE_CELLAR_STORAGE_KEY, payload);
    return;
  }
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WINE_CELLAR_STORAGE_KEY, payload);
}

function pickMostFrequent(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const key = raw.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let topKey: string | null = null;
  let topCount = 0;
  counts.forEach((count, key) => {
    if (count > topCount) {
      topKey = key;
      topCount = count;
    }
  });
  return topKey;
}

export function calculateWineSummary(entries: WineEntry[]): WineSummary {
  const totalWines = entries.length;
  const totalRating = entries.reduce((sum, entry) => sum + entry.rating, 0);
  const totalSpend = entries.reduce((sum, entry) => sum + (entry.price ?? 0), 0);

  const typeGroups = new Map<WineType, { count: number; totalRating: number }>();
  for (const entry of entries) {
    const bucket = typeGroups.get(entry.type) ?? { count: 0, totalRating: 0 };
    bucket.count += 1;
    bucket.totalRating += entry.rating;
    typeGroups.set(entry.type, bucket);
  }

  const typeBreakdown: WineTypeBreakdown[] = Array.from(typeGroups.entries())
    .map(([type, bucket]) => ({
      type,
      count: bucket.count,
      averageRating: bucket.count > 0 ? roundTwo(bucket.totalRating / bucket.count) : 0,
    }))
    .sort((left, right) => right.count - left.count);

  const sortedByRating = [...entries].sort((left, right) => {
    if (right.rating !== left.rating) return right.rating - left.rating;
    return right.tastedOn.localeCompare(left.tastedOn);
  });

  const sortedByDate = [...entries].sort((left, right) => {
    if (right.tastedOn !== left.tastedOn) {
      return right.tastedOn.localeCompare(left.tastedOn);
    }
    return right.createdAt.localeCompare(left.createdAt);
  });

  return {
    totalWines,
    averageRating: totalWines > 0 ? roundTwo(totalRating / totalWines) : 0,
    totalSpend: roundTwo(totalSpend),
    topRated: sortedByRating.slice(0, 3),
    recent: sortedByDate.slice(0, 5),
    typeBreakdown,
    topRegion: pickMostFrequent(entries.map((entry) => entry.region)),
    topVarietal: pickMostFrequent(entries.map((entry) => entry.varietal)),
  };
}

export type WineSortKey = "tastedOn" | "rating" | "name" | "price";

export interface WineFilters {
  search: string;
  type: WineType | "all";
  minRating: number;
  sort: WineSortKey;
  sortDirection: "asc" | "desc";
}

export const DEFAULT_WINE_FILTERS: WineFilters = {
  search: "",
  type: "all",
  minRating: 0,
  sort: "tastedOn",
  sortDirection: "desc",
};

export function filterAndSortWines(
  entries: WineEntry[],
  filters: WineFilters
): WineEntry[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (filters.type !== "all" && entry.type !== filters.type) return false;
    if (entry.rating < filters.minRating) return false;
    if (!search) return true;
    const haystack = [
      entry.name,
      entry.producer,
      entry.region,
      entry.varietal,
      entry.notes,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  const direction = filters.sortDirection === "asc" ? 1 : -1;
  filtered.sort((left, right) => {
    switch (filters.sort) {
      case "rating": {
        if (left.rating !== right.rating) return (left.rating - right.rating) * direction;
        return right.tastedOn.localeCompare(left.tastedOn);
      }
      case "name": {
        return left.name.localeCompare(right.name) * direction;
      }
      case "price": {
        const leftPrice = left.price ?? -1;
        const rightPrice = right.price ?? -1;
        if (leftPrice !== rightPrice) return (leftPrice - rightPrice) * direction;
        return right.tastedOn.localeCompare(left.tastedOn);
      }
      case "tastedOn":
      default: {
        if (left.tastedOn !== right.tastedOn) {
          return left.tastedOn.localeCompare(right.tastedOn) * direction;
        }
        return right.createdAt.localeCompare(left.createdAt);
      }
    }
  });

  return filtered;
}
