import type { ReactNode } from "react";
import { InstrumentTape, type InstrumentTapeItem } from "@/components/editorial/InstrumentTape";
import { formatKickoff } from "./fixtureFormat";

/**
 * Minimal fixture shape ResultsTape needs — deliberately narrower than
 * `GenericFixture` (FixtureCard.tsx) because the tape wants each side's short
 * competition code (TLA) when the snapshot has one, not just a full team
 * name. `PremierLeagueFixture`/`LaLigaFixture` already satisfy this shape
 * structurally, so callers pass those straight through.
 */
export interface ResultsTapeFixture {
  id: string;
  utcDate: string;
  status: string;
  homeTeam: { shortName: string; tla?: string | null };
  awayTeam: { shortName: string; tla?: string | null };
  score: { winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null; home: number | null; away: number | null };
}

function teamLabel(team: { shortName: string; tla?: string | null }): string {
  return team.tla || team.shortName;
}

/**
 * Recent-result score item: winner's side takes the win/draw/loss semantic
 * color (the same positive/negative trio TeamResultPill uses), loser dims to
 * --c97-ink-2, the scoreline itself stays neutral ink.
 * This is a deliberate departure from the design mirror (which just used
 * ink-vs-muted) toward the site's already-canonical W/D/L semantics.
 */
function ResultItem({ fixture }: { fixture: ResultsTapeFixture }) {
  const homeWin = fixture.score.winner === "HOME_TEAM";
  const awayWin = fixture.score.winner === "AWAY_TEAM";
  const homeColor = homeWin ? "var(--c97-positive)" : awayWin ? "var(--c97-negative)" : "var(--c97-ink-2)";
  const awayColor = awayWin ? "var(--c97-positive)" : homeWin ? "var(--c97-negative)" : "var(--c97-ink-2)";

  return (
    <>
      <span style={{ color: homeColor, letterSpacing: "0.02em" }}>{teamLabel(fixture.homeTeam)}</span>
      <span style={{ color: "var(--c97-ink)" }}>
        {fixture.score.home ?? "–"}
        <span style={{ color: "var(--c97-ink-2)", padding: "0 2px" }}>–</span>
        {fixture.score.away ?? "–"}
      </span>
      <span style={{ color: awayColor, letterSpacing: "0.02em" }}>{teamLabel(fixture.awayTeam)}</span>
    </>
  );
}

function UpcomingItem({ fixture }: { fixture: ResultsTapeFixture }) {
  return (
    <>
      <span style={{ color: "var(--c97-ink-2)", letterSpacing: "0.02em" }}>{teamLabel(fixture.homeTeam)}</span>
      <span
        style={{
          color: "color-mix(in srgb, var(--c97-ink-2) 78%, var(--c97-ink))",
          fontSize: "var(--text-3xs)",
          letterSpacing: "0.05em",
        }}
      >
        {formatKickoff(fixture.utcDate)}
      </span>
      <span style={{ color: "var(--c97-ink-2)", letterSpacing: "0.02em" }}>{teamLabel(fixture.awayTeam)}</span>
    </>
  );
}

/**
 * League results tape — the investments terminal's quote-tape device ported
 * into the matchday sheet: recent scorelines (winner/loser in the W/D/L
 * semantic colors) followed by upcoming kickoffs, on the shared
 * `InstrumentTape` fused-hairline track. Purely presentational; callers
 * supply the already-fetched recent/upcoming fixture arrays.
 */
export function ResultsTape({
  recentFixtures,
  upcomingFixtures,
  label,
  emptyFallback = null,
  className,
}: {
  recentFixtures: ResultsTapeFixture[];
  upcomingFixtures: ResultsTapeFixture[];
  label?: ReactNode;
  emptyFallback?: ReactNode;
  className?: string;
}) {
  const items: InstrumentTapeItem[] = [
    ...recentFixtures.map((fixture) => ({
      key: `r-${fixture.id}`,
      content: <ResultItem fixture={fixture} />,
    })),
    ...upcomingFixtures.map((fixture) => ({
      key: `u-${fixture.id}`,
      content: <UpcomingItem fixture={fixture} />,
    })),
  ];

  return (
    <InstrumentTape
      label={label}
      items={items}
      ariaLabel="Recent results and upcoming fixtures"
      emptyFallback={emptyFallback}
      className={className}
    />
  );
}
