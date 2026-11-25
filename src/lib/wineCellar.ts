import {
  getBrowserStorageSnapshot,
  writeBrowserStorageString,
} from "@/lib/browserStorage";
import type {
  WineEntry,
  WineSummary,
  WineType,
  WineTypeBreakdown,
} from "@/types/wine";
import { clamp, isRecord, prefixedId, roundTo } from "@/lib/utils";
import { toLocalDateKey } from "@/lib/date-formatters";

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

const MIN_RATING = 0.5;
const MAX_RATING = 5;
const RATING_STEP = 0.5;

function isWineType(value: unknown): value is WineType {
  return typeof value === "string" && (WINE_TYPES as string[]).includes(value);
}

function roundTwo(value: number) {
  return Number.isFinite(value) ? roundTo(value, 2) : 0;
}

function clampRating(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return MIN_RATING;
  const stepped = Math.round(numeric / RATING_STEP) * RATING_STEP;
  return clamp(roundTwo(stepped), MIN_RATING, MAX_RATING);
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

export const getTodayIsoDate = toLocalDateKey;

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
    id: prefixedId("wine"),
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
    id: typeof input.id === "string" && input.id ? input.id : prefixedId("wine"),
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

export function loadWineEntries(): WineEntry[] {
  if (typeof window === "undefined") return [];
  // Read through the shared memory-mirrored store so an entry still reads back
  // even when a prior durable write failed (Safari private mode / quota).
  return parseWineEntries(getBrowserStorageSnapshot(WINE_CELLAR_STORAGE_KEY, "[]"));
}

export function saveWineEntries(entries: WineEntry[]) {
  // Guarded write: mirrors in memory first, then attempts durable storage, so a
  // QuotaExceededError never throws out of the interaction and aborts the save.
  writeBrowserStorageString(WINE_CELLAR_STORAGE_KEY, JSON.stringify(entries));
}

export function calculateWineSummary(entries: WineEntry[]): WineSummary {
  const totalRating = entries.reduce((sum, entry) => sum + entry.rating, 0);

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

  return {
    averageRating: entries.length > 0 ? roundTwo(totalRating / entries.length) : 0,
    typeBreakdown,
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
