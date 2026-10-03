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
    <div className="border border-[var(--c97-rule)] bg-[var(--c97-surface)]">
      <h3 className="text-base font-bold text-[var(--c97-ink)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-2)" }}>{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--c97-ink-2)]" style={{ paddingInline: "var(--c97-sp-2)", paddingTop: "var(--c97-sp-1)", paddingBottom: "var(--c97-sp-2)" }}>
          {emptyLabel ?? `No ${title.toLowerCase()} yet this season.`}
        </p>
      ) : (
        <div style={{ paddingInline: "var(--c97-sp-2)", paddingBottom: "var(--c97-sp-2)" }}>
          {entries.map((entry) => (
            <div
              key={`${title}-${entry.rank}-${entry.name}`}
              className="flex items-center border-b border-[color-mix(in_srgb,var(--c97-rule)_50%,transparent)] last:border-b-0" style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}
            >
              <span className="w-5 flex-shrink-0 font-mono text-sm text-[var(--c97-ink-2)]">{entry.rank}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--c97-ink)]">{entry.name}</span>
              <span className="flex-shrink-0 font-mono text-2xs uppercase tracking-[0.06em] text-[var(--c97-ink-2)]">
                {entry.clubCode}
              </span>
              <span className="flex-shrink-0 font-mono text-base tabular-nums text-[var(--c97-ink)]">
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
