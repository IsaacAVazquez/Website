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
      <article className={`home-card p-5 sm:p-6 ${className}`.trim()}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
            {label}
          </p>
          {icon ? <span className="text-[var(--home-ink-muted)]">{icon}</span> : null}
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--home-ink)]">
          {value}
        </p>
        {detail ? (
          <p className="mt-2 mb-0 text-sm leading-6 text-[var(--home-ink-muted)]">{detail}</p>
        ) : null}
      </article>
    );
  }

  return (
    <div className={`rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-[var(--home-ink)]">{value}</p>
    </div>
  );
}
