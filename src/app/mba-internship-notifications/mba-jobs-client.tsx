"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
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
  Search,
  ExternalLink,
  Mail,
  RefreshCcw,
  X,
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
import {
  MBA_ROLE_FAMILY_LABELS,
  MBA_ROLE_FAMILY_SEARCH_TERMS,
} from "@/constants/mba-role-taxonomy";
import type {
  MBACategory,
  MBACategoryFilter,
  MBACompany,
  MBAJob,
  MBAJobRoleFamily,
  MBAJobRoleType,
  MBAJobsSearchState,
  MBARoleFamilyFilter,
  MBARoleTypeFilter,
  MBASortOrder,
} from "@/types/mba-jobs";
import {
  buildMBAJobsHref,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_MBA_JOBS_STATE,
  normalizeMBAJobsState,
  ROLE_FAMILY_LABELS,
  ROLE_FAMILY_OPTIONS,
  ROLE_TYPE_LABELS,
  ROLE_TYPE_OPTIONS,
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
  "big-tech": "var(--home-haze)",
  fintech: "var(--home-moss)",
  startup: "var(--home-acid)",
};

const CHIP_FONT_FAMILY = "var(--font-home-sans)";
const TRACKED_COMPANY_CATEGORIES: MBACategory[] = ["fintech", "startup", "big-tech"];

const ROLE_TYPE_STYLES: Record<
  MBAJobRoleType,
  { accent: string; backgroundWeight: number; borderWeight: number }
> = {
  internship: {
    accent: "var(--home-acid)",
    backgroundWeight: 24,
    borderWeight: 34,
  },
  "full-time": {
    accent: "var(--home-moss)",
    backgroundWeight: 20,
    borderWeight: 30,
  },
  unclear: {
    accent: "var(--home-haze)",
    backgroundWeight: 18,
    borderWeight: 28,
  },
};

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
    return "var(--home-haze)";
  }
  if (family === "finance" || family === "analytics") {
    return "var(--home-moss)";
  }
  return "var(--home-acid)";
}

