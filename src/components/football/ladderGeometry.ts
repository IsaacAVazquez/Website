/**
 * Points ladder geometry shared by Premier League Pulse and La Liga Pulse:
 * clubs placed on a vertical points axis so the title race, the European
 * lines, and the relegation line read as real distance rather than table
 * order. Pure and side-effect free — `PointsLadderChart.tsx` only draws what this
 * returns.
 */

export type LeagueZone = "champions" | "europa" | "conference" | "midtable" | "relegation";

export interface PointsLadderRow {
  id: string;
  position: number;
  points: number;
}

export interface PointsLadderMark {
  id: string;
  position: number;
  points: number;
  zone: LeagueZone;
  /** 0 (the leader) to 1 (last place), a fraction of the ladder's plotted height. */
  y: number;
  /** `y` nudged so two labels set `labelHeight` apart never overlap. */
  labelY: number;
  /** Points behind the leader; 0 for the leader itself. */
  gapFromLeader: number;
}

export interface PointsLadderZoneLine {
  /** The line sits directly below this table position. */
  afterPosition: number;
  y: number;
  /** `y` nudged so two lines that land close together (a tie spanning several zone boundaries) print distinct labels. */
  labelY: number;
  /** Points separating the club above the line from the club below it. */
  gap: number;
}

export interface PointsLadderResult {
  marks: PointsLadderMark[];
  lines: PointsLadderZoneLine[];
}

/** Display name for each zone, shared by the ladder's line labels and the table's zone chips. */
export const LEAGUE_ZONE_LABEL: Record<LeagueZone, string> = {
  champions: "Champions League",
  europa: "Europa League",
  conference: "Conference League",
  midtable: "Midtable",
  relegation: "Relegation",
};

/** Chip ink for a zone: accent for the title places, positive for Europe, negative for the drop. */
export function zoneChipStyle(zone: LeagueZone): { color: string } {
  switch (zone) {
    case "champions":
      return { color: "var(--c97-accent)" };
    case "europa":
    case "conference":
      return { color: "var(--c97-positive)" };
    case "relegation":
      return { color: "var(--c97-negative)" };
    default:
      return { color: "var(--c97-ink-2)" };
  }
}

/** 1-4 Champions League, 5 Europa League, 6 Conference League, bottom three relegation. */
export function leagueZone(position: number, clubCount: number): LeagueZone {
  if (position <= 4) return "champions";
  if (position === 5) return "europa";
  if (position === 6) return "conference";
  if (clubCount >= 3 && position > clubCount - 3) return "relegation";
  return "midtable";
}

/**
 * Places each club on the vertical points axis (`y`, 0 = leader, 1 = last)
 * and nudges labels apart so two clubs level, or nearly level, on points
 * never render overlapping text at the given `labelHeight` (a fraction of
 * the same axis). Also returns the zone lines below 4th, 5th, and 6th, and
 * above the drop, each carrying the points gap across it.
 */
export function pointsLadder(
  rows: PointsLadderRow[],
  opts: { labelHeight: number }
): PointsLadderResult {
  const clubCount = rows.length;
  if (clubCount === 0) return { marks: [], lines: [] };

  const sorted = [...rows].sort((a, b) => a.position - b.position);
  const allPoints = sorted.map((r) => r.points);
  const maxPoints = Math.max(...allPoints);
  const minPoints = Math.min(...allPoints);
  const span = Math.max(1, maxPoints - minPoints);
  const yFor = (points: number) => (maxPoints - points) / span;

  const marks: PointsLadderMark[] = sorted.map((row) => ({
    id: row.id,
    position: row.position,
    points: row.points,
    zone: leagueZone(row.position, clubCount),
    y: yFor(row.points),
    labelY: yFor(row.points),
    gapFromLeader: maxPoints - row.points,
  }));

  const labelYs = declutter(marks.map((mark) => mark.y), Math.max(0, opts.labelHeight));
  marks.forEach((mark, i) => {
    mark.labelY = labelYs[i];
  });

  const byPosition = new Map(sorted.map((row) => [row.position, row] as const));
  const afterPositions = [...new Set([4, 5, 6, clubCount - 3])]
    .filter((afterPosition) => afterPosition >= 1 && afterPosition < clubCount)
    .sort((a, b) => a - b);

  const lines: PointsLadderZoneLine[] = afterPositions.map((afterPosition) => {
    const above = byPosition.get(afterPosition)!;
    const below = byPosition.get(afterPosition + 1)!;
    return {
      afterPosition,
      y: (yFor(above.points) + yFor(below.points)) / 2,
      labelY: (yFor(above.points) + yFor(below.points)) / 2,
      gap: above.points - below.points,
    };
  });

  // A tie spanning several zone boundaries (four clubs level on points
  // covers the Champions League and Europa lines at once, say) puts two line
  // labels at the same y; nudge them apart the same way club labels are.
  const lineLabelYs = declutter(lines.map((line) => line.y), Math.max(0, opts.labelHeight));
  lines.forEach((line, i) => {
    line.labelY = lineLabelYs[i];
  });

  return { marks, lines };
}

/**
 * Greedily pushes points-descending y values apart by at least `gap`. A
 * table with several separate tie clusters (an early-season table bunched
 * into a narrow points range is the common case, not an edge case) can
 * compound those pushes past 1 even when no single pair looks crowded, so
 * the whole run then rescales back into [first, 1], anchored on the first
 * (least-pushed) label. That shrinks every gap by the same factor rather
 * than clamping the overflow to 0/1, which used to stack labels on top of
 * one another at the axis ends.
 *
 * ponytail: a table with more rows than `gap` allows across the axis (an
 * unrealistically small plate for a 20-club league) compresses spacing
 * below `gap` rather than clipping off the plate; give the SVG more height
 * if that ever shows up for real.
 */
function declutter(ys: number[], gap: number): number[] {
  const n = ys.length;
  if (n === 0) return [];
  const order = ys.map((_, i) => i).sort((a, b) => ys[a] - ys[b]);
  const adjusted = order.map((i) => ys[i]);

  for (let i = 1; i < n; i++) {
    if (adjusted[i] - adjusted[i - 1] < gap) adjusted[i] = adjusted[i - 1] + gap;
  }

  const first = adjusted[0];
  const span = adjusted[n - 1] - first;
  if (adjusted[n - 1] > 1 && span > 0) {
    const scale = (1 - first) / span;
    for (let i = 0; i < n; i++) adjusted[i] = first + (adjusted[i] - first) * scale;
  }

  const result = new Array<number>(n);
  order.forEach((originalIndex, sortedIndex) => {
    result[originalIndex] = Math.min(1, Math.max(0, adjusted[sortedIndex]));
  });
  return result;
}

/** A points gap as the ladder and the hero print it. */
export function formatPointsGap(points: number): string {
  if (points === 0) return "Level";
  return `${points} pt${points === 1 ? "" : "s"}`;
}
