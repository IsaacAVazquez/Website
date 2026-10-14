import { WILD_CARD_SLOTS, type ScoreboardDivision } from "./scoreboard";

interface MlbScoreboardProps {
  boards: ScoreboardDivision[];
  selectedId: string | null;
  onSelect: (teamId: string) => void;
}

function lastTenLabel(squares: readonly string[]): string {
  if (squares.length === 0) return "No recent games recorded";
  const wins = squares.filter((square) => square === "W").length;
  return `${wins} win${wins === 1 ? "" : "s"} in the last ${squares.length}`;
}

/**
 * The out-of-town scoreboard, which is the page: one ruled table per race
 * (the six divisions, or the two wild card races), each row a team with its
 * record, games back, last ten as lit squares, and streak. Every team is a
 * button into the drawer. A division leader and a wild card slot print as a
 * word beside the code, so status never rests on the lit colour alone.
 */
export function MlbScoreboard({ boards, selectedId, onSelect }: MlbScoreboardProps) {
  if (boards.length === 0) {
    return <p className="sb-muted">Standings for this season aren&apos;t loaded yet.</p>;
  }

  return (
    <div className="mlb-boards" data-kind={boards[0].kind} data-count={boards.length}>
      {boards.map((board) => {
        const headingId = `mlb-board-${board.name.toLowerCase().replaceAll(" ", "-")}`;
        return (
          <div key={board.name} className="mlb-division">
            <h3 id={headingId} className="mlb-division-name">
              {board.name} <span className="sr-only">standings</span>
            </h3>
            <table className="mlb-table" aria-labelledby={headingId}>
              <thead>
                <tr>
                  <th scope="col" className="mlb-col-team">Team</th>
                  <th scope="col" className="mlb-num">
                    <abbr title="Wins and losses">W-L</abbr>
                  </th>
                  <th scope="col" className="mlb-num">
                    <abbr title={
                        board.kind === "wildcard"
                          ? "Games behind or ahead of the last wild card slot"
                          : "Games back"
                      }>GB</abbr>
                  </th>
                  <th scope="col" className="mlb-col-ten">
                    <abbr title="Last ten games, wins lit">L10</abbr>
                  </th>
                  <th scope="col" className="mlb-num mlb-col-streak">
                    <abbr title="Streak">Strk</abbr>
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.teams.map((team, index) => {
                  const isSelected = team.id === selectedId;
                  const mark =
                    board.kind === "division"
                      ? team.divisionRank === 1
                        ? "Leads"
                        : team.holdsWildCard
                          ? "WC"
                          : null
                      : index < WILD_CARD_SLOTS
                        ? "In"
                        : null;
                  const markTitle =
                    mark === "Leads" ? "Leads the division" : mark === "WC" || mark === "In" ? "Holds a wild card slot" : undefined;
                  const label = lastTenLabel(team.squares);
                  return (
                    <tr
                      key={team.id}
                      data-selected={isSelected || undefined}
                      data-line={board.kind === "wildcard" && index === WILD_CARD_SLOTS - 1 ? "" : undefined}
                    >
                      <td className="mlb-col-team">
                        <button
                          type="button"
                          className="mlb-team"
                          onClick={() => onSelect(team.id)}
                          aria-pressed={isSelected}
                          aria-haspopup="dialog"
                          aria-label={`Show ${team.fullName} details`}
                        >
                          <span className="mlb-code">{team.code}</span>
                          <span className="mlb-name">{team.name}</span>
                          {mark ? (
                            <abbr className="mlb-mark" title={markTitle} data-mark={mark}>
                              {mark}
                            </abbr>
                          ) : null}
                        </button>
                        {/* The button's label replaces its content, so the mark is said again outside it. */}
                        {markTitle ? <span className="sr-only">{markTitle}</span> : null}
                      </td>
                      <td className="mlb-num">{team.record}</td>
                      <td className="mlb-num">{team.gamesBack}</td>
                      <td className="mlb-col-ten">
                        <span className="mlb-squares" role="img" aria-label={label} title={label}>
                          {team.squares.map((square, squareIndex) => (
                            <span key={squareIndex} className="mlb-square" data-square={square} aria-hidden="true" />
                          ))}
                        </span>
                      </td>
                      <td className="mlb-num mlb-col-streak" data-streak={team.streak.charAt(0) || undefined}>
                        {team.streak || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
