"use client";

// Shared presentational bits for the score-pools surfaces: formatting,
// chips, and the small token-styled controls the three pages reuse.

import type { ConfidenceLevel, Scoreline } from "@/lib/scorePools";
import { hasLiveScorePoolsData } from "@/lib/scorePoolsSnapshot";
import type { ScorePoolLeagueSnapshot, ScorePoolsSnapshot } from "@/types/scorePools";

export function formatScoreline(score: Scoreline): string {
  return `${score.home}-${score.away}`;
}

export function formatKickoff(iso: string, timezone: string | null): string {
  try {
    // tz-local: timezone is a per-pool localStorage setting (null = the visitor's own device zone); never renders before a pool exists.
    return new Intl.DateTimeFormat("en-US", {
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
      ? "var(--c97-positive)"
      : level === "low"
        ? "var(--c97-warning)"
        : "var(--c97-ink-2)";
  const glyph = level === "high" ? "●" : level === "medium" ? "◐" : "○";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-1xs font-semibold"
      style={{ color: "var(--c97-ink)" }}
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
  return <span className="c97-chip">Locked</span>;
}

/** Thin expected-points meter, baseline-anchored, value carried by text. */
export function EpMeter({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <span className="flex items-center gap-2">
      <span className="tabular-nums font-mono text-xs text-[var(--c97-ink)]">
        {formatPoints(value)}
      </span>
      <span aria-hidden="true" className="hidden w-16 sm:inline-block">
        <span className="c97-meter">
          <span style={{ width: `${width}%` }} />
        </span>
      </span>
    </span>
  );
}

export const SAMPLE_NOTICE =
  "border border-[var(--c97-rule)] bg-[var(--c97-overlay)] px-4 py-3 text-2xs text-[var(--c97-ink-2)]";

// UTC, so the server render and the browser print the same day.
const SNAPSHOT_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** Printed on every score-pools page until a provider league carries fetched odds. */
export function SampleDataNotice({ snapshot }: { snapshot: ScorePoolsSnapshot }) {
  if (hasLiveScorePoolsData(snapshot)) return null;
  const built = new Date(snapshot.generatedAt);
  const builtOn = Number.isNaN(built.getTime()) ? "an unknown date" : SNAPSHOT_DATE.format(built);
  // Hand-entered fixtures in a real league are not a sample, so they get their own wording.
  const sampleOnly = snapshot.leagues.every(
    (league) => league.sample || league.fixtures.length === 0,
  );
  return (
    <p className={SAMPLE_NOTICE}>
      {sampleOnly
        ? `This page is showing sample data only. The sample was built on ${builtOn}, and no live odds feed is connected.`
        : `No live odds feed is connected. The odds on this page were entered by hand, and the snapshot was built on ${builtOn}.`}
    </p>
  );
}

/** A league with no fixtures can't run a pool, so its option says so and is disabled. */
export function leagueOptionLabel(league: ScorePoolLeagueSnapshot): string {
  const name = `${league.name}${league.sample ? " (sample data)" : ""}`;
  return league.fixtures.length === 0 ? `${name} · no fixtures yet` : name;
}

export const PILL_BUTTON = "c97-btn";

export const FIELD_LABEL = "c97-kicker";
export const FIELD_INPUT = "c97-field";
export const FIELD_HINT = "c97-prose";
