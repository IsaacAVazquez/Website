import "./seed-ladder.css";
import { formatGamesGap, type SeedLadderResult } from "./seedLadder";

export interface LadderTeam {
  id: string;
  /** The full name, for the button's accessible name. */
  name: string;
  seed: number;
  wins: number;
  losses: number;
  ties?: number;
  shortName: string;
  /** Pre-formatted record, e.g. "58-24" or "9-4-1". */
  record: string;
  /** Hex with the leading "#", or null when the snapshot carries no colour. */
  color: string | null;
}

export interface LadderColumn<T extends LadderTeam> {
  key: string;
  /** The header text, short. */
  label: string;
  /** The header's full meaning, read out and shown on hover. */
  title: string;
  /** Printed only from 640px, where the ladder has the room. */
  wide?: boolean;
  value: (team: T) => string;
}

export interface SeedLadderConference<T extends LadderTeam> {
  id: string;
  label: string;
  ladder: SeedLadderResult<T>;
}

function formatGamesClear(gap: number | null): string | null {
  if (gap === null) return null;
  if (gap === 0) return "tied at the line";
  return `${formatGamesGap(gap)} clear`;
}

/**
 * The playoff picture as the standings: one ruled table per conference,
 * split into bands (in, play-in, out) with the games-clear gap printed on
 * each line between them. The team colour sits in a small chip, since the
 * same colour as small text fails 4.5:1, and every team is a button that
 * opens the route's drawer. Band membership prints as the band's own label
 * row, so it never rests on colour alone.
 */
export function SeedLadder<T extends LadderTeam>({
  conferences,
  columns,
  lineLabels,
  selectedId,
  onSelect,
  isBandVisible = () => true,
  seedLabel = (team) => String(team.seed),
}: {
  conferences: SeedLadderConference<T>[];
  columns: LadderColumn<T>[];
  /** One label per line between bands, e.g. "Playoff line". */
  lineLabels: string[];
  selectedId: string | null;
  onSelect: (teamId: string) => void;
  isBandVisible?: (bandIndex: number) => boolean;
  seedLabel?: (team: T) => string;
}) {
  const span = 3 + columns.length;

  return (
    <div className="sl-ladders" data-count={conferences.length}>
      {conferences.map((conference) => {
        const { bands, lines } = conference.ladder;
        return (
          <div key={conference.id} className="sl-conference">
            <h3 className="sl-conference-name" id={`sl-${conference.id}`}>
              {conference.label}
            </h3>
            <table className="sl-table" aria-labelledby={`sl-${conference.id}`}>
              <thead>
                <tr>
                  <th scope="col" className="sl-col-seed">
                    <abbr title="Seed">#</abbr>
                  </th>
                  <th scope="col" className="sl-col-team">Team</th>
                  <th scope="col" className="sl-num">
                    <abbr title="Wins and losses">W-L</abbr>
                  </th>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className={column.wide ? "sl-num sl-wide" : "sl-num"}>
                      <abbr title={column.title}>{column.label}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              {bands.map((band, index) => {
                if (!isBandVisible(index) || band.teams.length === 0) return null;
                const line = index < lines.length && isBandVisible(index + 1) ? lines[index] : null;
                const gap = line ? formatGamesClear(line.gamesClear) : null;
                return (
                  <tbody key={band.label} data-band={index}>
                    <tr className="sl-band">
                      <th scope="rowgroup" colSpan={span}>
                        {band.label}
                      </th>
                    </tr>
                    {band.teams.map((team) => {
                      const isSelected = team.id === selectedId;
                      return (
                        <tr key={team.id} data-selected={isSelected || undefined}>
                          <td className="sl-col-seed">{seedLabel(team)}</td>
                          <td className="sl-col-team">
                            <button
                              type="button"
                              className="sb-team"
                              onClick={() => onSelect(team.id)}
                              aria-pressed={isSelected}
                              aria-haspopup="dialog"
                              aria-label={`Show ${team.name} details`}
                            >
                              <span
                                className="sl-chip"
                                style={team.color ? { background: team.color } : undefined}
                                aria-hidden="true"
                              />
                              <span className="sb-team-name">{team.shortName}</span>
                            </button>
                          </td>
                          <td className="sl-num sl-record">{team.record}</td>
                          {columns.map((column) => (
                            <td key={column.key} className={column.wide ? "sl-num sl-wide" : "sl-num"}>
                              {column.value(team)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {gap && line ? (
                      <tr className="sl-line">
                        <td colSpan={span}>
                          {lineLabels[index] ? `${lineLabels[index]}, ${gap}` : gap}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                );
              })}
            </table>
          </div>
        );
      })}
    </div>
  );
}
