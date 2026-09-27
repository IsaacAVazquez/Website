"use client";

import { RefreshCw } from "lucide-react";

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
        ? "Market quote"
        : mode === "price"
          ? "Price as of"
        : "Updated";

  if (lastUpdated === null) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
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
