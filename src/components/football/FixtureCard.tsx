import type { CSSProperties } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CrestAvatar } from "./CrestAvatar";
import { TeamResultPill } from "./TeamResultPill";

export interface GenericFixture {
  id: string;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: { id: string; shortName: string; crest: string | null };
  awayTeam: { id: string; shortName: string; crest: string | null };
  score: { winner: string | null; home: number | null; away: number | null };
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatFixtureDateTime(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Time TBD" : DATE_TIME_FORMATTER.format(date);
}

function getResultForTeam(
  fixture: GenericFixture,
  teamId: string
): "W" | "D" | "L" | null {
  const isHome = fixture.homeTeam.id === teamId;
  const isAway = fixture.awayTeam.id === teamId;
  if (!isHome && !isAway) return null;
  if (fixture.score.winner === "DRAW") return "D";
  if (
    (isHome && fixture.score.winner === "HOME_TEAM") ||
    (isAway && fixture.score.winner === "AWAY_TEAM")
  ) return "W";
  return "L";
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
      className={cn(
        "rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)]",
        compact ? "px-3 py-2.5" : "px-4 py-4"
      )}
      style={style}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {!compact && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
              {fixture.matchday ? `${periodLabel} ${fixture.matchday}` : fallbackLabel}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--home-ink-muted)]">
              <Clock3 className="h-4 w-4 text-[var(--home-haze)]" />
              {fixture.status === "FINISHED"
                ? `Final · ${formatFixtureDateTime(fixture.utcDate)}`
                : formatFixtureDateTime(fixture.utcDate)}
            </p>
          </div>
        )}
        {compact && (
          <p className="flex items-center gap-1.5 text-xs text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
            <Clock3 className="h-3 w-3" />
            {fixture.status === "FINISHED" ? "Final" : formatFixtureDateTime(fixture.utcDate)}
          </p>
        )}
        {contextualResult ? <TeamResultPill result={contextualResult} /> : null}
      </div>

      <div className={compact ? "mt-2 space-y-1.5" : "mt-4 space-y-3"}>
        {[fixture.homeTeam, fixture.awayTeam].map((team, index) => {
          const isHome = index === 0;
          const score = isHome ? fixture.score.home : fixture.score.away;
          const isWinner =
            (isHome && fixture.score.winner === "HOME_TEAM") ||
            (!isHome && fixture.score.winner === "AWAY_TEAM");

          return (
            <div key={`${fixture.id}-${team.id}`} className="flex items-center justify-between gap-3">
              {onOpenTeam ? (
                <button
                  type="button"
                  onClick={() => onOpenTeam(team.id)}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:text-[var(--home-haze)]"
                >
                  <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
                  <span
                    className={cn(
                      "truncate text-sm",
                      isWinner ? "font-semibold text-[var(--home-ink)]" : "text-[var(--home-ink-muted)]"
                    )}
                  >
                    {team.shortName}
                  </span>
                </button>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <CrestAvatar crest={team.crest} name={team.shortName} size="sm" />
                  <span
                    className={cn(
                      "truncate text-sm",
                      isWinner ? "font-semibold text-[var(--home-ink)]" : "text-[var(--home-ink-muted)]"
                    )}
                  >
                    {team.shortName}
                  </span>
                </div>
              )}
              <span className="w-8 text-right text-sm font-semibold text-[var(--home-ink)]">
                {fixture.status === "FINISHED" && score !== null ? score : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
