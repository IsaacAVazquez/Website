// ---------------------------------------------------------------------------
// MBA application insights — a pure, framework-free engine over the tracked
// application pipeline.
//
// The tracker already collects statuses, priorities, follow-up dates, and
// deadlines, but until now it only surfaced three raw counts. This module
// turns that same browser-local data into two useful readings: a pipeline
// summary (funnel counts plus stage-conversion rates) and a prioritized
// "needs attention" list (overdue follow-ups, follow-ups due today, and
// approaching or missed application deadlines).
//
// Everything here is a pure function of the applications array plus a
// `todayKey` (a YYYY-MM-DD string), so it is easy to unit test and it never
// touches storage, the network, or `Date.now()` behind the caller's back.
// ---------------------------------------------------------------------------

import type {
  MBAApplicationPriority,
  MBAInterviewRound,
  MBATrackedApplication,
} from "@/types/mba-jobs";
import { getApplicationReachedStages } from "@/lib/mba-application-history";

const DAY_MS = 86_400_000;

// How far ahead a follow-up or deadline counts as "upcoming" rather than a
// distant future date the user does not need to act on yet.
const MBA_ATTENTION_WINDOW_DAYS = 7;

// ── Date-key helpers ───────────────────────────────────────────────────────

function parseDateKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const ms = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whole calendar days from `fromKey` to `toKey` (positive when `toKey` is in
 * the future). Both keys are read at UTC midnight so the difference is a clean
 * day count with no DST drift. Returns null when either key is malformed.
 */
export function diffInDays(fromKey: string, toKey: string): number | null {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (from === null || to === null) return null;
  return Math.round((to - from) / DAY_MS);
}

// tz-local: follow-up, deadline, and interview dates the visitor picked in
// <input type="date"> on their own tracked applications (client-only,
// localStorage-backed; never renders with real data during SSR since
// `applications` starts empty).
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** A YYYY-MM-DD key as "Nov 5", or the raw value when it is not a date. */
export function formatDateKey(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_KEY_FORMATTER.format(date);
}

export interface MBAUpcomingInterview {
  application: MBATrackedApplication;
  round: MBAInterviewRound;
  roundIndex: number;
  daysFromToday: number;
}

/** Scheduled rounds today through six days ahead, ordered by calendar date. */
export function getUpcomingInterviews(
  applications: MBATrackedApplication[],
  todayKey: string
): MBAUpcomingInterview[] {
  return applications.flatMap((application) => {
    if (["archived", "rejected", "offer"].includes(application.status)) return [];
    return (application.interviewRounds ?? []).flatMap((round, roundIndex) => {
      const days = round.date ? diffInDays(todayKey, round.date) : null;
      return round.outcome === "scheduled" && days !== null && days >= 0 && days < 7
        ? [{ application, round, roundIndex, daysFromToday: days }]
        : [];
    });
  }).sort((left, right) =>
    left.daysFromToday - right.daysFromToday ||
    left.application.jobSnapshot.companyName.localeCompare(right.application.jobSnapshot.companyName)
  );
}

// ── Ordering helpers ───────────────────────────────────────────────────────

const PRIORITY_RANK: Record<MBAApplicationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Order applications within a status column: highest priority first, then the
 * most recently touched. Returns a new array; the input is not mutated.
 */
