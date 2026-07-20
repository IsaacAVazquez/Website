"use client";

// Shared presentational bits for the score-pools surfaces: formatting,
// chips, and the small token-styled controls the three pages reuse.

import type { ConfidenceLevel, Scoreline } from "@/lib/scorePools";

export function formatScoreline(score: Scoreline): string {
  return `${score.home}-${score.away}`;
}

export function formatKickoff(iso: string, timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}

export function formatTime(iso: string, timezone: string | null): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "41m ago" / "6h ago" / "3d ago" for as-of stamps. */
export function formatAge(iso: string, nowIso: string): string {
  const ms = new Date(nowIso).getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "unknown age";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPoints(value: number): string {
  return value.toFixed(2);
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  // Confidence is a state, so it may use the status tokens; the glyph keeps
  // it readable without color.
  const color =
    level === "high"
      ? "var(--home-positive)"
      : level === "low"
        ? "var(--home-warning)"
        : "var(--home-ink-muted)";
  const glyph = level === "high" ? "●" : level === "medium" ? "◐" : "○";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-1xs font-semibold"
      style={{ color: "var(--home-ink)" }}
    >
      <span aria-hidden="true" style={{ color }}>
        {glyph}
      </span>
      {CONFIDENCE_LABELS[level]}
    </span>
  );
}

export function LockBadge({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--home-rule)] px-2 py-0.5 text-3xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
      Locked
    </span>
  );
}

/** Thin expected-points meter, baseline-anchored, value carried by text. */
export function EpMeter({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="tabular-nums font-mono text-xs text-[var(--home-ink)]">
        {formatPoints(value)}
      </span>
      <span
        aria-hidden="true"
        className="hidden h-1 w-16 overflow-hidden rounded-full bg-[var(--home-overlay)] sm:inline-block"
      >
        <span
          className="block h-full rounded-full bg-[var(--home-signal)]"
          style={{ width: `${width}%` }}
        />
      </span>
    </span>
  );
}

export const PILL_BUTTON =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]";

export const CHIP_BUTTON =
  "inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]";

export function chipStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        borderColor: "color-mix(in srgb, var(--home-signal) 45%, var(--home-rule))",
        background: "color-mix(in srgb, var(--home-signal) 12%, var(--home-paper))",
        color: "var(--home-ink)",
      }
    : {
        borderColor: "var(--home-rule)",
        background: "var(--home-overlay)",
        color: "var(--home-ink-muted)",
      };
}

export const FIELD_LABEL = "block text-1xs font-semibold text-[var(--home-ink)]";
export const FIELD_INPUT =
  "mt-1 w-full min-h-[44px] rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-sm text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-signal)]";
export const FIELD_HINT = "mt-1 block text-2xs text-[var(--home-ink-muted)]";
