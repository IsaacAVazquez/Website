import { CrestAvatar } from "./CrestAvatar";
import type { GenericFixture } from "./FixtureCard";
import type { FixtureLedgerGroup } from "./fixtureLedgerUtils";

const KICKOFF_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

function formatKickoff(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Time TBD" : KICKOFF_FORMATTER.format(date);
}

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
          <span className="min-w-0 truncate text-sm font-semibold text-[var(--home-ink)]">{team.shortName}</span>
          <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
        </>
      ) : (
        <>
          <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
          <span className="min-w-0 truncate text-sm font-semibold text-[var(--home-ink)]">{team.shortName}</span>
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
        className={`flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 ${justify} rounded-[var(--radius-xl)] transition-colors hover:text-[var(--home-signal)]`}
      >
        {content}
      </button>
    );
  }

  return <div className={`flex min-w-0 flex-1 items-center gap-2.5 ${justify}`}>{content}</div>;
}

function FixtureLedgerRow({
  fixture,
  onOpenTeam,
}: {
  fixture: GenericFixture;
  onOpenTeam?: (teamId: string) => void;
}) {
  const isFinal = fixture.status === "FINISHED";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(76px,auto)_minmax(0,1fr)] items-center gap-3 border-b border-[var(--home-rule)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--home-paper-raised)] hover:shadow-[inset_3px_0_0_var(--home-signal)]">
      <TeamCell team={fixture.homeTeam} onOpenTeam={onOpenTeam} />
      {isFinal ? (
        <span className="text-center font-mono text-lg tabular-nums text-[var(--home-ink)]">
          {fixture.score.home ?? "–"}
          <span className="px-0.5 text-[var(--home-ink-muted)]">–</span>
          {fixture.score.away ?? "–"}
        </span>
      ) : (
        <span className="text-center font-mono text-2xs text-[var(--home-ink-muted)]">
          {formatKickoff(fixture.utcDate)}
        </span>
      )}
      <TeamCell team={fixture.awayTeam} align="end" onOpenTeam={onOpenTeam} />
    </div>
  );
}

/**
 * The scoreboard ledger: fixtures grouped by matchday inside a bordered
 * panel per group, each fixture a single 3-column row (home | score-or-time
 * | away) rather than `FixtureCard`'s stacked two-row layout.
 */
export function FixtureLedgerSection({
  groups,
  onOpenTeam,
}: {
  groups: FixtureLedgerGroup[];
  onOpenTeam?: (teamId: string) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.key}
          className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--home-rule)] bg-[var(--home-paper)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--home-rule)] px-4 py-2.5 font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
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
