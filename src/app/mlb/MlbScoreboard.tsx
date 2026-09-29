import type { ScoreboardDivision } from "./scoreboard";

interface MlbScoreboardProps {
  divisions: ScoreboardDivision[];
}

/**
 * The page's signature: an out-of-town scoreboard, six division panels each
 * listing a team, its record, its games back, and a lit/hollow run of last-10
 * squares. It sits on its own paper plate inside the hero, since the panel
 * grid and squares are fields the ink sheet can't carry. Squares are plain
 * (no click, no tab stop); the standings table below is the only way to open
 * a team's detail.
 */
export function MlbScoreboard({ divisions }: MlbScoreboardProps) {
  if (divisions.length === 0) {
    return <p className="c97-meta">Standings for this season aren&apos;t loaded yet.</p>;
  }

  return (
    <div data-c97-surface="paper" className="c97-offset c97-mlb-scoreboard">
      {divisions.map((division) => (
        <div key={division.name} className="c97-mlb-scoreboard-panel">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-1)" }}>{division.name}</p>
          <ul className="c97-mlb-scoreboard-list">
            {division.teams.map((team) => (
              <li key={team.id} className="c97-mlb-scoreboard-row">
                <span className="c97-mono c97-mlb-scoreboard-code">{team.code}</span>
                <span className="c97-mono c97-mlb-scoreboard-record">{team.record}</span>
                <span className="c97-mono c97-mlb-scoreboard-gb">{team.gamesBack}</span>
                <span
                  className="c97-mlb-scoreboard-squares"
                  role="img"
                  aria-label={
                    team.squares.length > 0
                      ? `${team.squares.filter((s) => s === "W").length} win${
                          team.squares.filter((s) => s === "W").length === 1 ? "" : "s"
                        } in the last ${team.squares.length}`
                      : "No recent games recorded"
                  }
                  title={
                    team.squares.length > 0
                      ? `${team.squares.filter((s) => s === "W").length} win${
                          team.squares.filter((s) => s === "W").length === 1 ? "" : "s"
                        } in the last ${team.squares.length}`
                      : undefined
                  }
                >
                  {team.squares.map((square, index) => (
                    <span
                      key={index}
                      aria-hidden="true"
                      className="c97-mlb-scoreboard-square"
                      data-square={square}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
