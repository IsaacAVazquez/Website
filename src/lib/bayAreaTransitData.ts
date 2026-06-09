import type {
  TransitAdvisory,
  TransitDeparture,
  TransitElevatorStatus,
  TransitLine,
  TransitSnapshot,
  TransitStation,
  TransitStationBoard,
  TransitSummary,
} from "@/types/bayAreaTransit";

/**
 * Builds the Bay Area Transit snapshot from BART's public legacy API. The key
 * below is BART's officially published demo key (printed in their API docs), so
 * no registration is needed — the same "no token required" posture as the NBA
 * and golf pipelines.
 *
 * The builder is deliberately defensive: BART returns XML-shaped JSON where
 * single results are bare objects and lists are arrays, and several text fields
 * arrive wrapped in `{ "#cdata-section": "…" }`. Every field is optional-chained
 * with a sensible default, and the builder throws (rather than emit a hollow
 * snapshot) when the core feeds are too thin to trust. The script wrapper turns
 * that throw into "keep the previous snapshot", so a bad upstream response never
 * wipes good data.
 */

const BART_API_BASE = "https://api.bart.gov/api";
const BART_PUBLIC_KEY = "MW9S-E7SL-26DU-VV8V";
const REQUEST_TIMEOUT_MS = 15_000;
const MIN_STATIONS = 10;
const MIN_LINES = 3;
/** Polite spacing between sequential route detail calls. */
const ROUTE_REQUEST_SPACING_MS = 160;

// --- BART response shapes (only the fields we read) --------------------------

type Cdata = string | { "#cdata-section"?: string | null } | null | undefined;

interface BartRoute {
  name?: string | null;
  abbr?: string | null;
  routeID?: string | null;
  number?: string | null;
  hexcolor?: string | null;
  color?: string | null;
  origin?: string | null;
  destination?: string | null;
  num_stns?: string | number | null;
  config?: { station?: string[] | null } | null;
}

interface BartStation {
  name?: string | null;
  abbr?: string | null;
  city?: string | null;
  gtfs_latitude?: string | null;
  gtfs_longitude?: string | null;
}

interface BartAdvisory {
  station?: string | null;
  type?: string | null;
  description?: Cdata;
  sms_text?: Cdata;
  posted?: string | null;
}

interface BartEstimate {
  minutes?: string | null;
  platform?: string | null;
  direction?: string | null;
  length?: string | null;
  color?: string | null;
  hexcolor?: string | null;
  bikeflag?: string | null;
  delay?: string | null;
}

interface BartEtd {
  destination?: string | null;
  abbreviation?: string | null;
  estimate?: BartEstimate[] | null;
}

interface BartEtdStation {
  name?: string | null;
  abbr?: string | null;
  etd?: BartEtd[] | null;
}

// --- Helpers -----------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

/** BART wraps some text fields in `{ "#cdata-section": "…" }`. Unwrap to string. */
function readCdata(value: Cdata): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return (value["#cdata-section"] ?? "").trim();
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

