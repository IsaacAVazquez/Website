"use client";

import {
  startTransition,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  CircleAlert,
  ExternalLink,
  Mail,
  RefreshCcw,
} from "lucide-react";
import {
  EditorialPillButton,
  StatusPanel,
  getPillStyle,
} from "@/components/editorial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useMBAJobs } from "@/hooks/useMBAJobs";
import { MBA_COMPANIES, MBA_COMPANY_MAP } from "@/constants/mba-companies";
import type {
  MBACategory,
  MBACategoryFilter,
  MBACompany,
  MBAJob,
  MBAJobsSearchState,
  MBASortOrder,
} from "@/types/mba-jobs";
import {
  buildMBAJobsHref,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_MBA_JOBS_STATE,
  normalizeMBAJobsState,
  SORT_LABELS,
  SORT_OPTIONS,
} from "./mba-jobs-state";

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const noMotion = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
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

function formatFetchedAt(d: Date | null): string {
  if (!d) return "—";
  return DATE_FORMATTER.format(d);
}

const CATEGORY_COLOR: Record<MBACategory | "all", string> = {
  all: "var(--home-ink)",
  "big-tech": "#4285F4",
  fintech: "#00C805",
  startup: "#FF5A5F",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompanyAvatar({ company }: { company: MBACompany | undefined }) {
  const color = company?.color ?? "var(--home-haze)";
  const initials = company?.logoInitials ?? "??";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
      style={{ background: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function NewBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em]"
      style={{
        background: "var(--home-acid)",
        color: "var(--home-ink)",
        fontFamily: "var(--font-home-sans)",
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
      style={{
        background: `color-mix(in srgb, ${color} 14%, var(--home-paper))`,
        color,
        fontFamily: "var(--font-home-sans)",
        border: `1px solid color-mix(in srgb, ${color} 24%, var(--home-rule))`,
      }}
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

function JobCard({
  job,
  isNew,
  onMarkSeen,
}: {
  job: MBAJob;
  isNew: boolean;
  onMarkSeen: () => void;
}) {
  const company = MBA_COMPANY_MAP.get(job.companyId);
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    job.title + " " + job.companyName
  )}`;

  return (
    <article
      className="home-card flex flex-col p-5 sm:p-6"
      onMouseEnter={onMarkSeen}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompanyAvatar company={company} />
          <div>
            <p
              className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
            >
              {job.companyName}
            </p>
            <p
              className="text-[0.7rem]"
              style={{ color: "var(--home-ink-muted)" }}
            >
              {job.department}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isNew && <NewBadge />}
          <CategoryChip category={job.category} />
        </div>
      </div>

      {/* Body */}
      <h2
        className="mt-4 text-base font-semibold leading-snug"
        style={{
          fontFamily: "var(--font-home-sans)",
          letterSpacing: "-0.025em",
          color: "var(--home-ink)",
        }}
      >
        {job.title}
      </h2>

      {job.snippet && (
        <p
          className="mt-2 line-clamp-2 text-sm leading-6"
          style={{ color: "var(--home-ink-muted)" }}
        >
          {job.snippet}
        </p>
      )}

      {/* Footer */}
      <div
        className="mt-auto flex items-center justify-between gap-3 pt-4"
        style={{ borderTop: "1px solid var(--home-rule)" }}
      >
        <span
          className="text-[0.7rem]"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
        >
          {job.location} · {timeAgo(job.postedAt)}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[32px] items-center gap-1 text-[0.7rem] font-semibold"
            style={{ color: "var(--home-ink-muted)" }}
            onClick={onMarkSeen}
            aria-label={`Find ${job.title} on LinkedIn`}
          >
            LinkedIn
          </a>
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[32px] items-center gap-1 text-[0.72rem] font-semibold"
            style={{ color: "var(--home-haze)" }}
            onClick={onMarkSeen}
          >
            Apply <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

function ManualCompanyCard({ company }: { company: MBACompany }) {
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    "MBA intern " + company.name
  )}`;

  return (
    <article
      className="home-card flex flex-col p-5 sm:p-6"
      style={{ opacity: 0.88 }}
    >
      <div className="flex items-center gap-3">
        <CompanyAvatar company={company} />
        <div>
          <p
            className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
          >
            {company.name}
          </p>
          <CategoryChip category={company.category} />
        </div>
      </div>
      <p
        className="mt-4 text-sm leading-6"
        style={{ color: "var(--home-ink-muted)" }}
      >
        Uses a proprietary career portal. Visit directly to browse MBA roles.
      </p>
      <div
        className="mt-auto flex items-center gap-3 pt-4"
        style={{ borderTop: "1px solid var(--home-rule)" }}
      >
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[32px] items-center gap-1 text-[0.7rem] font-semibold"
          style={{ color: "var(--home-ink-muted)" }}
        >
          LinkedIn search
        </a>
        <a
          href={company.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[32px] items-center gap-1 text-[0.72rem] font-semibold"
          style={{ color: "var(--home-haze)" }}
        >
          Career page <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function JobGridSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="home-card flex flex-col gap-4 p-5 sm:p-6"
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
            className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
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
        className="min-w-[12rem] rounded-[1rem] border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,white)] p-1.5 text-[var(--home-ink)] shadow-[var(--shadow-lg)]"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as MBASortOrder)}
        >
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem
              key={opt}
              value={opt}
              className="rounded-[0.8rem] py-2 pl-8 pr-3 text-sm font-medium focus:bg-[color-mix(in_srgb,var(--home-paper-alt)_90%,white)]"
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
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
        style={{
          color: "var(--home-haze)",
          borderColor: "color-mix(in srgb, var(--home-haze) 28%, var(--home-rule))",
          background: "color-mix(in srgb, var(--home-haze) 8%, var(--home-paper))",
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
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm"
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
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color] duration-200 ease"
      style={getPillStyle(false)}
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
          color: result.ok ? "var(--color-success)" : "var(--color-error)",
          borderColor: result.ok
            ? "color-mix(in srgb, var(--color-success) 28%, var(--home-rule))"
            : "color-mix(in srgb, var(--color-error) 28%, var(--home-rule))",
        }}
        role="status"
      >
        {result.message}
        <button
          type="button"
          onClick={onClear}
          className="ml-1 text-[0.7rem] underline opacity-70 hover:opacity-100"
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
      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color] duration-200 ease disabled:opacity-50"
      style={getPillStyle(false)}
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {sending ? "Sending…" : "Email digest"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Email dialog (simple inline form)
// ---------------------------------------------------------------------------

function EmailDigestDialog({
  isOpen,
  onClose,
  onSubmit,
  sending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  sending: boolean;
}) {
  const [email, setEmail] = useState("");
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Send email digest"
    >
      <div
        className="home-card w-full max-w-sm p-6"
        style={{ background: "var(--home-paper)" }}
      >
        <h2
          className="mb-3 text-lg font-semibold"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
        >
          Send email digest
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--home-ink-muted)" }}>
          Enter your email to receive the current job list as a digest.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mb-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
          style={{
            background: "var(--home-paper-alt)",
            borderColor: "var(--home-rule)",
            color: "var(--home-ink)",
          }}
          disabled={sending}
          autoComplete="email"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSubmit(email)}
            disabled={sending || !email.includes("@")}
            className="flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--home-ink)", color: "var(--home-paper)" }}
          >
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-xl border px-5 py-3 text-sm"
            style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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
  const allOn = nonManual.every((c) => watchedIds.has(c.id));
  const allOff = nonManual.every((c) => !watchedIds.has(c.id));

  return (
    <div className="rounded-[1.25rem] border p-4" style={{ borderColor: "var(--home-rule)", ...style }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p
          className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
        >
          Tracked companies
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allOn}
            className="text-[0.7rem] font-semibold underline-offset-2 hover:underline disabled:opacity-40"
            style={{ color: "var(--home-haze)" }}
          >
            All on
          </button>
          <span style={{ color: "var(--home-rule)" }}>·</span>
          <button
            type="button"
            onClick={onClearAll}
            disabled={allOff}
            className="text-[0.7rem] font-semibold underline-offset-2 hover:underline disabled:opacity-40"
            style={{ color: "var(--home-ink-muted)" }}
          >
            All off
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {nonManual.map((c) => {
          const active = watchedIds.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-[background-color,border-color,color] duration-150 ease"
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${c.color} 16%, var(--home-paper))`,
                      borderColor: `color-mix(in srgb, ${c.color} 42%, var(--home-rule))`,
                      color: c.color,
                    }
                  : {
                      background: "transparent",
                      borderColor: "var(--home-rule)",
                      color: "var(--home-ink-muted)",
                    }
              }
              aria-pressed={active}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: active ? c.color : "var(--home-stone)" }}
                aria-hidden="true"
              />
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
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

  const hasManagedParams =
    searchParams.get("sort") !== null || searchParams.get("category") !== null;
  const routeState = useMemo(
    () =>
      hasManagedParams ? normalizeMBAJobsState(searchParams) : initialState,
    [hasManagedParams, initialState, searchParams]
  );

  function updateRouteState(next: Partial<MBAJobsSearchState>) {
    const href = buildMBAJobsHref({ ...routeState, ...next });
    startTransition(() => router.push(href, { scroll: false }));
  }

  const {
    jobs,
    isLoading,
    error,
    fetchErrors,
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
  } = useMBAJobs();

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // ── Derived: filtered + sorted job list ──────────────────────────────
  const displayJobs = useMemo(() => {
    let filtered = jobs.filter((j) => watchedCompanyIds.has(j.companyId));
    if (routeState.category !== DEFAULT_MBA_JOBS_STATE.category) {
      filtered = filtered.filter((j) => j.category === routeState.category);
    }
    return [...filtered].sort((a, b) => {
      const diff = new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      return routeState.sort === "newest" ? diff : -diff;
    });
  }, [jobs, watchedCompanyIds, routeState]);

  // ── Manual (Big Tech) companies filtered by category ─────────────────
  const manualCompanies = useMemo(() => {
    const all = MBA_COMPANIES.filter((c) => c.atsType === "manual");
    if (routeState.category === "all") return all;
    return all.filter((c) => c.category === routeState.category);
  }, [routeState.category]);

  const totalTracked = MBA_COMPANIES.filter((c) => c.atsType !== "manual").length;
  const refreshLabel = isLoading
    ? "Loading…"
    : lastFetchedAt
      ? `Updated ${formatFetchedAt(lastFetchedAt)}`
      : "Not yet fetched";

  async function handleEmailSend(email: string) {
    setEmailDialogOpen(false);
    await sendEmailDigest(email, displayJobs.length > 0 ? displayJobs : jobs);
  }

  return (
    <>
      <EmailDigestDialog
        isOpen={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSubmit={handleEmailSend}
        sending={emailSending}
      />

      <section
        className="home-page min-h-screen"
        aria-label="MBA Internship Tracker"
      >
        <div className="home-shell home-section space-y-5">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <motion.div
            className="space-y-3 pt-2"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            <p
              className="home-kicker"
              style={{ color: "var(--home-acid)", fontFamily: "var(--font-home-sans)" }}
            >
              MBA Recruiting
            </p>
            <h1
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
                fontWeight: 600,
                lineHeight: 0.92,
                letterSpacing: "-0.07em",
                color: "var(--home-ink)",
              }}
            >
              Internship Tracker
            </h1>
            <p className="home-body max-w-[44rem]">
              Monitors {totalTracked} company career pages via Greenhouse and Lever for MBA
              internship, APM, and summer associate roles. New postings are flagged each time the
              page polls — you can also get browser notifications or an email digest.
            </p>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="resume-chip">
                {isLoading ? "Loading…" : `${jobs.length} live roles`}
              </span>
              <span className="resume-chip">{refreshLabel}</span>
              {!isLoading && newJobCount > 0 && (
                <span
                  className="resume-chip"
                  style={{ background: "var(--home-acid)", color: "var(--home-ink)" }}
                >
                  {newJobCount} new since last visit
                </span>
              )}
              <span className="resume-chip">Polls every 30 min</span>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={refresh}
                disabled={isLoading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,border-color] duration-200 ease disabled:opacity-50"
                style={getPillStyle(false)}
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
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm transition-[background-color,border-color] duration-200 ease"
                  style={{ borderColor: "var(--home-rule)", color: "var(--home-ink-muted)" }}
                >
                  Mark all seen
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Partial fetch errors ─────────────────────────────────────── */}
          {fetchErrors.length > 0 && !isLoading && (
            <div
              className="flex items-start gap-3 rounded-[1.5rem] px-5 py-4"
              style={{
                borderColor: "color-mix(in srgb, var(--color-warning) 30%, var(--home-rule))",
                background: "color-mix(in srgb, var(--color-warning) 8%, var(--home-paper))",
                border: "1px solid",
              }}
              role="status"
            >
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "var(--color-warning)" }}
                aria-hidden="true"
              />
              <p className="text-sm" style={{ color: "var(--home-ink)" }}>
                Some companies could not be reached:{" "}
                {fetchErrors.map((e) => e.companyId).join(", ")}. Results shown
                are partial.
              </p>
            </div>
          )}

          {/* ── Category + Sort controls ──────────────────────────────────── */}
          <motion.div
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Filter by company category"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <EditorialPillButton
                  key={cat}
                  active={routeState.category === cat}
                  onClick={() => updateRouteState({ category: cat as MBACategoryFilter })}
                  role="tab"
                  ariaSelected={routeState.category === cat}
                >
                  {CATEGORY_LABELS[cat as MBACategoryFilter]}
                </EditorialPillButton>
              ))}
            </div>

            <SortDropdown
              value={routeState.sort}
              onValueChange={(sort) => updateRouteState({ sort })}
            />
          </motion.div>

          {/* ── Company filter strip ──────────────────────────────────────── */}
          <CompanyFilterStrip
            watchedIds={watchedCompanyIds}
            onToggle={toggleCompany}
            onSelectAll={() => setAllCompanies(true)}
            onClearAll={() => setAllCompanies(false)}
          />

          {/* ── Live job grid ─────────────────────────────────────────────── */}
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
              message="Either no companies are being tracked or no MBA-relevant postings matched the current filters. Try selecting more companies or changing the category filter."
              icon={
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
              }
            />
          ) : (
            <motion.div
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              variants={variants}
              initial="hidden"
              animate="visible"
            >
              {displayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isNew={!seenIds.has(job.id)}
                  onMarkSeen={() => markJobSeen(job.id)}
                />
              ))}
            </motion.div>
          )}

          {/* ── Big Tech manual links ─────────────────────────────────────── */}
          {manualCompanies.length > 0 && (
            <div className="space-y-4">
              <div>
                <p
                  className="home-kicker mb-1"
                  style={{ fontFamily: "var(--font-home-sans)" }}
                >
                  Proprietary portals
                </p>
                <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  These companies do not expose a public ATS API. Use their direct career pages or
                  LinkedIn search links below.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {manualCompanies.map((c) => (
                  <ManualCompanyCard key={c.id} company={c} />
                ))}
              </div>
            </div>
          )}

          {/* ── Footer note ───────────────────────────────────────────────── */}
          {!isLoading && !error && (
            <p
              className="pb-2 text-center text-xs"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
              {displayJobs.length} role{displayJobs.length !== 1 ? "s" : ""} shown ·{" "}
              {formatFetchedAt(lastFetchedAt)} · Polls every 30 min
            </p>
          )}
        </div>
      </section>
    </>
  );
}
