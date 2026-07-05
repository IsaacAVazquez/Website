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
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  CalendarDays,
  CircleAlert,
  Download,
  Edit3,
  ExternalLink,
  Mail,
  MapPin,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  EditorialPillButton,
  StatusPanel,
  UtilityStrip,
  getPillStyle,
} from "@/components/editorial";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import { Chip } from "@/components/ui/Chip";
import { Kicker } from "@/components/ui/Kicker";
import { Briefcase, ChartBar, Article, FileText, Mail as MailIcon } from "@/components/ui/ServerIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  MBA_APPLICATION_PRIORITY_LABELS,
  MBA_APPLICATION_STATUSES,
  MBA_APPLICATION_STATUS_LABELS,
} from "@/lib/mba-applications";
import { useMBAApplications } from "@/hooks/useMBAApplications";
import { useMBAJobs } from "@/hooks/useMBAJobs";
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
} from "./mba-jobs-state";
import dynamic from "next/dynamic";
import {
  applicationInputClass,
  applicationInputStyle,
  type ApplicationFormState,
} from "./application-form";

// Interaction-gated dialogs are code-split so their chunks load only when a
// user opens them — keeping them out of this large client page's initial bundle.
const EmailDigestDialog = dynamic(() => import("./EmailDigestDialog"));
const ApplicationEditDialog = dynamic(() => import("./ApplicationEditDialog"));

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const noMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string): string {
  const timestamp = getPostedAtTime(iso);
  if (!timestamp) return "";
  const diff = timestamp - Date.now();
  const absDiff = Math.abs(diff);
  if (absDiff < 60_000) return "just now";
  if (absDiff < 3_600_000)
    return RELATIVE_FORMATTER.format(Math.round(diff / 60_000), "minute");
  if (absDiff < 86_400_000)
    return RELATIVE_FORMATTER.format(Math.round(diff / 3_600_000), "hour");
  return RELATIVE_FORMATTER.format(Math.round(diff / 86_400_000), "day");
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatFetchedAt(d: Date | null): string {
  if (!d) return "—";
  return DATE_FORMATTER.format(d);
}

function getPostedAtTime(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

const CATEGORY_COLOR: Record<MBACategory | "all", string> = {
  all: "var(--home-ink)",
  "big-tech": "color-mix(in srgb, var(--home-ink) 68%, var(--home-stone) 32%)",
  fintech: "color-mix(in srgb, var(--home-positive) 60%, var(--home-ink))",
  startup: "var(--home-signal)",
};

const CHIP_FONT_FAMILY = "var(--font-home-sans)";
const TRACKED_COMPANY_CATEGORIES: MBACategory[] = ["fintech", "startup", "big-tech"];

const ROLE_TYPE_STYLES: Record<
  MBAJobRoleType,
  { accent: string; backgroundWeight: number; borderWeight: number }
> = {
  internship: {
    accent: "var(--home-signal)",
    backgroundWeight: 24,
    borderWeight: 34,
  },
  "full-time": {
    accent: "color-mix(in srgb, var(--home-ink) 72%, var(--home-stone))",
    backgroundWeight: 20,
    borderWeight: 30,
  },
  unclear: {
    accent: "var(--home-ink-muted)",
    backgroundWeight: 18,
    borderWeight: 28,
  },
};

const APPLICATION_STATUS_ACCENTS: Record<MBAApplicationStatus, string> = {
  saved: "var(--home-ink-muted)",
  applied: "var(--home-signal)",
  interviewing: "var(--home-warning)",
  offer: "var(--home-positive)",
  rejected: "var(--home-negative)",
  archived: "var(--home-ink-muted)",
};

const APPLICATION_PRIORITY_ACCENTS: Record<MBAApplicationPriority, string> = {
  low: "var(--home-stone)",
  medium: "var(--home-warning)",
  high: "var(--home-signal)",
};

const ACTIVE_APPLICATION_STATUSES: MBAApplicationStatus[] = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

function getReadableAccentColor(accent: string): string {
  return `color-mix(in srgb, var(--home-ink) 76%, ${accent} 24%)`;
}

function getChipStyle(
  accent: string,
  backgroundWeight = 18,
  borderWeight = 28
): CSSProperties {
  return {
    background: `color-mix(in srgb, ${accent} ${backgroundWeight}%, var(--home-paper))`,
    border: `1px solid color-mix(in srgb, ${accent} ${borderWeight}%, var(--home-rule))`,
    color: getReadableAccentColor(accent),
    fontFamily: CHIP_FONT_FAMILY,
    letterSpacing: "0.01em",
  };
}

function getRoleFamilyAccent(family: MBAJobRoleFamily): string {
  if (family === "product" || family === "product-marketing") {
    return "var(--home-signal)";
  }
  if (family === "finance" || family === "analytics") {
    return "color-mix(in srgb, var(--home-positive) 55%, var(--home-ink))";
  }
  return "color-mix(in srgb, var(--home-ink) 70%, var(--home-stone))";
}

function getTrackedCompanyButtonStyle(company: MBACompany, active: boolean): CSSProperties {
  if (active) {
    return {
      background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
      borderColor: `color-mix(in srgb, ${company.color} 28%, var(--home-rule))`,
      color: "var(--home-ink)",
      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
      fontFamily: CHIP_FONT_FAMILY,
    };
  }

  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
    borderColor: "var(--home-rule)",
    color: "var(--home-ink-muted)",
    fontFamily: CHIP_FONT_FAMILY,
  };
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

function getTodayDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateKey(value: string | null): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_KEY_FORMATTER.format(date);
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
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
    <div className="home-section-intro gap-3">
      <div className="space-y-2">
        <Kicker variant="plain" className="mb-0">
          {kicker}
        </Kicker>
        <h2
          id={id}
          className="home-project-title mb-0 max-w-[18ch]"
          style={{ color: "var(--home-ink)" }}
        >
          {title}
        </h2>
      </div>
      <p className="home-note-copy mb-0 max-w-[40rem]">{description}</p>
    </div>
  );
}

function CompanyAvatar({ company }: { company: MBACompany | undefined }) {
  const color = company?.color ?? "var(--home-signal)";
  const initials = company?.logoInitials ?? "??";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
      style={{ background: color }}
      aria-hidden="true"
    >
      <span style={{ color: "var(--home-paper)" }}>{initials}</span>
    </div>
  );
}

function NewBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-[0.12em]"
      style={{
        background: "var(--home-signal)",
        color: "var(--home-ink)",
        fontFamily: CHIP_FONT_FAMILY,
      }}
    >
      New
    </span>
  );
}

function CategoryChip({ category }: { category: MBACategory }) {
  const color = CATEGORY_COLOR[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle(color, 18, 28)}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function RoleTypeChip({ roleType }: { roleType: MBAJobRoleType }) {
  const style = ROLE_TYPE_STYLES[roleType];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle(
        style.accent,
        style.backgroundWeight,
        style.borderWeight
      )}
    >
      {ROLE_TYPE_LABELS[roleType]}
    </span>
  );
}

function RoleFamilyChip({ family }: { family: MBAJobRoleFamily }) {
  const accent = getRoleFamilyAccent(family);

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle(accent, 18, 28)}
    >
      {MBA_ROLE_FAMILY_LABELS[family]}
    </span>
  );
}

function ApplicationStatusChip({ status }: { status: MBAApplicationStatus }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle(APPLICATION_STATUS_ACCENTS[status], 18, 30)}
    >
      {MBA_APPLICATION_STATUS_LABELS[status]}
    </span>
  );
}

function ExternalLeadChip({ sourceName }: { sourceName?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle("var(--home-signal)", 16, 28)}
    >
      {sourceName ? `${sourceName} lead` : "External lead"}
    </span>
  );
}

