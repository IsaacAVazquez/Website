"use client";

import { useMemo } from "react";
import { LEAGUE_ZONE_LABEL, formatPointsGap, leagueZone, pointsLadder, type LeagueZone } from "./ladderGeometry";
import "./points-ladder.css";

export interface PointsLadderClub {
  id: string;
  position: number;
  points: number;
  /** Short name for the mark's label — the club's tla when the snapshot has one, else its shortName. */
  label: string;
  /** Brand accent hex from the snapshot; some ship without the leading "#". Null/undefined falls back to the zone tone. */
  accentColor?: string | null;
}

interface PointsLadderProps {
  clubs: PointsLadderClub[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The ladder's accessible title, e.g. "Premier League points ladder". */
  title: string;
}

/** The wide ladder, and a narrow one for phones so the plot keeps its height and type. */
const WIDE_W = 640;
const NARROW_W = 360;
const ROW_HEIGHT = 34;
const AXIS_TOP = 44;
const AXIS_BOTTOM_PAD = 36;
const AXIS_X = 96;
const LABEL_X = 118;

const ZONE_TONE: Record<LeagueZone, string> = {
  champions: "var(--c97-accent)",
  europa: "var(--c97-positive)",
  conference: "var(--c97-positive)",
  midtable: "var(--c97-ink-2)",
  relegation: "var(--c97-negative)",
};

function normalizeHex(hex: string | null | undefined): string | null {
  if (!hex) return null;
  return hex.startsWith("#") ? hex : `#${hex}`;
}

/** The competitions' own short names, for the narrow ladder. */
const ZONE_SHORT: Record<LeagueZone, string> = {
  champions: "UCL",
  europa: "UEL",
  conference: "UECL",
  midtable: "",
  relegation: "Drop",
};

function zoneLineLabel(afterPosition: number, clubCount: number, short: boolean): string {
  const zoneBelow = leagueZone(afterPosition + 1, clubCount);
  if (zoneBelow === "relegation") return short ? ZONE_SHORT.relegation : "Relegation line";
  const zone = leagueZone(afterPosition, clubCount);
  return short ? ZONE_SHORT[zone] : `${LEAGUE_ZONE_LABEL[zone]} line`;
}

/**
 * The page's signature, shared by Premier League Pulse and La Liga Pulse: a
 * vertical points axis with every club placed by its points total, so the
 * gaps to the title race, the European lines, and the drop read as real
 * distance. Marks respond to a pointer; the standings table below is the
 * keyboard path to the same selection.
 */
export function PointsLadder({ clubs, selectedId, onSelect, title }: PointsLadderProps) {
  const plotHeight = Math.max(360, clubs.length * ROW_HEIGHT);
  const height = AXIS_TOP + plotHeight + AXIS_BOTTOM_PAD;
  const labelHeight = clubs.length > 0 ? ROW_HEIGHT / plotHeight : 0;

  const { marks, lines } = useMemo(
    () =>
      pointsLadder(
        clubs.map((club) => ({ id: club.id, position: club.position, points: club.points })),
        { labelHeight }
      ),
    [clubs, labelHeight]
  );

  if (marks.length === 0) {
    return <p className="c97-meta">The ladder fills in once the next standings snapshot publishes.</p>;
  }

  const byId = new Map(clubs.map((club) => [club.id, club]));
  const toY = (fraction: number) => AXIS_TOP + fraction * plotHeight;
  const strongest = marks[0];
  const weakest = marks[marks.length - 1];

  const renderLadder = (variant: "wide" | "narrow") => {
    const W = variant === "wide" ? WIDE_W : NARROW_W;
    return (
        <svg
          viewBox={`0 0 ${W} ${height}`}
          data-variant={variant}
          role="img"
          aria-labelledby={`ladder-title-${variant} ladder-desc-${variant}`}
          className={`c97-points-ladder c97-points-ladder--${variant}`}
        >
          <title id={`ladder-title-${variant}`}>{title}</title>
          <desc id={`ladder-desc-${variant}`}>
            {`${marks.length} clubs placed by points, from ${strongest.points} at the top to ${weakest.points} at the bottom.`}
          </desc>

          <line
            x1={AXIS_X}
            x2={AXIS_X}
            y1={AXIS_TOP}
            y2={AXIS_TOP + plotHeight}
            stroke="var(--c97-rule)"
            strokeWidth={1.5}
          />

          {lines.map((line) => {
            const y = toY(line.y);
            const labelY = toY(line.labelY);
            return (
              <g key={line.afterPosition}>
                <line
                  x1={AXIS_X - 14}
                  x2={W - 8}
                  y1={y}
                  y2={y}
                  stroke="var(--c97-rule)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
                <text x={W - 8} y={labelY - 6} textAnchor="end" className="c97-ladder-line-label">
                  <tspan>{zoneLineLabel(line.afterPosition, clubs.length, variant === "narrow")} </tspan>
                  <tspan>{`· ${formatPointsGap(line.gap)}`}</tspan>
                </text>
              </g>
            );
          })}

          {marks.map((mark) => {
            const club = byId.get(mark.id);
            if (!club) return null;
            const trueY = toY(mark.y);
            const labelY = toY(mark.labelY);
            const isSelected = mark.id === selectedId;
            const tone = normalizeHex(club.accentColor) ?? ZONE_TONE[mark.zone];

            return (
              <g key={mark.id}>
                <rect
                  x={AXIS_X - 12}
                  y={labelY - ROW_HEIGHT / 2}
                  width={W - AXIS_X - 4}
                  height={ROW_HEIGHT}
                  fill="transparent"
                  onClick={() => onSelect(mark.id)}
                  style={{ cursor: "pointer" }}
                />
                {Math.abs(labelY - trueY) > 2 ? (
                  <line
                    x1={AXIS_X}
                    x2={LABEL_X - 6}
                    y1={trueY}
                    y2={labelY}
                    stroke="var(--c97-rule)"
                    strokeWidth={1}
                  />
                ) : null}
                {/* The edge keeps a navy or black club colour visible on the dark plate. */}
                <circle
                  cx={AXIS_X}
                  cy={trueY}
                  r={isSelected ? 6.5 : 4.5}
                  fill={tone}
                  stroke="var(--c97-ink-2)"
                  strokeWidth={1}
                  pointerEvents="none"
                >
                  <title>{`${club.label} · ${mark.points} pts`}</title>
                </circle>
                {isSelected ? (
                  <circle
                    cx={AXIS_X}
                    cy={trueY}
                    r={9.5}
                    fill="none"
                    stroke="var(--c97-ink)"
                    strokeWidth={1.3}
                    pointerEvents="none"
                  />
                ) : null}
                <text x={LABEL_X} y={labelY + 5} className="c97-ladder-mark-label" pointerEvents="none">
                  <tspan className="c97-ladder-mark-name">{club.label}</tspan>
                  <tspan className="c97-ladder-mark-points" dx={8}>
                    {mark.points}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
    );
  };

  return (
    <div
      data-c97-surface="paper"
      className="c97-offset c97-points-ladder-plate"
      style={{ padding: "var(--c97-sp-3)" }}
    >
      {renderLadder("wide")}
      {renderLadder("narrow")}
    </div>
  );
}
