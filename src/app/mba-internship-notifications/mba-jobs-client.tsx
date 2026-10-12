"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  MapPin,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { pipelineStages } from "./pipelineStages";
import {
  MBA_APPLICATION_PRIORITIES,
  MBA_APPLICATION_PRIORITY_LABELS,
  MBA_APPLICATION_STATUSES,
  MBA_APPLICATION_STATUS_LABELS,
  buildMBAApplicationSearchText,
  sanitizeFit,
} from "@/lib/mba-applications";
import {
  describeAttentionItem,
  getApplicationAttentionItems,
  isFollowUpAttention,
  sortApplicationsForColumn,
  summarizeApplicationPipeline,
  type MBAApplicationInsights,
  type MBAAttentionItem,
  type MBAAttentionKind,
} from "@/lib/mba-application-insights";
import { useMBAApplications, useMBAJobCandidates } from "@/hooks/useMBAApplications";
import { useMBAJobs } from "@/hooks/useMBAJobs";
import { useClientNow } from "@/hooks/useClientNow";
import { UPDATED_AT_FORMATTER, formatStableDateTime, toLocalDateKey as getTodayDateKey } from "@/lib/date-formatters";
import { downloadFile as downloadTextFile } from "@/lib/downloadFile";
import { MBA_COMPANIES, MBA_COMPANY_MAP } from "@/constants/mba-companies";
import {
  MBA_ROLE_FAMILY_LABELS,
  MBA_ROLE_FAMILY_SEARCH_TERMS,
} from "@/constants/mba-role-taxonomy";
import type {
  MBACategory,
  MBACategoryFilter,
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBACompany,
  MBAJob,
  MBAJobRoleFamily,
  MBAJobRoleType,
  MBAJobsApiResponse,
  MBAJobsSearchState,
  MBAJobsSourceStatus,
  MBATrackedApplication,
  MBARoleFamilyFilter,
  MBARoleTypeFilter,
  MBASortOrder,
} from "@/types/mba-jobs";
import {
  buildMBAJobsHref,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_MBA_JOBS_STATE,
  EXTERNAL_LABELS,
  JOB_PAGE_SIZE,
  normalizeMBAJobsState,
  ROLE_FAMILY_LABELS,
  ROLE_FAMILY_OPTIONS,
  ROLE_TYPE_LABELS,
  ROLE_TYPE_OPTIONS,
  SORT_LABELS,
  SORT_OPTIONS,
  VIEW_LABELS,
  VIEW_OPTIONS,
} from "./mba-jobs-state";
import CandidatesView from "./candidates-view";
import UpcomingInterviews from "./UpcomingInterviews";
import ApplicationHistory from "./ApplicationHistory";
import dynamic from "next/dynamic";
import {
  type ApplicationFormState,
} from "./application-form";
import "./mba-jobs.css";

// Interaction-gated dialogs are code-split so their chunks load only when a
// user opens them, keeping them out of this large client page's initial bundle.
// `loading` is what gives each dialog its own Suspense boundary. Without it the
// first open suspends up to the route's loading.tsx and blanks the page.
const ApplicationEditDialog = dynamic(() => import("./ApplicationEditDialog"), {
  loading: () => null,
});

// A pipeline card is tall (facts, rounds, history, and a row of controls), and
// a status column is one card wide on a big screen, so a column pages too.
const PIPELINE_COLUMN_PAGE_SIZE = 6;


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

// `now` is the caller's `useClientNow()` reading (null on the server and
// during hydration), not `Date.now()` directly: `postedAt` is a real
// timestamp present on the very first server-rendered paint (it comes from
// the page's SSR `initialData`), so computing "ago" from `Date.now()` at
// render time prints different text server-side than it does once the
// client hydrates a moment later, and React flags the mismatch.
function timeAgo(iso: string, now: number | null): string {
  if (now === null) return "";
  const timestamp = getPostedAtTime(iso);
  if (!timestamp) return "";
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  if (absDiff < 60_000) return "just now";
  if (absDiff < 3_600_000)
    return RELATIVE_FORMATTER.format(Math.round(diff / 60_000), "minute");
  if (absDiff < 86_400_000)
    return RELATIVE_FORMATTER.format(Math.round(diff / 3_600_000), "hour");
  return RELATIVE_FORMATTER.format(Math.round(diff / 86_400_000), "day");
}

// tz-local: follow-up/deadline dates the visitor picked in <input type="date">
// on their own tracked applications (client-only, localStorage-backed; never
// renders with real data during SSR since `applications` starts empty).
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatFetchedAt(d: Date | null): string {
  if (!d) return "—";
  return formatStableDateTime(UPDATED_AT_FORMATTER, d);
}

