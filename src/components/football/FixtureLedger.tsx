import { CrestAvatar } from "./CrestAvatar";
import type { GenericFixture } from "./FixtureCard";
import type { FixtureLedgerGroup } from "./fixtureLedgerUtils";
import { formatFixtureDay, formatFixtureTime, getResultForTeam } from "./fixtureFormat";
import { TeamResultPill } from "./TeamResultPill";

function TeamCell({
  team,
  align = "start",
  muted = false,
  onOpenTeam,
}: {
  team: GenericFixture["homeTeam"];
  align?: "start" | "end";
  /** The side that lost a game printed without a score. */
  muted?: boolean;
  onOpenTeam?: (teamId: string) => void;
}) {
  // A name too long for a phone takes a second line before it is cut, and a
  // single word wider than its cell breaks so none of it is clipped.
  const name = (
    <span
      className={`min-w-0 line-clamp-2 break-words text-sm leading-tight ${align === "end" ? "text-right" : "text-left"} ${muted ? "text-[var(--c97-ink-2)]" : "font-semibold text-[var(--c97-ink)]"}`}
    >
      {team.shortName}
    </span>
  );
  const crest = <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />;
  const content = align === "end" ? <>{name}{crest}</> : <>{crest}{name}</>;

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
  canOpenTeam,
  dayInLabel,
  contextTeamId,
}: {
  fixture: GenericFixture;
  onOpenTeam?: (teamId: string) => void;
  canOpenTeam?: (teamId: string) => boolean;
  dayInLabel: boolean;
  contextTeamId?: string | null;
}) {
  const { homeTeam, awayTeam, score } = fixture;
  const isFinal = fixture.status === "FINISHED";
  const hasShootout = score.shootoutHome != null && score.shootoutAway != null;
  // Some feeds send a finished game with a winner and no score.
  const isScoreless = isFinal && score.home == null && score.away == null;
  const winner =
    score.winner === "HOME_TEAM" ? homeTeam : score.winner === "AWAY_TEAM" ? awayTeam : null;
  const loser = isScoreless && winner ? (winner === homeTeam ? awayTeam : homeTeam) : null;
  const inContext = contextTeamId != null && (homeTeam.id === contextTeamId || awayTeam.id === contextTeamId);
  const result = contextTeamId ? getResultForTeam(fixture, contextTeamId) : null;
  // One line each, so the column stays as narrow as its longest part and the
  // team names keep their room on a phone.
  const lines = [
    dayInLabel ? null : formatFixtureDay(fixture),
    isFinal ? null : formatFixtureTime(fixture),
    !isFinal && fixture.ifNecessary ? "if necessary" : null,
  ].filter((line): line is string => line !== null);
  const openFor = (teamId: string) => (canOpenTeam?.(teamId) === false ? undefined : onOpenTeam);

  return (
    <div
      data-selected={inContext || undefined}
      className="grid grid-cols-[minmax(0,1fr)_minmax(64px,auto)_minmax(0,1fr)] items-stretch border-b border-[var(--c97-rule)] transition-colors hover:bg-[var(--c97-field)]" style={{ paddingBlock: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}
    >
      <TeamCell team={homeTeam} muted={loser === homeTeam} onOpenTeam={openFor(homeTeam.id)} />
      <div className="flex flex-col justify-center text-center">
        {isFinal ? (
          <span className="flex items-center justify-center font-bold tabular-nums text-[var(--c97-ink)]" style={{ gap: "var(--c97-sp-1)" }}>
            {isScoreless ? (
              <span className="text-sm">
                Final
                {winner ? <span className="sr-only">, {winner.shortName} won</span> : null}
              </span>
            ) : (
              <span className="text-base">
                {score.home ?? "–"}
                <span className="px-0.5 text-[var(--c97-ink-2)]">–</span>
                {score.away ?? "–"}
              </span>
            )}
            {result ? <TeamResultPill result={result} /> : null}
          </span>
        ) : null}
        {isFinal && hasShootout ? (
          <span className="text-center text-2xs tabular-nums text-[var(--c97-ink-2)]">
            {score.shootoutHome}–{score.shootoutAway} pens
          </span>
        ) : null}
        {lines.map((line) => (
          <span key={line} className="whitespace-nowrap text-2xs text-[var(--c97-ink-2)]">
            {line}
          </span>
        ))}
      </div>
      <TeamCell team={awayTeam} align="end" muted={loser === awayTeam} onOpenTeam={openFor(awayTeam.id)} />
    </div>
  );
}

/**
 * Fixtures sit under a caller-supplied group label, with home team, dated
 * score or kickoff, and away team in one three-column row. The label carries
 * no count, since callers pass capped lists and a count would read as the
 * size of the whole round.
 */
export function FixtureLedgerSection({
  groups,
  onOpenTeam,
  canOpenTeam,
  emptyLabel,
  dayInLabel = false,
  contextTeamId,
}: {
  groups: FixtureLedgerGroup[];
  onOpenTeam?: (teamId: string) => void;
  /** Says which teams `onOpenTeam` can open. A team it turns down prints as text, not a button. */
  canOpenTeam?: (teamId: string) => boolean;
  /** Shown in place of the ledger when there are no fixtures; nothing renders without it. */
  emptyLabel?: string;
  /** Set when every group label names its fixtures' day, so the rows do not print it again. */
  dayInLabel?: boolean;
  /** A team the page is about. Its rows carry `data-selected` and its win, draw, or loss. */
  contextTeamId?: string | null;
}) {
  if (groups.length === 0) return emptyLabel ? <p className="c97-prose">{emptyLabel}</p> : null;

  return (
    <div className="flex flex-col" style={{ rowGap: "var(--c97-sp-2)" }}>
      {groups.map((group) => (
        <div key={group.key}>
          <div className="border-b border-[var(--c97-ink-2)] text-2xs font-semibold uppercase tracking-[0.06em] text-[var(--c97-ink-2)]" style={{ paddingBlock: "var(--c97-sp-1)" }}>
            {group.label}
          </div>
          {group.fixtures.map((fixture) => (
            <FixtureLedgerRow
              key={fixture.id}
              fixture={fixture}
              onOpenTeam={onOpenTeam}
              canOpenTeam={canOpenTeam}
              dayInLabel={dayInLabel}
              contextTeamId={contextTeamId}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
