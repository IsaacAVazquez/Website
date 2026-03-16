"use client";

import { IconRefresh } from "@tabler/icons-react";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  mode?: "default" | "dataset" | "live";
}

function getRelativeTime(date: Date): { label: string; color: string } {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
    color = "var(--color-primary)";
  } else if (diffDays < 3) {
    color = "var(--color-warning)";
  } else {
    color = "var(--color-error)";
  }

  return { label, color };
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
        : "Updated";

  if (lastUpdated === null) {
    return (
      <div className="inline-flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-error)" }}
        />
        <span className="text-xs text-[var(--text-tertiary)]">
          {mode === "dataset" ? "No dataset" : "No data"}
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center"
            aria-label="Refresh data"
          >
            <IconRefresh
              size={14}
              className={`text-[var(--text-tertiary)] ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>
    );
  }

  const date =
    typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
  const { label, color } = getRelativeTime(date);

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-[var(--text-tertiary)]">
        {labelPrefix} {label}
      </span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center"
          aria-label="Refresh data"
        >
          <IconRefresh
            size={14}
            className={`text-[var(--text-tertiary)] ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
