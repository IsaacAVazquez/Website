import type { CSSProperties } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/cn";
import { CrestAvatar } from "./CrestAvatar";
import { formatFixtureDateTime, getResultForTeam } from "./fixtureFormat";
import { TeamResultPill } from "./TeamResultPill";

export interface GenericFixture {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: { id: string; shortName: string; crest: string | null };
  awayTeam: { id: string; shortName: string; crest: string | null };
  score: {
    winner: string | null;
    home: number | null;
    away: number | null;
    // Penalty shootout tallies, present only on knockout ties decided on pens
    // (World Cup). Other competitions omit them and render unchanged.
    shootoutHome?: number | null;
    shootoutAway?: number | null;
  };
  // The league has set the day and not the time, so utcDate holds a placeholder.
  startTimeTbd?: boolean;
  // A playoff game that is played only if the series is still open.
  ifNecessary?: boolean;
}

export function FixtureCard({
  fixture,
  contextTeamId,
  onOpenTeam,
  compact = false,
  style,
  periodLabel = "Matchday",
  fallbackLabel = "League fixture",
}: {
  fixture: GenericFixture;
  contextTeamId?: string | null;
  onOpenTeam?: (teamId: string) => void;
  compact?: boolean;
  style?: CSSProperties;
  periodLabel?: string;
  fallbackLabel?: string;
}) {
  const contextualResult = contextTeamId ? getResultForTeam(fixture, contextTeamId) : null;

  return (
    <div
      className="border border-[var(--c97-rule)] bg-[var(--c97-field)]"
      style={{ padding: compact ? "var(--c97-sp-1)" : "var(--c97-sp-2)", ...style }}
    >
      <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-1)" }}>
        {!compact && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--c97-label)]">
              {fixture.matchday ? `${periodLabel} ${fixture.matchday}` : fallbackLabel}
            </p>
            <p className="flex items-center text-sm text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-0)", gap: "var(--c97-sp-1)" }}>
              <Clock3 className="h-4 w-4 text-[var(--c97-accent)]" />
              {fixture.status === "FINISHED"
                ? `Final · ${formatFixtureDateTime(fixture)}`
                : formatFixtureDateTime(fixture)}
            </p>
          </div>
        )}
        {compact && (
          <p className="flex items-center text-xs text-[var(--c97-label)]" style={{ gap: "var(--c97-sp-0)" }}>
            <Clock3 className="h-3 w-3" />
            {fixture.status === "FINISHED" ? "Final" : formatFixtureDateTime(fixture)}
          </p>
        )}
        {contextualResult ? <TeamResultPill result={contextualResult} /> : null}
      </div>

      <div
        className="flex flex-col"
        style={{
          marginTop: compact ? "var(--c97-sp-1)" : "var(--c97-sp-2)",
          rowGap: compact ? "var(--c97-sp-0)" : "var(--c97-sp-1)",
        }}
      >
        {[fixture.homeTeam, fixture.awayTeam].map((team, index) => {
          const isHome = index === 0;
          const score = isHome ? fixture.score.home : fixture.score.away;
          const shootout = isHome ? fixture.score.shootoutHome : fixture.score.shootoutAway;
          const isWinner =
            (isHome && fixture.score.winner === "HOME_TEAM") ||
            (!isHome && fixture.score.winner === "AWAY_TEAM");

          return (
            <div key={`${fixture.id}-${team.id}`} className="flex items-center justify-between" style={{ gap: "var(--c97-sp-1)" }}>
              {onOpenTeam ? (
                <button
                  type="button"
                  onClick={() => onOpenTeam(team.id)}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center text-left transition-colors hover:text-[var(--c97-accent)] focus-visible:text-[var(--c97-accent)]" style={{ gap: "var(--c97-sp-1)" }}
                >
                  <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
                  <span
                    className={cn(
                      "truncate text-sm",
                      isWinner ? "font-semibold text-[var(--c97-ink)]" : "text-[var(--c97-ink-2)]"
                    )}
                  >
                    {team.shortName}
                  </span>
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-center" style={{ gap: "var(--c97-sp-1)" }}>
                  <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
                  <span
                    className={cn(
                      "truncate text-sm",
                      isWinner ? "font-semibold text-[var(--c97-ink)]" : "text-[var(--c97-ink-2)]"
                    )}
                  >
                    {team.shortName}
                  </span>
                </div>
              )}
              <span className="c97-tabular shrink-0 whitespace-nowrap text-right text-sm font-semibold text-[var(--c97-ink)]">
                {fixture.status === "FINISHED" && score !== null ? (
                  <>
                    {score}
                    {shootout != null ? (
                      <span className="text-xs font-medium text-[var(--c97-label)]" style={{ marginLeft: "var(--c97-sp-0)" }}>
                        ({shootout})
                      </span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
