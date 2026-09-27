import { formatDayHeading, formatTripDateRange, getTodayKey } from "@/lib/travelPlanner";
import type { ActivityCategory, Trip, TripDayBucket, TripSummary } from "@/types/travel";

/** One timed stop placed on a day's timeline. `top`/`height` are fractions of that day's shared time window. */
export interface ItineraryStop {
  id: string;
  title: string;
  category: ActivityCategory;
  top: number;
  height: number;
  conflict: boolean;
  done: boolean;
}

/** A stop with no time, listed under its day rather than placed on the timeline. */
export interface ItineraryUntimedStop {
  id: string;
  title: string;
  category: ActivityCategory;
  conflict: boolean;
  done: boolean;
}

export interface ItineraryColumn {
  dateKey: string;
  label: string;
  stops: ItineraryStop[];
  untimed: ItineraryUntimedStop[];
}

const DAY_MINUTES = 24 * 60;
/**
 * The shared day window defaults to a normal waking day (6am to midnight) and
 * only widens for a stop that genuinely falls outside it. That's what keeps a
 * single early or late outlier from stretching the window and squashing
 * every other stop into a sliver.
 */
const DEFAULT_WINDOW_START = 6 * 60;
const DEFAULT_WINDOW_END = DAY_MINUTES;
const WINDOW_PAD = 30;
const MIN_HEIGHT = 0.02;

function minutesOf(time: string): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

/** A stop with no end time occupies one minute, matching findActivityOverlaps. */
function stopEnd(start: number, endTime: string): number {
  const end = minutesOf(endTime);
  return end !== null && end > start ? end : start + 1;
}

/** The shared vertical window, in minutes after midnight, for every column. */
function timelineWindow(buckets: readonly TripDayBucket[]): { start: number; end: number } {
  const timedWindows = buckets
    .flatMap((bucket) => bucket.activities)
    .map((activity) => {
      const start = minutesOf(activity.time);
      return start === null ? null : { start, end: stopEnd(start, activity.endTime) };
    })
    .filter((window): window is { start: number; end: number } => window !== null);

  const start = timedWindows.length
    ? Math.max(0, Math.min(DEFAULT_WINDOW_START, ...timedWindows.map((w) => w.start - WINDOW_PAD)))
    : DEFAULT_WINDOW_START;
  const end = timedWindows.length
    ? Math.min(DAY_MINUTES, Math.max(DEFAULT_WINDOW_END, ...timedWindows.map((w) => w.end + WINDOW_PAD)))
    : DEFAULT_WINDOW_END;
  return { start, end };
}

export interface TimelineTick {
  label: string;
  /** Fraction of the day window, 0 at the top. */
  top: number;
}

const TICKS = [
  { minutes: 6 * 60, label: "6 AM" },
  { minutes: 12 * 60, label: "Noon" },
  { minutes: 18 * 60, label: "6 PM" },
];

/** Hour marks for the timeline's axis, placed on the same window as the stops. */
export function timelineTicks(buckets: readonly TripDayBucket[]): TimelineTick[] {
  const { start, end } = timelineWindow(buckets);
  const span = Math.max(1, end - start);
  return TICKS.filter((tick) => tick.minutes >= start && tick.minutes < end).map((tick) => ({
    label: tick.label,
    top: (tick.minutes - start) / span,
  }));
}

/**
 * One column per day bucket, each stop placed by time and flagged from the
 * trip's conflict ids. The vertical window is shared across every column so
 * the bands stay comparable day to day.
 */
export function itineraryColumns(
  buckets: readonly TripDayBucket[],
  conflictIds: Iterable<string>
): ItineraryColumn[] {
  const conflicts = new Set(conflictIds);
  const { start: windowStart, end: windowEnd } = timelineWindow(buckets);
  const span = Math.max(1, windowEnd - windowStart);

  return buckets.map((bucket) => {
    const stops: ItineraryStop[] = [];
    const untimed: ItineraryUntimedStop[] = [];
    for (const activity of bucket.activities) {
      const base = {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        conflict: conflicts.has(activity.id),
        done: activity.completed,
      };
      const start = minutesOf(activity.time);
      if (start === null) {
        untimed.push(base);
        continue;
      }
      const end = stopEnd(start, activity.endTime);
      const top = Math.min(1, Math.max(0, (start - windowStart) / span));
      const rawHeight = (end - start) / span;
      const height = Math.min(1 - top, Math.max(MIN_HEIGHT, rawHeight));
      stops.push({ ...base, top, height });
    }
    return { dateKey: bucket.date, label: formatDayHeading(bucket.date), stops, untimed };
  });
}

export interface BoardingPass {
  destination: string;
  dateRange: string;
  countdown: string;
  stopsDone: number;
  stopsTotal: number;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00`).getTime();
  const to = new Date(`${toKey}T00:00`).getTime();
  return Math.round((to - from) / 86400000);
}

function pluralDays(count: number): string {
  return `${count} day${count === 1 ? "" : "s"}`;
}

/** The trip header's numbers: where, when, how far along, and stops checked off. */
export function boardingPass(trip: Trip, summary: TripSummary, today = getTodayKey()): BoardingPass {
  let countdown: string;
  if (summary.status === "planned") {
    countdown = `${pluralDays(summary.daysUntilStart)} to go`;
  } else if (summary.status === "active") {
    countdown = `Day ${summary.daysElapsed} of ${summary.daysTotal}`;
  } else {
    const daysAgo = daysBetween(trip.endDate, today);
    countdown = daysAgo > 0 ? `Back ${pluralDays(daysAgo)} ago` : "Just wrapped";
  }

  return {
    destination: trip.destination || trip.name,
    dateRange: formatTripDateRange(trip.startDate, trip.endDate),
    countdown,
    stopsDone: summary.activitiesCompleted,
    stopsTotal: summary.activitiesTotal,
  };
}
