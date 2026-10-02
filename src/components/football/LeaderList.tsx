export interface LeaderEntry {
  rank: number;
  name: string;
  clubId: string;
  clubCode: string;
  total: number;
  appearances: number;
  perMatch: number;
}

export function LeaderList({
  leaders,
  statLabel,
  clubLookup,
}: {
  leaders: LeaderEntry[];
  statLabel: string;
  clubLookup?: Map<string, string>;
}) {
  return (
    <ol className="mt-5 space-y-3 pl-0">
      {leaders.map((leader) => {
        const clubName = clubLookup?.get(leader.clubId) ?? leader.clubCode;
        return (
          <li
            key={`${statLabel}-${leader.rank}-${leader.name}`}
            className="flex items-center justify-between gap-4 border border-[var(--c97-rule)] bg-[var(--c97-field)] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[var(--c97-surface)] text-sm font-bold text-[var(--c97-accent)] ">
                {leader.rank}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--c97-ink)]">{leader.name}</p>
                <p className="text-sm text-[var(--c97-ink-2)]">
                  {/* Some feeds send no games count, and "0 apps" would be false. */}
                  {leader.appearances > 0
                    ? `${clubName} · ${leader.appearances} apps`
                    : clubName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="c97-tabular text-lg font-bold text-[var(--c97-ink)]">{leader.total}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--c97-label)]">
                {statLabel}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
