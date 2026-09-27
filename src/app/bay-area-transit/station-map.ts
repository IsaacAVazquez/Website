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
 * Fits every station's latitude and longitude into a `width`×`height` frame
 * with an equirectangular projection, corrected by cos(mean latitude) so the
 * Bay isn't stretched east-west. The snapshot has no ordered station sequence
 * per line, so this only places dots, never a line path.
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
