import type { CSSProperties } from "react";

interface DivisionGridTeam {
  id: string;
  name: string;
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
  const top = primary ?? "var(--sb-ink-2)";
  const bottom = secondary ?? top;
  return { background: `linear-gradient(180deg, ${top} 0 50%, ${bottom} 50% 100%)` };
}

/**
 * The eight divisions as a ruled grid, each team a row striped in its own
 * primary and secondary colour that opens the team drawer. Colour stays in
 * the stripe; the team name and record print in ink, and the leader is
 * marked in words.
 */
export function NflDivisionGrid({
  divisions,
  selectedId,
  onSelect,
}: {
  divisions: DivisionGridGroup[];
  selectedId: string | null;
  onSelect: (teamId: string) => void;
}) {
  return (
    <div className="nfl-divisions">
      {divisions.map((division) => (
        <div key={division.name} className="nfl-division">
          <h3 className="nfl-division-name">{division.name}</h3>
          <ol className="nfl-division-rows">
            {division.teams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  className="nfl-division-row"
                  onClick={() => onSelect(team.id)}
                  aria-haspopup="dialog"
                  aria-pressed={team.id === selectedId}
                >
                  <span
                    className="nfl-division-stripe"
                    style={stripeStyle(team.primaryColor, team.secondaryColor)}
                    aria-hidden="true"
                  />
                  <span className="nfl-division-team">
                    <span className="sb-team-name">{team.shortName}</span>
                    {team.isLeader ? <span className="nfl-division-leader">Leads</span> : null}
                  </span>
                  <span className="nfl-division-record">{team.record}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
