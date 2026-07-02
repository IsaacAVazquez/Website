import type { ReactNode } from "react";

/**
 * Unified stat card used by both the Premier League and La Liga dashboards.
 *
 * Both variants share the canonical card radius (var(--radius-2xl)) and the
 * theme-aware --shadow-sm token; they differ in surface, density, and scale:
 * - variant="compact"  → PL style: raised surface, metric at text-lg
 * - variant="full"     → La Liga style: paper-alt surface, title + metric at text-3xl
 */
export function StatCard({
  eyebrow,
  title,
  metric,
  detail,
  icon,
  variant = "full",
}: {
  eyebrow: string;
  title?: string;
  metric: string;
  detail: string;
  icon: ReactNode;
  variant?: "compact" | "full";
}) {
  if (variant === "compact") {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] px-4 py-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">
            {eyebrow}
          </p>
          <span className="text-[var(--home-signal)]">{icon}</span>
        </div>
        <p className="mt-3 text-lg font-semibold tabular-nums text-[var(--home-ink)]">{metric}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--home-ink-muted)]">{detail}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
          {eyebrow}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--home-paper)] text-[var(--home-signal)] shadow-[var(--shadow-sm)]">
          {icon}
        </span>
      </div>
      {title && (
        <h3 className="mt-4 text-xl font-bold text-[var(--home-ink)]">{title}</h3>
      )}
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-[var(--home-ink)]">{metric}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">{detail}</p>
    </div>
  );
}
