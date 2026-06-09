import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

export interface HomeStatsCell {
  label: string;
  /** Tooltip / dotted-underline detail. Honors the design's `cursor: help`. */
  tooltip?: string;
  /** Main value. May contain `<em>` for inline serif emphasis when passed as ReactNode. */
  value: ReactNode;
  /** Sub-line under the value. Optional. */
  sub?: ReactNode;
  /** Tint the value green (used for status-positive cells like "Open to roles"). */
  tone?: "default" | "good";
}

export interface HomeStatsPill {
  label: string;
  href: string;
  /** Optional Tabler-style icon component from `@/components/ui/ServerIcons`. */
  icon?: ComponentType<{ className?: string }>;
  /** Set to true if href points outside the site. */
  external?: boolean;
}

interface Props {
  /** Section title — e.g. "Practice at a glance", "Archive at a glance". */
  title: string;
  /** Right-aligned meta string next to the live dot. */
  meta?: string;
  /** Hide the live indicator dot when meta is purely informational (no recency). */
  hideLiveDot?: boolean;
  cells: HomeStatsCell[];
  pills?: HomeStatsPill[];
  /** Anchor id used for in-page navigation and aria-labelledby. */
  id?: string;
  /** Screenreader label fallback when no `id` is provided. */
  ariaLabel?: string;
}

/**
 * Dashboard-style stats panel — renders only the panel itself. Wrap in
 * `<section class="home-shell home-section">` (or equivalent) at the call site.
 */
export function HomeStatsPanel({
  title,
  meta,
  hideLiveDot,
  cells,
  pills,
  id,
  ariaLabel,
}: Props) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      className="home-stats-panel"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : ariaLabel}
      id={id}
    >
      <header className="home-stats-head">
        <h2 id={headingId}>{title}</h2>
        {meta && (
          <span className="home-stats-head-meta">
            {!hideLiveDot && (
              <span className="home-stats-live-dot" aria-hidden="true" />
            )}
            {meta}
          </span>
        )}
      </header>

      <div className="home-stats-grid">
        {cells.map((cell) => (
          <div className="home-stats-cell" key={cell.label}>
            <span className="home-stats-cell-lbl" title={cell.tooltip ?? cell.label}>
              {cell.label}
            </span>
            <span
              className={`home-stats-cell-val${
                cell.tone === "good" ? " home-stats-cell-val-good" : ""
              }`}
            >
              {cell.value}
            </span>
            {cell.sub && <span className="home-stats-cell-sub">{cell.sub}</span>}
          </div>
        ))}
      </div>

      {pills && pills.length > 0 && (
        <nav className="home-stats-pill-row" aria-label="Quick links">
          {pills.map((pill) => {
            const Icon = pill.icon;
            return (
              <Link
                key={pill.label}
                href={pill.href}
                className="home-stats-pill"
                {...(pill.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {Icon && <Icon className="" />}
                {pill.label}
              </Link>
            );
          })}
        </nav>
      )}
    </section>
  );
}
