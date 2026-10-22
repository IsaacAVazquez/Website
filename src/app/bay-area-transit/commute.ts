import type { TransitDeparture } from "@/types/bayAreaTransit";
export const COMMUTE_KEY = "bay-area-transit-commute-v1";
export interface Commute {
  saved: string[];
  from: string;
  to: string;
  direction: "" | "North" | "South";
}
export function parseCommute(raw: string, stationIds: string[]): Commute {
  const valid = new Set(stationIds);
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") throw new Error("Invalid record");
    return {
      saved: Array.isArray(data.saved)
        ? [
            ...new Set<string>(
              data.saved.filter(
                (id: unknown): id is string =>
                  typeof id === "string" && valid.has(id),
              ),
            ),
          ].slice(0, 20)
        : [],
      from:
        typeof data.from === "string" && valid.has(data.from) ? data.from : "",
      to: typeof data.to === "string" && valid.has(data.to) ? data.to : "",
      direction:
        data.direction === "North" || data.direction === "South"
          ? data.direction
          : "",
    };
  } catch {
    return { saved: [], from: "", to: "", direction: "" };
  }
}
export function commuteDepartures(
  departures: TransitDeparture[],
  direction: Commute["direction"],
) {
  return direction
    ? departures.filter(
        (train) => train.direction.toLowerCase() === direction.toLowerCase(),
      )
    : departures;
}
export function commuteAdvisories<T extends { station: string | null }>(
  advisories: T[],
  endpoints: string[],
  knownStations: string[],
): T[] {
  const known = new Set(knownStations.map((id) => id.toUpperCase()));
  const selected = new Set(endpoints.map((id) => id.toUpperCase()));
  return advisories.filter(
    (alert) =>
      !alert.station ||
      !known.has(alert.station.toUpperCase()) ||
      selected.has(alert.station.toUpperCase()),
  );
}
