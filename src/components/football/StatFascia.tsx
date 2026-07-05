export interface StatFasciaItem {
  /** Unique per item — also rendered as the mono eyebrow label. */
  eyebrow: string;
  metric: string;
  detail?: string;
}

/**
 * Fused hairline stat strip: a CSS grid with a 1px `--home-rule` background
 * showing through the grid gap, so adjoining cards read as one strip with
 * shared hairlines instead of separately-bordered cards. Used both at the
 * page level (4 cells: leader / top scorer / most goals / best defense) and
 * inside `ClubDrawer` (8 cells, wraps to two rows) — always 2-up on mobile,
 * 4-up from `sm:` up, matching the design mirror's `.stat-strip`.
 */
export function StatFascia({
  items,
  dense = false,
  className = "",
}: {
  items: StatFasciaItem[];
  dense?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-px border border-[var(--home-rule)] bg-[var(--home-rule)] sm:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <div key={item.eyebrow} className={`min-w-0 bg-[var(--home-paper)] ${dense ? "px-3 py-2.5" : "px-4 py-3.5"}`}>
          <p className="truncate font-mono text-3xs font-normal uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
            {item.eyebrow}
          </p>
          <p
            className={`mt-2 font-mono tabular-nums text-[var(--home-ink)] ${
              dense ? "text-base" : "text-xl font-bold tracking-tight"
            }`}
          >
            {item.metric}
          </p>
          {item.detail ? (
            <p className="mt-1 truncate text-sm tabular-nums text-[var(--home-ink-muted)]">{item.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
