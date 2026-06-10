"use client";

import { IconRefresh } from "@tabler/icons-react";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  mode?: "default" | "dataset" | "live" | "price";
}

const STALE_DATASET_THRESHOLD_DAYS = 7;

function getRelativeTime(date: Date): {
  label: string;
  color: string;
  diffDays: number;
} {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
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
    color = "var(--color-success)";
  } else if (diffHours < 24) {
    color = "var(--home-haze)";
  } else if (diffDays < 3) {
    color = "var(--color-warning)";
  } else {
    color = "var(--color-error)";
  }

  return { label, color, diffDays };
}

function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DataFreshnessIndicator({
  lastUpdated,
  onRefresh,
  isRefreshing,
  mode = "default",
}: DataFreshnessIndicatorProps) {
  const labelPrefix =
    mode === "dataset"
      ? "Dataset updated"
      : mode === "live"
        ? "Live snapshot fetched"
        : mode === "price"
          ? "Price as of"
        : "Updated";

  if (lastUpdated === null) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-error)" }}
        />
        <span className="text-xs text-[var(--home-ink-soft)]">
          {mode === "dataset"
            ? "No dataset"
            : mode === "price"
              ? "No price data"
              : "No data"}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-[var(--home-ink-soft)] transition hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
            aria-label="Refresh data"
          >
            <IconRefresh
              size={14}
              className={`text-[var(--home-ink-soft)] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>
    );
  }

  const date =
    typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const { label, color, diffDays } = getRelativeTime(date);
  const shouldUseAbsoluteDatasetLabel =
    mode === "dataset" && diffDays >= STALE_DATASET_THRESHOLD_DAYS;
  const displayedLabel =
    mode === "price"
      ? `Price as of ${formatAbsoluteDate(date)}`
      : shouldUseAbsoluteDatasetLabel
        ? `Snapshot as of ${formatAbsoluteDate(date)}`
        : `${labelPrefix} ${label}`;

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[var(--home-ink-soft)]">
        {displayedLabel}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-[var(--home-ink-soft)] transition hover:bg-[var(--home-paper-alt)] hover:text-[var(--home-ink)]"
          aria-label="Refresh data"
        >
          <IconRefresh
            size={14}
            className={`text-[var(--home-ink-soft)] ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
