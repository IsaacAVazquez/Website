import type { QuakeEvent } from "@/types/earthquake";

type QuakePoint = Pick<QuakeEvent, "id" | "time" | "magnitude" | "latitude" | "longitude" | "depthKm">;

/** One quake on the 24-hour trace. `x` and `height` are fractions of the band. */
export interface Spike {
  id: string;
  x: number;
  height: number;
  magnitude: number;
}

/** One quake on the epicentre plot. `x` and `y` are fractions of an equirectangular frame. */
export interface Epicentre {
  id: string;
  x: number;
  y: number;
  r: number;
  depthBand: "shallow" | "intermediate" | "deep";
}

const FLOOR = 0.08;

/**
 * Height is magnitude over the strongest quake's magnitude. Magnitude is
 * already logarithmic in energy, so this keeps an M2.5 visible beside an M8,
 * and the floor guarantees it.
 */
export function seismogramSpikes(quakes: QuakePoint[], windowEnd: Date, hours = 24): Spike[] {
  const end = windowEnd.getTime();
  const start = end - hours * 3600e3;
  const inWindow = quakes.filter((quake) => {
    const t = Date.parse(quake.time);
    return t >= start && t <= end;
  });
  if (inWindow.length === 0) return [];
  const max = Math.max(...inWindow.map((quake) => quake.magnitude));
  return inWindow.map((quake) => ({
    id: quake.id,
    x: (Date.parse(quake.time) - start) / (end - start),
    magnitude: quake.magnitude,
    height: max <= 0 ? FLOOR : Math.max(FLOOR, quake.magnitude / max),
  }));
}

/** USGS depth classes: shallow under 70 km, intermediate under 300 km, deep from 300 km (matching the client's depthLabel). */
export function epicentres(quakes: QuakePoint[]): Epicentre[] {
  return quakes.map((quake) => ({
    id: quake.id,
    x: (quake.longitude + 180) / 360,
    y: (90 - quake.latitude) / 180,
    r: Math.max(1.5, quake.magnitude * 1.2),
    depthBand: quake.depthKm < 70 ? "shallow" : quake.depthKm < 300 ? "intermediate" : "deep",
  }));
}
