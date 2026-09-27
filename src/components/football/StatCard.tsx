import type { ReactNode } from "react";

/**
 * Unified stat card used by both the Premier League and La Liga dashboards.
 *
 * Both variants print flat on the sheet with a hairline rule;
 * they differ in surface, density, and scale:
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
      <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)] px-4 py-4 ">
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-label)]">
            {eyebrow}
          </p>
          <span className="text-[var(--c97-accent)]">{icon}</span>
        </div>
        <p className="mt-3 text-lg font-semibold tabular-nums text-[var(--c97-ink)]">{metric}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--c97-ink-2)]">{detail}</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-field)] p-5 ">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
          {eyebrow}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center bg-[var(--c97-surface)] text-[var(--c97-accent)] ">
          {icon}
        </span>
      </div>
      {title && (
        <h3 className="mt-4 text-xl font-bold text-[var(--c97-ink)]">{title}</h3>
      )}
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-[var(--c97-ink)]">{metric}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--c97-ink-2)]">{detail}</p>
    </div>
  );
}
