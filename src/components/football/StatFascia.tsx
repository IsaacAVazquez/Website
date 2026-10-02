export interface StatFasciaItem {
  /** Unique per item — also rendered as the mono eyebrow label. */
  eyebrow: string;
  metric: string;
  detail?: string;
}

/**
 * Fused hairline stat strip: a CSS grid with a 1px `--c97-rule` background
 * showing through the grid gap, so adjoining cards read as one strip with
 * shared hairlines instead of separately-bordered cards. Used inside
 * `ClubDrawer` (8 cells, wraps to two rows), 2-up on mobile and 4-up from
 * `sm:` up.
 */
export function StatFascia({
  items,
  className = "",
}: {
  items: StatFasciaItem[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-px border border-[var(--c97-rule)] bg-[var(--c97-rule)] sm:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <div key={item.eyebrow} className="min-w-0 bg-[var(--c97-surface)] px-3 py-2.5">
          <p className="truncate font-mono text-3xs font-normal uppercase tracking-[0.12em] text-[var(--c97-ink-2)]">
            {item.eyebrow}
          </p>
          <p className="mt-2 font-mono text-base tabular-nums text-[var(--c97-ink)]">
            {item.metric}
          </p>
          {item.detail ? (
            <p className="mt-1 truncate text-sm tabular-nums text-[var(--c97-ink-2)]">{item.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
