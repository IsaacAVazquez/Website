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
  CircleAlert,
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
import { StatusPanel } from "@/components/editorial/StatusPanel";
import { ChevronDown } from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
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

const ROUTE = "/mba-internship-notifications";
const JOB_PAGE_SIZE = 60;

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

function SectionLead({
  kicker,
  title,
  description,
  id,
}: {
  kicker: string;
  title: string;
  description: string;
  id?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
        <p className="c97-kicker">{kicker}</p>
        <h2 id={id} className="c97-poster-sm" style={{ maxWidth: "18ch" }}>
          {title}
        </h2>
      </div>
      <p className="c97-prose" style={{ maxWidth: "40rem" }}>{description}</p>
    </div>
  );
}

function CompanyAvatar({ company }: { company: MBACompany | undefined }) {
  const color = company?.color ?? "var(--c97-accent)";
  const initials = company?.logoInitials ?? "??";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold"
      style={{ background: color }}
      aria-hidden="true"
    >
      <span style={{ color: "var(--c97-surface)" }}>{initials}</span>
    </div>
  );
}

function NewBadge() {
  return <span className="c97-chip" style={{ color: "var(--c97-ink)" }}>New</span>;
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
      style={{ gap: "var(--c97-sp-1)" }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span>{label}</span>
      {trailingIcon ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </a>
  );
}

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
    <article
      className="c97-panel flex h-full flex-col"
      onMouseEnter={onMarkSeen}
      onFocus={onMarkSeen}
    >
      <div className="flex h-full flex-col" style={{ gap: "var(--c97-sp-3)" }}>
        <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div className="min-w-0 flex items-center" style={{ gap: "var(--c97-sp-2)" }}>
            <CompanyAvatar company={company} />
            <div className="min-w-0">
              <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>{job.companyName}</p>
              <p className="text-sm" style={{ margin: 0, marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
                {job.department}
                {job.sourceName ? ` · via ${job.sourceName}` : ""}
              </p>
            </div>
          </div>
          <div
            data-testid={`job-card-${job.id}-chips`}
            className="flex max-w-full flex-wrap items-center sm:justify-end"
            style={{ gap: "var(--c97-sp-1)" }}
          >
            {isNew && <NewBadge />}
            {application && <ApplicationStatusChip status={application.status} />}
            {application?.fit && (
              <FitTag score={application.fit.score} scoredAt={application.fit.scoredAt} />
            )}
            {job.atsType === "external-api" && (
              <ExternalLeadChip sourceName={job.sourceName} />
            )}
            <RoleTypeChip roleType={job.roleType} />
            <CategoryChip category={job.category} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
          <h3 className="c97-serif c97-h3">
            {job.title}
          </h3>

          {job.snippet && (
            <p className="c97-prose line-clamp-3 break-words">{job.snippet}</p>
          )}
        </div>

        {job.roleFamilies.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
            {job.roleFamilies.map((family) => (
              <RoleFamilyChip key={`${job.id}-${family}`} family={family} />
            ))}
          </div>
        )}

        <div
          className="mt-auto border-t border-[var(--c97-rule)]"
          style={{ paddingTop: "var(--c97-sp-3)" }}
        >
          <p className="c97-meta">
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
          {job.sourceName && (
            <p className="c97-prose text-sm" style={{ marginTop: "var(--c97-sp-1)" }}>
              Found through {job.sourceName}
              {job.sourceUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[var(--c97-rule)] underline-offset-4"
                  >
                    Source
                  </a>
                </>
              ) : null}
            </p>
          )}
          <div className="flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-2)" }}>
            <button
              type="button"
              onClick={() => {
                onTrack();
                onMarkSeen();
              }}
              className="c97-btn-ghost mba-ghost"
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
              className="c97-btn-ghost mba-ghost"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
              Mark applied
            </button>
            {application && (
              <button
                type="button"
                onClick={onEditApplication}
                className="c97-btn-ghost mba-ghost"
              >
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
              ariaLabel={`Apply for ${job.title} at ${job.companyName}`}
              variant="primary"
              trailingIcon
              onClick={onMarkSeen}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ManualCompanyCard({
  company,
  currentState,
}: {
  company: MBACompany;
  currentState: MBAJobsSearchState;
}) {
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    buildManualLinkedInQuery(company.name, currentState)
  )}`;

  return (
    <article
      className="c97-panel flex h-full flex-col"
    >
      <div className="flex h-full flex-col" style={{ gap: "var(--c97-sp-3)" }}>
        <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div className="flex min-w-0 items-center" style={{ gap: "var(--c97-sp-2)" }}>
            <CompanyAvatar company={company} />
            <div className="min-w-0">
              <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>{company.name}</p>
              <p className="text-sm" style={{ margin: 0, marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}>
                Manual fallback
              </p>
            </div>
          </div>
          <CategoryChip category={company.category} />
        </div>

        <p className="c97-prose">
          I do not have a stable public feed for this company yet, so I keep the career page and
          a role-aware LinkedIn search here instead.
        </p>

        <div
          className="mt-auto border-t border-[var(--c97-rule)]"
          style={{ paddingTop: "var(--c97-sp-3)" }}
        >
          <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-2)" }}>
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
          </div>
        </div>
      </div>
    </article>
  );
}

function SearchElsewhereStrip({ currentState }: { currentState: MBAJobsSearchState }) {
  const links = buildExternalSearchLinks(currentState);

  return (
    <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle" aria-labelledby="mba-search-elsewhere-heading">
      <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
      <SectionLead
        kicker="Search elsewhere"
        title="Open the same search on outside boards."
        description="These are outbound searches only. LinkedIn stays a shortcut here, not a server-side source."
        id="mba-search-elsewhere-heading"
      />
      <div className="c97-panel">
        <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-2)" }}>
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
      </div>
      </div>
    </section>
  );
}

function JobGridSkeleton() {
  return (
    <div
      className="grid md:grid-cols-2 xl:grid-cols-3"
      style={{ gap: "var(--c97-sp-3)" }}
      role="status"
      aria-live="polite"
      aria-label="Loading jobs"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="c97-panel"
          style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}
          aria-hidden="true"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}>
            <span className="c97-skeleton" style={{ height: 36, width: 36 }} />
            <div style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
              <span className="c97-skeleton" style={{ height: 10, width: 80 }} />
              <span className="c97-skeleton" style={{ height: 8, width: 56 }} />
            </div>
          </div>
          <div style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
            <span className="c97-skeleton" style={{ height: 16, width: "75%" }} />
            <span className="c97-skeleton" style={{ height: 12, width: "50%" }} />
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
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--c97-sp-1)" }}>
      <span className="c97-kicker">Sort</span>
      <select
        value={value}
        onChange={(event) => onValueChange(event.target.value as MBASortOrder)}
        className="c97-field"
        style={{ width: "auto", cursor: "pointer" }}
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
      <div
        className="inline-flex min-h-[48px] items-center border text-sm font-semibold"
        style={{
          gap: "var(--c97-sp-1)",
          padding: "var(--c97-sp-1) var(--c97-sp-2)",
          color: "color-mix(in srgb, var(--c97-accent) 78%, var(--c97-ink))",
          borderColor: "color-mix(in srgb, var(--c97-accent) 40%, var(--c97-rule))",
          background: "color-mix(in srgb, var(--c97-accent) 18%, var(--c97-surface))",
        }}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        Notifications on
      </div>
    );
  }
  if (permission === "denied") {
    return (
      <div
        className="inline-flex min-h-[48px] items-center border text-sm"
        style={{
          gap: "var(--c97-sp-1)",
          padding: "var(--c97-sp-1) var(--c97-sp-2)",
          color: "var(--c97-ink-2)",
          borderColor: "var(--c97-rule)",
        }}
      >
        <BellOff className="h-4 w-4" aria-hidden="true" />
        Notifications blocked in browser
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onRequest}
      className="c97-btn-ghost mba-ghost"
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      Enable notifications
    </button>
  );
}

// ---------------------------------------------------------------------------
// Company filter strip
// ---------------------------------------------------------------------------

function CompanyFilterStrip({
  watchedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  style,
}: {
  watchedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  style?: CSSProperties;
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
    <div className="c97-panel" style={style}>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="mba-toggle flex w-full items-start justify-between border text-left transition-[border-color,color] duration-200 ease sm:items-center"
        style={{ gap: "var(--c97-sp-2)", padding: "var(--c97-sp-2)" }}
        aria-expanded={isExpanded}
        aria-controls="tracked-companies-controls"
      >
        <span style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
          <span className="block">
            <span className="c97-meta" style={{ display: "block" }}>Tracked company feeds</span>
            <span
              className="block text-sm"
              style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
            >
              {watchedLiveCount} of {totalLiveCount} live boards are in your scan right now.
            </span>
          </span>
          <span className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
            <span className="c97-chip">{totalLiveCount} live feeds</span>
            <span className="c97-chip">{watchedLiveCount} watched now</span>
            <span className="c97-chip">{groups.length} company groups</span>
          </span>
        </span>
        <span className="flex items-center" style={{ gap: "var(--c97-sp-2)" }}>
          <span
            className="hidden text-2xs font-semibold uppercase tracking-[0.12em] sm:inline"
            style={{ color: "var(--c97-ink-2)" }}
          >
            {isExpanded ? "Hide list" : "Show list"}
          </span>
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border"
            style={{
              borderColor: "var(--c97-rule)",
              background: "var(--c97-field)",
            }}
            aria-hidden="true"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ease ${
                isExpanded ? "rotate-180" : ""
              }`}
              style={{ color: "var(--c97-ink-2)" }}
            />
          </span>
        </span>
      </button>

      {isExpanded && (
        <div id="tracked-companies-controls" style={{ marginTop: "var(--c97-sp-3)" }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end" style={{ gap: "var(--c97-sp-2)" }}>
            <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
              <button
                type="button"
                onClick={onSelectAll}
                disabled={allOn}
                className="c97-btn-ghost"
              >
                All on
              </button>
              <button
                type="button"
                onClick={onClearAll}
                disabled={allOff}
                className="c97-btn-ghost"
              >
                All off
              </button>
            </div>
          </div>
          <div className="grid xl:grid-cols-3" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}>
            {groups.map((group) => {
              const watchedCount = group.companies.filter((company) => watchedIds.has(company.id)).length;
              const isGroupExpanded = expandedGroups[group.category];

              return (
                <div
                  key={group.category}
                  data-testid={`tracked-companies-${group.category}`}
                  className="border p-[var(--c97-sp-1)] sm:p-[var(--c97-sp-2)]"
                  style={{
                    borderColor: "var(--c97-rule)",
                    background: "var(--c97-field)",
                  }}
                >
                  <button
                    type="button"
                    className="mba-disclosure flex min-h-[44px] w-full items-center justify-between text-left"
                    style={{ gap: "var(--c97-sp-2)", padding: "var(--c97-sp-1)", color: "var(--c97-ink)" }}
                    aria-expanded={isGroupExpanded}
                    aria-controls={`tracked-companies-panel-${group.category}`}
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.category]: !current[group.category],
                      }))
                    }
                  >
                    <span className="block min-w-0">
                      <span className="c97-meta" style={{ display: "block" }}>{group.label}</span>
                      <span
                        className="block text-xs"
                        style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
                      >
                        {watchedCount} / {group.companies.length} watched
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 ease ${
                        isGroupExpanded ? "rotate-180" : ""
                      }`}
                      style={{ color: "var(--c97-ink-2)" }}
                      aria-hidden="true"
                    />
                  </button>
                  {isGroupExpanded && (
                    <div
                      id={`tracked-companies-panel-${group.category}`}
                      className="grid sm:grid-cols-2"
                      style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
                    >
                      {group.companies.map((company) => {
                        const active = watchedIds.has(company.id);
                        return (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => onToggle(company.id)}
                            className="mba-toggle inline-flex min-h-[44px] w-full items-center border text-left text-xs font-semibold transition-[border-color,color] duration-150 ease"
                            style={{ ...getTrackedCompanyButtonStyle(company, active), gap: "var(--c97-sp-1)", padding: "var(--c97-sp-2)" }}
                            aria-pressed={active}
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0"
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
 * The four-column pipeline signature: applied, responded, interview, offer,
 * each a big mono count with the conversion rate from the stage before it.
 * The first stage has nothing before it, so it carries no rate.
 */
function PipelineSignature({ insights }: { insights: MBAApplicationInsights }) {
  const stages = pipelineStages(insights);

  return (
    <div>
      <p className="c97-kicker">Pipeline funnel</p>
      <div className="mba-pipeline-stages" style={{ marginTop: "var(--c97-sp-3)" }}>
        {stages.map((stage, index) => (
          <div key={stage.key} className={index > 0 ? "mba-pipeline-rate" : undefined}>
            <p className="c97-stat-value c97-mono" style={{ margin: 0 }}>
              {stage.count}
            </p>
            <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
              {stage.label}
            </p>
            {index > 0 && (
              <div style={{ marginTop: "var(--c97-sp-2)" }}>
                <p className="c97-meta">{stage.rateLabel}</p>
                <p className="c97-mono" style={{ margin: 0, fontSize: "var(--c97-fs-h3)" }}>
                  {formatRate(stage.rateFromPrevious)}
                </p>
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                  {stage.count} of {stages[index - 1].count}{" "}
                  {stage.key === "responded"
                    ? "heard back"
                    : stage.key === "interview"
                      ? "reached interview"
                      : "got an offer"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="c97-prose" style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}>
        {insights.funnel.rejected} rejected · {insights.archived} archived
      </p>
      <p className="c97-meta">Rates include previous stages and archived applications with recorded progress.</p>
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
    <div
      className="c97-panel flex flex-col" style={{ gap: "var(--c97-sp-2)" }}
    >
      <div className="flex min-w-0 items-start" style={{ gap: "var(--c97-sp-2)" }}>
        {/* The colour is a swatch/mark only, and every word beside it prints in ink. */}
        <span
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center"
          style={{ background: accent, color: "var(--c97-surface)" }}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>
            {application.jobSnapshot.companyName}
          </p>
          <p className="text-sm font-semibold" style={{ margin: 0, marginTop: "var(--c97-sp-1)", color: "var(--c97-ink)" }}>
            {application.jobSnapshot.title}
          </p>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
            {describeAttentionItem(item)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-1)" }}>
        {isFollowUp ? (
          <button
            type="button"
            onClick={() => onClearFollowUp(application.id)}
            className="c97-btn-ghost mba-ghost"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Mark done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMarkApplied(application.id)}
            className="c97-btn-ghost mba-ghost"
          >
            <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
            Mark applied
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(application)}
          className="c97-btn-ghost mba-ghost"
        >
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
    </div>
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
    <section aria-labelledby="mba-attention-heading" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
      <SectionLead
        kicker="Needs attention"
        title="What to chase today."
        description="Overdue and same-day follow-ups plus deadlines closing on roles you have not submitted yet, pulled straight from your tracked pipeline."
        id="mba-attention-heading"
      />
      <div>
        {items.length === 0 ? (
          <div className="c97-panel flex items-center" style={{ gap: "var(--c97-sp-2)" }}>
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center"
              style={{ background: "var(--c97-positive)", color: "var(--c97-surface)" }}
              aria-hidden="true"
            >
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ margin: 0, color: "var(--c97-ink)" }}>
                You&rsquo;re all caught up.
              </p>
              <p className="c97-prose text-sm" style={{ marginTop: "var(--c97-sp-1)" }}>
                No follow-ups or deadlines need action right now. Add a follow-up date when you
                apply and it will surface here on the day.
              </p>
            </div>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
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
      </div>
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
    <article className="c97-panel">
      <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
        <div className="min-w-0">
          <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>
            {application.jobSnapshot.companyName}
          </p>
          <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
            {application.jobSnapshot.title}
          </h3>
        </div>
        <ApplicationPriorityChip priority={application.priority} />
      </div>
      <p className="c97-prose text-sm" style={{ marginTop: "var(--c97-sp-2)" }}>
        {application.jobSnapshot.department} · {application.jobSnapshot.location}
      </p>
      {application.appliedVia && (
        <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
          Applied via {application.appliedVia}
        </p>
      )}
      <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
        <ApplicationStatusChip status={application.status} />
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
        <details className="c97-disclosure" style={{ marginTop: "var(--c97-sp-1)" }}>
          <summary className="c97-btn-ghost">Why this fit</summary>
          <p className="c97-meta" style={{ margin: 0 }}>{application.fit.rationale}</p>
        </details>
      )}
      {application.notes && (
        <p className="c97-prose line-clamp-3 text-sm" style={{ marginTop: "var(--c97-sp-2)" }}>{application.notes}</p>
      )}
      <ApplicationHistory events={application.statusHistory ?? []} />
      {facts.length > 0 && (
        <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }} aria-label="Posting facts">
          {facts.map((fact, index) => (
            <li key={`${fact.label}-${index}`} className="c97-meta">
              {fact.label} · {fact.value}
            </li>
          ))}
        </ul>
      )}
      {rounds.length > 0 && (
        <ul className="c97-list" style={{ marginTop: "var(--c97-sp-2)" }} aria-label="Interview rounds">
          {rounds.map((round, index) => (
            <li key={`${round.label}-${index}`} className="c97-meta">
              {round.label}
              {round.date ? ` · ${formatDateKey(round.date)}` : ""}
              {` · ${round.outcome}`}
            </li>
          ))}
        </ul>
      )}
      {application.materialsDir && (
        <p className="c97-meta flex flex-wrap items-center" style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)" }}>
          <code className="font-mono break-all">{application.materialsDir}</code>
          <button
            type="button"
            className="c97-btn-ghost"
            style={{ minHeight: 44 }}
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
      <div className="flex flex-wrap items-center border-t border-[var(--c97-rule)]"
        style={{ marginTop: "var(--c97-sp-2)", gap: "var(--c97-sp-1)", paddingTop: "var(--c97-sp-2)" }}>
        <select
          value={application.status}
          onChange={(event) => onStatusChange(event.target.value as MBAApplicationStatus)}
          className="c97-field"
          style={{ width: "auto" }}
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
          onChange={(event) =>
            onPriorityChange(event.target.value as MBAApplicationPriority)
          }
          className="c97-field"
          style={{ width: "auto" }}
          aria-label={`Priority for ${application.jobSnapshot.title}`}
        >
          {MBA_APPLICATION_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {MBA_APPLICATION_PRIORITY_LABELS[priority]} priority
            </option>
          ))}
        </select>
        <button type="button" onClick={onEdit} className="c97-btn-ghost mba-ghost">
          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
        {application.jobSnapshot.applyUrl && (
          <CardActionLink
            href={application.jobSnapshot.applyUrl}
            label="Apply"
            ariaLabel={`Open application for ${application.jobSnapshot.title}`}
            variant="primary"
            trailingIcon
          />
        )}
        {application.status !== "archived" && (
          <button type="button" onClick={onArchive} className="c97-btn-ghost mba-ghost">
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={() => (confirmingDelete ? onRemove() : setConfirmingDelete(true))}
          className="c97-btn-ghost mba-ghost"
          style={confirmingDelete ? { color: "var(--c97-negative)" } : undefined}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {confirmingDelete ? "Confirm delete" : "Delete"}
        </button>
        {confirmingDelete && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="c97-btn-ghost"
          >
            Keep it
          </button>
        )}
      </div>
    </article>
  );
}

function ApplicationPipeline({
  applications,
  todayKey,
  onCreate,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onArchive,
  onRemove,
  onExportJson,
  onExportCsv,
  onImport,
}: {
  applications: MBATrackedApplication[];
  todayKey: string | null;
  onCreate: () => void;
  onEdit: (application: MBATrackedApplication) => void;
  onStatusChange: (id: string, status: MBAApplicationStatus) => void;
  onPriorityChange: (id: string, priority: MBAApplicationPriority) => void;
  onArchive: (id: string) => void;
  onRemove: (id: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: (content: string) => { imported: number; total: number };
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MBAApplicationStatus | "all">("all");
  const [sortByFit, setSortByFit] = useState(false);
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
    <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-labelledby="mba-application-pipeline-heading">
      <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
      <UpcomingInterviews applications={applications} todayKey={todayKey} onEdit={onEdit} />
      <SectionLead
        kicker="Applications"
        title="Work the full-time pipeline in one place."
        description="I track roles from the live feed, add the ones I find elsewhere by hand, and keep follow-ups, interview rounds, and fit notes visible without sending any of it to the server."
        id="mba-application-pipeline-heading"
      />
      <div className="c97-panel" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div className="grid md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[34rem]" style={{ gap: "var(--c97-sp-2)" }}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--c97-ink-2)" }}
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roles, posting facts, notes…"
                aria-label="Search applications"
                className="c97-field"
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as MBAApplicationStatus | "all")
              }
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
          </div>

          <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
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
            <button type="button" onClick={onExportJson} className="c97-btn-ghost mba-ghost">
              <Download className="h-4 w-4" aria-hidden="true" />
              JSON backup
            </button>
            <button type="button" onClick={onExportCsv} className="c97-btn-ghost mba-ghost">
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="c97-btn-ghost mba-ghost"
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
          <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-3)" }} role="status">
            {importMessage}
          </p>
        )}

        {applications.length === 0 ? (
          <StatusPanel
            title="No applications tracked yet."
            message="Track a role from the feed or add one manually to start building your pipeline."
            icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
          />
        ) : filteredApplications.length === 0 ? (
          <StatusPanel
            title="No applications match."
            message="Try a different search or status filter."
            icon={<Search className="h-5 w-5" aria-hidden="true" />}
          />
        ) : (
          <div className="grid xl:grid-cols-5" style={{ gap: "var(--c97-sp-2)" }}>
            {columns.map(({ status, applications: statusApplications }) => {
              return (
                <div key={status} style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
                  <div className="c97-panel flex items-center justify-between">
                    <p className="c97-meta">{MBA_APPLICATION_STATUS_LABELS[status]}</p>
                    <span className="c97-chip">{statusApplications.length}</span>
                  </div>
                  {statusApplications.length === 0 ? (
                    <div
                      className="border border-dashed text-sm"
                      style={{
                        padding: "var(--c97-sp-2)",
                        borderColor: "var(--c97-rule)",
                        color: "var(--c97-ink-2)",
                      }}
                    >
                      Nothing here.
                    </div>
                  ) : (
                    statusApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        onStatusChange={(nextStatus) =>
                          onStatusChange(application.id, nextStatus)
                        }
                        onPriorityChange={(nextPriority) =>
                          onPriorityChange(application.id, nextPriority)
                        }
                        onEdit={() => onEdit(application)}
                        onArchive={() => onArchive(application.id)}
                        onRemove={() => onRemove(application.id)}
                      />
                    ))
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

/**
 * Which feeds answered. The counts stay in view and the per-feed list, one tag
 * for every board, opens on request. It prints inside a band its caller owns.
 */
function SourceHealthPanel({ sourceStatuses }: { sourceStatuses: MBAJobsSourceStatus[] }) {
  const okCount = sourceStatuses.filter((status) => status.status === "ok").length;
  const failedCount = sourceStatuses.filter((status) => status.status === "failed").length;
  const skippedCount = sourceStatuses.filter((status) => status.status === "skipped").length;
  const externalDisabledCount = sourceStatuses.filter(
    (status) => status.status === "external-disabled"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
      <SectionLead
        kicker="Source health"
        title="Know which feeds answered."
        description="The tracker separates healthy feeds, failed requests, and manual-only sources so partial results are easier to trust."
        id="mba-source-health-heading"
      />
      <div className="c97-panel">
        <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
          <span className="c97-chip">{okCount} healthy</span>
          <span className="c97-chip">{failedCount} failed</span>
          <span className="c97-chip">{skippedCount} manual-only</span>
          {externalDisabledCount > 0 && (
            <span className="c97-chip">{externalDisabledCount} external disabled</span>
          )}
        </div>
        <details className="c97-disclosure" style={{ marginTop: "var(--c97-sp-1)" }}>
          <summary className="c97-btn-ghost">
            <span data-when="closed">Show all {sourceStatuses.length} sources</span>
            <span data-when="open">Hide the source list</span>
          </summary>
          <div className="flex flex-wrap" style={{ marginTop: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
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
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

interface MBAJobsClientProps {
  initialData?: MBAJobsApiResponse;
  initialState: MBAJobsSearchState;
}

export function MBAJobsClient({
  initialData,
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
    activeApplications,
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


  const hasApplications = applications.length > 0;
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
    <>
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

      <Catalog97ProjectHero
        ink={PROJECT_PRESS[ROUTE].lead}
        title="Job search"
        standfirst={
          <>
            I monitor {totalTracked} public job boards across {totalCompanies} target companies
            for full-time product, PMM, strategy, operations, growth, finance, analytics, chief of
            staff, and MBA leadership program roles. External leads stay opt-in, and LinkedIn stays
            an outbound search shortcut instead of a scraped feed. The board below narrows by role
            and company type, and any role I track from it lands in the pipeline so follow-ups,
            interview rounds, and deadlines surface on their own.
          </>
        }
        meta={refreshLabel}
        // The hero fills a phone's first screen, so one link goes straight to the search.
        action={
          view === "applications" ? undefined : (
            <a href="#mba-role-tracker-filters-heading" className="c97-btn-ghost">
              Search roles
            </a>
          )
        }
        // The two pipeline figures and the funnel are all zeros until a role
        // is tracked, and on a phone they stood between the visitor and the
        // search. They print once there is something to count.
        readouts={
          hasApplications
            ? [
                { label: "Live roles tracked", value: isLoading ? "—" : jobs.length },
                { label: "Active applications", value: activeApplications.length },
                { label: "Needs attention", value: attentionItems.length },
              ]
            : [{ label: "Live roles tracked", value: isLoading ? "—" : jobs.length }]
        }
      >
        {hasApplications ? (
          <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-4)" }}>
            <div className="mba-signature-grid">
              <PipelineSignature insights={applicationInsights} />
              <NeedsAttentionPanel
                items={attentionItems}
                onEdit={openApplicationDialog}
                onMarkApplied={(id) => updateStatus(id, "applied")}
                onClearFollowUp={handleClearFollowUp}
              />
            </div>
          </div>
        ) : (
          <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
            <p className="c97-kicker">Pipeline funnel</p>
            <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
              Track a role below to start filling this in.
            </p>
          </div>
        )}
      </Catalog97ProjectHero>

      {/* Bone, because the band under it is paper in both views now that
          source health prints after the results. */}
      <section className="c97-band c97-band-tight c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-4)" }}>
          <div className="flex flex-wrap items-center" style={{ gap: "var(--c97-sp-2)" }}>
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="c97-btn-ghost mba-ghost disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "motion-safe:animate-spin" : ""}`}
                aria-hidden="true"
              />
              {isLoading ? "Loading…" : "Refresh now"}
            </button>

            <NotificationBell
              permission={notificationPermission}
              onRequest={requestNotificationPermission}
            />

            {!isLoading && newJobCount > 0 && (
              <button type="button" onClick={markAllSeen} className="c97-btn-ghost mba-ghost">
                Mark all seen
              </button>
            )}
            {!isLoading && newJobCount > 0 && (
              <p className="c97-meta" style={{ margin: 0 }}>
                {newJobCount} new since last visit
              </p>
            )}
          </div>

          <div role="group" aria-label="Job tracker view" className="c97-segmented">
            {VIEW_OPTIONS.filter((option) => option !== "candidates" || candidates.enabled).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={view === option}
                onClick={() => updateRouteState({ view: option })}
                style={{ minHeight: 44 }}
              >
                {VIEW_LABELS[option]}
              </button>
            ))}
          </div>
          {privateSync && view === "applications" && (
            <p className="c97-meta" style={{ margin: 0 }} role="status">
              {privateSync.error
                ? `The private sync hit a problem. ${privateSync.error}`
                : privateSync.lastSyncedAt
                  ? `Synced with private/job-search/pipeline.json, last sync ${formatFetchedAt(new Date(privateSync.lastSyncedAt))}.`
                  : "Syncing with private/job-search/pipeline.json, no pull has finished yet."}
            </p>
          )}
        </div>
      </section>

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
        <>
          <ApplicationPipeline
            applications={applications}
            todayKey={now === null ? null : applicationTodayKey}
            onCreate={() => openApplicationDialog(null)}
            onEdit={openApplicationDialog}
            onStatusChange={updateStatus}
            onPriorityChange={updatePriority}
            onArchive={archiveApplication}
            onRemove={removeApplication}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onImport={importApplications}
          />
          {showSourceHealth && (
            <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle" aria-labelledby="mba-source-health-heading">
              <div className="c97-shell">
                <SourceHealthPanel sourceStatuses={sourceStatuses} />
              </div>
            </section>
          )}
        </>
      ) : (
        <>

          <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-labelledby="mba-role-tracker-filters-heading">
            <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
              {fetchErrors.length > 0 && !isLoading && (
                <div
                  className="c97-panel"
                  role="status"
                  style={{ borderLeft: "2px solid var(--c97-warning)" }}
                >
                  <span className="c97-chip c97-chip-warning">Partial results</span>
                  <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink)" }}>
                    Some companies could not be reached:{" "}
                    {fetchErrors.map((e) => e.companyName).join(", ")}. Results shown are partial.
                  </p>
                </div>
              )}
            <SectionLead
              kicker="Filters"
              title="Search and narrow the board."
              description="Search roles, narrow by location, sort the feed, and filter by role type, role family, and company category without leaving the page."
              id="mba-role-tracker-filters-heading"
            />
            <div
              className="c97-panel"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-3)" }}>
                <div className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)_auto] xl:items-center"
                  style={{ gap: "var(--c97-sp-2)" }}>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--c97-ink-2)" }}
                      aria-hidden="true"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={uiState.q}
                      onChange={(event) => updateRouteState({ q: event.target.value })}
                      placeholder="Search PM, PMM, strategy, ops, growth, finance…"
                      aria-label="Search roles"
                      className="c97-field"
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                    />
                    {uiState.q && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRouteState({ q: "" });
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center"
                        aria-label="Clear search"
                        style={{ color: "var(--c97-ink-2)" }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--c97-ink-2)" }}
                      aria-hidden="true"
                    />
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={uiState.location}
                      onChange={(event) => updateRouteState({ location: event.target.value })}
                      placeholder="Remote, New York, San Francisco…"
                      aria-label="Filter by location"
                      className="c97-field"
                      style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                    />
                    {uiState.location && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRouteState({ location: "" });
                          locationInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center"
                        aria-label="Clear location filter"
                        style={{ color: "var(--c97-ink-2)" }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                    <SortDropdown
                      value={uiState.sort}
                      onValueChange={(sort) => updateRouteState({ sort })}
                    />
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

                {/* On a phone these five groups stack between the search field
                    and the first role. Below 768px they open on request, and
                    from there up they always print. The tags under them still
                    name every filter in force. */}
                <button
                  type="button"
                  className="mba-disclosure flex min-h-[44px] w-full items-center justify-between text-left md:hidden"
                  style={{ gap: "var(--c97-sp-2)", color: "var(--c97-ink)" }}
                  aria-expanded={showRefinements}
                  aria-controls="mba-role-refinements"
                  onClick={() => setShowRefinements((open) => !open)}
                >
                  <span className="c97-meta" style={{ display: "block" }}>
                    {`${showRefinements ? "Hide" : "Show"} location, role, company, and source filters`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-150 ease ${
                      showRefinements ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id="mba-role-refinements"
                  className={`flex-col gap-[var(--c97-sp-3)] md:flex ${showRefinements ? "flex" : "hidden"}`}
                >
                  {locationOptions.length > 0 && (
                    <div
                      className="border"
                      style={{
                        padding: "var(--c97-sp-2)",
                        borderColor: "var(--c97-rule)",
                        background: "var(--c97-field)",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
                        <p className="c97-meta">Popular locations</p>
                        <p
                          className="text-1xs"
                          style={{ margin: 0, color: "var(--c97-ink-2)" }}
                        >
                          {matchingRoleCount} roles before location filtering
                        </p>
                      </div>
                      <div
                        className="c97-segmented"
                        role="group"
                        aria-label="Suggested locations"
                        style={{ marginTop: "var(--c97-sp-2)" }}
                      >
                        <button
                          type="button"
                          aria-pressed={uiState.location.trim().length === 0}
                          onClick={() => updateRouteState({ location: "" })}
                          style={{ minHeight: 44 }}
                        >
                          All locations
                        </button>
                        {locationOptions.map((option) => (
                          <button
                            type="button"
                            key={option.normalizedValue}
                            aria-pressed={normalizedLocationFilter === option.normalizedValue}
                            onClick={() => updateRouteState({ location: option.label })}
                            style={{ minHeight: 44 }}
                          >
                            {option.label} · {option.count}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className="border-t border-[var(--c97-rule)]"
                    style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-3)" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-meta">Role type</p>
                      <div className="c97-segmented" role="group" aria-label="Filter by role type">
                        {ROLE_TYPE_OPTIONS.map((roleType) => (
                          <button
                            type="button"
                            key={roleType}
                            aria-pressed={uiState.roleType === roleType}
                            onClick={() =>
                              updateRouteState({ roleType: roleType as MBARoleTypeFilter })
                            }
                            style={{ minHeight: 44 }}
                          >
                            {ROLE_TYPE_LABELS[roleType as MBARoleTypeFilter]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-meta">Role family</p>
                      <div
                        className="c97-segmented"
                        role="group"
                        aria-label="Filter by role family"
                      >
                        {ROLE_FAMILY_OPTIONS.map((family) => (
                          <button
                            type="button"
                            key={family}
                            aria-pressed={uiState.roleFamily === family}
                            onClick={() =>
                              updateRouteState({ roleFamily: family as MBARoleFamilyFilter })
                            }
                            style={{ minHeight: 44 }}
                          >
                            {ROLE_FAMILY_LABELS[family as MBARoleFamilyFilter]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-meta">Company category</p>
                      <div
                        className="c97-segmented"
                        role="group"
                        aria-label="Filter by company category"
                      >
                        {CATEGORY_OPTIONS.map((category) => (
                          <button
                            type="button"
                            key={category}
                            aria-pressed={uiState.category === category}
                            onClick={() =>
                              updateRouteState({ category: category as MBACategoryFilter })
                            }
                            style={{ minHeight: 44 }}
                          >
                            {CATEGORY_LABELS[category as MBACategoryFilter]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-1)" }}>
                      <p className="c97-meta">Sources</p>
                      <div className="c97-segmented" role="group" aria-label="External lead sources">
                        {(["off", "on"] as const).map((external) => (
                          <button
                            type="button"
                            key={external}
                            aria-pressed={uiState.external === external}
                            onClick={() => updateRouteState({ external })}
                            style={{ minHeight: 44 }}
                          >
                            {EXTERNAL_LABELS[external]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {activeFilters && (
                  <div className="flex flex-wrap items-center border-t border-[var(--c97-rule)]"
                    style={{ gap: "var(--c97-sp-1)", paddingTop: "var(--c97-sp-3)" }}>
                    {uiState.q.trim() && (
                      <ColorTag accent="var(--c97-ink)" label={`Search: ${uiState.q.trim()}`} />
                    )}
                    {uiState.location.trim() && (
                      <ColorTag
                        accent="var(--c97-ink-2)"
                        label={`Location: ${uiState.location.trim()}`}
                      />
                    )}
                    {uiState.roleType !== DEFAULT_MBA_JOBS_STATE.roleType && (
                      <ColorTag
                        accent={
                          uiState.roleType === "all"
                            ? "var(--c97-ink-2)"
                            : ROLE_TYPE_ACCENTS[uiState.roleType]
                        }
                        label={
                          uiState.roleType === "all"
                            ? "All role types"
                            : ROLE_TYPE_LABELS[uiState.roleType]
                        }
                      />
                    )}
                    {uiState.roleFamily !== "all" && (
                      <ColorTag
                        accent={getRoleFamilyAccent(uiState.roleFamily)}
                        label={ROLE_FAMILY_LABELS[uiState.roleFamily]}
                      />
                    )}
                    {uiState.category !== "all" && (
                      <ColorTag
                        accent={CATEGORY_COLOR[uiState.category]}
                        label={CATEGORY_LABELS[uiState.category]}
                      />
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
            </div>
            </div>
          </section>

          <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle" aria-labelledby="mba-role-tracker-roles-heading">
            <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
            <SectionLead
              kicker="Live roles"
              title="Current openings across the tracked boards."
              description="This is the fastest way I have found to scan full-time business roles without bouncing across dozens of career pages."
              id="mba-role-tracker-roles-heading"
            />
            {!isLoading && (
              <div
                className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="c97-chip">{displayJobs.length} matching roles</span>
                <span className="c97-chip">{watchedCompanyIds.size} watched feeds active</span>
                {uiState.external === "on" && (
                  <span className="c97-chip">{externalLeadCount} external leads</span>
                )}
                {uiState.location.trim() && (
                  <span className="c97-chip">{matchingRoleCount} before location filter</span>
                )}
                {uiState.location.trim() && (
                  <span className="c97-chip">
                    Location: {uiState.location.trim()}
                  </span>
                )}
              </div>
            )}
            {isLoading ? (
              <JobGridSkeleton />
            ) : error ? (
              <>
                <StatusPanel
                  title="Could not load jobs."
                  message={error}
                  tone="error"
                  icon={<CircleAlert className="h-5 w-5" aria-hidden="true" />}
                />
                <div className="flex justify-center">
                  <button type="button" onClick={refresh} className="c97-btn-ghost mba-ghost">
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Try again
                  </button>
                </div>
              </>
            ) : displayJobs.length === 0 ? (
              <StatusPanel
                title="No roles found right now."
                message="No tracked postings matched the current search, location, or role filters. Try broadening the role family, switching role type, or clearing the filters."
                icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
              />
            ) : (
              <>
                <div
                  className="grid md:grid-cols-2 xl:grid-cols-3"
      style={{ gap: "var(--c97-sp-3)" }}
                  data-testid="live-jobs-grid"
                >
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
                {displayJobs.length > visibleJobs.length && (
                  <div className="flex justify-center" style={{ marginTop: "var(--c97-sp-4)" }}>
                    <button
                      type="button"
                      className="c97-btn"
                      onClick={() => setVisibleJobCount((n) => n + JOB_PAGE_SIZE)}
                    >
                      Show more ({visibleJobs.length} of {displayJobs.length} shown)
                    </button>
                  </div>
                )}
              </>
            )}
            {!isLoading && !error && (
              <p className="c97-meta" style={{ marginTop: "var(--c97-sp-3)" }}>
                {visibleJobs.length} of {displayJobs.length} role{displayJobs.length !== 1 ? "s" : ""} shown ·{" "}
                {formatFetchedAt(lastFetchedAt)} · Polls every 30 min
                {showSourceHealth && (
                  <a href="#mba-source-health-heading" className="c97-link">
                    Source health
                  </a>
                )}
              </p>
            )}
            </div>
          </section>

          <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-labelledby="mba-role-tracker-companies-heading">
            <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
            <SectionLead
              kicker="Tracked companies"
              title="Choose which live feeds stay in view."
              description="Toggle the companies I can poll directly. Manual-only targets stay separate in Manual checks below."
              id="mba-role-tracker-companies-heading"
            />
            <CompanyFilterStrip
              watchedIds={watchedCompanyIds}
              onToggle={toggleCompany}
              onSelectAll={() => setAllCompanies(true)}
              onClearAll={() => setAllCompanies(false)}
            />
            {showSourceHealth && (
              <div style={{ marginTop: "var(--c97-sp-4)" }}>
                <SourceHealthPanel sourceStatuses={sourceStatuses} />
              </div>
            )}
            </div>
          </section>

          <SearchElsewhereStrip currentState={uiState} />

          {manualCompanies.length > 0 && (
            <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-labelledby="mba-role-tracker-manual-heading">
              <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
              <SectionLead
                kicker="Manual checks"
                title="Fallback paths for companies without stable public feeds."
                description="These LinkedIn and career-page shortcuts preserve your current role intent so you can still move quickly when a direct feed is unavailable."
                id="mba-role-tracker-manual-heading"
              />
              <div
                className="grid md:grid-cols-2 xl:grid-cols-3"
      style={{ gap: "var(--c97-sp-3)" }}
                data-testid="manual-checks-grid"
              >
                {manualCompanies.map((c) => (
                  <ManualCompanyCard key={c.id} company={c} currentState={uiState} />
                ))}
              </div>
              </div>
            </section>
          )}

        </>
      )}
    </>
  );
}
