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
  MBAApplicationStatus,
  MBATrackedApplication,
} from "@/types/mba-jobs";

const DAY_MS = 86_400_000;

// How far ahead a follow-up or deadline counts as "upcoming" rather than a
// distant future date the user does not need to act on yet.
export const MBA_ATTENTION_WINDOW_DAYS = 7;

// ── Date-key helpers ───────────────────────────────────────────────────────

/**
 * Local-calendar day key (YYYY-MM-DD) for a date. Matches the format the
 * tracker stores follow-up dates and deadlines in and that `<input type="date">`
 * produces, so comparisons stay in the user's own calendar day.
 */
export function toApplicationDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

export interface MBAApplicationFunnel {
  saved: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}

export interface MBAApplicationBucketCounts {
  // For deadlines, `overdue` means the deadline has already passed.
  overdue: number;
  dueToday: number;
  upcoming: number;
}

export interface MBAApplicationInsights {
  // Non-archived applications only; archived ones are counted separately.
  total: number;
  archived: number;
  funnel: MBAApplicationFunnel;
  // Reached "applied" or beyond (applied + interviewing + offer + rejected).
  submitted: number;
  // Heard back either way (interviewing + offer + rejected).
  responded: number;
  // Reached at least the interview stage (interviewing + offer).
  interviews: number;
  offers: number;
  // Shares of `submitted`; null when nothing has been submitted yet so the UI
  // can show a dash instead of a misleading 0%.
  responseRate: number | null;
  interviewRate: number | null;
  offerRate: number | null;
  followUps: MBAApplicationBucketCounts;
  deadlines: MBAApplicationBucketCounts;
  // Applications with at least one actionable follow-up/deadline signal.
  attentionCount: number;
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

function rate(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

/**
 * Summarize the tracked pipeline into funnel counts, stage-conversion rates,
 * and follow-up/deadline bucket counts. Archived applications are excluded
 * from the funnel and rates (they have been set aside) but reported as a
 * separate `archived` total.
 */
export function summarizeApplicationPipeline(
  applications: MBATrackedApplication[],
  todayKey: string
): MBAApplicationInsights {
  const funnel: MBAApplicationFunnel = { ...EMPTY_FUNNEL };
  const followUps: MBAApplicationBucketCounts = { overdue: 0, dueToday: 0, upcoming: 0 };
  const deadlines: MBAApplicationBucketCounts = { overdue: 0, dueToday: 0, upcoming: 0 };
  let archived = 0;
  let active = 0;

  for (const application of applications) {
    if (!isActive(application)) {
      archived += 1;
      continue;
    }
    active += 1;
    if (application.status in funnel) {
      funnel[application.status as keyof MBAApplicationFunnel] += 1;
    }

    if (application.followUpDate) {
      const diff = diffInDays(todayKey, application.followUpDate);
      if (diff !== null) {
        if (diff < 0) followUps.overdue += 1;
        else if (diff === 0) followUps.dueToday += 1;
        else if (diff <= MBA_ATTENTION_WINDOW_DAYS) followUps.upcoming += 1;
      }
    }

    // Deadlines only matter while a role is still un-submitted ("saved").
    if (application.status === "saved" && application.deadline) {
      const diff = diffInDays(todayKey, application.deadline);
      if (diff !== null) {
        if (diff < 0) deadlines.overdue += 1;
        else if (diff === 0) deadlines.dueToday += 1;
        else if (diff <= MBA_ATTENTION_WINDOW_DAYS) deadlines.upcoming += 1;
      }
    }
  }

  const submitted = funnel.applied + funnel.interviewing + funnel.offer + funnel.rejected;
  const responded = funnel.interviewing + funnel.offer + funnel.rejected;
  const interviews = funnel.interviewing + funnel.offer;
  const offers = funnel.offer;

  return {
    total: active,
    archived,
    funnel,
    submitted,
    responded,
    interviews,
    offers,
    responseRate: rate(responded, submitted),
    interviewRate: rate(interviews, submitted),
    offerRate: rate(offers, submitted),
    followUps,
    deadlines,
    attentionCount: getApplicationAttentionItems(applications, todayKey).length,
  };
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

export const MBA_ATTENTION_KIND_LABELS: Record<MBAAttentionKind, string> = {
  "follow-up-overdue": "Follow-up overdue",
  "follow-up-today": "Follow-up today",
  "deadline-passed": "Deadline passed",
  "deadline-soon": "Deadline soon",
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

// Re-exported for callers that want to keep status keys in one place.
export type { MBAApplicationStatus };