function getTrackedCompanyButtonStyle(company: MBACompany, active: boolean): CSSProperties {
  if (active) {
    return {
      background: `color-mix(in srgb, ${company.color} 18%, var(--home-paper))`,
      borderColor: `color-mix(in srgb, ${company.color} 36%, var(--home-rule))`,
      color: getReadableAccentColor(company.color),
      boxShadow: "var(--shadow-sm)",
      fontFamily: CHIP_FONT_FAMILY,
    };
  }

  return {
    background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
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
  return parts.join(" ");
}

function hasActiveFilters(state: MBAJobsSearchState): boolean {
  return (
    state.q.trim().length > 0 ||
    state.category !== DEFAULT_MBA_JOBS_STATE.category ||
    state.roleType !== DEFAULT_MBA_JOBS_STATE.roleType ||
    state.roleFamily !== DEFAULT_MBA_JOBS_STATE.roleFamily ||
    state.sort !== DEFAULT_MBA_JOBS_STATE.sort
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompanyAvatar({ company }: { company: MBACompany | undefined }) {
  const color = company?.color ?? "var(--home-haze)";
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
      className="inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
      style={{
        background: "var(--home-acid)",
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-semibold"
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
      className="inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-semibold"
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
      className="inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-semibold"
      style={getChipStyle(accent, 18, 28)}
    >
      {MBA_ROLE_FAMILY_LABELS[family]}
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
      } px-4 py-3 text-[0.8rem]`}
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
  onMarkSeen,
  currentState,
}: {
  job: MBAJob;
  isNew: boolean;
  onMarkSeen: () => void;
  currentState: MBAJobsSearchState;
}) {
  const company = MBA_COMPANY_MAP.get(job.companyId);
  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    [currentState.q.trim(), job.title, job.companyName].filter(Boolean).join(" ")
  )}`;

  return (
    <article
      className="home-card flex flex-col p-5 sm:p-6"
      onMouseEnter={onMarkSeen}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <CompanyAvatar company={company} />
          <div className="min-w-0">
            <p
              className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
              style={{ fontFamily: CHIP_FONT_FAMILY, color: "var(--home-ink-muted)" }}
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
        <div
          data-testid={`job-card-${job.id}-chips`}
          className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end"
        >
          {isNew && <NewBadge />}
          <RoleTypeChip roleType={job.roleType} />
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
          className="mt-2 line-clamp-2 break-words text-sm leading-6"
          style={{ color: "var(--home-ink-muted)" }}
        >
          {job.snippet}
        </p>
      )}

      {job.roleFamilies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {job.roleFamilies.map((family) => (
            <RoleFamilyChip key={`${job.id}-${family}`} family={family} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-auto flex flex-col gap-3 pt-4"
        style={{ borderTop: "1px solid var(--home-rule)" }}
      >
        <span
          className="text-[0.7rem]"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
        >
          {job.location} · {timeAgo(job.postedAt)}
        </span>
        <div className="flex flex-wrap items-center gap-3">
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
        I do not have a stable public job feed for this company yet, so I keep the career page and
        a role-aware LinkedIn search here instead.
      </p>
      <div
        className="mt-auto flex flex-wrap items-center gap-3 pt-4"
        style={{ borderTop: "1px solid var(--home-rule)" }}
      >
        <CardActionLink
          href={linkedinUrl}
          label="LinkedIn search"
          ariaLabel={`LinkedIn search for ${company.name}`}
        />
        <CardActionLink
          href={company.careersUrl}
          label="Career page"
          ariaLabel={`Career page for ${company.name}`}
          variant="primary"
          trailingIcon
        />
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
          className="ml-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[0.8rem] opacity-70 transition-opacity duration-200 ease hover:opacity-100"
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
  const groups = TRACKED_COMPANY_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    companies: nonManual.filter((c) => c.category === category),
  })).filter((group) => group.companies.length > 0);
  const allOn = nonManual.every((c) => watchedIds.has(c.id));
  const allOff = nonManual.every((c) => !watchedIds.has(c.id));

  return (
    <section
      className="rounded-[1.25rem] border p-4 sm:p-5"
      style={{ borderColor: "var(--home-rule)", ...style }}
      aria-labelledby="tracked-companies-heading"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p
            id="tracked-companies-heading"
            className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            style={{ fontFamily: CHIP_FONT_FAMILY, color: "var(--home-ink-muted)" }}
          >
            Tracked companies
          </p>
          <p
            className="max-w-2xl text-sm leading-6"
            style={{ color: "var(--home-ink-muted)" }}
          >
            Toggle {nonManual.length} live-feed companies here. Manual-only targets stay in
            Manual checks below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allOn}
            className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color] duration-200 ease disabled:opacity-40"
            style={{
              ...getPillStyle(false),
              color: "var(--home-haze)",
            }}
          >
            All on
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={allOff}
            className="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-[background-color,border-color,color] duration-200 ease disabled:opacity-40"
            style={getPillStyle(false)}
          >
            All off
          </button>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.category}
            data-testid={`tracked-companies-${group.category}`}
            className="rounded-[1rem] border p-3"
            style={{
              borderColor: "var(--home-rule)",
              background: "color-mix(in srgb, var(--home-paper-alt) 58%, white)",
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                style={{ fontFamily: CHIP_FONT_FAMILY, color: "var(--home-ink-muted)" }}
              >
                {group.label}
              </p>
              <span
                className="text-[0.68rem]"
                style={{ fontFamily: CHIP_FONT_FAMILY, color: "var(--home-ink-muted)" }}
              >
                {group.companies.length} live
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {group.companies.map((company) => {
                const active = watchedIds.has(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => onToggle(company.id)}
                    className="inline-flex min-h-[44px] w-full items-center gap-2.5 rounded-[1rem] border px-4 py-2.5 text-left text-[0.78rem] font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 ease"
                    style={getTrackedCompanyButtonStyle(company, active)}
                    aria-pressed={active}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: active ? company.color : "var(--home-stone)" }}
                      aria-hidden="true"
                    />
                    <span>{company.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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

  useEffect(() => {
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
  const activeFilters = hasActiveFilters(uiState);
  const effectiveState = useMemo(
    () => ({ ...uiState, q: deferredQuery }),
    [deferredQuery, uiState]
  );

  // ── Derived: filtered + sorted job list ──────────────────────────────
  const displayJobs = useMemo(() => {
    const query = effectiveState.q.trim();
    const filtered = jobs.flatMap((job) => {
      if (!watchedCompanyIds.has(job.companyId)) return [];
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

    filtered.sort((left, right) => {
      const leftTime = new Date(left.job.postedAt).getTime();
      const rightTime = new Date(right.job.postedAt).getTime();
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
  }, [effectiveState, jobs, watchedCompanyIds]);

  // ── Manual (Big Tech) companies filtered by category ─────────────────
  const manualCompanies = useMemo(() => {
    const all = MBA_COMPANIES.filter((c) => c.atsType === "manual");
    if (uiState.category === "all") return all;
    return all.filter((c) => c.category === uiState.category);
  }, [uiState.category]);

  const totalTracked = MBA_COMPANIES.filter((c) => c.atsType !== "manual").length;
  const totalCompanies = MBA_COMPANIES.length;
  const internshipCount = jobs.filter((job) => job.roleType === "internship").length;
  const fullTimeCount = jobs.filter((job) => job.roleType === "full-time").length;
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
        aria-label="MBA role tracker"
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
              MBA Role Tracker
            </h1>
            <p className="home-body max-w-[44rem]">
              I monitor {totalTracked} public job boards across {totalCompanies} target companies
              for internships and full-time product, PMM, strategy, operations, growth, finance,
              analytics, and adjacent business roles. When a company does not expose a stable
              public feed, I keep the career page and LinkedIn search below so you can still move
              quickly.
            </p>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="resume-chip">
                {isLoading ? "Loading…" : `${jobs.length} live roles`}
              </span>
              {!isLoading && <span className="resume-chip">{internshipCount} internships</span>}
              {!isLoading && <span className="resume-chip">{fullTimeCount} full-time</span>}
              <span className="resume-chip">{totalTracked} live feeds</span>
              <span className="resume-chip">{totalCompanies} target companies</span>
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
                {fetchErrors.map((e) => e.companyName).join(", ")}. Results shown
                are partial.
              </p>
            </div>
          )}

          {/* ── Search + role controls ───────────────────────────────────── */}
          <motion.div
            className="home-card p-5 sm:p-6"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--home-ink-muted)" }}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={uiState.q}
                    onChange={(event) => updateRouteState({ q: event.target.value })}
                    placeholder="Search PM, PMM, strategy, ops, growth, finance..."
                    aria-label="Search roles"
                    className="w-full min-h-[44px] rounded-[1rem] border pl-11 pr-12 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease"
                    style={{
                      background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
                      borderColor: "var(--home-rule)",
                      color: "var(--home-ink)",
                      fontFamily: "var(--font-home-sans)",
                      paddingTop: "0.8rem",
                      paddingBottom: "0.8rem",
                    }}
                  />
                  {uiState.q && (
                    <button
                      type="button"
                      onClick={() => updateRouteState({ q: "" })}
                      className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full"
                      aria-label="Clear search"
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

              <div className="space-y-3">
                <div className="space-y-2">
                  <p
                    className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      color: "var(--home-ink-muted)",
                      fontFamily: "var(--font-home-sans)",
                    }}
                  >
                    Role type
                  </p>
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
                  <p
                    className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      color: "var(--home-ink-muted)",
                      fontFamily: "var(--font-home-sans)",
                    }}
                  >
                    Role family
                  </p>
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
                  <p
                    className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      color: "var(--home-ink-muted)",
                      fontFamily: "var(--font-home-sans)",
                    }}
                  >
                    Company category
                  </p>
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
              </div>

              {activeFilters && (
                <div className="flex flex-wrap items-center gap-2">
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
                        background: "color-mix(in srgb, var(--home-paper-alt) 84%, white)",
                        color: "var(--home-ink)",
                        fontFamily: CHIP_FONT_FAMILY,
                      }}
                    >
                      {SORT_LABELS[uiState.sort]}
                    </span>
                  )}
                </div>
              )}
            </div>
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
              message="No tracked postings matched the current search or role filters. Try broadening the role family, switching role type, or clearing the search."
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
                  currentState={uiState}
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
                  Manual checks
                </p>
                <p className="text-sm" style={{ color: "var(--home-ink-muted)" }}>
                  These companies do not expose a stable public feed I can poll here yet. The
                  LinkedIn buttons keep your current role intent so you can still check them
                  quickly.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {manualCompanies.map((c) => (
                  <ManualCompanyCard key={c.id} company={c} currentState={uiState} />
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
