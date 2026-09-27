import type { CSSProperties } from "react";

export interface DivisionGridTeam {
  id: string;
  shortName: string;
  record: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  isLeader: boolean;
}

export interface DivisionGridGroup {
  name: string;
  teams: DivisionGridTeam[];
}

function stripeStyle(primary: string | null, secondary: string | null): CSSProperties {
  const top = primary ?? "var(--c97-ink-2)";
  const bottom = secondary ?? top;
  return { background: `linear-gradient(180deg, ${top} 0 50%, ${bottom} 50% 100%)` };
}

/**
 * The eight divisions as a grid, each team a row striped in its own
 * primary and secondary colour. Colour stays in the stripe; the team name
 * and record print in ink.
 */
export function NflDivisionGrid({ divisions }: { divisions: DivisionGridGroup[] }) {
  return (
    <div className="c97-nfl-divisions">
      {divisions.map((division) => (
        <div key={division.name} className="c97-nfl-division">
          <p className="c97-kicker">{division.name}</p>
          <ol className="c97-nfl-division-rows">
            {division.teams.map((team) => (
              <li key={team.id} className="c97-nfl-division-row">
                <span
                  className="c97-nfl-division-stripe"
                  style={stripeStyle(team.primaryColor, team.secondaryColor)}
                  aria-hidden="true"
                />
                <span className="c97-serif c97-nfl-division-name">
                  {team.shortName}
                  {team.isLeader ? <span className="c97-nfl-division-leader">Leads</span> : null}
                </span>
                <span className="c97-mono c97-nfl-division-record">{team.record}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
