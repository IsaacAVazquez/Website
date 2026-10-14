export interface LeaderLedgerEntry {
  rank: number;
  name: string;
  clubCode: string;
  /** Printed as given, so a caller can fix the precision. */
  value: number | string;
}

/**
 * Dense leaderboard rows (rank, bold name, club code, value and unit) on
 * hairlines with no box. Used for the scorers and assists boards on the
 * league pages and the stat leaders on the MLB, NBA, and NFL boards.
 */
export function LeaderLedger({
  title,
  entries,
  unit,
  emptyLabel,
}: {
  title: string;
  entries: LeaderLedgerEntry[];
  unit: string;
  emptyLabel?: string;
}) {
  return (
    <div>
      <h3 className="lt-h3" style={{ paddingBottom: "var(--c97-sp-1)" }}>{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--c97-ink-2)]" style={{ paddingTop: "var(--c97-sp-1)" }}>
          {emptyLabel ?? `No ${title.toLowerCase()} yet this season.`}
        </p>
      ) : (
        <div className="border-t border-[var(--c97-ink-2)]">
          {entries.map((entry) => (
            <div
              key={`${title}-${entry.rank}-${entry.name}`}
              className="flex min-h-[44px] items-center border-b border-[var(--c97-rule)]" style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
            >
              <span className="w-6 flex-shrink-0 text-sm tabular-nums text-[var(--c97-ink-2)]">{entry.rank}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--c97-ink)]">{entry.name}</span>
              <span className="flex-shrink-0 text-2xs font-semibold uppercase tracking-[0.06em] text-[var(--c97-ink-2)]">
                {entry.clubCode}
              </span>
              <span className="min-w-12 flex-shrink-0 text-right text-base font-bold tabular-nums text-[var(--c97-ink)]">
                {entry.value}
                <span className="text-2xs text-[var(--c97-ink-2)]" style={{ marginLeft: "var(--c97-sp-0)" }}>{unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