export function sortApplicationsForColumn(
  applications: MBATrackedApplication[]
): MBATrackedApplication[] {
  return [...applications].sort((left, right) => {
    const priorityDiff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

// ── Pipeline summary ───────────────────────────────────────────────────────

interface MBAApplicationFunnel {
  saved: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}

export interface MBAApplicationInsights {
  archived: number;
  // Non-archived applications only; archived ones are counted separately.
  funnel: MBAApplicationFunnel;
  // Known progress across all applications, including those now archived.
  submitted: number;
  // Heard back either way (interviewing + offer + rejected).
  responded: number;
  // Reached at least the interview stage (interviewing + offer).
  interviews: number;
  offers: number;
}

const EMPTY_FUNNEL: MBAApplicationFunnel = {
  saved: 0,
  applied: 0,
  interviewing: 0,
  offer: 0,
  rejected: 0,
};

function isActive(application: MBATrackedApplication): boolean {
  return application.status !== "archived";
}

/**
 * Summarize the tracked pipeline into funnel counts and the counts that reached
 * each stage. The funnel excludes archived records; the stage counts include
 * prior stages supported by history or other evidence.
 */
export function summarizeApplicationPipeline(
  applications: MBATrackedApplication[]
): MBAApplicationInsights {
  const funnel: MBAApplicationFunnel = { ...EMPTY_FUNNEL };
  let archived = 0;

  for (const application of applications) {
    if (!isActive(application)) {
      archived += 1;
    } else if (application.status in funnel) {
      funnel[application.status as keyof MBAApplicationFunnel] += 1;
    }
  }

  const reached = applications.map(getApplicationReachedStages);
  const submitted = reached.filter((item) => item.submitted).length;
  const responded = reached.filter((item) => item.responded).length;
  const interviews = reached.filter((item) => item.interview).length;
  const offers = reached.filter((item) => item.offer).length;

  return { archived, funnel, submitted, responded, interviews, offers };
}

// ── Needs-attention list ───────────────────────────────────────────────────

export type MBAAttentionKind =
  | "follow-up-overdue"
  | "follow-up-today"
  | "deadline-passed"
  | "deadline-soon";

export interface MBAAttentionItem {
  application: MBATrackedApplication;
  kind: MBAAttentionKind;
  // The follow-up date or deadline that triggered this item.
  dateKey: string;
  // Whole days from today: negative = past, 0 = today, positive = upcoming.
  daysFromToday: number;
}

// Lower rank = more urgent. A single application surfaces once, under its most
// urgent signal.
const ATTENTION_RANK: Record<MBAAttentionKind, number> = {
  "follow-up-overdue": 0,
  "deadline-passed": 1,
  "follow-up-today": 2,
  "deadline-soon": 3,
};

function getAttentionForApplication(
  application: MBATrackedApplication,
  todayKey: string
): MBAAttentionItem | null {
  if (!isActive(application)) return null;

  const candidates: MBAAttentionItem[] = [];

  if (application.followUpDate) {
    const diff = diffInDays(todayKey, application.followUpDate);
    if (diff !== null && diff <= 0) {
      candidates.push({
        application,
        kind: diff < 0 ? "follow-up-overdue" : "follow-up-today",
        dateKey: application.followUpDate,
        daysFromToday: diff,
      });
    }
  }

  // A deadline is only actionable while the role is still un-submitted.
  if (application.status === "saved" && application.deadline) {
    const diff = diffInDays(todayKey, application.deadline);
    if (diff !== null && diff <= MBA_ATTENTION_WINDOW_DAYS) {
      candidates.push({
        application,
        kind: diff < 0 ? "deadline-passed" : "deadline-soon",
        dateKey: application.deadline,
        daysFromToday: diff,
      });
    }
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((best, candidate) =>
    ATTENTION_RANK[candidate.kind] < ATTENTION_RANK[best.kind] ? candidate : best
  );
}

/**
 * Build the prioritized list of applications that need action now: overdue
 * follow-ups, follow-ups due today, and deadlines that are approaching (within
 * {@link MBA_ATTENTION_WINDOW_DAYS}) or already passed on un-submitted roles.
 *
 * Ordered most urgent first — by signal kind, then by how overdue/imminent the
 * date is, then by the application's priority.
 */
export function getApplicationAttentionItems(
  applications: MBATrackedApplication[],
  todayKey: string
): MBAAttentionItem[] {
  const items = applications
    .map((application) => getAttentionForApplication(application, todayKey))
    .filter((item): item is MBAAttentionItem => item !== null);

  return items.sort((left, right) => {
    const kindDiff = ATTENTION_RANK[left.kind] - ATTENTION_RANK[right.kind];
    if (kindDiff !== 0) return kindDiff;
    if (left.daysFromToday !== right.daysFromToday) {
      return left.daysFromToday - right.daysFromToday;
    }
    const priorityDiff =
      PRIORITY_RANK[left.application.priority] - PRIORITY_RANK[right.application.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return left.application.jobSnapshot.companyName.localeCompare(
      right.application.jobSnapshot.companyName
    );
  });
}

/** Human-readable summary of an attention item, e.g. "Follow-up overdue by 3 days". */
export function describeAttentionItem(item: MBAAttentionItem): string {
  const days = Math.abs(item.daysFromToday);
  const dayLabel = days === 1 ? "1 day" : `${days} days`;
  switch (item.kind) {
    case "follow-up-overdue":
      return `Follow-up overdue by ${dayLabel}`;
    case "follow-up-today":
      return "Follow-up due today";
    case "deadline-passed":
      return `Deadline passed ${dayLabel} ago`;
    case "deadline-soon":
      return item.daysFromToday === 0 ? "Deadline today" : `Deadline in ${dayLabel}`;
  }
}

/** Whether an attention item is a follow-up signal (vs. a deadline signal). */
export function isFollowUpAttention(kind: MBAAttentionKind): boolean {
  return kind === "follow-up-overdue" || kind === "follow-up-today";
}
