export interface MissionStatFasciaCell {
  label: string;
  value: string;
  detail: string;
}

interface MissionStatFasciaProps {
  cells: MissionStatFasciaCell[];
}

/**
 * Fused hairline stat fascia: cards share a 1px `--home-rule` gutter so the
 * strip reads as one instrument panel instead of four separately-bordered
 * cards. A route-local variant rather than a restyle of the shared
 * `HomeStatsPanel` (used elsewhere with a different, more spacious look).
 */
export function MissionStatFascia({ cells }: MissionStatFasciaProps) {
  if (cells.length === 0) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Mission control stat fascia"
      className="grid grid-cols-2 gap-px border border-[var(--home-rule)] bg-[var(--home-rule)] sm:grid-cols-4"
    >
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0 bg-[var(--home-paper)] px-4 py-3.5">
          <p className="font-mono text-3xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
            {cell.label}
          </p>
          <p className="mt-2 text-xl font-bold tracking-[-0.02em] tabular-nums text-[var(--home-ink)] sm:text-2xl">
            {cell.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--home-ink-muted)]">{cell.detail}</p>
        </div>
      ))}
    </div>
  );
}