/** BART returns "Leaving" or a numeric minutes string. */
function parseMinutes(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === "" || /leaving/i.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Normalizes BART's "single object or array" into an array. */
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchBartJson<T>(path: string): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BART_API_BASE}/${path}${separator}key=${BART_PUBLIC_KEY}&json=y`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const error = new Error(
          `BART request failed with status ${response.status} for ${path}.`
        );
        (error as { retryable?: boolean }).retryable = response.status >= 500;
        throw error;
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const isTimeout =
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError");
      const isNetwork = error instanceof TypeError;
      const isRetryable = Boolean((error as { retryable?: boolean })?.retryable);
      if (attempt < 2 && (isTimeout || isNetwork || isRetryable)) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Builder -----------------------------------------------------------------

export async function buildBayAreaTransitSnapshotData(): Promise<TransitSnapshot> {
  const generatedAt = new Date().toISOString();

  // 1. Stations.
  const stationsResponse = await fetchBartJson<{
    root?: { stations?: { station?: BartStation[] | null } | null } | null;
  }>("stn.aspx?cmd=stns");
  const rawStations = asArray(stationsResponse.root?.stations?.station).filter(
    (station) => station.abbr && station.name
  );
  if (rawStations.length < MIN_STATIONS) {
    throw new Error(
      `BART returned too few stations (${rawStations.length}).`
    );
  }

  // 2. Routes (lines).
  const routesResponse = await fetchBartJson<{
    root?: { routes?: { route?: BartRoute[] | null } | null } | null;
  }>("route.aspx?cmd=routes");
  const rawRoutes = asArray(routesResponse.root?.routes?.route).filter(
    (route) => route.name && route.number
  );
  if (rawRoutes.length < MIN_LINES) {
    throw new Error(`BART returned too few routes (${rawRoutes.length}).`);
  }

  // 3. Route detail per route — origin/destination, station list, and the
  //    station→lines mapping. Sequential with polite spacing.
  const stationLineNames = new Map<string, Set<string>>();
  const lines: TransitLine[] = [];
  const seenLineIds = new Set<string>();

  for (const route of rawRoutes) {
    let detail: BartRoute = route;
    try {
      const detailResponse = await fetchBartJson<{
        root?: { routes?: { route?: BartRoute | BartRoute[] | null } | null } | null;
      }>(`route.aspx?cmd=routeinfo&route=${encodeURIComponent(route.number!)}`);
      detail = asArray(detailResponse.root?.routes?.route)[0] ?? route;
    } catch {
      // Fall back to the summary record if the detail call fails.
    }

    const name = detail.name ?? route.name ?? "BART Line";
    let id = slugify(name);
    if (!id) id = slugify(route.abbr ?? route.number ?? "line");
    if (seenLineIds.has(id)) id = `${id}-${route.number}`;
    seenLineIds.add(id);

    const colorName = (detail.color ?? route.color ?? "").trim();
    const configStations = asArray(detail.config?.station).filter(Boolean);

    lines.push({
      id,
      routeId: detail.routeID ?? route.routeID ?? "",
      name,
      colorName: colorName || "Line",
      hexColor: detail.hexcolor ?? route.hexcolor ?? "#888888",
      origin: detail.origin ?? "",
      destination: detail.destination ?? "",
      stationCount: configStations.length || toNumber(detail.num_stns),
    });

    if (colorName) {
      for (const stationAbbr of configStations) {
        const key = stationAbbr.toUpperCase();
        if (!stationLineNames.has(key)) stationLineNames.set(key, new Set());
        stationLineNames.get(key)!.add(colorName);
      }
    }

    await delay(ROUTE_REQUEST_SPACING_MS);
  }

  // Stable display order: by line color name.
  lines.sort((a, b) => a.colorName.localeCompare(b.colorName));

  const stations: TransitStation[] = rawStations
    .map((station) => {
      const abbr = station.abbr!.toUpperCase();
      const colorNames = Array.from(stationLineNames.get(abbr) ?? []).sort();
      return {
        id: abbr.toLowerCase(),
        abbr,
        name: station.name!.trim(),
        city: (station.city ?? "").trim(),
        latitude: toNumber(station.gtfs_latitude),
        longitude: toNumber(station.gtfs_longitude),
        lines: colorNames,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // 4. Service advisories.
  const advisoriesResponse = await fetchBartJson<{
    root?: { bsa?: BartAdvisory | BartAdvisory[] | null } | null;
  }>("bsa.aspx?cmd=bsa");
  const advisories: TransitAdvisory[] = asArray(advisoriesResponse.root?.bsa)
    .map((advisory, index): TransitAdvisory => ({
      id: `advisory-${index}`,
      type: (advisory.type ?? "").trim(),
      description: readCdata(advisory.description),
      station: advisory.station ? advisory.station.trim() || null : null,
      posted: (advisory.posted ?? "").trim(),
    }))
    // BART emits a single "No delays reported." entry when service is normal.
    .filter((advisory) => {
      const text = advisory.description.toLowerCase();
      return text !== "" && !text.startsWith("no delays");
    });

  // 5. Elevator outages.
  let elevator: TransitElevatorStatus[] = [];
  try {
    const elevatorResponse = await fetchBartJson<{
      root?: { bsa?: BartAdvisory | BartAdvisory[] | null } | null;
    }>("bsa.aspx?cmd=elev");
    elevator = asArray(elevatorResponse.root?.bsa)
      .map((entry, index): TransitElevatorStatus => ({
        id: `elevator-${index}`,
        description: readCdata(entry.description),
        posted: (entry.posted ?? "").trim(),
      }))
      .filter((entry) => {
        const text = entry.description.toLowerCase();
        return (
          text !== "" &&
          !text.includes("all elevators are in service") &&
          !text.includes("no elevators")
        );
      });
  } catch {
    elevator = [];
  }

  // 6. Real-time departures for every station in one call.
  const etdResponse = await fetchBartJson<{
    root?: {
      time?: string | null;
      date?: string | null;
      station?: BartEtdStation[] | null;
    } | null;
  }>("etd.aspx?cmd=etd&orig=ALL");
  const feedTime = [etdResponse.root?.date, etdResponse.root?.time]
    .filter(Boolean)
    .join(" ");

  const stationBoards: Record<string, TransitStationBoard> = {};
  let trainsTracked = 0;

  for (const etdStation of asArray(etdResponse.root?.station)) {
    if (!etdStation.abbr) continue;
    const abbr = etdStation.abbr.toUpperCase();
    const id = abbr.toLowerCase();

    const departures: TransitDeparture[] = [];
    for (const etd of asArray(etdStation.etd)) {
      for (const estimate of asArray(etd.estimate)) {
        departures.push({
          destination: (etd.destination ?? "").trim(),
          destinationAbbr: (etd.abbreviation ?? "").trim(),
          minutes: parseMinutes(estimate.minutes),
          platform: (estimate.platform ?? "").trim(),
          direction: (estimate.direction ?? "").trim(),
          length: toNumber(estimate.length),
          colorName: (estimate.color ?? "").trim() || "Line",
          hexColor: estimate.hexcolor ?? "#888888",
          delaySeconds: toNumber(estimate.delay),
          bikesAllowed: estimate.bikeflag === "1",
        });
      }
    }

    // Soonest first; "Leaving" (null minutes) sorts ahead of timed trains.
    departures.sort((a, b) => {
      const aMin = a.minutes ?? -1;
      const bMin = b.minutes ?? -1;
      return aMin - bMin;
    });

    trainsTracked += departures.length;
    stationBoards[id] = {
      id,
      abbr,
      name: (etdStation.name ?? "").trim(),
      departures,
      generatedAt,
    };
  }

  // Default to a busy core station that has live departures, else the first
  // station that does.
  const preferredDefaults = ["embr", "mont", "powl", "12th", "mcar"];
  const defaultStation =
    preferredDefaults.find((id) => (stationBoards[id]?.departures.length ?? 0) > 0) ??
    Object.values(stationBoards).find((board) => board.departures.length > 0)?.id ??
    stations[0]?.id ??
    null;

  const summary: TransitSummary = {
    system: {
      name: "Bay Area Rapid Transit",
      abbr: "BART",
      source: "BART public API (api.bart.gov)",
      feedTime,
      generatedAt,
      seed: false,
    },
    heroStats: {
      lineCount: lines.length,
      stationCount: stations.length,
      activeAdvisories: advisories.length,
      elevatorOutages: elevator.length,
      trainsTracked,
    },
    lines,
    stations,
    advisories,
    elevator,
    defaultStation,
  };

  return { summary, stationBoards };
}
