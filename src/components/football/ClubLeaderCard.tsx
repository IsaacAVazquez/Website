import { formatFixed } from "./fixtureFormat";
import type { LeaderEntry } from "./LeaderList";

/** A club's leader on one board, shared by the Premier League and La Liga club panels. */
export function ClubLeaderCard({
  title,
  leader,
  statLabel,
  emptyLabel,
}: {
  title: string;
  leader?: LeaderEntry;
  statLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="c97-panel">
      <p className="c97-kicker">{title}</p>
      {leader ? (
        <>
          <p className="text-lg font-bold c97-serif" style={{ marginTop: "var(--c97-sp-1)" }}>{leader.name}</p>
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>
            {leader.total} {statLabel.toLowerCase()} in {leader.appearances} matches
          </p>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }}>
            {formatFixed(leader.perMatch)} per match
          </p>
        </>
      ) : (
        <p className="c97-prose" style={{ marginTop: "var(--c97-sp-1)" }}>{emptyLabel}</p>
      )}
    </div>
  );
}
