"use client";

import { CrestAvatar } from "./CrestAvatar";
import { leagueZone, type LeagueZone } from "./ladderGeometry";
import { formatFixed } from "./fixtureFormat";

export interface ProgrammeTableRow {
  id: string;
  position: number;
  /** Full club name, used only for the row button's accessible label. */
  name: string;
  shortName: string;
  crest: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface LeagueProgrammeTableProps {
  rows: ProgrammeTableRow[];
  /** Total clubs in the league, so the last three rows read as relegation regardless of view filtering. */
  clubCount: number;
  ariaLabel: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Low-percent tints behind the ink text, not on it — the zones a matchday
 * programme prints as bands. Midtable rows take no tint and show the sheet
 * underneath.
 */
const ZONE_TINT: Partial<Record<LeagueZone, string>> = {
  champions: "color-mix(in srgb, var(--c97-accent) 9%, var(--c97-surface))",
  europa: "color-mix(in srgb, var(--c97-positive) 11%, var(--c97-surface))",
  conference: "color-mix(in srgb, var(--c97-positive) 6%, var(--c97-surface))",
  relegation: "color-mix(in srgb, var(--c97-negative) 10%, var(--c97-surface))",
};

/**
 * The standings set like a matchday programme: hairline `.c97-table` rows
 * with the qualification and relegation zones printed as tints behind them.
 * The club-name button is the keyboard path to the same selection the
 * points ladder's marks offer by pointer.
 */
export function LeagueProgrammeTable({
  rows,
  clubCount,
  ariaLabel,
  selectedId,
  onSelect,
}: LeagueProgrammeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="c97-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Pos</th>
            <th scope="col">Club</th>
            <th scope="col" className="hidden sm:table-cell">
              Record
            </th>
            <th scope="col" data-align="end">
              Pts
            </th>
            <th scope="col" data-align="end" className="hidden md:table-cell">
              PPG
            </th>
            <th scope="col" data-align="end" className="hidden lg:table-cell">
              GF
            </th>
            <th scope="col" data-align="end" className="hidden lg:table-cell">
              GA
            </th>
            <th scope="col" data-align="end">
              GD
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const zone = leagueZone(row.position, clubCount);
            const isSelected = row.id === selectedId;
            return (
              <tr
                key={row.id}
                style={{
                  background: ZONE_TINT[zone],
                  boxShadow: isSelected ? "inset 4px 0 0 0 var(--c97-ink)" : undefined,
                }}
              >
                <td className="c97-mono">{row.position}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    aria-pressed={isSelected}
                    aria-label={`Show ${row.name} details`}
                    className="flex min-h-[44px] w-full items-center gap-2 text-left"
                  >
                    <CrestAvatar crest={row.crest} name={row.shortName} size="sm" />
                    <span className="font-semibold text-[var(--c97-ink)]">{row.shortName}</span>
                  </button>
                </td>
                <td className="c97-mono hidden sm:table-cell">
                  {row.won}-{row.draw}-{row.lost}
                </td>
                <td className="c97-mono font-semibold" data-align="end">
                  {row.points}
                </td>
                <td className="c97-mono hidden md:table-cell" data-align="end">
                  {formatFixed(row.points / row.played)}
                </td>
                <td className="c97-mono hidden lg:table-cell" data-align="end">
                  {row.goalsFor}
                </td>
                <td className="c97-mono hidden lg:table-cell" data-align="end">
                  {row.goalsAgainst}
                </td>
                <td className="c97-mono" data-align="end">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
