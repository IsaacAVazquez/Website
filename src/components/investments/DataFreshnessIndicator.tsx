"use client";

import { RefreshCw } from "lucide-react";
import { useClientNow } from "@/hooks/useClientNow";
import { DATE_ONLY_TIME_ZONE, DISPLAY_TIME_ZONE } from "@/lib/date-formatters";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  mode?: "default" | "dataset" | "live" | "price";
}

const STALE_DATASET_THRESHOLD_DAYS = 7;

// `now` is the caller's `useClientNow()` reading, not `Date.now()` taken
// directly: several callers pass a real, live-fetched instant that's already
// present at the first server-rendered paint, so computing "ago" from
// `Date.now()` here would print different text on the server than it does
// once the client hydrates a moment later and break hydration.
function getRelativeTime(date: Date, now: number): {
  label: string;
  color: string;
  diffDays: number;
} {
  const diffMs = Math.max(0, now - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  if (diffMinutes < 60) {
    label = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    label = `${diffHours}h ago`;
  } else {
    label = `${diffDays}d ago`;
  }

  let color: string;
  if (diffHours < 1) {
    color = "var(--c97-positive)";
  } else if (diffHours < 24) {
    color = "var(--c97-accent)";
  } else if (diffDays < 3) {
    color = "var(--c97-warning)";
  } else {
    color = "var(--c97-negative)";
  }

  return { label, color, diffDays };
}

function formatAbsoluteDate(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

export function DataFreshnessIndicator({
  lastUpdated,
  onRefresh,
  isRefreshing,
  mode = "default",
}: DataFreshnessIndicatorProps) {
  const now = useClientNow();
  const labelPrefix =
    mode === "dataset"
      ? "Dataset updated"
      : mode === "live"
        ? "Market quote"
        : mode === "price"
          ? "Price as of"
        : "Updated";

  if (lastUpdated === null) {
    return (
      <div className="inline-flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
        <div
          className="w-2 h-2"
          style={{ backgroundColor: "var(--c97-negative)" }}
        />
        <span className="text-xs text-[var(--c97-label)]">
          {mode === "dataset"
            ? "No dataset"
            : mode === "price"
              ? "No price data"
              : "No data"}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex min-h-touch min-w-touch items-center justify-center text-[var(--c97-label)] transition hover:bg-[var(--c97-panel)] hover:text-[var(--c97-ink)]"
            aria-label="Refresh data"
          >
            <RefreshCw
              size={14}
              className={`text-[var(--c97-label)] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>
    );
  }

  const date =
    typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  // `relative` is null on the server and during the first client render
  // (before `useClientNow()` has a reading), so every branch below has a
  // now-free, absolute-date fallback for that window.
  const relative = now === null ? null : getRelativeTime(date, now);
  const shouldUseAbsoluteDatasetLabel =
    mode === "dataset" && (relative === null || relative.diffDays >= STALE_DATASET_THRESHOLD_DAYS);
  const displayedLabel =
    mode === "price"
      ? `Price as of ${formatAbsoluteDate(date, DATE_ONLY_TIME_ZONE)}`
      : shouldUseAbsoluteDatasetLabel
        ? `Snapshot as of ${formatAbsoluteDate(date, DISPLAY_TIME_ZONE)}`
        : relative
          ? `${labelPrefix} ${relative.label}`
          : `${labelPrefix} ${formatAbsoluteDate(date, DISPLAY_TIME_ZONE)}`;
  const color = relative?.color ?? "var(--c97-label)";

  return (
    <div className="inline-flex items-center" style={{ gap: "var(--c97-sp-1)" }}>
      <div
        className="w-2 h-2"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[var(--c97-label)]">
        {displayedLabel}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex min-h-touch min-w-touch items-center justify-center text-[var(--c97-label)] transition hover:bg-[var(--c97-panel)] hover:text-[var(--c97-ink)]"
          aria-label="Refresh data"
        >
          <RefreshCw
            size={14}
            className={`text-[var(--c97-label)] ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
