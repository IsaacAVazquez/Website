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
            className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--home-paper)] text-sm font-bold text-[var(--home-haze)] shadow-sm">
                {leader.rank}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--home-ink)]">{leader.name}</p>
                <p className="text-sm text-[var(--home-ink-muted)]">
                  {clubName} · {leader.appearances} apps
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--home-ink)]">{leader.total}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
                {statLabel}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