function getPostedAtTime(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

// Category, role, status, and priority accents are swatch colours only, and
// chip text always prints in ink, never in the accent, per the print shop
// rule that party/status colour as small text fails 4.5:1.
const CATEGORY_COLOR: Record<MBACategory | "all", string> = {
  all: "var(--c97-ink-2)",
  "big-tech": "var(--c97-chart-2)",
  fintech: "var(--c97-positive)",
  startup: "var(--c97-accent)",
};

const TRACKED_COMPANY_CATEGORIES: MBACategory[] = ["fintech", "startup", "big-tech"];

const ROLE_TYPE_ACCENTS: Record<MBAJobRoleType, string> = {
  internship: "var(--c97-accent)",
  "full-time": "var(--c97-chart-2)",
  unclear: "var(--c97-ink-2)",
};

const APPLICATION_STATUS_ACCENTS: Record<MBAApplicationStatus, string> = {
  saved: "var(--c97-ink-2)",
  applied: "var(--c97-accent)",
  interviewing: "var(--c97-warning)",
  offer: "var(--c97-positive)",
  rejected: "var(--c97-negative)",
  archived: "var(--c97-ink-2)",
};

const APPLICATION_PRIORITY_ACCENTS: Record<MBAApplicationPriority, string> = {
  low: "var(--c97-ink-2)",
  medium: "var(--c97-warning)",
  high: "var(--c97-accent)",
};

const ACTIVE_APPLICATION_STATUSES: MBAApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

const ATTENTION_KIND_ACCENTS: Record<MBAAttentionKind, string> = {
  "follow-up-overdue": "var(--c97-negative)",
  "deadline-passed": "var(--c97-negative)",
  "follow-up-today": "var(--c97-accent)",
  "deadline-soon": "var(--c97-warning)",
};

function formatRate(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

/** Whole counts with thousands separators, since the feed runs past 1,000 roles. */
function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Fit score descending with unscored applications last; ties keep the column's own order. */
function sortApplicationsByFit(applications: MBATrackedApplication[]): MBATrackedApplication[] {
  return [...applications].sort(
    (left, right) => (right.fit?.score ?? -1) - (left.fit?.score ?? -1)
  );
}

function FitTag({ score, scoredAt }: { score: number; scoredAt: string }) {
  return <ColorTag accent="var(--c97-accent)" label={`Fit ${score}`} title={`Scored ${scoredAt}`} />;
}

/** A small colour swatch plus a label printed in ink, never in the accent itself. */
function ColorTag({
  accent,
  label,
  title,
}: {
  accent: string;
  label: string;
  title?: string;
}) {
  return (
    <span className="c97-chip" style={{ color: "var(--c97-ink)" }} title={title}>
      <span
        aria-hidden="true"
        style={{ width: "8px", height: "8px", flexShrink: 0, background: accent }}
      />
      {label}
    </span>
  );
}

function getRoleFamilyAccent(family: MBAJobRoleFamily): string {
  if (family === "product" || family === "product-marketing") {
    return "var(--c97-accent)";
  }
  if (family === "finance" || family === "analytics") {
    return "var(--c97-positive)";
  }
  return "var(--c97-ink-2)";
}

// The inactive look and the hover live on `.mba-toggle` in mba-jobs.css; only the
// company's own colour has to come in inline.
function getTrackedCompanyButtonStyle(company: MBACompany, active: boolean): CSSProperties {
  return active ? { borderColor: company.color, color: "var(--c97-ink)" } : {};
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSearchTokens(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return normalized ? Array.from(new Set(normalized.split(" "))) : [];
}

function buildJobSearchHaystack(job: MBAJob): string {
  const familyTerms = job.roleFamilies.flatMap((family) => [
    MBA_ROLE_FAMILY_LABELS[family],
    ...MBA_ROLE_FAMILY_SEARCH_TERMS[family],
  ]);

  return normalizeSearchText(
    [
      job.title,
      job.companyName,
      job.department,
      job.location,
      job.snippet,
      job.sourceName,
      ROLE_TYPE_LABELS[job.roleType],
      ...familyTerms,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getQueryScore(job: MBAJob, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const haystack = buildJobSearchHaystack(job);
  const tokens = splitSearchTokens(normalizedQuery);
  let score = haystack.includes(normalizedQuery) ? 10 : 0;
  let matchedTokens = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      matchedTokens += 1;
      score += token.length <= 2 ? 2 : 3;
    }
  }

  if (tokens.length > 1 && matchedTokens === tokens.length) {
    score += 4;
  }

  return score;
}

interface LocationOption {
  label: string;
  normalizedValue: string;
  count: number;
}

const LOCATION_PRESETS = [
  { label: "Remote", terms: ["remote"] },
  { label: "San Francisco", terms: ["san francisco", "bay area"] },
  { label: "New York", terms: ["new york", "nyc"] },
  { label: "Seattle", terms: ["seattle"] },
  { label: "London", terms: ["london"] },
  { label: "Austin", terms: ["austin"] },
  { label: "Boston", terms: ["boston"] },
] as const;

function getLocationLabels(location: string): string[] {
  const normalizedLocation = normalizeSearchText(location);
  if (!normalizedLocation) return [];

  const labels = new Set<string>();

  for (const preset of LOCATION_PRESETS) {
    if (preset.terms.some((term) => normalizedLocation.includes(term))) {
      labels.add(preset.label);
    }
  }

  if (labels.size > 0) {
    return Array.from(labels);
  }

  const fallbackSegment = location.split(/[;|/]/)[0]?.trim();
  const fallbackLabel = fallbackSegment?.split(",")[0]?.trim();
  return fallbackLabel ? [fallbackLabel] : [];
}

function buildLocationOptions(jobs: MBAJob[]): LocationOption[] {
  const counts = new Map<string, LocationOption>();

  for (const job of jobs) {
    const labels = new Set(getLocationLabels(job.location));
    for (const label of labels) {
      const normalizedValue = normalizeSearchText(label);
      const current = counts.get(normalizedValue);
      if (current) {
        current.count += 1;
      } else {
        counts.set(normalizedValue, { label, normalizedValue, count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 6);
}

function buildManualLinkedInQuery(
  companyName: string,
  state: MBAJobsSearchState
): string {
  const parts: string[] = [];

  if (state.q.trim()) {
    parts.push(state.q.trim());
  } else {
    if (state.roleFamily !== "all") {
      parts.push(MBA_ROLE_FAMILY_LABELS[state.roleFamily]);
    } else {
      parts.push("MBA business roles");
    }

    if (state.roleType === "internship") {
      parts.push("internship");
    } else if (state.roleType === "full-time") {
      parts.push("full time");
    }
  }

  parts.push(companyName);
  if (state.location.trim()) {
    parts.push(state.location.trim());
  }
  return parts.join(" ");
}

function buildRoleSearchQuery(state: MBAJobsSearchState, suffix?: string): string {
  const parts: string[] = [];

  if (state.q.trim()) {
    parts.push(state.q.trim());
  } else {
    if (state.roleFamily !== "all") {
      parts.push(MBA_ROLE_FAMILY_LABELS[state.roleFamily]);
    } else {
      parts.push("MBA business roles");
    }

    if (state.roleType === "internship") {
      parts.push("internship");
    } else if (state.roleType === "full-time") {
      parts.push("full time");
    }
  }

  if (state.category !== "all") {
    parts.push(CATEGORY_LABELS[state.category]);
  }
  if (state.location.trim()) {
    parts.push(state.location.trim());
  }
  if (suffix) {
    parts.push(suffix);
  }

  return parts.join(" ");
}

function buildExternalSearchLinks(state: MBAJobsSearchState) {
  const query = buildRoleSearchQuery(state);
  const careerPageQuery = buildRoleSearchQuery(
    state,
    "company careers OR jobs"
  );
  return [
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
      ariaLabel: "Search LinkedIn for the current role filters",
    },
    {
      label: "Google",
      href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      ariaLabel: "Search Google for the current role filters",
    },
    {
      label: "Handshake",
      href: `https://app.joinhandshake.com/stu/postings?text=${encodeURIComponent(query)}`,
      ariaLabel: "Search Handshake for the current role filters",
    },
    {
      label: "Wellfound",
      href: `https://wellfound.com/jobs?q=${encodeURIComponent(query)}`,
      ariaLabel: "Search Wellfound for the current role filters",
    },
    {
      label: "Career pages",
      href: `https://www.google.com/search?q=${encodeURIComponent(careerPageQuery)}`,
      ariaLabel: "Search company career pages for the current role filters",
    },
  ];
}

function hasActiveFilters(state: MBAJobsSearchState): boolean {
  return (
    state.q.trim().length > 0 ||
    state.location.trim().length > 0 ||
    state.external !== DEFAULT_MBA_JOBS_STATE.external ||
    state.category !== DEFAULT_MBA_JOBS_STATE.category ||
    state.roleType !== DEFAULT_MBA_JOBS_STATE.roleType ||
    state.roleFamily !== DEFAULT_MBA_JOBS_STATE.roleFamily ||
    state.sort !== DEFAULT_MBA_JOBS_STATE.sort
  );
}

function formatDateKey(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_KEY_FORMATTER.format(date);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompanyAvatar({ company }: { company: MBACompany | undefined }) {
  const color = company?.color ?? "var(--c97-accent)";
  const initials = company?.logoInitials ?? "??";
  return (
    <span
      className="mba-avatar"
      style={{ background: color, color: "var(--c97-surface)" }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function NewBadge() {
  return <span className="c97-chip">New</span>;
}

function CategoryChip({ category }: { category: MBACategory }) {
  return <ColorTag accent={CATEGORY_COLOR[category]} label={CATEGORY_LABELS[category]} />;
}

function RoleTypeChip({ roleType }: { roleType: MBAJobRoleType }) {
  return <ColorTag accent={ROLE_TYPE_ACCENTS[roleType]} label={ROLE_TYPE_LABELS[roleType]} />;
}

function RoleFamilyChip({ family }: { family: MBAJobRoleFamily }) {
  return <ColorTag accent={getRoleFamilyAccent(family)} label={MBA_ROLE_FAMILY_LABELS[family]} />;
}

function ApplicationStatusChip({ status }: { status: MBAApplicationStatus }) {
  return (
    <ColorTag
      accent={APPLICATION_STATUS_ACCENTS[status]}
      label={MBA_APPLICATION_STATUS_LABELS[status]}
    />
  );
}

function ExternalLeadChip({ sourceName }: { sourceName?: string }) {
  return (
    <ColorTag
      accent="var(--c97-accent)"
      label={sourceName ? `${sourceName} lead` : "External lead"}
    />
  );
}

function ApplicationPriorityChip({ priority }: { priority: MBAApplicationPriority }) {
  return (
    <ColorTag
      accent={APPLICATION_PRIORITY_ACCENTS[priority]}
      label={`${MBA_APPLICATION_PRIORITY_LABELS[priority]} priority`}
    />
  );
}

function CardActionLink({
  href,
  label,
  ariaLabel,
  variant = "secondary",
  trailingIcon = false,
  onClick,
}: {
  href: string;
  label: string;
  ariaLabel: string;
  variant?: "primary" | "secondary";
  trailingIcon?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={variant === "primary" ? "c97-btn" : "c97-btn-ghost"}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      {trailingIcon ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </a>
  );
}

/** One posting: company, title, where and when, its tags, and its own actions. */
function JobCard({
  job,
  isNew,
  application,
  onMarkSeen,
  onTrack,
  onMarkApplied,
  onEditApplication,
  currentState,
  now,
}: {
  job: MBAJob;
  isNew: boolean;
  application: MBATrackedApplication | undefined;
  onMarkSeen: () => void;
  onTrack: () => void;
  onMarkApplied: () => void;
  onEditApplication: () => void;
  currentState: MBAJobsSearchState;
  now: number | null;
}) {
  const company = MBA_COMPANY_MAP.get(job.companyId);
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    [currentState.q.trim(), job.title, job.companyName].filter(Boolean).join(" ")
  )}`;
  const relativePostedAt = timeAgo(job.postedAt, now);

  return (
    <article className="mba-job" onMouseEnter={onMarkSeen} onFocus={onMarkSeen}>
      <div className="mba-job-head">
        <CompanyAvatar company={company} />
        <div className="mba-job-id">
          <p className="mba-job-company">
            <strong>{job.companyName}</strong>
            {job.department ? ` · ${job.department}` : ""}
            {job.sourceName ? ` · via ${job.sourceName}` : ""}
          </p>
          <h3 className="mba-job-title">{job.title}</h3>
          <p className="mba-job-meta">
            {relativePostedAt ? (
              <>
                {job.location} ·{" "}
                <time
                  dateTime={job.postedAt}
                  title={`Posted ${formatStableDateTime(UPDATED_AT_FORMATTER, new Date(job.postedAt))}`}
                >
                  {relativePostedAt}
                </time>
              </>
            ) : (
              job.location
            )}
          </p>
        </div>
      </div>

      <div data-testid={`job-card-${job.id}-chips`} className="mba-tags flex-wrap">
        {isNew && <NewBadge />}
        {application && <ApplicationStatusChip status={application.status} />}
        {application?.fit && (
          <FitTag score={application.fit.score} scoredAt={application.fit.scoredAt} />
        )}
        {job.atsType === "external-api" && <ExternalLeadChip sourceName={job.sourceName} />}
        <RoleTypeChip roleType={job.roleType} />
        <CategoryChip category={job.category} />
        {job.roleFamilies.map((family) => (
          <RoleFamilyChip key={`${job.id}-${family}`} family={family} />
        ))}
      </div>

      {job.snippet && <p className="mba-snippet line-clamp-2">{job.snippet}</p>}

      {job.sourceName && (
        <p className="mba-job-meta">
          Found through {job.sourceName}
          {job.sourceUrl ? (
            <>
              {" "}
              ·{" "}
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="mba-link">
                Source
              </a>
            </>
          ) : null}
        </p>
      )}

      <div className="mba-actions">
        <button
          type="button"
          onClick={() => {
            onTrack();
            onMarkSeen();
          }}
          className="c97-btn-ghost"
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          {application ? "Tracked" : "Track"}
        </button>
        <button
          type="button"
          onClick={() => {
            onMarkApplied();
            onMarkSeen();
          }}
          className="c97-btn-ghost"
        >
          <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
          Mark applied
        </button>
        {application && (
          <button type="button" onClick={onEditApplication} className="c97-btn-ghost">
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
        )}
        <CardActionLink
          href={linkedinUrl}
          label="LinkedIn search"
          ariaLabel={`LinkedIn search for ${job.title} at ${job.companyName}`}
          onClick={onMarkSeen}
        />
        <CardActionLink
          href={job.applyUrl}
          label="Apply now"
          ariaLabel={`Apply now, ${job.title} at ${job.companyName}`}
          variant="primary"
          trailingIcon
          onClick={onMarkSeen}
        />
      </div>
    </article>
  );
}

function SearchElsewhere({ currentState }: { currentState: MBAJobsSearchState }) {
  const links = buildExternalSearchLinks(currentState);

  return (
    <section className="mba-source-block" aria-labelledby="mba-search-elsewhere-heading">
      <h3 id="mba-search-elsewhere-heading" className="mba-h3">
        Search elsewhere
      </h3>
      <p>
        These open the same search on outside boards, and they are outbound links only, so nothing
        from them is fetched by the server.
      </p>
      <div className="mba-wrap-row">
        {links.map((link) => (
          <CardActionLink
            key={link.label}
            href={link.href}
            label={link.label}
            ariaLabel={link.ariaLabel}
            trailingIcon
          />
        ))}
      </div>
    </section>
  );
}

function ManualChecks({
  companies,
  currentState,
}: {
  companies: MBACompany[];
  currentState: MBAJobsSearchState;
}) {
  return (
    <section className="mba-source-block" aria-labelledby="mba-role-tracker-manual-heading">
      <h3 id="mba-role-tracker-manual-heading" className="mba-h3">
        Manual checks
      </h3>
      <p>
        These companies have no stable public feed, so the LinkedIn search here carries the current
        role filters.
      </p>
      <ul className="mba-manual" data-testid="manual-checks-grid">
        {companies.map((company) => {
          const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
            buildManualLinkedInQuery(company.name, currentState)
          )}`;
          return (
            <li key={company.id}>
              <span className="mba-manual-name">
                <span className="mba-swatch" style={{ background: company.color }} aria-hidden="true" />
                {company.name}
              </span>
              <CardActionLink
                href={linkedinUrl}
                label="LinkedIn search"
                ariaLabel={`LinkedIn search for ${company.name}`}
              />
              <CardActionLink
                href={company.jobsUrl ?? company.careersUrl}
                label="Career page"
                ariaLabel={`Career page for ${company.name}`}
                variant="primary"
                trailingIcon
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function JobGridSkeleton() {
  return (
    <div className="mba-jobs" role="status" aria-live="polite" aria-label="Loading jobs">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="mba-job" aria-hidden="true">
          <div className="mba-job-head">
            <span className="c97-skeleton" style={{ height: 36, width: 36 }} />
            <div style={{ display: "grid", gap: "var(--c97-sp-1)", flex: 1 }}>
              <span className="c97-skeleton" style={{ height: 10, width: 120 }} />
              <span className="c97-skeleton" style={{ height: 16, width: "70%" }} />
              <span className="c97-skeleton" style={{ height: 10, width: "40%" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SortDropdown({
  value,
  onValueChange,
}: {
  value: MBASortOrder;
  onValueChange: (v: MBASortOrder) => void;
}) {
  // Native <select>: this is a single-choice sort picker, so the platform
  // control gives keyboard support, type-ahead, and the OS picker on mobile
  // for free. The wrapping <label> supplies the accessible name ("Sort").
  return (
    <label className="mba-sort">
      <span>Sort</span>
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value as MBASortOrder)}
        className="c97-field"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>
    </label>
  );
}

function NotificationBell({
  permission,
  onRequest,
}: {
  permission: NotificationPermission | "unsupported";
  onRequest: () => Promise<void>;
}) {
  if (permission === "unsupported") return null;
  if (permission === "granted") {
    return (
      <p className="mba-note">
        <Bell className="h-4 w-4" aria-hidden="true" />
        Notifications on
      </p>
    );
  }
  if (permission === "denied") {
    return (
      <p className="mba-note">
        <BellOff className="h-4 w-4" aria-hidden="true" />
        Notifications blocked in browser
      </p>
    );
  }
  return (
    <button type="button" onClick={onRequest} className="c97-btn-ghost">
      <Bell className="h-4 w-4" aria-hidden="true" />
      Enable notifications
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tracked feeds
// ---------------------------------------------------------------------------

function CompanyFilterStrip({
  watchedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  watchedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  const nonManual = MBA_COMPANIES.filter((c) => c.atsType !== "manual");
  const watchedLiveCount = nonManual.filter((company) => watchedIds.has(company.id)).length;
  const totalLiveCount = nonManual.length;
  const groups = TRACKED_COMPANY_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    companies: nonManual.filter((c) => c.category === category),
  })).filter((group) => group.companies.length > 0);
  const [isExpanded, setIsExpanded] = useState(() => watchedLiveCount !== totalLiveCount);
  const [expandedGroups, setExpandedGroups] = useState<Record<MBACategory, boolean>>({
    fintech: true,
    startup: true,
    "big-tech": true,
  });
  const allOn = nonManual.every((c) => watchedIds.has(c.id));
  const allOff = nonManual.every((c) => !watchedIds.has(c.id));

  useEffect(() => {
    if (watchedLiveCount !== totalLiveCount) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Auto-expand the tracked-companies panel when the user has filtered out boards; reactive to derived counts
      setIsExpanded(true);
    }
  }, [totalLiveCount, watchedLiveCount]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="mba-disclosure"
        aria-expanded={isExpanded}
        aria-controls="tracked-companies-controls"
      >
        <span>
          Tracked company feeds, {watchedLiveCount} of {totalLiveCount} live boards in the scan
        </span>
        <ChevronDown className="mba-chevron" aria-hidden="true" />
      </button>

      {isExpanded && (
        <div id="tracked-companies-controls">
          <div className="mba-wrap-row">
            <button type="button" onClick={onSelectAll} disabled={allOn} className="c97-btn-ghost">
              All on
            </button>
            <button type="button" onClick={onClearAll} disabled={allOff} className="c97-btn-ghost">
              All off
            </button>
          </div>
          <div className="mba-groups">
            {groups.map((group) => {
              const watchedCount = group.companies.filter((company) => watchedIds.has(company.id)).length;
              const isGroupExpanded = expandedGroups[group.category];

              return (
                <div key={group.category} data-testid={`tracked-companies-${group.category}`}>
                  <button
                    type="button"
                    className="mba-disclosure"
                    aria-expanded={isGroupExpanded}
                    aria-controls={`tracked-companies-panel-${group.category}`}
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.category]: !current[group.category],
                      }))
                    }
                  >
                    <span>
                      <strong>{group.label}</strong>{" "}
                      <span className="mba-small">
                        {watchedCount} / {group.companies.length} watched
                      </span>
                    </span>
                    <ChevronDown className="mba-chevron" aria-hidden="true" />
                  </button>
                  {isGroupExpanded && (
                    <div
                      id={`tracked-companies-panel-${group.category}`}
                      className="mba-group-list"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    >
                      {group.companies.map((company) => {
                        const active = watchedIds.has(company.id);
                        return (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => onToggle(company.id)}
                            className="mba-toggle"
                            style={getTrackedCompanyButtonStyle(company, active)}
                            aria-pressed={active}
                          >
                            <span
                              className="mba-swatch"
                              style={{ background: active ? company.color : "var(--c97-rule)" }}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 truncate">{company.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Which feeds answered. The counts stay in view and the per-feed list, one tag
 * for every board, opens on request.
 */
function SourceHealthPanel({ sourceStatuses }: { sourceStatuses: MBAJobsSourceStatus[] }) {
  const okCount = sourceStatuses.filter((status) => status.status === "ok").length;
  const failedCount = sourceStatuses.filter((status) => status.status === "failed").length;
  const skippedCount = sourceStatuses.filter((status) => status.status === "skipped").length;
  const externalDisabledCount = sourceStatuses.filter(
    (status) => status.status === "external-disabled"
  ).length;

  return (
    <section className="mba-source-block" aria-labelledby="mba-source-health-heading">
      <h3 id="mba-source-health-heading" className="mba-h3">
        Source health
      </h3>
      <p className="mba-health-counts">
        <span>{okCount} healthy</span>
        <span>{failedCount} failed</span>
        <span>{skippedCount} manual-only</span>
        {externalDisabledCount > 0 && <span>{externalDisabledCount} external disabled</span>}
      </p>
      <details className="c97-disclosure">
        <summary className="c97-btn-ghost">
          <span data-when="closed">Show all {sourceStatuses.length} sources</span>
          <span data-when="open">Hide the source list</span>
        </summary>
        <div className="mba-tags flex-wrap" style={{ marginTop: "var(--c97-sp-1)" }}>
          {sourceStatuses.map((source) => {
            const accent =
              source.status === "ok"
                ? "var(--c97-positive)"
                : source.status === "failed"
                  ? "var(--c97-negative)"
                  : source.status === "external-disabled"
                    ? "var(--c97-warning)"
                    : "var(--c97-ink-2)";
            return (
              <ColorTag
                key={`${source.companyId}-${source.status}`}
                accent={accent}
                title={source.message}
                label={`${source.companyName} · ${
                  source.status === "ok" ? `${source.jobCount} roles` : source.status
                }`}
              />
            );
          })}
        </div>
      </details>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/**
 * The funnel as the strip of heads over the board: applications, responses,
 * interviews, and offers, each with its count and the conversion rate from
 * the stage before it. The first stage has nothing before it, so it carries
 * no rate.
 */
function PipelineSignature({ insights }: { insights: MBAApplicationInsights }) {
  const stages = pipelineStages(insights);

  return (
    <div className="mba-funnel" role="group" aria-labelledby="mba-funnel-label">
      <p id="mba-funnel-label" className="mba-funnel-label">
        Pipeline funnel
      </p>
      {stages.map((stage, index) => (
        <div key={stage.key} className="mba-funnel-stage">
          <span className="mba-funnel-count">{stage.count}</span>
          <span className="mba-small">{stage.label}</span>
          {index > 0 && (
            <span className="mba-funnel-rate">
              <span>{stage.rateLabel}</span> <strong>{formatRate(stage.rateFromPrevious)}</strong>
              <br />
              <span>
                {stage.count} of {stages[index - 1].count}{" "}
                {stage.key === "responded"
                  ? "heard back"
                  : stage.key === "interview"
                    ? "reached interview"
                    : "got an offer"}
              </span>
            </span>
          )}
        </div>
      ))}
      <p className="mba-funnel-foot">
        {insights.funnel.rejected} rejected · {insights.archived} archived. Rates include previous
        stages and archived applications with recorded progress.
      </p>
    </div>
  );
}

function AttentionRow({
  item,
  onEdit,
  onMarkApplied,
  onClearFollowUp,
}: {
  item: MBAAttentionItem;
  onEdit: (application: MBATrackedApplication) => void;
  onMarkApplied: (id: string) => void;
  onClearFollowUp: (id: string) => void;
}) {
  const { application } = item;
  const accent = ATTENTION_KIND_ACCENTS[item.kind];
  const isFollowUp = isFollowUpAttention(item.kind);
  const Icon = isFollowUp ? Clock : CalendarClock;

  return (
    <>
      {/* The colour is a mark only, and every word beside it prints in ink. */}
      <p className="mba-attention-what">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} aria-hidden="true" />
        {describeAttentionItem(item)}
      </p>
      <p className="mba-job-company">
        <strong>{application.jobSnapshot.companyName}</strong> · {application.jobSnapshot.title}
      </p>
      <div className="mba-wrap-row">
        {isFollowUp ? (
          <button
            type="button"
            onClick={() => onClearFollowUp(application.id)}
            className="c97-btn-ghost"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Mark done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMarkApplied(application.id)}
            className="c97-btn-ghost"
          >
            <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
            Mark applied
          </button>
        )}
        <button type="button" onClick={() => onEdit(application)} className="c97-btn-ghost">
          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
        {application.jobSnapshot.applyUrl && (
          <CardActionLink
            href={application.jobSnapshot.applyUrl}
            label="Open"
            ariaLabel={`Open ${application.jobSnapshot.title} at ${application.jobSnapshot.companyName}`}
            trailingIcon
          />
        )}
      </div>
    </>
  );
}

function NeedsAttentionPanel({
  items,
  onEdit,
  onMarkApplied,
  onClearFollowUp,
}: {
  items: MBAAttentionItem[];
  onEdit: (application: MBATrackedApplication) => void;
  onMarkApplied: (id: string) => void;
  onClearFollowUp: (id: string) => void;
}) {
  return (
    <section className="mba-rail-section" aria-labelledby="mba-attention-heading">
      <h3 id="mba-attention-heading" className="mba-h3">
        What to chase today.
      </h3>
      {items.length === 0 ? (
        <p>
          <strong style={{ color: "var(--c97-ink)" }}>All caught up.</strong>{" "}
          No follow-ups or deadlines need action right now. A follow-up date set when I apply
          surfaces here on its day.
        </p>
      ) : (
        <ul className="mba-attention">
          {items.map((item) => (
            <li key={`${item.application.id}-${item.kind}`}>
              <AttentionRow
                item={item}
                onEdit={onEdit}
                onMarkApplied={onMarkApplied}
                onClearFollowUp={onClearFollowUp}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ApplicationCard({
  application,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onArchive,
  onRemove,
}: {
  application: MBATrackedApplication;
  onStatusChange: (status: MBAApplicationStatus) => void;
  onPriorityChange: (priority: MBAApplicationPriority) => void;
  onEdit: () => void;
  onArchive: () => void;
  onRemove: () => void;
}) {
  const followUpIsDue =
    application.followUpDate !== null && application.followUpDate <= getTodayDateKey();
  // Delete is permanent (localStorage, no undo), so it takes a second click.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const rounds = application.interviewRounds ?? [];
  const facts = application.facts ?? [];
  return (
    <article className="mba-card">
      <p className="mba-job-company">
        <strong>{application.jobSnapshot.companyName}</strong>
      </p>
      <h3 className="mba-job-title">{application.jobSnapshot.title}</h3>
      <p className="mba-job-meta">
        {application.jobSnapshot.department} · {application.jobSnapshot.location}
      </p>
      {application.appliedVia && (
        <p className="mba-job-meta">Applied via {application.appliedVia}</p>
      )}
      {/* The column head already names the status, so the card carries the rest. */}
      <div className="mba-tags flex-wrap">
        <ApplicationPriorityChip priority={application.priority} />
        {application.fit && (
          <FitTag score={application.fit.score} scoredAt={application.fit.scoredAt} />
        )}
        {application.followUpDate && (
          <ColorTag
            accent={followUpIsDue ? "var(--c97-accent)" : "var(--c97-ink-2)"}
            label={`Follow up ${formatDateKey(application.followUpDate)}`}
          />
        )}
        {application.deadline && (
          <ColorTag accent="var(--c97-warning)" label={`Due ${formatDateKey(application.deadline)}`} />
        )}
      </div>
      {application.fit?.rationale && (
        <details className="c97-disclosure">
          <summary className="c97-btn-ghost">Why this fit</summary>
          <p className="mba-snippet">{application.fit.rationale}</p>
        </details>
      )}
      {application.notes && <p className="mba-snippet line-clamp-3">{application.notes}</p>}
      <ApplicationHistory events={application.statusHistory ?? []} />
      {facts.length > 0 && (
        <ul className="mba-snippet" aria-label="Posting facts">
          {facts.map((fact, index) => (
            <li key={`${fact.label}-${index}`}>
              {fact.label} · {fact.value}
            </li>
          ))}
        </ul>
      )}
      {rounds.length > 0 && (
        <ul className="mba-snippet" aria-label="Interview rounds">
          {rounds.map((round, index) => (
            <li key={`${round.label}-${index}`}>
              {round.label}
              {round.date ? ` · ${formatDateKey(round.date)}` : ""}
              {` · ${round.outcome}`}
            </li>
          ))}
        </ul>
      )}
      {application.materialsDir && (
        <p className="mba-job-meta mba-wrap-row">
          <code className="font-mono break-all">{application.materialsDir}</code>
          <button
            type="button"
            className="c97-btn-ghost"
            onClick={() => {
              const dir = application.materialsDir;
              if (!dir || !navigator.clipboard) return;
              void navigator.clipboard.writeText(dir).then(() => setCopiedPath(true));
            }}
          >
            {copiedPath ? "Copied" : "Copy path"}
          </button>
        </p>
      )}
      <div className="mba-card-controls">
        <select
          value={application.status}
          onChange={(event) => onStatusChange(event.target.value as MBAApplicationStatus)}
          className="c97-field"
          aria-label={`Application status for ${application.jobSnapshot.title}`}
        >
          {MBA_APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {MBA_APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <select
          value={application.priority}
          onChange={(event) => onPriorityChange(event.target.value as MBAApplicationPriority)}
          className="c97-field"
          aria-label={`Priority for ${application.jobSnapshot.title}`}
        >
          {MBA_APPLICATION_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {MBA_APPLICATION_PRIORITY_LABELS[priority]} priority
            </option>
          ))}
        </select>
        <button type="button" onClick={onEdit} className="c97-btn-ghost">
          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
        {application.jobSnapshot.applyUrl && (
          <CardActionLink
            href={application.jobSnapshot.applyUrl}
            label="Apply"
            ariaLabel={`Apply for ${application.jobSnapshot.title} at ${application.jobSnapshot.companyName}`}
            trailingIcon
          />
        )}
        {application.status !== "archived" && (
          <button type="button" onClick={onArchive} className="c97-btn-ghost">
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={() => (confirmingDelete ? onRemove() : setConfirmingDelete(true))}
          className="c97-btn-ghost"
          style={confirmingDelete ? { color: "var(--c97-negative)" } : undefined}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {confirmingDelete ? "Confirm delete" : "Delete"}
        </button>
        {confirmingDelete && (
          <button type="button" onClick={() => setConfirmingDelete(false)} className="c97-btn-ghost">
            Keep it
          </button>
        )}
      </div>
    </article>
  );
}

function ApplicationPipeline({
  applications,
  insights,
  attentionItems,
  todayKey,
  onCreate,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onArchive,
  onRemove,
  onClearFollowUp,
  onExportJson,
  onExportCsv,
  onImport,
}: {
  applications: MBATrackedApplication[];
  insights: MBAApplicationInsights;
  attentionItems: MBAAttentionItem[];
  todayKey: string | null;
  onCreate: () => void;
  onEdit: (application: MBATrackedApplication) => void;
  onStatusChange: (id: string, status: MBAApplicationStatus) => void;
  onPriorityChange: (id: string, priority: MBAApplicationPriority) => void;
  onArchive: (id: string) => void;
  onRemove: (id: string) => void;
  onClearFollowUp: (id: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: (content: string) => { imported: number; total: number };
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MBAApplicationStatus | "all">("all");
  const [sortByFit, setSortByFit] = useState(false);
  // One limit per status column, so "Show more" on one column leaves the rest
  // at their first page.
  const [columnLimits, setColumnLimits] = useState<Partial<Record<MBAApplicationStatus, number>>>({});
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (statusFilter === "all" && application.status === "archived") return false;
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return buildMBAApplicationSearchText(application).includes(normalizedQuery);
    });
  }, [applications, query, statusFilter]);

  const columns = useMemo(() => {
    const statusesToShow =
      statusFilter === "all" ? ACTIVE_APPLICATION_STATUSES : [statusFilter];
    return statusesToShow.map((status) => {
      const sorted = sortApplicationsForColumn(
        filteredApplications.filter((application) => application.status === status)
      );
      return { status, applications: sortByFit ? sortApplicationsByFit(sorted) : sorted };
    });
  }, [filteredApplications, sortByFit, statusFilter]);

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const content = await file.text();
      const result = onImport(content);
      setImportMessage(
        result.imported > 0
          ? `Imported ${result.imported} applications. ${result.total} total now.`
          : "No valid applications were found in that file."
      );
    } catch {
      setImportMessage("Could not read that import file.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <section className="mba-pipeline" aria-labelledby="mba-application-pipeline-heading">
      <h2 id="mba-application-pipeline-heading" className="sr-only">
        Application pipeline
      </h2>
      <div className="mba-toolbar">
        <div className="mba-input">
          <Search className="mba-input-icon" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search roles, posting facts, notes…"
            aria-label="Search applications"
            className="c97-field"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as MBAApplicationStatus | "all")}
          className="c97-field"
          aria-label="Filter applications by status"
        >
          <option value="all">All active statuses</option>
          {MBA_APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {MBA_APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <div className="mba-toolbar-actions">
          <button type="button" onClick={onCreate} className="c97-btn">
            Add application
          </button>
          <button
            type="button"
            aria-pressed={sortByFit}
            onClick={() => setSortByFit((current) => !current)}
            className="c97-btn-ghost"
          >
            By fit
          </button>
          <button type="button" onClick={onExportJson} className="c97-btn-ghost">
            <Download className="h-4 w-4" aria-hidden="true" />
            JSON backup
          </button>
          <button type="button" onClick={onExportCsv} className="c97-btn-ghost">
            <Download className="h-4 w-4" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="c97-btn-ghost"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => handleImportFile(event.target.files?.[0])}
            aria-label="Import applications JSON"
          />
        </div>
      </div>

      {importMessage && (
        <p className="mba-count-line" role="status">
          {importMessage}
        </p>
      )}

      <div className="mba-pipeline-layout">
        <aside className="mba-rail" aria-label="Pipeline to-do">
          <UpcomingInterviews applications={applications} todayKey={todayKey} onEdit={onEdit} />
          <NeedsAttentionPanel
            items={attentionItems}
            onEdit={onEdit}
            onMarkApplied={(id) => onStatusChange(id, "applied")}
            onClearFollowUp={onClearFollowUp}
          />
        </aside>

        <div className="mba-board-wrap">
          {applications.length > 0 && <PipelineSignature insights={insights} />}
          {applications.length === 0 ? (
            <p className="mba-empty">
              <strong>No applications tracked yet.</strong>
              Track a role from the feed or add one by hand to start the pipeline. Everything here
              stays in this browser.
            </p>
          ) : filteredApplications.length === 0 ? (
            <p className="mba-empty">
              <strong>No applications match.</strong>
              Try a different search or status filter.
            </p>
          ) : (
            <div className="mba-board" role="region" aria-label="Pipeline columns" tabIndex={0}>
              {columns.map(({ status, applications: statusApplications }) => {
                const columnLimit = columnLimits[status] ?? PIPELINE_COLUMN_PAGE_SIZE;
                return (
                  <div key={status} className="mba-column">
                    <p className="mba-column-head">
                      <span>{MBA_APPLICATION_STATUS_LABELS[status]}</span>
                      <span className="mba-column-count">{statusApplications.length}</span>
                    </p>
                    {statusApplications.length === 0 ? (
                      <p className="mba-column-empty">Nothing here.</p>
                    ) : (
                      statusApplications.slice(0, columnLimit).map((application) => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          onStatusChange={(nextStatus) => onStatusChange(application.id, nextStatus)}
                          onPriorityChange={(nextPriority) =>
                            onPriorityChange(application.id, nextPriority)
                          }
                          onEdit={() => onEdit(application)}
                          onArchive={() => onArchive(application.id)}
                          onRemove={() => onRemove(application.id)}
                        />
                      ))
                    )}
                    {statusApplications.length > columnLimit && (
                      <button
                        type="button"
                        className="c97-btn-ghost"
                        onClick={() =>
                          setColumnLimits((limits) => ({
                            ...limits,
                            [status]: (limits[status] ?? PIPELINE_COLUMN_PAGE_SIZE) + PIPELINE_COLUMN_PAGE_SIZE,
                          }))
                        }
                      >
                        Show more ({columnLimit} of {statusApplications.length}{" "}
                        {MBA_APPLICATION_STATUS_LABELS[status].toLowerCase()})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

interface MBAJobsClientProps {
  initialData?: MBAJobsApiResponse;
  /** The feed's full size at render time; `initialData.jobs` is only its first page. */
  initialJobCount?: number;
  initialState: MBAJobsSearchState;
}

export function MBAJobsClient({
  initialData,
  initialJobCount,
  initialState,
}: MBAJobsClientProps) {
  const now = useClientNow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const routeState = useMemo(
    () => (searchParamsKey ? normalizeMBAJobsState(searchParams) : initialState),
    [initialState, searchParams, searchParamsKey]
  );
  const [uiState, setUiState] = useState(routeState);
  const deferredQuery = useDeferredValue(uiState.q);
  const deferredLocation = useDeferredValue(uiState.location);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mirror canonical route state into local UI state when the URL changes externally (e.g. back/forward nav)
    setUiState(routeState);
  }, [routeState]);

  function updateRouteState(next: Partial<MBAJobsSearchState>) {
    const nextState = { ...uiState, ...next };
    setUiState(nextState);
    startTransition(() => router.push(buildMBAJobsHref(nextState), { scroll: false }));
  }

  const {
    jobs,
    isLoading,
    hasFetched,
    error,
    fetchErrors,
    sourceStatuses,
    lastFetchedAt,
    seenIds,
    watchedCompanyIds,
    notificationPermission,
    newJobCount,
    markJobSeen,
    markAllSeen,
    toggleCompany,
    setAllCompanies,
    requestNotificationPermission,
    refresh,
  } = useMBAJobs({
    externalLeads: uiState.external === "on",
    initialData,
  });

  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<MBATrackedApplication | null>(null);
  const {
    applications,
    getApplicationForJob,
    trackJob,
    addManualApplication,
    updateApplication,
    updateStatus,
    updatePriority,
    archiveApplication,
    removeApplication,
    importApplications,
    exportJson,
    exportCsv,
    privateSync,
  } = useMBAApplications();
  const candidates = useMBAJobCandidates();
  // A shared ?view=candidates link falls back to the feed where candidates are off.
  const view = uiState.view === "candidates" && !candidates.enabled ? "feed" : uiState.view;
  const applicationTodayKey = getTodayDateKey();
  const applicationInsights = useMemo(
    () => summarizeApplicationPipeline(applications, applicationTodayKey),
    [applications, applicationTodayKey]
  );
  const attentionItems = useMemo(
    () => getApplicationAttentionItems(applications, applicationTodayKey),
    [applications, applicationTodayKey]
  );
  const activeFilters = hasActiveFilters(uiState);
  const effectiveState = useMemo(
    () => ({ ...uiState, q: deferredQuery, location: deferredLocation }),
    [deferredLocation, deferredQuery, uiState]
  );

  const locationScopedEntries = useMemo(() => {
    const query = effectiveState.q.trim();
    return jobs.flatMap((job) => {
      if (job.atsType !== "external-api" && !watchedCompanyIds.has(job.companyId)) return [];
      if (job.atsType === "external-api" && effectiveState.external !== "on") return [];
      if (effectiveState.category !== "all" && job.category !== effectiveState.category) {
        return [];
      }
      if (effectiveState.roleType !== "all" && job.roleType !== effectiveState.roleType) {
        return [];
      }
      if (
        effectiveState.roleFamily !== "all" &&
        !job.roleFamilies.includes(effectiveState.roleFamily)
      ) {
        return [];
      }

      const queryScore = getQueryScore(job, query);
      if (query && queryScore === 0) return [];

      const roleFamilyBoost =
        effectiveState.roleFamily !== "all" &&
        job.roleFamilies.includes(effectiveState.roleFamily)
          ? 8
          : 0;

      return [
        {
          job,
          queryScore,
          relevanceScore: queryScore + roleFamilyBoost,
        },
      ];
    });
  }, [effectiveState.category, effectiveState.external, effectiveState.q, effectiveState.roleFamily, effectiveState.roleType, jobs, watchedCompanyIds]);

  const locationOptions = useMemo(
    () => buildLocationOptions(locationScopedEntries.map((entry) => entry.job)),
    [locationScopedEntries]
  );

  // ── Derived: filtered + sorted job list ──────────────────────────────
  const displayJobs = useMemo(() => {
    const normalizedLocation = normalizeSearchText(effectiveState.location);
    const filtered = locationScopedEntries.filter(
      (entry) =>
        !normalizedLocation ||
        normalizeSearchText(entry.job.location).includes(normalizedLocation)
    );

    filtered.sort((left, right) => {
      const leftTime = getPostedAtTime(left.job.postedAt);
      const rightTime = getPostedAtTime(right.job.postedAt);
      if (effectiveState.sort === "oldest") {
        return leftTime - rightTime;
      }
      if (effectiveState.sort === "newest") {
        return rightTime - leftTime;
      }
      const scoreDiff = right.relevanceScore - left.relevanceScore;
      if (scoreDiff !== 0) return scoreDiff;
      return rightTime - leftTime;
    });

    return filtered.map((entry) => entry.job);
  }, [effectiveState.location, effectiveState.sort, locationScopedEntries]);

  // ── Pagination: the live grid can carry ~1,870 unfiltered cards, so only
  // the first page renders until "Show more" is clicked, and any filter
  // change starts back at the first page.
  const [visibleJobCount, setVisibleJobCount] = useState(JOB_PAGE_SIZE);
  const [showRefinements, setShowRefinements] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets pagination when the filters that produced `displayJobs` change, not on every render
    setVisibleJobCount(JOB_PAGE_SIZE);
  }, [
    effectiveState.category,
    effectiveState.external,
    effectiveState.q,
    effectiveState.roleFamily,
    effectiveState.roleType,
    effectiveState.location,
    effectiveState.sort,
  ]);
  const visibleJobs = useMemo(
    () => displayJobs.slice(0, visibleJobCount),
    [displayJobs, visibleJobCount]
  );

  // ── Manual (Big Tech) companies filtered by category ─────────────────
  const manualCompanies = useMemo(() => {
    const all = MBA_COMPANIES.filter((c) => c.atsType === "manual");
    if (uiState.category === "all") return all;
    return all.filter((c) => c.category === uiState.category);
  }, [uiState.category]);

  const totalTracked = MBA_COMPANIES.filter((c) => c.atsType !== "manual").length;
  const totalCompanies = MBA_COMPANIES.length;
  const externalLeadCount = jobs.filter((job) => job.atsType === "external-api").length;
  const normalizedLocationFilter = normalizeSearchText(uiState.location);
  const matchingRoleCount = locationScopedEntries.length;
  const refreshLabel = isLoading
    ? "Loading…"
    : lastFetchedAt
      ? `Updated ${formatFetchedAt(lastFetchedAt)}`
      : "Not yet fetched";
  // Until the browser's fetch lands, `jobs` is the server's first page, so the
  // feed size comes from the server's own count of the full list.
  const liveRoleCount = hasFetched ? jobs.length : initialJobCount ?? jobs.length;
  const countsReady = !isLoading && hasFetched;
  // Boards that failed by name. A feed-level error (no board behind it) is the
  // page's error state instead, so it never prints as an empty name here.
  const failedBoards = fetchErrors.map((item) => item.companyName).filter(Boolean);

  const showSourceHealth = !isLoading && sourceStatuses.length > 0;

  function openApplicationDialog(application: MBATrackedApplication | null) {
    setEditingApplication(application);
    setApplicationDialogOpen(true);
  }

  function handleSaveApplication(
    form: ApplicationFormState,
    application: MBATrackedApplication | null
  ) {
    const followUpDate = form.followUpDate.trim() || null;
    const deadline = form.deadline.trim() || null;
    const now = new Date().toISOString();
    const scoreText = form.fitScore.trim();
    const rationale = form.fitRationale.trim();
    const existingFit = application?.fit ?? null;
    // An unchanged score and rationale keep the skill's scoredAt; an unreadable score keeps the old fit.
    const fit = !scoreText
      ? null
      : existingFit && String(existingFit.score) === scoreText && existingFit.rationale === rationale
        ? existingFit
        : sanitizeFit({ score: Number(scoreText), rationale, scoredAt: now }, now) ?? existingFit;
    const appliedVia = form.appliedVia.trim();
    const materialsDir = form.materialsDir.trim() || null;

    if (application) {
      updateApplication(application.id, {
        status: form.status,
        priority: form.priority,
        notes: form.notes,
        contact: form.contact,
        sourceUrl: form.sourceUrl,
        followUpDate,
        deadline,
        fit,
        appliedVia,
        materialsDir,
        jobSnapshot: {
          companyName: form.companyName,
          title: form.title,
          location: form.location,
          department: form.department,
          applyUrl: form.applyUrl,
        },
      });
    } else {
      addManualApplication({
        companyName: form.companyName,
        title: form.title,
        location: form.location,
        department: form.department,
        applyUrl: form.applyUrl,
        sourceUrl: form.sourceUrl,
        status: form.status,
        priority: form.priority,
        notes: form.notes,
        contact: form.contact,
        followUpDate,
        deadline,
        fit,
        appliedVia,
        materialsDir,
      });
    }

    setApplicationDialogOpen(false);
    setEditingApplication(null);
  }

  function handleTrackJob(job: MBAJob, status: MBAApplicationStatus = "saved") {
    trackJob(job, status);
  }

  function handleClearFollowUp(id: string) {
    updateApplication(id, { followUpDate: null });
  }

  function handleExportJson() {
    downloadTextFile(
      `mba-applications-${getTodayDateKey()}.json`,
      exportJson(),
      "application/json"
    );
  }

  function handleExportCsv() {
    downloadTextFile(
      `mba-applications-${getTodayDateKey()}.csv`,
      exportCsv(),
      "text/csv"
    );
  }

  return (
    <div className="mba-root">
      <div className="c97-shell c97-frame mba-page">
        {applicationDialogOpen && (
          <ApplicationEditDialog
            isOpen
            application={editingApplication}
            onClose={() => {
              setApplicationDialogOpen(false);
              setEditingApplication(null);
            }}
            onSave={handleSaveApplication}
          />
        )}

        <header className="mba-titlebar">
          <div className="mba-title-row">
            <h1 className="mba-h1">Job search</h1>
            <div role="group" aria-label="Job tracker view" className="mba-switch">
              {VIEW_OPTIONS.filter((option) => option !== "candidates" || candidates.enabled).map((option) => (
                <button
                  type="button"
                  key={option}
                  aria-pressed={view === option}
                  onClick={() => updateRouteState({ view: option })}
                >
                  {VIEW_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
          <div className="mba-title-sub">
            <p className="mba-lede">
              I poll {totalTracked} public job boards across {totalCompanies} target companies for
              full-time business roles, and anything I track moves into a pipeline that keeps its
              follow-ups, interviews, and deadlines in this browser.
            </p>
            <div className="mba-status">
              <p className="mba-stat">
                <span className="mba-stat-value">{isLoading ? "—" : formatCount(liveRoleCount)}</span>
                <span className="mba-stat-label">Live roles tracked</span>
              </p>
              <p className="mba-stat-label">{refreshLabel}</p>
              <button type="button" onClick={refresh} disabled={isLoading} className="c97-btn-ghost">
                <RefreshCcw
                  className={`h-4 w-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {isLoading ? "Loading…" : "Refresh"}
              </button>
              <NotificationBell
                permission={notificationPermission}
                onRequest={requestNotificationPermission}
              />
              {countsReady && newJobCount > 0 && (
                <>
                  <p className="mba-stat-label">{formatCount(newJobCount)} new since last visit</p>
                  <button type="button" onClick={markAllSeen} className="c97-btn-ghost">
                    Mark all seen
                  </button>
                </>
              )}
            </div>
          </div>
          {privateSync && view === "applications" && (
            <p className="mba-small" role="status">
              {privateSync.error
                ? `The private sync hit a problem. ${privateSync.error}`
                : privateSync.lastSyncedAt
                  ? `Synced with private/job-search/pipeline.json, last sync ${formatFetchedAt(new Date(privateSync.lastSyncedAt))}.`
                  : "Syncing with private/job-search/pipeline.json, no pull has finished yet."}
            </p>
          )}
        </header>

        {/* Under the title bar on every view, so the live-roles count above it
            carries its context on the pipeline too, where source health no
            longer prints. */}
        {failedBoards.length > 0 && !isLoading && (
          <p className="mba-notice" role="status">
            <span className="mba-notice-tag">Partial results.</span>
            <span>
              Some companies could not be reached: {failedBoards.join(", ")}. Results shown and the
              live-roles count are partial.
            </span>
          </p>
        )}

        {view === "candidates" ? (
          <CandidatesView
            candidates={candidates.candidates}
            onPromote={(candidate) => {
              const tracked = trackJob(candidate.job);
              if (tracked && candidate.fit) updateApplication(tracked.id, { fit: candidate.fit });
              candidates.removeCandidate(candidate.id);
            }}
            onDismiss={(id) => candidates.setTriage(id, "dismissed")}
            onRestore={(id) => candidates.setTriage(id, "reviewed")}
          />
        ) : view === "applications" ? (
          <ApplicationPipeline
            applications={applications}
            insights={applicationInsights}
            attentionItems={attentionItems}
            todayKey={now === null ? null : applicationTodayKey}
            onCreate={() => openApplicationDialog(null)}
            onEdit={openApplicationDialog}
            onStatusChange={updateStatus}
            onPriorityChange={updatePriority}
            onArchive={archiveApplication}
            onRemove={removeApplication}
            onClearFollowUp={handleClearFollowUp}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onImport={importApplications}
          />
        ) : (
          <>
            <section className="mba-feed" aria-labelledby="mba-live-roles-heading">
              <div className="mba-searchbar">
                <div className="mba-input">
                  <Search className="mba-input-icon" aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={uiState.q}
                    onChange={(event) => updateRouteState({ q: event.target.value })}
                    placeholder="Search PM, PMM, strategy, ops, growth, finance…"
                    aria-label="Search roles"
                    className="c97-field"
                  />
                  {uiState.q && (
                    <button
                      type="button"
                      onClick={() => {
                        updateRouteState({ q: "" });
                        searchInputRef.current?.focus();
                      }}
                      className="mba-input-clear"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="mba-input">
                  <MapPin className="mba-input-icon" aria-hidden="true" />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={uiState.location}
                    onChange={(event) => updateRouteState({ location: event.target.value })}
                    placeholder="Remote, New York, San Francisco…"
                    aria-label="Filter by location"
                    className="c97-field"
                  />
                  {uiState.location && (
                    <button
                      type="button"
                      onClick={() => {
                        updateRouteState({ location: "" });
                        locationInputRef.current?.focus();
                      }}
                      className="mba-input-clear"
                      aria-label="Clear location filter"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="mba-searchbar-end">
                  <SortDropdown value={uiState.sort} onValueChange={(sort) => updateRouteState({ sort })} />
                  {activeFilters && (
                    <button
                      type="button"
                      onClick={() => updateRouteState(DEFAULT_MBA_JOBS_STATE)}
                      className="c97-btn-ghost"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* On a phone these groups stack between the search field and
                  the first role, so below 768px they open on request, and from
                  there up they always print. The tags above the list still name
                  every filter in force. */}
              <button
                type="button"
                className="mba-disclosure mba-refine-toggle"
                aria-expanded={showRefinements}
                aria-controls="mba-role-refinements"
                onClick={() => setShowRefinements((open) => !open)}
              >
                <span>
                  {`${showRefinements ? "Hide" : "Show"} location, role, company, and source filters`}
                </span>
                <ChevronDown className="mba-chevron" aria-hidden="true" />
              </button>
              <div
                id="mba-role-refinements"
                className={`mba-refine md:flex ${showRefinements ? "flex" : "hidden"}`}
              >
                {locationOptions.length > 0 && (
                  <div className="mba-refine-row">
                    <p className="mba-refine-label">
                      Location
                      <span className="mba-small">
                        {formatCount(matchingRoleCount)} roles before location filtering
                      </span>
                    </p>
                    <div className="mba-pills" role="group" aria-label="Suggested locations">
                      <button
                        type="button"
                        aria-pressed={uiState.location.trim().length === 0}
                        onClick={() => updateRouteState({ location: "" })}
                      >
                        All locations
                      </button>
                      {locationOptions.map((option) => (
                        <button
                          type="button"
                          key={option.normalizedValue}
                          aria-pressed={normalizedLocationFilter === option.normalizedValue}
                          onClick={() => updateRouteState({ location: option.label })}
                        >
                          {option.label} · {option.count}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mba-refine-row">
                  <p className="mba-refine-label">Role type</p>
                  <div className="mba-pills" role="group" aria-label="Filter by role type">
                    {ROLE_TYPE_OPTIONS.map((roleType) => (
                      <button
                        type="button"
                        key={roleType}
                        aria-pressed={uiState.roleType === roleType}
                        onClick={() => updateRouteState({ roleType: roleType as MBARoleTypeFilter })}
                      >
                        {ROLE_TYPE_LABELS[roleType as MBARoleTypeFilter]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mba-refine-row">
                  <p className="mba-refine-label">Role family</p>
                  <div className="mba-pills" role="group" aria-label="Filter by role family">
                    {ROLE_FAMILY_OPTIONS.map((family) => (
                      <button
                        type="button"
                        key={family}
                        aria-pressed={uiState.roleFamily === family}
                        onClick={() => updateRouteState({ roleFamily: family as MBARoleFamilyFilter })}
                      >
                        {ROLE_FAMILY_LABELS[family as MBARoleFamilyFilter]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mba-refine-row">
                  <p className="mba-refine-label">Company category</p>
                  <div className="mba-pills" role="group" aria-label="Filter by company category">
                    {CATEGORY_OPTIONS.map((category) => (
                      <button
                        type="button"
                        key={category}
                        aria-pressed={uiState.category === category}
                        onClick={() => updateRouteState({ category: category as MBACategoryFilter })}
                      >
                        {CATEGORY_LABELS[category as MBACategoryFilter]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mba-refine-row">
                  <p className="mba-refine-label">Sources</p>
                  <div className="mba-pills" role="group" aria-label="External lead sources">
                    {(["off", "on"] as const).map((external) => (
                      <button
                        type="button"
                        key={external}
                        aria-pressed={uiState.external === external}
                        onClick={() => updateRouteState({ external })}
                      >
                        {EXTERNAL_LABELS[external]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mba-results-head">
                <h2 id="mba-live-roles-heading" className="mba-h2">
                  Live roles
                </h2>
                {countsReady && (
                  <p className="mba-count-line" role="status" aria-live="polite" aria-atomic="true">
                    {formatCount(displayJobs.length)} matching roles
                    {uiState.external === "on" ? `, ${formatCount(externalLeadCount)} external leads` : ""}
                  </p>
                )}
                {activeFilters && (
                  <div className="mba-tags flex-wrap">
                    {uiState.q.trim() && (
                      <ColorTag accent="var(--c97-ink)" label={`Search: ${uiState.q.trim()}`} />
                    )}
                    {uiState.location.trim() && (
                      <ColorTag accent="var(--c97-ink-2)" label={`Location: ${uiState.location.trim()}`} />
                    )}
                    {uiState.roleType !== DEFAULT_MBA_JOBS_STATE.roleType && (
                      <ColorTag
                        accent={uiState.roleType === "all" ? "var(--c97-ink-2)" : ROLE_TYPE_ACCENTS[uiState.roleType]}
                        label={uiState.roleType === "all" ? "All role types" : ROLE_TYPE_LABELS[uiState.roleType]}
                      />
                    )}
                    {uiState.roleFamily !== "all" && (
                      <ColorTag
                        accent={getRoleFamilyAccent(uiState.roleFamily)}
                        label={ROLE_FAMILY_LABELS[uiState.roleFamily]}
                      />
                    )}
                    {uiState.category !== "all" && (
                      <ColorTag accent={CATEGORY_COLOR[uiState.category]} label={CATEGORY_LABELS[uiState.category]} />
                    )}
                    {uiState.sort !== DEFAULT_MBA_JOBS_STATE.sort && (
                      <ColorTag accent="var(--c97-ink-2)" label={SORT_LABELS[uiState.sort]} />
                    )}
                    {uiState.external !== DEFAULT_MBA_JOBS_STATE.external && (
                      <ColorTag accent="var(--c97-accent)" label={EXTERNAL_LABELS[uiState.external]} />
                    )}
                  </div>
                )}
              </div>

              {isLoading ? (
                <JobGridSkeleton />
              ) : error ? (
                <div className="mba-empty" role="alert">
                  <strong>Could not load jobs.</strong>
                  <span>{error}</span>
                  <div>
                    <button type="button" onClick={refresh} className="c97-btn-ghost">
                      <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                </div>
              ) : displayJobs.length === 0 ? (
                <p className="mba-empty">
                  <strong>No roles found right now.</strong>
                  No tracked postings matched the current search, location, or role filters. Try
                  broadening the role family, switching role type, or clearing the filters.
                </p>
              ) : (
                <div className="mba-jobs" data-testid="live-jobs-grid">
                  {visibleJobs.map((job) => {
                    const application = getApplicationForJob(job);
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        isNew={!seenIds.has(job.id)}
                        application={application}
                        onMarkSeen={() => markJobSeen(job.id)}
                        onTrack={() => handleTrackJob(job)}
                        onMarkApplied={() => handleTrackJob(job, "applied")}
                        onEditApplication={() => {
                          const tracked = getApplicationForJob(job) ?? trackJob(job);
                          openApplicationDialog(tracked);
                        }}
                        currentState={uiState}
                        now={now}
                      />
                    );
                  })}
                </div>
              )}

              {!isLoading && !error && (
                <div className="mba-more">
                  {displayJobs.length > visibleJobs.length && (
                    <button
                      type="button"
                      className="c97-btn"
                      onClick={() => setVisibleJobCount((n) => n + JOB_PAGE_SIZE)}
                    >
                      Show more ({formatCount(visibleJobs.length)} of {formatCount(displayJobs.length)} shown)
                    </button>
                  )}
                  <p className="mba-foot">
                    Polls every 30 min
                    {showSourceHealth && (
                      <>
                        {" · "}
                        <a href="#mba-source-health-heading" className="mba-link">
                          Source health
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}
            </section>

            <section className="mba-sources" aria-labelledby="mba-sources-heading">
              <h2 id="mba-sources-heading" className="mba-h2">
                Sources
              </h2>
              <section className="mba-source-block" aria-labelledby="mba-role-tracker-companies-heading">
                <h3 id="mba-role-tracker-companies-heading" className="mba-h3">
                  Tracked feeds
                </h3>
                <p>
                  Toggle the companies I can poll directly. Manual-only targets stay separate in
                  Manual checks below.
                </p>
                <CompanyFilterStrip
                  watchedIds={watchedCompanyIds}
                  onToggle={toggleCompany}
                  onSelectAll={() => setAllCompanies(true)}
                  onClearAll={() => setAllCompanies(false)}
                />
              </section>
              <div className="mba-sources-pair">
                {showSourceHealth && <SourceHealthPanel sourceStatuses={sourceStatuses} />}
                <SearchElsewhere currentState={uiState} />
              </div>
              {manualCompanies.length > 0 && (
                <ManualChecks companies={manualCompanies} currentState={uiState} />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
