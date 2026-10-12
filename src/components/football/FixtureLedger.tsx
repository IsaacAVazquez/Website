import { CrestAvatar } from "./CrestAvatar";
import type { GenericFixture } from "./FixtureCard";
import type { FixtureLedgerGroup } from "./fixtureLedgerUtils";
import { formatFixtureDateTime, formatKickoff } from "./fixtureFormat";

function TeamCell({
  team,
  align = "start",
  onOpenTeam,
}: {
  team: GenericFixture["homeTeam"];
  align?: "start" | "end";
  onOpenTeam?: (teamId: string) => void;
}) {
  const content = (
    <>
      {align === "end" ? (
        <>
          <span className="min-w-0 truncate text-sm font-semibold text-[var(--c97-ink)]">{team.shortName}</span>
          <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
        </>
      ) : (
        <>
          <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
          <span className="min-w-0 truncate text-sm font-semibold text-[var(--c97-ink)]">{team.shortName}</span>
        </>
      )}
    </>
  );

  const justify = align === "end" ? "justify-end" : "justify-start";

  if (onOpenTeam) {
    return (
      <button
        type="button"
        onClick={() => onOpenTeam(team.id)}
        className={`flex min-h-[44px] min-w-0 flex-1 items-center ${justify} transition-colors hover:text-[var(--c97-accent)] focus-visible:text-[var(--c97-accent)]`} style={{ gap: "var(--c97-sp-1)" }}
      >
        {content}
      </button>
    );
  }

  return <div className={`flex min-w-0 flex-1 items-center ${justify}`} style={{ gap: "var(--c97-sp-1)" }}>{content}</div>;
}

function FixtureLedgerRow({
  fixture,
  onOpenTeam,
}: {
  fixture: GenericFixture;
  onOpenTeam?: (teamId: string) => void;
}) {
  const isFinal = fixture.status === "FINISHED";
  const hasShootout = fixture.score.shootoutHome != null && fixture.score.shootoutAway != null;
  const finalScore = (
    <span className="flex items-center justify-center text-base font-bold tabular-nums text-[var(--c97-ink)]">
      {fixture.score.home ?? "–"}
      <span className="px-0.5 text-[var(--c97-ink-2)]">–</span>
      {fixture.score.away ?? "–"}
    </span>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(76px,auto)_minmax(0,1fr)] items-stretch border-b border-[var(--c97-rule)] transition-colors hover:bg-[var(--c97-field)]" style={{ paddingBlock: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
      <TeamCell team={fixture.homeTeam} onOpenTeam={onOpenTeam} />
      {isFinal && hasShootout ? (
        // A knockout tie settled on penalties (the World Cup) prints the shootout under the score.
        <span className="flex flex-col justify-center">
          {finalScore}
          <span className="text-center text-2xs tabular-nums text-[var(--c97-ink-2)]">
            {fixture.score.shootoutHome}–{fixture.score.shootoutAway} pens
          </span>
        </span>
      ) : isFinal ? (
        finalScore
      ) : (
        <span className="flex items-center justify-center text-center text-2xs text-[var(--c97-ink-2)]">
          {/* A placeholder clock (MLB's unset start times) prints the day and "time TBD" instead. */}
          {fixture.startTimeTbd ? formatFixtureDateTime(fixture) : formatKickoff(fixture.utcDate)}
        </span>
      )}
      <TeamCell team={fixture.awayTeam} align="end" onOpenTeam={onOpenTeam} />
    </div>
  );
}

/**
 * The scoreboard ledger: fixtures grouped by matchday under a ruled label,
 * each fixture a single 3-column row (home, score or kickoff, away) on a
 * hairline, with no box around the group.
 */
export function FixtureLedgerSection({
  groups,
  onOpenTeam,
  emptyLabel,
}: {
  groups: FixtureLedgerGroup[];
  onOpenTeam?: (teamId: string) => void;
  /** Shown in place of the ledger when there are no fixtures; nothing renders without it. */
  emptyLabel?: string;
}) {
  if (groups.length === 0) return emptyLabel ? <p className="c97-prose">{emptyLabel}</p> : null;

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      {groups.map((group) => (
        <div key={group.key}>
          <div className="flex items-center justify-between border-b border-[var(--c97-ink-2)] text-2xs font-semibold uppercase tracking-[0.06em] text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)", gap: "var(--c97-sp-1)" }}>
            <span>{group.label}</span>
            <span>{group.fixtures.length} {group.fixtures.length === 1 ? "game" : "games"}</span>
          </div>
          {group.fixtures.map((fixture) => (
            <FixtureLedgerRow key={fixture.id} fixture={fixture} onOpenTeam={onOpenTeam} />
          ))}
        </div>
      ))}
    </div>
  );
}
