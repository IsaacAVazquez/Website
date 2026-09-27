import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Shared metric stat card used across dashboards (Premier League, La Liga,
 * Formula 1). Pass `detail`/`icon` for the editorial variant; omit for the
 * compact football-table variant.
 */
export function MetricCard({ label, value, detail, icon, className = "" }: MetricCardProps) {
  const isExtended = Boolean(detail || icon);

  if (isExtended) {
    return (
      <article className={`c97-panel ${className}`.trim()}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--c97-ink-2)]">
            {label}
          </p>
          {icon ? <span className="text-[var(--c97-ink-2)]">{icon}</span> : null}
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] tabular-nums text-[var(--c97-ink)]">
          {value}
        </p>
        {detail ? (
          <p className="mt-2 mb-0 text-sm leading-6 text-[var(--c97-ink-2)]">{detail}</p>
        ) : null}
      </article>
    );
  }

  return (
    <div className={`border border-[var(--c97-rule)] bg-[var(--c97-field)] p-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-[var(--c97-ink)]">{value}</p>
    </div>
  );
}
