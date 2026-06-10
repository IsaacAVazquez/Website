import type {
  ActivityCategory,
  JournalEntry,
  JournalMood,
  Trip,
  TripActivity,
  TripDayBucket,
  TripStatus,
  TripSummary,
} from "@/types/travel";

export const TRAVEL_PLANNER_STORAGE_KEY = "travel_planner_trips_v1";

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "transit",
  "lodging",
  "food",
  "sight",
  "activity",
  "other",
];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  transit: "Transit",
  lodging: "Lodging",
  food: "Food",
  sight: "Sight",
  activity: "Activity",
  other: "Other",
};

export const JOURNAL_MOODS: JournalMood[] = [
  "amazing",
  "good",
  "neutral",
  "rough",
  "tired",
];

export const JOURNAL_MOOD_LABELS: Record<JournalMood, string> = {
  amazing: "Amazing",
  good: "Good",
  neutral: "Neutral",
  rough: "Rough",
  tired: "Tired",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHourMinute(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function createId(prefix: "trip" | "act" | "jrn") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampString(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, max);
  return trimmed || fallback;
}

function sanitizeNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100) / 100;
}

export function getTodayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date | null {
  if (!isIsoDate(value)) return null;
  const date = new Date(`${value}T00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffDaysInclusive(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function diffDaysSigned(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_FORMATTER_SHORT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatTripDateRange(startKey: string, endKey: string): string {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return "—";
  if (startKey === endKey) return DATE_FORMATTER.format(start);
  return `${DATE_FORMATTER.format(start)} – ${DATE_FORMATTER.format(end)}`;
}

export function formatDayHeading(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return DATE_FORMATTER_SHORT.format(date);
}

export function formatActivityTime(time: string): string {
  if (!isHourMinute(time)) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return TIME_FORMATTER.format(date);
}

export function formatActivityTimeRange(time: string, endTime: string): string {
  const start = formatActivityTime(time);
  if (!start) return "";
  const end = formatActivityTime(endTime);
  return end ? `${start} – ${end}` : start;
}

function timeToMinutes(value: string): number | null {
  if (!isHourMinute(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export interface ActivityOverlaps {
  ids: Set<string>;
  pairCount: number;
}

/**
 * Flags activities whose time windows overlap another stop on the same day.
 * Windows are half-open ([start, end)), so a stop that begins exactly when
 * another ends doesn't conflict. A stop with only a start time occupies that
 * single minute, so it conflicts with anything else scheduled across it —
 * including another start-only stop at the same minute. The result is
 * independent of how the stops happen to be ordered or titled.
 */
export function findActivityOverlaps(activities: TripActivity[]): ActivityOverlaps {
  const conflicts = new Set<string>();
  let pairCount = 0;
  const byDay = new Map<string, TripActivity[]>();
  for (const activity of activities) {
    const list = byDay.get(activity.date);
    if (list) list.push(activity);
    else byDay.set(activity.date, [activity]);
  }

  for (const dayActivities of byDay.values()) {
    const windows = dayActivities
      .map((activity) => {
        const start = timeToMinutes(activity.time);
        if (start === null) return null;
        const end = timeToMinutes(activity.endTime);
        // Start-only stops occupy one minute so the overlap test below stays
        // uniform (every window has end > start).
        return { id: activity.id, start, end: end !== null && end > start ? end : start + 1 };
      })
      .filter((window): window is { id: string; start: number; end: number } => window !== null)
      .sort((left, right) => left.start - right.start);

    for (let i = 0; i < windows.length; i += 1) {
      for (let j = i + 1; j < windows.length; j += 1) {
        // Sorted by start, so once the next window starts at/after this one
        // ends there can be no further overlaps for `i`.
        if (windows[j].start >= windows[i].end) break;
        conflicts.add(windows[i].id);
        conflicts.add(windows[j].id);
        pairCount += 1;
      }
    }
  }

  return { ids: conflicts, pairCount };
}

export function findOverlappingActivityIds(activities: TripActivity[]): Set<string> {
  return findActivityOverlaps(activities).ids;
}

export function getTripStatus(trip: Pick<Trip, "startDate" | "endDate">, today = getTodayKey()): TripStatus {
  if (today < trip.startDate) return "planned";
  if (today > trip.endDate) return "completed";
  return "active";
}

/**
 * Upper bound on rendered itinerary days. A typo'd year in a date input can
 * otherwise ask for tens of thousands of day sections and hang the tab.
 */
export const MAX_ITINERARY_DAYS = 366;

export function getDayKeysBetween(startKey: string, endKey: string): string[] {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end || end.getTime() < start.getTime()) return [];

  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime() && keys.length < MAX_ITINERARY_DAYS) {
    keys.push(getTodayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

function sanitizeActivity(input: unknown): TripActivity | null {
  if (!isRecord(input)) return null;

  const category =
    typeof input.category === "string" &&
    (ACTIVITY_CATEGORIES as string[]).includes(input.category)
      ? (input.category as ActivityCategory)
      : "other";

  const time = isHourMinute(input.time) ? input.time : "";
  const endTimeRaw = isHourMinute(input.endTime) ? input.endTime : "";
  // An end time only makes sense alongside a start, and never before it.
  const endTime = time && endTimeRaw && endTimeRaw > time ? endTimeRaw : "";

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("act"),
    // Repair rather than discard: a malformed stored date must never silently
    // delete a stop the user created.
    date: isIsoDate(input.date) ? input.date : getTodayKey(),
    time,
    endTime,
    title: clampString(input.title, 140, "Untitled stop"),
    location: clampString(input.location, 140),
    category,
    notes: clampString(input.notes, 500),
    completed: input.completed === true,
  };
}

function sanitizeJournalEntry(input: unknown): JournalEntry | null {
  if (!isRecord(input)) return null;

  const mood =
    typeof input.mood === "string" && (JOURNAL_MOODS as string[]).includes(input.mood)
      ? (input.mood as JournalMood)
      : "neutral";

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("jrn"),
    // Repair rather than discard: journal text is irreplaceable, so a bad
    // date falls back to today instead of dropping the entry.
    date: isIsoDate(input.date) ? input.date : getTodayKey(),
    title: clampString(input.title, 160, "Untitled entry"),
    body: clampString(input.body, 4000),
    mood,
  };
}

function sanitizeTrip(input: unknown): Trip | null {
  if (!isRecord(input)) return null;

  // Repair rather than discard: a malformed date (for example a cleared date
  // input that slipped into storage) must never delete the whole trip.
  const startRaw = isIsoDate(input.startDate) ? input.startDate : null;
  const endRaw = isIsoDate(input.endDate) ? input.endDate : null;
  const startDate = startRaw ?? endRaw ?? getTodayKey();
  const endDate = endRaw && endRaw >= startDate ? endRaw : startDate;

  const activities = Array.isArray(input.activities)
    ? input.activities
        .map(sanitizeActivity)
        .filter((activity): activity is TripActivity => activity !== null)
    : [];

  const journal = Array.isArray(input.journal)
    ? input.journal
        .map(sanitizeJournalEntry)
        .filter((entry): entry is JournalEntry => entry !== null)
    : [];

  return {
    id: typeof input.id === "string" && input.id ? input.id : createId("trip"),
    name: clampString(input.name, 140, "Untitled trip"),
    destination: clampString(input.destination, 140),
    startDate,
    endDate,
    notes: clampString(input.notes, 1000),
    budget: sanitizeNumber(input.budget),
    activities,
    journal,
  };
}

export function parseTrips(raw: string | null): Trip[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeTrip)
      .filter((trip): trip is Trip => trip !== null);
  } catch {
    return [];
  }
}

export function loadTrips(storage?: Pick<Storage, "getItem">): Trip[] {
  if (storage) return parseTrips(storage.getItem(TRAVEL_PLANNER_STORAGE_KEY));
  if (typeof window === "undefined") return [];
  return parseTrips(window.localStorage.getItem(TRAVEL_PLANNER_STORAGE_KEY));
}

export function saveTrips(trips: Trip[], storage?: Pick<Storage, "setItem">) {
  const payload = JSON.stringify(trips);
  if (storage) {
    storage.setItem(TRAVEL_PLANNER_STORAGE_KEY, payload);
    return;
  }
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRAVEL_PLANNER_STORAGE_KEY, payload);
}

interface CreateTripInput {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export function createTrip(input: CreateTripInput): Trip {
  const startDate = isIsoDate(input.startDate) ? input.startDate : getTodayKey();
  const rawEnd = isIsoDate(input.endDate) ? input.endDate : startDate;
  const endDate = rawEnd >= startDate ? rawEnd : startDate;

  return {
    id: createId("trip"),
    name: clampString(input.name, 140, "Untitled trip"),
    destination: clampString(input.destination, 140),
    startDate,
    endDate,
    notes: "",
    budget: 0,
    activities: [],
    journal: [],
  };
}

export function createActivity(input: Omit<TripActivity, "id" | "completed">): TripActivity {
  const time = isHourMinute(input.time) ? input.time : "";
  const endTimeRaw = isHourMinute(input.endTime) ? input.endTime : "";
  const endTime = time && endTimeRaw && endTimeRaw > time ? endTimeRaw : "";

  return {
    id: createId("act"),
    date: isIsoDate(input.date) ? input.date : getTodayKey(),
    time,
    endTime,
    title: clampString(input.title, 140, "Untitled stop"),
    location: clampString(input.location, 140),
    category: input.category,
    notes: clampString(input.notes, 500),
    completed: false,
  };
}

export function createJournalEntry(input: Omit<JournalEntry, "id">): JournalEntry {
  return {
    id: createId("jrn"),
    date: isIsoDate(input.date) ? input.date : getTodayKey(),
    title: clampString(input.title, 160, "Untitled entry"),
    body: clampString(input.body, 4000),
    mood: input.mood,
  };
}

function sortActivities(activities: TripActivity[]): TripActivity[] {
  return [...activities].sort((left, right) => {
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    if (left.time && right.time) return left.time.localeCompare(right.time);
    if (left.time) return -1;
    if (right.time) return 1;
    return left.title.localeCompare(right.title);
  });
}

export function calculateTripSummary(trip: Trip, today = getTodayKey()): TripSummary {
  const status = getTripStatus(trip, today);
  const daysTotal = diffDaysInclusive(trip.startDate, trip.endDate);
  const daysUntilStart = Math.max(0, diffDaysSigned(today, trip.startDate));

  let daysElapsed = 0;
  if (today >= trip.startDate) {
    daysElapsed = Math.min(daysTotal, diffDaysSigned(trip.startDate, today) + 1);
  }

  const sortedActivities = sortActivities(trip.activities);
  const dayKeys = getDayKeysBetween(trip.startDate, trip.endDate);

  const dayLookup = new Map<string, TripActivity[]>();
  for (const key of dayKeys) dayLookup.set(key, []);
  for (const activity of sortedActivities) {
    const list = dayLookup.get(activity.date);
    if (list) {
      list.push(activity);
    } else {
      dayLookup.set(activity.date, [activity]);
    }
  }

  const overlaps = findActivityOverlaps(sortedActivities);
  const conflictIds = overlaps.ids;

  const dayBuckets: TripDayBucket[] = Array.from(dayLookup.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, activities]) => ({
      date,
      activities,
      completed: activities.filter((activity) => activity.completed).length,
      conflictIds: activities
        .filter((activity) => conflictIds.has(activity.id))
        .map((activity) => activity.id),
    }));

  const upcomingActivities = sortedActivities
    .filter((activity) => !activity.completed && activity.date >= today)
    .slice(0, 4);

  const activitiesCompleted = sortedActivities.filter((activity) => activity.completed).length;

  return {
    status,
    daysTotal,
    daysElapsed,
    daysUntilStart,
    activitiesTotal: sortedActivities.length,
    activitiesCompleted,
    conflictCount: overlaps.pairCount,
    journalCount: trip.journal.length,
    dayBuckets,
    upcomingActivities,
    itineraryTruncated: daysTotal > MAX_ITINERARY_DAYS,
  };
}

export function getDefaultActivityDate(trip: Pick<Trip, "startDate" | "endDate">, today = getTodayKey()): string {
  if (today < trip.startDate) return trip.startDate;
  if (today > trip.endDate) return trip.endDate;
  return today;
}
