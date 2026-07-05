export interface LeaderLedgerEntry {
  rank: number;
  name: string;
  clubCode: string;
  value: number;
}

/**
 * Denser mono leaderboard row list — the design mirror's `.lead-row` (mono
 * rank, bold name, mono club code, mono value + unit) inside one shared
 * panel border, as opposed to `LeaderList`'s individually-bordered cards.
 * Used for the scorers/assists boards on the league pages; `LeaderList`
 * itself is untouched since NBA/MLB/NFL/World Cup already depend on it.
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
    <div className="rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper)]">
      <h3 className="px-4 pt-4 text-base font-bold text-[var(--home-ink)]">{title}</h3>
      {entries.length === 0 ? (
        <p className="px-4 pb-4 pt-2 text-sm leading-relaxed text-[var(--home-ink-muted)]">
          {emptyLabel ?? `No ${title.toLowerCase()} yet this season.`}
        </p>
      ) : (
        <div className="px-4 pb-3.5">
          {entries.map((entry) => (
            <div
              key={`${title}-${entry.rank}-${entry.name}`}
              className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--home-rule)_50%,transparent)] py-2.5 last:border-b-0"
            >
              <span className="w-5 flex-shrink-0 font-mono text-sm text-[var(--home-ink-muted)]">{entry.rank}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--home-ink)]">{entry.name}</span>
              <span className="flex-shrink-0 font-mono text-2xs uppercase tracking-[0.06em] text-[var(--home-ink-muted)]">
                {entry.clubCode}
              </span>
              <span className="flex-shrink-0 font-mono text-base tabular-nums text-[var(--home-ink)]">
                {entry.value}
                <span className="ml-1 text-2xs text-[var(--home-ink-muted)]">{unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
