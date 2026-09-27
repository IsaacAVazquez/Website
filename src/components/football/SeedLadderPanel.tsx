import "./seed-ladder.css";
import type { SeedLadderResult } from "./seedLadder";

export interface LadderTeam {
  id: string;
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

export interface SeedLadderConference {
  label: string;
  ladder: SeedLadderResult<LadderTeam>;
}

function formatGamesClear(gap: number | null): string | null {
  if (gap === null) return null;
  if (gap === 0) return "Tied at the line";
  return `${gap.toFixed(1)} games clear`;
}

/**
 * The playoff picture for one or more conferences: seeds grouped into bands,
 * with the games-clear gap printed at each line. A colour swatch carries the
 * team's colour, since the same colour as small text fails 4.5:1; the name
 * and record stay in ink. Presentational only, since the standings table
 * below is the keyboard path to the same teams.
 */
export function SeedLadder({
  conferences,
  note,
}: {
  conferences: SeedLadderConference[];
  /** A short caveat under the ladder, e.g. that a mid-season seed is derived. */
  note?: string;
}) {
  return (
    <div
      data-c97-surface="paper"
      className="c97-seed-ladder c97-offset"
      style={{ padding: "var(--c97-sp-3)" }}
    >
      {conferences.map((conference) => {
        const { bands, lines } = conference.ladder;
        return (
          <div key={conference.label} className="c97-seed-ladder-conf">
            <p className="c97-kicker">{conference.label}</p>
            {bands.map((band, index) => {
              const gapLabel = index < lines.length ? formatGamesClear(lines[index].gamesClear) : null;
              return (
                <div key={band.label} className="c97-seed-ladder-band">
                  {band.teams.length > 0 ? (
                    <p className="c97-seed-ladder-band-label">{band.label}</p>
                  ) : null}
                  <ol className="c97-seed-ladder-rows">
                    {band.teams.map((team) => (
                      <li key={team.id} className="c97-seed-ladder-row">
                        <span
                          className="c97-seed-ladder-swatch"
                          style={{ background: team.color ?? "var(--c97-ink-2)" }}
                          aria-hidden="true"
                        />
                        <span className="c97-seed-ladder-seed c97-mono">{team.seed}</span>
                        <span className="c97-seed-ladder-name">{team.shortName}</span>
                        <span className="c97-seed-ladder-record c97-mono">{team.record}</span>
                      </li>
                    ))}
                  </ol>
                  {gapLabel ? <p className="c97-seed-ladder-gap">{gapLabel}</p> : null}
                </div>
              );
            })}
          </div>
        );
      })}
      {note ? <p className="c97-seed-ladder-note">{note}</p> : null}
    </div>
  );
}
