import type { TransitLine, TransitStation } from "@/types/bayAreaTransit";

type StationPoint = Pick<TransitStation, "abbr" | "latitude" | "longitude" | "lines">;
type LineSwatch = Pick<TransitLine, "colorName" | "hexColor">;

/** One station on the map. `x` and `y` are pixel coordinates in the frame. */
export interface ProjectedStation {
  abbr: string;
  x: number;
  y: number;
  /** Hex colours of the lines serving this station, in line order. */
  rings: string[];
}

function ringsFor(station: StationPoint, lines: LineSwatch[]): string[] {
  return lines
    .filter((line) =>
      station.lines.some(
        (name) => name.trim().toLowerCase() === line.colorName.trim().toLowerCase()
      )
    )
    .map((line) => line.hexColor);
}

/**
 * The points a line runs through, in BART's order, with repeated neighbours
 * collapsed. BART lists the airport connector as OAKL, OAKL, so anything
 * shorter than two distinct stops (or a snapshot built before the sequence
 * existed) gives no path and the map shows that line's stations only.
 */
export function linePath<T>(
  line: Pick<TransitLine, "stationSequence">,
  byAbbr: Map<string, T>
): T[] {
  const path: T[] = [];
  for (const abbr of line.stationSequence ?? []) {
    const point = byAbbr.get(abbr);
    if (point !== undefined && path[path.length - 1] !== point) path.push(point);
  }
  return path.length >= 2 ? path : [];
}

/** The station closest to a point, by great-circle distance, with its distance in km. */
export function nearestStation<T extends Pick<TransitStation, "latitude" | "longitude">>(
  stations: T[],
  latitude: number,
  longitude: number
): { station: T; km: number } | null {
  const rad = Math.PI / 180;
  let best: { station: T; km: number } | null = null;
  for (const station of stations) {
    const dLat = (station.latitude - latitude) * rad;
    const dLon = (station.longitude - longitude) * rad;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(latitude * rad) * Math.cos(station.latitude * rad) * Math.sin(dLon / 2) ** 2;
    const km = 2 * 6371 * Math.asin(Math.sqrt(a));
    if (!best || km < best.km) best = { station, km };
  }
  return best;
}

/**
 * Fits every station's latitude and longitude into a `width`×`height` frame
 * with an equirectangular projection, corrected by cos(mean latitude) so the
 * Bay isn't stretched east-west. This drawing is the map's server render,
 * its print copy, and its fallback when Leaflet can't load.
 */
export function projectStations(
  stations: StationPoint[],
  lines: LineSwatch[],
  width: number,
  height: number,
  pad = 16
): ProjectedStation[] {
  if (stations.length === 0) return [];

  if (stations.length === 1) {
    const [only] = stations;
    return [{ abbr: only.abbr, x: width / 2, y: height / 2, rings: ringsFor(only, lines) }];
  }

  const meanLat = stations.reduce((sum, s) => sum + s.latitude, 0) / stations.length;
  const lonScale = Math.cos((meanLat * Math.PI) / 180);

  const points = stations.map((station) => ({
    abbr: station.abbr,
    px: station.longitude * lonScale,
    py: -station.latitude,
    rings: ringsFor(station, lines),
  }));

  const xs = points.map((p) => p.px);
  const ys = points.map((p) => p.py);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  const availW = width - pad * 2;
  const availH = height - pad * 2;

  // Every station shares the same coordinates: fall back to centring, the
  // same as the single-station case above.
  if (spanX === 0 && spanY === 0) {
    return points.map((p) => ({ abbr: p.abbr, x: width / 2, y: height / 2, rings: p.rings }));
  }

  // One scale for both axes, so the frame is never stretched on one side.
  const scale = Math.min(
    spanX === 0 ? Infinity : availW / spanX,
    spanY === 0 ? Infinity : availH / spanY
  );
  const offsetX = pad + (availW - spanX * scale) / 2;
  const offsetY = pad + (availH - spanY * scale) / 2;

  return points.map((p) => ({
    abbr: p.abbr,
    x: offsetX + (p.px - minX) * scale,
    y: offsetY + (p.py - minY) * scale,
    rings: p.rings,
  }));
}

interface PathPoint {
  abbr: string;
  x: number;
  y: number;
}

type Point = { x: number; y: number };

/** One stretch of track between two stations and the lines that share it. */
export interface TrackSegment {
  /** Line keys on this stretch, in the order the lines were given. */
  members: string[];
  /** The stretch itself, which the ink casing runs along. */
  ends: [Point, Point];
  /** Each line's own stroke, set side by side across the casing. */
  strokes: { key: string; hex: string; ends: [Point, Point] }[];
}

/**
 * Splits every line into station-to-station segments and sets the lines that
 * share a segment side by side, `spacing` apart, like a printed transit map.
 * Points are in screen space (y down), so the caller projects first.
 *
 * Each segment takes its direction from the first line that runs it, and its
 * members keep the order the lines were given, so a bundle of lines keeps the
 * same side-by-side order along a whole trunk instead of swapping at every
 * station. The offsets are per segment, so a bend leaves a sub-stroke-width
 * gap at the station, which the stop marker covers.
 */
export function bundleTrack(
  lines: { key: string; hex: string; path: PathPoint[] }[],
  spacing: number
): TrackSegment[] {
  const segments = new Map<string, { a: PathPoint; b: PathPoint; members: { key: string; hex: string }[] }>();
  for (const line of lines) {
    for (let i = 1; i < line.path.length; i++) {
      const from = line.path[i - 1];
      const to = line.path[i];
      const id = [from.abbr, to.abbr].sort().join("|");
      const segment = segments.get(id) ?? { a: from, b: to, members: [] };
      if (!segment.members.some((member) => member.key === line.key)) {
        segment.members.push({ key: line.key, hex: line.hex });
      }
      segments.set(id, segment);
    }
  }

  return [...segments.values()].map(({ a, b, members }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    return {
      members: members.map((member) => member.key),
      ends: [
        { x: a.x, y: a.y },
        { x: b.x, y: b.y },
      ],
      strokes: members.map((member, index) => {
        const offset = (index - (members.length - 1) / 2) * spacing;
        return {
          key: member.key,
          hex: member.hex,
          ends: [
            { x: a.x + nx * offset, y: a.y + ny * offset },
            { x: b.x + nx * offset, y: b.y + ny * offset },
          ],
        };
      }),
    };
  });
}
