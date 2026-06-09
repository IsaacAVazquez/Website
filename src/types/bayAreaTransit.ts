export type TransitView = "lines" | "stations" | "advisories";

export interface TransitRouteState {
  view: TransitView;
  /** Lowercased BART station abbreviation, e.g. "embr". */
  station: string | null;
}

export interface TransitLine {
  /** URL-friendly slug derived from the route name, e.g. "antioch-sfo-millbrae". */
  id: string;
  /** BART routeID, e.g. "ROUTE 1". */
  routeId: string;
  /** Full route name, e.g. "Antioch to SFO/Millbrae". */
  name: string;
  /** Human color label, e.g. "Yellow". */
  colorName: string;
  /** Hex color from BART, e.g. "#ffff33". */
  hexColor: string;
  /** Origin station abbreviation (uppercase, as BART returns it). */
  origin: string;
  /** Destination station abbreviation (uppercase). */
  destination: string;
  /** Number of stations the route serves end to end. */
  stationCount: number;
}

export interface TransitStation {
  /** Lowercased abbreviation used in URLs and the stationBoards map. */
  id: string;
  /** Uppercase abbreviation as BART returns it, e.g. "EMBR". */
  abbr: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  /** Human color labels of the lines that stop here, e.g. ["Yellow", "Red"]. */
  lines: string[];
}

export interface TransitAdvisory {
  id: string;
  /** BART advisory type, e.g. "DELAY", "EMERGENCY", or "" when normal. */
  type: string;
  description: string;
  /** Station abbreviation the advisory is scoped to, when present. */
  station: string | null;
  posted: string;
}

export interface TransitElevatorStatus {
  id: string;
  description: string;
  posted: string;
}

export interface TransitDeparture {
  /** Headsign, e.g. "Antioch". */
  destination: string;
  /** Destination station abbreviation. */
  destinationAbbr: string;
  /** Minutes until departure. Null means the train is leaving now. */
  minutes: number | null;
  platform: string;
  /** "North" or "South". */
  direction: string;
  /** Car count. */
  length: number;
  colorName: string;
  hexColor: string;
  /** Delay in seconds reported by BART. */
  delaySeconds: number;
  bikesAllowed: boolean;
}

export interface TransitStationBoard {
  /** Lowercased station abbreviation. */
  id: string;
  abbr: string;
  name: string;
  departures: TransitDeparture[];
  generatedAt: string;
}

export interface TransitHeroStats {
  lineCount: number;
  stationCount: number;
  activeAdvisories: number;
  elevatorOutages: number;
  trainsTracked: number;
}

export interface TransitSystem {
  name: string;
  abbr: string;
  /** Attribution string shown in the UI. */
  source: string;
  /** Time BART reported for its real-time feed. */
  feedTime: string;
  generatedAt: string;
  /** True when this is the hand-authored seed, before the first live refresh. */
  seed: boolean;
}

export interface TransitSummary {
  system: TransitSystem | null;
  heroStats: TransitHeroStats;
  lines: TransitLine[];
  stations: TransitStation[];
  advisories: TransitAdvisory[];
  elevator: TransitElevatorStatus[];
  /** Lowercased abbreviation of the station to show by default. */
  defaultStation: string | null;
}

export interface TransitSnapshot {
  summary: TransitSummary;
  stationBoards: Record<string, TransitStationBoard>;
}
