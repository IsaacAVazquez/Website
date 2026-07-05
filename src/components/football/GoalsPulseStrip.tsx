export interface GoalsPulseEntry {
  matchday: number;
  totalGoals: number;
}

/**
 * Goals-per-matchday pulse — the dashboard's namesake device: one bar per
 * matchday, height scaled to the season's highest-scoring matchday, the most
 * recent bar picked out in --home-signal. `data` is season-to-date and can
 * legitimately be empty (a pre-season snapshot has no FINISHED matches yet),
 * so this renders a plain, on-brand empty state instead of an empty chart —
 * the page should ship now and light up once the first matchday completes.
 */
export function GoalsPulseStrip({
  data,
  capLabel,
  className = "",
}: {
  data: GoalsPulseEntry[];
  capLabel?: string;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div className={className} aria-label="Goals per matchday, season to date">
        <p className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
          Goals / matchday
        </p>
        <p className="mt-2 max-w-[22ch] text-xs leading-relaxed text-[var(--home-ink-muted)]">
          Pulse arrives with the first matchday of the season.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((entry) => entry.totalGoals), 1);

  return (
    <div className={className} aria-label="Goals per matchday, season to date">
      <div className="flex h-11 items-end gap-[3px]">
        {data.map((entry, index) => (
          <span
            key={entry.matchday}
            className="w-2 flex-shrink-0"
            style={{
              height: `${Math.max(Math.round((entry.totalGoals / max) * 100), 4)}%`,
              background:
                index === data.length - 1
                  ? "var(--home-signal)"
                  : "color-mix(in srgb, var(--home-ink) 20%, var(--home-paper))",
            }}
            title={`Matchday ${entry.matchday} · ${entry.totalGoals} goals`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
        <span>Goals / matchday</span>
        {capLabel ? <span>{capLabel}</span> : null}
      </div>
    </div>
  );
}