function ApplicationPriorityChip({ priority }: { priority: MBAApplicationPriority }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-2xs font-semibold"
      style={getChipStyle(APPLICATION_PRIORITY_ACCENTS[priority], 14, 24)}
    >
      {MBA_APPLICATION_PRIORITY_LABELS[priority]} priority
    </span>
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
      className={`home-button ${
        variant === "primary" ? "home-button-primary" : "home-button-secondary"
      } px-4 py-3 text-sm`}
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
}: {
  job: MBAJob;
  isNew: boolean;
  application: MBATrackedApplication | undefined;
  onMarkSeen: () => void;
  onTrack: () => void;
  onMarkApplied: () => void;
  onEditApplication: () => void;
  currentState: MBAJobsSearchState;
}) {
  const company = MBA_COMPANY_MAP.get(job.companyId);
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    [currentState.q.trim(), job.title, job.companyName].filter(Boolean).join(" ")
  )}`;
  const relativePostedAt = timeAgo(job.postedAt);

  return (
    <article
      className="home-card flex h-full flex-col p-6 sm:p-7"
      onMouseEnter={onMarkSeen}
    >
      <div className="flex h-full flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <CompanyAvatar company={company} />
            <div className="min-w-0">
              <p className="home-meta mb-0">{job.companyName}</p>
              <p className="mb-0 mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                {job.department}
                {job.sourceName ? ` · via ${job.sourceName}` : ""}
              </p>
            </div>
          </div>
          <div
            data-testid={`job-card-${job.id}-chips`}
            className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end"
          >
            {isNew && <NewBadge />}
            {application && <ApplicationStatusChip status={application.status} />}
            {job.atsType === "external-api" && (
              <ExternalLeadChip sourceName={job.sourceName} />
            )}
            <RoleTypeChip roleType={job.roleType} />
            <CategoryChip category={job.category} />
          </div>
        </div>

        <div className="space-y-3">
          <h3
            className="mb-0 text-lg font-semibold leading-[1.08] tracking-[-0.04em] sm:text-xl"
            style={{
              fontFamily: "var(--font-home-sans)",
              color: "var(--home-ink)",
            }}
          >
            {job.title}
          </h3>

          {job.snippet && (
            <p className="home-note-copy mb-0 line-clamp-3 break-words">{job.snippet}</p>
          )}
        </div>

        {job.roleFamilies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.roleFamilies.map((family) => (
              <RoleFamilyChip key={`${job.id}-${family}`} family={family} />
            ))}
          </div>
        )}

        <div
          className="mt-auto border-t border-[var(--home-rule)] pt-5"
        >
          <p className="home-meta mb-0">
            {relativePostedAt ? (
              <>
                {job.location} ·{" "}
                <time
                  dateTime={job.postedAt}
                  title={`Posted ${DATE_FORMATTER.format(new Date(job.postedAt))}`}
                >
                  {relativePostedAt}
                </time>
              </>
            ) : (
              job.location
            )}
          </p>
          {job.sourceName && (
            <p className="home-note-copy mb-0 mt-2 text-sm">
              Found through {job.sourceName}
              {job.sourceUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[var(--home-rule)] underline-offset-4"
                  >
                    Source
                  </a>
                </>
              ) : null}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onTrack();
                onMarkSeen();
              }}
              className="home-button home-button-secondary px-4 py-3 text-sm"
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
              className="home-button home-button-secondary px-4 py-3 text-sm"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
              Mark applied
            </button>
            {application && (
              <button
                type="button"
                onClick={onEditApplication}
                className="home-button home-button-secondary px-4 py-3 text-sm"
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
      className="home-card flex h-full flex-col p-6 sm:p-7"
    >
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyAvatar company={company} />
            <div className="min-w-0">
              <p className="home-meta mb-0">{company.name}</p>
              <p className="mb-0 mt-1 text-sm" style={{ color: "var(--home-ink-muted)" }}>
                Manual fallback
              </p>
            </div>
          </div>
          <CategoryChip category={company.category} />
        </div>

        <p className="home-note-copy mb-0">
          I do not have a stable public feed for this company yet, so I keep the career page and
          a role-aware LinkedIn search here instead.
        </p>

        <div
          className="mt-auto border-t border-[var(--home-rule)] pt-5"
        >
          <div className="flex flex-wrap items-center gap-3">
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
    <section className="space-y-4" aria-labelledby="mba-search-elsewhere-heading">
      <SectionLead
        kicker="Search elsewhere"
        title="Open the same search on outside boards."
        description="These are outbound searches only. LinkedIn stays a shortcut here, not a server-side source."
        id="mba-search-elsewhere-heading"
      />
      <div className="section-panel">
        <div className="flex flex-wrap gap-3">
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
    </section>
  );
}

function JobGridSkeleton() {
  return (
    <div
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-live="polite"
      aria-label="Loading jobs"
    >
      {[0, 1, 2, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="home-card flex flex-col gap-4 p-6 sm:p-7"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 animate-pulse rounded-lg"
              style={{ background: "color-mix(in srgb, var(--home-stone) 40%, var(--home-paper))" }}
            />
            <div className="space-y-2">
              <div
                className="h-2.5 w-20 animate-pulse rounded-full"
                style={{ background: "color-mix(in srgb, var(--home-stone) 40%, var(--home-paper))" }}
              />
              <div
                className="h-2 w-14 animate-pulse rounded-full"
                style={{ background: "color-mix(in srgb, var(--home-stone) 30%, var(--home-paper))" }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="h-4 w-3/4 animate-pulse rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-stone) 40%, var(--home-paper))" }}
            />
            <div
              className="h-3 w-1/2 animate-pulse rounded-full"
              style={{ background: "color-mix(in srgb, var(--home-stone) 30%, var(--home-paper))" }}
            />
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 ease"
          style={getPillStyle(false)}
          aria-label={`Sort: ${SORT_LABELS[value]}`}
        >
          <span
            className="text-2xs font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-home-sans)" }}
          >
            Sort
          </span>
          <span>{SORT_LABELS[value]}</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[12rem] rounded-[var(--radius-3xl)] border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] p-1.5 text-[var(--home-ink)] shadow-[var(--shadow-lg)]"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as MBASortOrder)}
        >
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem
              key={opt}
              value={opt}
              className="rounded-[var(--radius-2xl)] py-2 pl-8 pr-3 text-sm font-medium focus:bg-[color-mix(in_srgb,var(--home-paper-alt)_90%,var(--home-elev-mix))]"
              style={{ fontFamily: "var(--font-home-sans)" }}
            >
              {SORT_LABELS[opt]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
        className="inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
        style={{
          color: "color-mix(in srgb, var(--home-signal) 78%, var(--home-ink))",
          borderColor: "color-mix(in srgb, var(--home-signal) 40%, var(--home-rule))",
          background: "color-mix(in srgb, var(--home-signal) 18%, var(--home-paper))",
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
        className="inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 py-2 text-sm"
        style={{ color: "var(--home-ink-muted)", borderColor: "var(--home-rule)" }}
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
      className="home-button home-button-secondary text-sm"
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      Enable notifications
    </button>
  );
}

function EmailDigestButton({
  onSend,
  sending,
  result,
  onClear,
  disabled,
}: {
  onSend: () => void;
  sending: boolean;
  result: { ok: boolean; message: string } | null;
  onClear: () => void;
  disabled: boolean;
}) {
  if (result) {
    return (
      <div
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
        style={{
          color: result.ok
            ? "color-mix(in srgb, var(--home-positive) 60%, var(--home-ink))"
            : "color-mix(in srgb, var(--home-negative) 55%, var(--home-ink))",
          borderColor: result.ok
            ? "color-mix(in srgb, var(--home-positive) 36%, var(--home-rule))"
            : "color-mix(in srgb, var(--home-negative) 32%, var(--home-rule))",
          background: result.ok
            ? "color-mix(in srgb, var(--home-positive) 10%, var(--home-paper))"
            : "color-mix(in srgb, var(--home-negative) 10%, var(--home-paper))",
        }}
        role="status"
      >
        {result.message}
        <button
          type="button"
          onClick={onClear}
          className="ml-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-xs opacity-70 transition-opacity duration-200 ease hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onSend}
      disabled={disabled || sending}
      className="home-button home-button-secondary text-sm disabled:opacity-50"
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {sending ? "Sending…" : "Email digest"}
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
    <div className="section-panel" style={style}>
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 rounded-[var(--radius-3xl)] border px-4 py-4 text-left transition-[border-color,background-color] duration-200 ease sm:items-center"
        style={{
          borderColor: "var(--home-rule)",
          background: "color-mix(in srgb, var(--home-paper-alt) 56%, var(--home-elev-mix))",
        }}
        aria-expanded={isExpanded}
        aria-controls="tracked-companies-controls"
      >
        <div className="space-y-3">
          <div>
            <p className="home-meta mb-0">Tracked company feeds</p>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--home-ink-muted)", fontFamily: CHIP_FONT_FAMILY }}
            >
              {watchedLiveCount} of {totalLiveCount} live boards are in your scan right now.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="resume-chip">{totalLiveCount} live feeds</span>
            <span className="resume-chip">{watchedLiveCount} watched now</span>
            <span className="resume-chip">{groups.length} company groups</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden text-2xs font-semibold uppercase tracking-[0.12em] sm:inline"
            style={{ color: "var(--home-ink-muted)", fontFamily: CHIP_FONT_FAMILY }}
          >
            {isExpanded ? "Hide list" : "Show list"}
          </span>
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: "var(--home-rule)",
              background: "var(--home-paper-raised)",
            }}
            aria-hidden="true"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ease ${
                isExpanded ? "rotate-180" : ""
              }`}
              style={{ color: "var(--home-ink-muted)" }}
            />
          </span>
        </div>
      </button>

      {isExpanded && (
        <div id="tracked-companies-controls" className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="resume-chip">{totalLiveCount} live feeds</span>
              <span className="resume-chip">{watchedLiveCount} watched now</span>
              <span className="resume-chip">{groups.length} company groups</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                disabled={allOn}
                className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-2xs font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color] duration-200 ease disabled:opacity-40"
                style={{
                  ...getPillStyle(false),
                  color: "var(--home-signal)",
                }}
              >
                All on
              </button>
              <button
                type="button"
                onClick={onClearAll}
                disabled={allOff}
                className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-2xs font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color] duration-200 ease disabled:opacity-40"
                style={getPillStyle(false)}
              >
                All off
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {groups.map((group) => {
              const watchedCount = group.companies.filter((company) => watchedIds.has(company.id)).length;
              const isGroupExpanded = expandedGroups[group.category];

              return (
                <div
                  key={group.category}
                  data-testid={`tracked-companies-${group.category}`}
                  className="rounded-[var(--radius-3xl)] border p-3 sm:p-4"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 58%, var(--home-elev-mix))",
                  }}
                >
                  <button
                    type="button"
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[var(--radius-2xl)] px-2 py-1.5 text-left transition-[background-color] duration-150 ease"
                    style={{ color: "var(--home-ink)" }}
                    aria-expanded={isGroupExpanded}
                    aria-controls={`tracked-companies-panel-${group.category}`}
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.category]: !current[group.category],
                      }))
                    }
                  >
                    <div className="min-w-0">
                      <p className="home-meta mb-0">{group.label}</p>
                      <p
                        className="mt-1 text-xs"
                        style={{ fontFamily: CHIP_FONT_FAMILY, color: "var(--home-ink-muted)" }}
                      >
                        {watchedCount} / {group.companies.length} watched
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 ease ${
                        isGroupExpanded ? "rotate-180" : ""
                      }`}
                      style={{ color: "var(--home-ink-muted)" }}
                      aria-hidden="true"
                    />
                  </button>
                  {isGroupExpanded && (
                    <div
                      id={`tracked-companies-panel-${group.category}`}
                      className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-2"
                    >
                      {group.companies.map((company) => {
                        const active = watchedIds.has(company.id);
                        return (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => onToggle(company.id)}
                            className="inline-flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-2xl)] border px-3 py-3 text-left text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 ease"
                            style={getTrackedCompanyButtonStyle(company, active)}
                            aria-pressed={active}
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: active ? company.color : "var(--home-stone)" }}
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

function ApplicationCard({
  application,
  onStatusChange,
  onEdit,
  onArchive,
  onRemove,
}: {
  application: MBATrackedApplication;
  onStatusChange: (status: MBAApplicationStatus) => void;
  onEdit: () => void;
  onArchive: () => void;
  onRemove: () => void;
}) {
  const followUpIsDue =
    application.followUpDate !== null && application.followUpDate <= getTodayDateKey();
  return (
    <article
      className="rounded-[var(--radius-3xl)] border p-4"
      style={{
        borderColor: "var(--home-rule)",
        background: "color-mix(in srgb, var(--home-paper-alt) 72%, var(--home-elev-mix))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="home-meta mb-0">{application.jobSnapshot.companyName}</p>
          <h3
            className="mb-0 mt-2 text-base font-semibold leading-tight"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {application.jobSnapshot.title}
          </h3>
        </div>
        <ApplicationPriorityChip priority={application.priority} />
      </div>
      <p className="home-note-copy mb-0 mt-3 text-sm">
        {application.jobSnapshot.department} · {application.jobSnapshot.location}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <ApplicationStatusChip status={application.status} />
        {application.followUpDate && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-2xs font-semibold"
            style={getChipStyle(
              followUpIsDue ? "var(--home-signal)" : "var(--home-ink-muted)",
              16,
              26
            )}
          >
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            Follow up {formatDateKey(application.followUpDate)}
          </span>
        )}
        {application.deadline && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-2xs font-semibold"
            style={getChipStyle("var(--home-warning)", 14, 24)}
          >
            Due {formatDateKey(application.deadline)}
          </span>
        )}
      </div>
      {application.notes && (
        <p className="home-note-copy mb-0 mt-4 line-clamp-3 text-sm">{application.notes}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--home-rule)] pt-4">
        <select
          value={application.status}
          onChange={(event) => onStatusChange(event.target.value as MBAApplicationStatus)}
          className="min-h-[44px] rounded-full border px-3 py-2 text-sm"
          style={applicationInputStyle}
          aria-label={`Application status for ${application.jobSnapshot.title}`}
        >
          {MBA_APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {MBA_APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button type="button" onClick={onEdit} className="home-button home-button-secondary text-sm">
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
          <button type="button" onClick={onArchive} className="home-button home-button-secondary text-sm">
            Archive
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          style={{
            ...getPillStyle(false),
            color: "color-mix(in srgb, var(--home-signal) 55%, var(--home-ink))",
          }}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}

function ApplicationPipeline({
  applications,
  onCreate,
  onEdit,
  onStatusChange,
  onArchive,
  onRemove,
  onExportJson,
  onExportCsv,
  onImport,
}: {
  applications: MBATrackedApplication[];
  onCreate: () => void;
  onEdit: (application: MBATrackedApplication) => void;
  onStatusChange: (id: string, status: MBAApplicationStatus) => void;
  onArchive: (id: string) => void;
  onRemove: (id: string) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImport: (content: string) => { imported: number; total: number };
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MBAApplicationStatus | "all">("all");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const today = getTodayDateKey();

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      if (statusFilter === "all" && application.status === "archived") return false;
      if (statusFilter !== "all" && application.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [
        application.jobSnapshot.companyName,
        application.jobSnapshot.title,
        application.jobSnapshot.location,
        application.jobSnapshot.department,
        application.notes,
        application.contact,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [applications, query, statusFilter]);

  const overdueCount = applications.filter(
    (application) =>
      application.status !== "archived" &&
      application.followUpDate !== null &&
      application.followUpDate < today
  ).length;
  const todayCount = applications.filter(
    (application) =>
      application.status !== "archived" && application.followUpDate === today
  ).length;
  const activeCount = applications.filter(
    (application) => application.status !== "archived"
  ).length;
  const statusesToShow =
    statusFilter === "all" ? ACTIVE_APPLICATION_STATUSES : [statusFilter];

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
    <section className="space-y-4" aria-labelledby="mba-application-pipeline-heading">
      <SectionLead
        kicker="Applications"
        title="Work the pipeline, not another spreadsheet."
        description="Track roles from the live feed, add manual opportunities, and keep follow-ups visible without sending personal application data to the server."
        id="mba-application-pipeline-heading"
      />
      <div className="section-panel space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-3xl)] border p-4" style={{ borderColor: "var(--home-rule)" }}>
            <p className="home-meta mb-0">Active applications</p>
            <p className="mb-0 mt-2 text-2xl font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
              {activeCount}
            </p>
          </div>
          <div className="rounded-[var(--radius-3xl)] border p-4" style={{ borderColor: "var(--home-rule)" }}>
            <p className="home-meta mb-0">Due today</p>
            <p className="mb-0 mt-2 text-2xl font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
              {todayCount}
            </p>
          </div>
          <div className="rounded-[var(--radius-3xl)] border p-4" style={{ borderColor: "var(--home-rule)" }}>
            <p className="home-meta mb-0">Overdue follow-ups</p>
            <p className="mb-0 mt-2 text-2xl font-semibold tabular-nums" style={{ color: "var(--home-ink)" }}>
              {overdueCount}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:min-w-[34rem]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--home-ink-muted)" }}
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company, role, notes, contact..."
                aria-label="Search applications"
                className="w-full min-h-[48px] rounded-[var(--radius-3xl)] border pl-11 pr-4 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease focus-visible:border-[var(--home-signal)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--home-signal)_35%,transparent)]"
                style={applicationInputStyle}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as MBAApplicationStatus | "all")
              }
              className={applicationInputClass}
              style={applicationInputStyle}
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

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCreate} className="home-button home-button-primary text-sm">
              Add application
            </button>
            <button type="button" onClick={onExportJson} className="home-button home-button-secondary text-sm">
              <Download className="h-4 w-4" aria-hidden="true" />
              JSON backup
            </button>
            <button type="button" onClick={onExportCsv} className="home-button home-button-secondary text-sm">
              <Download className="h-4 w-4" aria-hidden="true" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="home-button home-button-secondary text-sm"
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
          <p className="home-note-copy mb-0" role="status">
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
          <div className="grid gap-4 xl:grid-cols-5">
            {statusesToShow.map((status) => {
              const statusApplications = filteredApplications.filter(
                (application) => application.status === status
              );
              return (
                <div key={status} className="space-y-3">
                  <div
                    className="flex items-center justify-between rounded-[var(--radius-3xl)] border px-3 py-3"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 72%, var(--home-elev-mix))",
                    }}
                  >
                    <p className="home-meta mb-0">{MBA_APPLICATION_STATUS_LABELS[status]}</p>
                    <span className="resume-chip">{statusApplications.length}</span>
                  </div>
                  {statusApplications.length === 0 ? (
                    <div
                      className="rounded-[var(--radius-3xl)] border border-dashed p-4 text-sm"
                      style={{
                        borderColor: "var(--home-rule)",
                        color: "var(--home-ink-muted)",
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
    </section>
  );
}

function SourceHealthPanel({
  sourceStatuses,
  isLoading,
}: {
  sourceStatuses: MBAJobsSourceStatus[];
  isLoading: boolean;
}) {
  if (isLoading || sourceStatuses.length === 0) return null;

  const okCount = sourceStatuses.filter((status) => status.status === "ok").length;
  const failedCount = sourceStatuses.filter((status) => status.status === "failed").length;
  const skippedCount = sourceStatuses.filter((status) => status.status === "skipped").length;
  const externalDisabledCount = sourceStatuses.filter(
    (status) => status.status === "external-disabled"
  ).length;

  return (
    <section className="space-y-4" aria-labelledby="mba-source-health-heading">
      <SectionLead
        kicker="Source health"
        title="Know which feeds answered."
        description="The tracker separates healthy feeds, failed requests, and manual-only sources so partial results are easier to trust."
        id="mba-source-health-heading"
      />
      <div className="section-panel">
        <div className="flex flex-wrap gap-2">
          <span className="resume-chip">{okCount} healthy</span>
          <span className="resume-chip">{failedCount} failed</span>
          <span className="resume-chip">{skippedCount} manual-only</span>
          {externalDisabledCount > 0 && (
            <span className="resume-chip">{externalDisabledCount} external disabled</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {sourceStatuses.map((source) => {
            const accent =
              source.status === "ok"
                ? "var(--home-positive)"
                : source.status === "failed"
                  ? "var(--home-negative)"
                  : source.status === "external-disabled"
                    ? "var(--home-warning)"
                    : "var(--home-stone)";
            return (
              <span
                key={`${source.companyId}-${source.status}`}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-semibold"
                style={getChipStyle(accent, 14, 24)}
                title={source.message}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                  aria-hidden="true"
                />
                {source.companyName} ·{" "}
                {source.status === "ok" ? `${source.jobCount} roles` : source.status}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

interface MBAJobsClientProps {
  initialState: MBAJobsSearchState;
}

export function MBAJobsClient({ initialState }: MBAJobsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? noMotion : fadeIn;
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
    sendEmailDigest,
    emailSending,
    emailResult,
    clearEmailResult,
  } = useMBAJobs({ externalLeads: uiState.external === "on" });

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
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
    archiveApplication,
    removeApplication,
    importApplications,
    exportJson,
    exportCsv,
  } = useMBAApplications();
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

  // ── Manual (Big Tech) companies filtered by category ─────────────────
  const manualCompanies = useMemo(() => {
    const all = MBA_COMPANIES.filter((c) => c.atsType === "manual");
    if (uiState.category === "all") return all;
    return all.filter((c) => c.category === uiState.category);
  }, [uiState.category]);

  const totalTracked = MBA_COMPANIES.filter((c) => c.atsType !== "manual").length;
  const totalCompanies = MBA_COMPANIES.length;
  const externalLeadCount = jobs.filter((job) => job.atsType === "external-api").length;
  const internshipCount = jobs.filter((job) => job.roleType === "internship").length;
  const fullTimeCount = jobs.filter((job) => job.roleType === "full-time").length;
  const normalizedLocationFilter = normalizeSearchText(uiState.location);
  const matchingRoleCount = locationScopedEntries.length;
  const refreshLabel = isLoading
    ? "Loading…"
    : lastFetchedAt
      ? `Updated ${formatFetchedAt(lastFetchedAt)}`
      : "Not yet fetched";

  const lastRefreshRelative = isLoading
    ? "Refreshing"
    : lastFetchedAt
      ? timeAgo(lastFetchedAt.toISOString())
      : "—";

  const statsCells: HomeStatsCell[] = [
    {
      label: "Live roles",
      value: <span className="tabular-nums">{isLoading ? "—" : jobs.length}</span>,
      sub: "Across tracked feeds",
    },
    {
      label: "Internships",
      value: <span className="tabular-nums">{isLoading ? "—" : internshipCount}</span>,
      sub: "Summer and intern roles",
    },
    {
      label: "Full-time",
      value: <span className="tabular-nums">{isLoading ? "—" : fullTimeCount}</span>,
      sub: "Post-MBA roles",
    },
    {
      label: "New since last visit",
      value: <span className="tabular-nums">{isLoading ? "—" : newJobCount}</span>,
      sub: newJobCount > 0 ? "Mark all seen to clear" : "Caught up",
      tone: newJobCount > 0 ? "good" : "default",
    },
    {
      label: "Tracked apps",
      value: <span className="tabular-nums">{activeApplications.length}</span>,
      sub: "Browser-local pipeline",
      tone: activeApplications.length > 0 ? "good" : "default",
    },
    {
      label: "Companies tracked",
      value: <span className="tabular-nums">{totalCompanies}</span>,
      sub: "Public boards plus manual fallbacks",
    },
    {
      label: "Live feeds",
      value: <span className="tabular-nums">{totalTracked}</span>,
      sub: "Auto-polled boards",
    },
    {
      label: "External leads",
      value: <span className="tabular-nums">{externalLeadCount}</span>,
      sub: uiState.external === "on" ? "Opt-in aggregator" : "Off by default",
    },
    {
      label: "Manual fallbacks",
      value: <span className="tabular-nums">{manualCompanies.length}</span>,
      sub: "Career page or LinkedIn search",
    },
    {
      label: "Last refresh",
      value: lastRefreshRelative,
      sub: "Polls every 30 min",
    },
  ];

  async function handleEmailSend(email: string) {
    setEmailDialogOpen(false);
    await sendEmailDigest(email, displayJobs.length > 0 ? displayJobs : jobs);
  }

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

    if (application) {
      updateApplication(application.id, {
        status: form.status,
        priority: form.priority,
        notes: form.notes,
        contact: form.contact,
        sourceUrl: form.sourceUrl,
        followUpDate,
        deadline,
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
      });
    }

    setApplicationDialogOpen(false);
    setEditingApplication(null);
  }

  function handleTrackJob(job: MBAJob, status: MBAApplicationStatus = "saved") {
    trackJob(job, status);
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
      {emailDialogOpen && (
        <EmailDigestDialog
          isOpen
          onClose={() => setEmailDialogOpen(false)}
          onSubmit={handleEmailSend}
          sending={emailSending}
        />
      )}
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

      <section className="home-page min-h-screen" aria-label="MBA role tracker">
        <div className="home-shell home-section space-y-8 sm:space-y-10">
          <HomeStatsPanel
            id="mba-jobs-stats"
            title="MBA tracker at a glance"
            meta={refreshLabel}
            cells={statsCells}
            pills={[
              {
                label: "Internships",
                href: buildMBAJobsHref({ ...uiState, view: "feed", roleType: "internship" }),
                icon: Briefcase,
              },
              {
                label: "Product",
                href: buildMBAJobsHref({ ...uiState, view: "feed", roleFamily: "product" }),
                icon: ChartBar,
              },
              {
                label: "Finance",
                href: buildMBAJobsHref({ ...uiState, view: "feed", roleFamily: "finance" }),
                icon: FileText,
              },
              {
                label: "Strategy",
                href: buildMBAJobsHref({ ...uiState, view: "feed", roleFamily: "strategy" }),
                icon: Article,
              },
              {
                label: "Newsletter",
                href: "/contact",
                icon: MailIcon,
              },
            ]}
          />

          <motion.div
            className="section-panel overflow-hidden"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="space-y-4">
                <p
                  className="home-kicker mb-0"
                  style={{ color: "var(--home-signal)", fontFamily: "var(--font-home-sans)" }}
                >
                  MBA recruiting
                </p>
                <h1 className="home-section-title mb-0 max-w-[9ch]">Job search</h1>
                <p className="home-body mb-0 max-w-[44rem]">
                  I monitor {totalTracked} public job boards across {totalCompanies} target
                  companies for internships and full-time product, PMM, strategy, operations,
                  growth, finance, analytics, and adjacent business roles. External leads stay
                  opt-in, and LinkedIn stays an outbound search shortcut instead of a scraped feed.
                </p>
              </div>
              <div className="grid gap-3 self-start sm:grid-cols-2 xl:grid-cols-1">
                <div
                  className="rounded-[var(--radius-3xl)] border p-4"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-elev-mix))",
                  }}
                >
                  <p className="home-meta mb-0">Coverage</p>
                  <p className="home-note-copy mb-0 mt-3">
                    {totalTracked} live public feeds plus manual fallbacks across {totalCompanies}{" "}
                    companies.
                  </p>
                </div>
                <div
                  className="rounded-[var(--radius-3xl)] border p-4"
                  style={{
                    borderColor: "var(--home-rule)",
                    background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-elev-mix))",
                  }}
                >
                  <p className="home-meta mb-0">Workflow</p>
                  <p className="home-note-copy mb-0 mt-3">
                    Search the board, narrow by role and company type, then use alerts and digests
                    when you want a faster recruiting scan.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--home-rule)] pt-6">
              <div className="flex flex-wrap gap-2">
                <span className="resume-chip">
                    {isLoading ? "Loading…" : `${jobs.length} live roles`}
                </span>
                {!isLoading && <span className="resume-chip">{internshipCount} internships</span>}
                {!isLoading && <span className="resume-chip">{fullTimeCount} full-time</span>}
                <Chip>{totalTracked} live feeds</Chip>
                {uiState.external === "on" && (
                  <span className="resume-chip">{externalLeadCount} external leads</span>
                )}
                <span className="resume-chip">{totalCompanies} target companies</span>
                <span className="resume-chip">{refreshLabel}</span>
                {!isLoading && newJobCount > 0 && (
                  <span
                    className="resume-chip"
                    style={{ background: "var(--home-signal)", color: "var(--home-ink)" }}
                  >
                    {newJobCount} new since last visit
                  </span>
                )}
                <span className="resume-chip">Polls every 30 min</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={refresh}
                disabled={isLoading}
                className="home-button home-button-secondary text-sm disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {isLoading ? "Loading…" : "Refresh now"}
              </button>

              <NotificationBell
                permission={notificationPermission}
                onRequest={requestNotificationPermission}
              />

              <EmailDigestButton
                onSend={() => setEmailDialogOpen(true)}
                sending={emailSending}
                result={emailResult}
                onClear={clearEmailResult}
                disabled={isLoading || jobs.length === 0}
              />

              {!isLoading && newJobCount > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="home-button home-button-secondary text-sm"
                >
                  Mark all seen
                </button>
              )}
            </div>

            <div
              className="mt-5 flex flex-wrap gap-2 border-t border-[var(--home-rule)] pt-5"
              role="tablist"
              aria-label="Job tracker view"
            >
              {(["feed", "applications"] as const).map((view) => (
                <EditorialPillButton
                  key={view}
                  active={uiState.view === view}
                  onClick={() => updateRouteState({ view })}
                  role="tab"
                  ariaSelected={uiState.view === view}
                  size="sm"
                >
                  {VIEW_LABELS[view]}
                </EditorialPillButton>
              ))}
            </div>
          </motion.div>

          <SourceHealthPanel sourceStatuses={sourceStatuses} isLoading={isLoading} />

          {uiState.view === "applications" ? (
            <ApplicationPipeline
              applications={applications}
              onCreate={() => openApplicationDialog(null)}
              onEdit={openApplicationDialog}
              onStatusChange={updateStatus}
              onArchive={archiveApplication}
              onRemove={removeApplication}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
              onImport={importApplications}
            />
          ) : (
            <>
          {fetchErrors.length > 0 && !isLoading && (
            <div
              className="flex items-start gap-3 rounded-[var(--radius-3xl)] px-5 py-4"
              style={{
                borderColor: "color-mix(in srgb, var(--home-signal) 32%, var(--home-rule))",
                background: "color-mix(in srgb, var(--home-signal) 10%, var(--home-paper))",
                border: "1px solid",
              }}
              role="status"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "color-mix(in srgb, var(--home-signal) 55%, var(--home-ink))" }}
                aria-hidden="true"
              />
              <p className="mb-0 text-sm" style={{ color: "var(--home-ink)" }}>
                Some companies could not be reached:{" "}
                {fetchErrors.map((e) => e.companyName).join(", ")}. Results shown are partial.
              </p>
            </div>
          )}

          <section className="space-y-4" aria-labelledby="mba-role-tracker-filters-heading">
            <SectionLead
              kicker="Filters"
              title="Search and narrow the board."
              description="Search roles, narrow by location, sort the feed, and filter by role type, role family, and company category without leaving the page."
              id="mba-role-tracker-filters-heading"
            />
            <motion.div
              className="section-panel"
              variants={variants}
              initial="hidden"
              animate="visible"
            >
              <div className="space-y-6">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)_auto] xl:items-center">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--home-ink-muted)" }}
                      aria-hidden="true"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={uiState.q}
                      onChange={(event) => updateRouteState({ q: event.target.value })}
                      placeholder="Search PM, PMM, strategy, ops, growth, finance..."
                      aria-label="Search roles"
                      className="w-full min-h-[48px] rounded-[var(--radius-3xl)] border pl-11 pr-12 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease focus-visible:border-[var(--home-signal)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--home-signal)_35%,transparent)]"
                      style={{
                        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                        borderColor: "var(--home-rule)",
                        color: "var(--home-ink)",
                        fontFamily: "var(--font-home-sans)",
                        paddingTop: "0.85rem",
                        paddingBottom: "0.85rem",
                      }}
                    />
                    {uiState.q && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRouteState({ q: "" });
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                        aria-label="Clear search"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--home-ink-muted)" }}
                      aria-hidden="true"
                    />
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={uiState.location}
                      onChange={(event) => updateRouteState({ location: event.target.value })}
                      placeholder="Remote, New York, San Francisco..."
                      aria-label="Filter by location"
                      className="w-full min-h-[48px] rounded-[var(--radius-3xl)] border pl-11 pr-12 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease focus-visible:border-[var(--home-signal)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--home-signal)_35%,transparent)]"
                      style={{
                        background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                        borderColor: "var(--home-rule)",
                        color: "var(--home-ink)",
                        fontFamily: "var(--font-home-sans)",
                        paddingTop: "0.85rem",
                        paddingBottom: "0.85rem",
                      }}
                    />
                    {uiState.location && (
                      <button
                        type="button"
                        onClick={() => {
                          updateRouteState({ location: "" });
                          locationInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)] focus-visible:ring-offset-2"
                        aria-label="Clear location filter"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <SortDropdown
                      value={uiState.sort}
                      onValueChange={(sort) => updateRouteState({ sort })}
                    />
                    {activeFilters && (
                      <button
                        type="button"
                        onClick={() => updateRouteState(DEFAULT_MBA_JOBS_STATE)}
                        className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ease"
                        style={getPillStyle(false)}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {locationOptions.length > 0 && (
                  <div
                    className="rounded-[var(--radius-3xl)] border px-4 py-4"
                    style={{
                      borderColor: "var(--home-rule)",
                      background: "color-mix(in srgb, var(--home-paper-alt) 62%, var(--home-elev-mix))",
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="home-meta mb-0">Popular locations</p>
                      <p
                        className="mb-0 text-1xs"
                        style={{ color: "var(--home-ink-muted)", fontFamily: CHIP_FONT_FAMILY }}
                      >
                        {matchingRoleCount} roles before location filtering
                      </p>
                    </div>
                    <div
                      className="mt-3 flex flex-wrap gap-2"
                      role="tablist"
                      aria-label="Suggested locations"
                    >
                      <EditorialPillButton
                        active={uiState.location.trim().length === 0}
                        onClick={() => updateRouteState({ location: "" })}
                        role="tab"
                        ariaSelected={uiState.location.trim().length === 0}
                        size="sm"
                      >
                        All locations
                      </EditorialPillButton>
                      {locationOptions.map((option) => (
                        <EditorialPillButton
                          key={option.normalizedValue}
                          active={normalizedLocationFilter === option.normalizedValue}
                          onClick={() => updateRouteState({ location: option.label })}
                          role="tab"
                          ariaSelected={normalizedLocationFilter === option.normalizedValue}
                          size="sm"
                        >
                          {option.label} · {option.count}
                        </EditorialPillButton>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-[var(--home-rule)] pt-6">
                  <div className="space-y-2">
                    <p className="home-meta mb-0">Role type</p>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by role type">
                      {ROLE_TYPE_OPTIONS.map((roleType) => (
                        <EditorialPillButton
                          key={roleType}
                          active={uiState.roleType === roleType}
                          onClick={() =>
                            updateRouteState({ roleType: roleType as MBARoleTypeFilter })
                          }
                          role="tab"
                          ariaSelected={uiState.roleType === roleType}
                          size="sm"
                        >
                          {ROLE_TYPE_LABELS[roleType as MBARoleTypeFilter]}
                        </EditorialPillButton>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="home-meta mb-0">Role family</p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="tablist"
                      aria-label="Filter by role family"
                    >
                      {ROLE_FAMILY_OPTIONS.map((family) => (
                        <EditorialPillButton
                          key={family}
                          active={uiState.roleFamily === family}
                          onClick={() =>
                            updateRouteState({ roleFamily: family as MBARoleFamilyFilter })
                          }
                          role="tab"
                          ariaSelected={uiState.roleFamily === family}
                          size="sm"
                        >
                          {ROLE_FAMILY_LABELS[family as MBARoleFamilyFilter]}
                        </EditorialPillButton>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="home-meta mb-0">Company category</p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="tablist"
                      aria-label="Filter by company category"
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <EditorialPillButton
                          key={category}
                          active={uiState.category === category}
                          onClick={() =>
                            updateRouteState({ category: category as MBACategoryFilter })
                          }
                          role="tab"
                          ariaSelected={uiState.category === category}
                          size="sm"
                        >
                          {CATEGORY_LABELS[category as MBACategoryFilter]}
                        </EditorialPillButton>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="home-meta mb-0">Sources</p>
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="External lead sources">
                      {(["off", "on"] as const).map((external) => (
                        <EditorialPillButton
                          key={external}
                          active={uiState.external === external}
                          onClick={() => updateRouteState({ external })}
                          role="tab"
                          ariaSelected={uiState.external === external}
                          size="sm"
                        >
                          {EXTERNAL_LABELS[external]}
                        </EditorialPillButton>
                      ))}
                    </div>
                  </div>
                </div>

                {activeFilters && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--home-rule)] pt-6">
                    {uiState.q.trim() && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: "var(--home-ink)",
                          color: "var(--home-paper)",
                          fontFamily: CHIP_FONT_FAMILY,
                        }}
                      >
                        Search: {uiState.q.trim()}
                      </span>
                    )}
                    {uiState.location.trim() && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                          color: "var(--home-ink)",
                          fontFamily: CHIP_FONT_FAMILY,
                        }}
                      >
                        Location: {uiState.location.trim()}
                      </span>
                    )}
                    {uiState.roleType !== "all" && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={getChipStyle(
                          ROLE_TYPE_STYLES[uiState.roleType].accent,
                          ROLE_TYPE_STYLES[uiState.roleType].backgroundWeight,
                          ROLE_TYPE_STYLES[uiState.roleType].borderWeight
                        )}
                      >
                        {ROLE_TYPE_LABELS[uiState.roleType]}
                      </span>
                    )}
                    {uiState.roleFamily !== "all" && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={getChipStyle(getRoleFamilyAccent(uiState.roleFamily), 18, 28)}
                      >
                        {ROLE_FAMILY_LABELS[uiState.roleFamily]}
                      </span>
                    )}
                    {uiState.category !== "all" && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={getChipStyle(CATEGORY_COLOR[uiState.category], 18, 28)}
                      >
                        {CATEGORY_LABELS[uiState.category]}
                      </span>
                    )}
                    {uiState.sort !== DEFAULT_MBA_JOBS_STATE.sort && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: "color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix))",
                          color: "var(--home-ink)",
                          fontFamily: CHIP_FONT_FAMILY,
                        }}
                      >
                        {SORT_LABELS[uiState.sort]}
                      </span>
                    )}
                    {uiState.external !== DEFAULT_MBA_JOBS_STATE.external && (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={getChipStyle("var(--home-signal)", 16, 28)}
                      >
                        {EXTERNAL_LABELS[uiState.external]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </section>

          <SearchElsewhereStrip currentState={uiState} />

          <section className="space-y-4" aria-labelledby="mba-role-tracker-companies-heading">
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
          </section>

          <section className="space-y-4" aria-labelledby="mba-role-tracker-roles-heading">
            <SectionLead
              kicker="Live roles"
              title="Current openings across the tracked boards."
              description="This is the fastest way to scan internships and full-time business roles without bouncing across dozens of career pages."
              id="mba-role-tracker-roles-heading"
            />
            {!isLoading && (
              <div
                className="flex flex-wrap gap-2"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="resume-chip">{displayJobs.length} matching roles</span>
                <span className="resume-chip">{watchedCompanyIds.size} watched feeds active</span>
                {uiState.external === "on" && (
                  <span className="resume-chip">{externalLeadCount} external leads</span>
                )}
                {uiState.location.trim() && (
                  <span className="resume-chip">{matchingRoleCount} before location filter</span>
                )}
                {uiState.location.trim() && (
                  <span
                    className="resume-chip"
                    style={{
                      background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
                      color: "var(--home-ink)",
                    }}
                  >
                    Location: {uiState.location.trim()}
                  </span>
                )}
              </div>
            )}
            {isLoading ? (
              <JobGridSkeleton />
            ) : error ? (
              <StatusPanel
                title="Could not load jobs."
                message={error}
                tone="error"
                icon={<CircleAlert className="h-5 w-5" aria-hidden="true" />}
                statusRole="alert"
              />
            ) : displayJobs.length === 0 ? (
              <StatusPanel
                title="No roles found right now."
                message="No tracked postings matched the current search, location, or role filters. Try broadening the role family, switching role type, or clearing the filters."
                icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
              />
            ) : (
              <motion.div
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                data-testid="live-jobs-grid"
                variants={variants}
                initial="hidden"
                animate="visible"
              >
                {displayJobs.map((job) => {
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
                    />
                  );
                })}
              </motion.div>
            )}
          </section>

          {manualCompanies.length > 0 && (
            <section className="space-y-4" aria-labelledby="mba-role-tracker-manual-heading">
              <SectionLead
                kicker="Manual checks"
                title="Fallback paths for companies without stable public feeds."
                description="These LinkedIn and career-page shortcuts preserve your current role intent so you can still move quickly when a direct feed is unavailable."
                id="mba-role-tracker-manual-heading"
              />
              <div
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                data-testid="manual-checks-grid"
              >
                {manualCompanies.map((c) => (
                  <ManualCompanyCard key={c.id} company={c} currentState={uiState} />
                ))}
              </div>
            </section>
          )}

          {!isLoading && !error && (
            <div className="flex justify-center pb-2">
              <UtilityStrip>
                {displayJobs.length} role{displayJobs.length !== 1 ? "s" : ""} shown ·{" "}
                {formatFetchedAt(lastFetchedAt)} · Polls every 30 min
              </UtilityStrip>
            </div>
          )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
