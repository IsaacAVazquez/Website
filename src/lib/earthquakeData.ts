import type {
  EarthquakeSnapshot,
  EarthquakeSummary,
  MagnitudeBucket,
  QuakeAlert,
  QuakeEvent,
  QuakeTier,
  RegionCount,
} from "@/types/earthquake";

/**
 * Builds the earthquake snapshot from the USGS Earthquake Hazards Program GeoJSON
 * feeds. The USGS public feeds need no token and update every minute.
 *
 *   - all_day        — every quake in the past 24h (powers the 24h pulse)
 *   - 2.5_week       — M2.5+ over the past 7 days (distribution + region map)
 *   - significant_month — flagged-significant quakes over the past 30 days
 *
 * Parsing is deliberately defensive: each field is optional-chained with a
 * sensible default, and the builder throws (rather than emit a hollow snapshot)
 * when every feed comes back empty. The script wrapper turns that throw into
 * "keep the previous snapshot", so a bad upstream response never wipes good data.
 *
 * Feed docs: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */

const FEED_BASE = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary";
const ALL_DAY_URL = `${FEED_BASE}/all_day.geojson`;
const WEEK_URL = `${FEED_BASE}/2.5_week.geojson`;
const SIGNIFICANT_MONTH_URL = `${FEED_BASE}/significant_month.geojson`;

const REQUEST_TIMEOUT_MS = 15_000;
const RECENT_LIMIT = 48;
const SIGNIFICANT_LIMIT = 24;
const REGION_LIMIT = 12;
/** Recent feed is noisy; only surface quakes at or above this magnitude. */
const RECENT_MIN_MAGNITUDE = 2.5;

// --- USGS GeoJSON response shapes (only the fields we read) -------------------

interface UsgsFeatureProperties {
  mag?: number | null;
  place?: string | null;
  time?: number | null;
  url?: string | null;
  felt?: number | null;
  alert?: string | null;
  tsunami?: number | null;
  sig?: number | null;
  magType?: string | null;
  type?: string | null;
  title?: string | null;
}

interface UsgsFeature {
  id?: string | null;
  properties?: UsgsFeatureProperties | null;
  geometry?: { coordinates?: (number | null)[] | null } | null;
}

interface UsgsFeedResponse {
  metadata?: { generated?: number | null } | null;
  features?: (UsgsFeature | null)[] | null;
}

// --- Parsing helpers ---------------------------------------------------------

function classifyMagnitude(magnitude: number): QuakeTier {
  if (magnitude >= 8) return "great";
  if (magnitude >= 7) return "major";
  if (magnitude >= 6) return "strong";
  if (magnitude >= 5) return "moderate";
  if (magnitude >= 4) return "light";
  return "minor";
}

const TIER_LABELS: Record<QuakeTier, string> = {
  minor: "Minor",
  light: "Light",
  moderate: "Moderate",
  strong: "Strong",
  major: "Major",
  great: "Great",
};

const TIER_RANGES: Record<QuakeTier, string> = {
  minor: "< 4.0",
  light: "4.0–4.9",
  moderate: "5.0–5.9",
  strong: "6.0–6.9",
  major: "7.0–7.9",
  great: "8.0+",
};

const TIER_ORDER: QuakeTier[] = [
  "minor",
  "light",
  "moderate",
  "strong",
  "major",
  "great",
];

function normalizeAlert(alert: string | null | undefined): QuakeAlert | null {
  if (!alert) return null;
  const value = alert.toLowerCase();
  return value === "green" ||
    value === "yellow" ||
    value === "orange" ||
    value === "red"
    ? (value as QuakeAlert)
    : null;
}

/** USGS place strings read like "10 km NE of Ridgecrest, CA" or "south of Fiji". */
function cleanPlace(place: string | null | undefined): string {
  if (!place) return "Unknown location";
  const trimmed = place.trim();
  return trimmed.length > 0 ? trimmed : "Unknown location";
}

/**
 * Derives a coarse region for grouping. USGS places usually end in a region tail
 * after the last comma (US state, country); oceanic events ("90 km W of …") have
 * no comma, so we strip the leading "<distance> of " bearing and use the body.
 */
function deriveRegion(place: string): string {
  const commaIndex = place.lastIndexOf(", ");
  if (commaIndex !== -1) {
    const tail = place.slice(commaIndex + 2).trim();
    if (tail.length > 0) return tail;
  }
  const withoutBearing = place.replace(/^.*?\bof\s+/i, "").trim();
  return withoutBearing.length > 0 ? withoutBearing : place;
}

function toFeatureEvent(feature: UsgsFeature | null): QuakeEvent | null {
  if (!feature?.id || !feature.properties) return null;
  const props = feature.properties;
  if (props.type && props.type !== "earthquake") return null;

  const magnitude =
    typeof props.mag === "number" && Number.isFinite(props.mag) ? props.mag : null;
  if (magnitude === null) return null;

  const time = typeof props.time === "number" ? props.time : null;
  if (time === null) return null;

  const coords = feature.geometry?.coordinates ?? [];
  const longitude = typeof coords[0] === "number" ? coords[0] : 0;
  const latitude = typeof coords[1] === "number" ? coords[1] : 0;
  const depthKm = typeof coords[2] === "number" ? coords[2] : 0;

  const place = cleanPlace(props.place);

  return {
    id: feature.id,
    magnitude: Math.round(magnitude * 10) / 10,
    magType: props.magType ?? "",
    place,
    region: deriveRegion(place),
    time: new Date(time).toISOString(),
    depthKm: Math.round(depthKm * 10) / 10,
    longitude: Math.round(longitude * 1000) / 1000,
    latitude: Math.round(latitude * 1000) / 1000,
    tsunami: props.tsunami === 1,
    felt: typeof props.felt === "number" && props.felt > 0 ? props.felt : null,
    alert: normalizeAlert(props.alert),
    significance: typeof props.sig === "number" ? props.sig : 0,
    url: props.url ?? "",
    tier: classifyMagnitude(magnitude),
  };
}

function parseFeed(response: UsgsFeedResponse): {
  events: QuakeEvent[];
  feedUpdated: string | null;
} {
  const events: QuakeEvent[] = [];
  for (const feature of response.features ?? []) {
    const event = toFeatureEvent(feature);
    if (event) events.push(event);
  }
  const generated = response.metadata?.generated;
  const feedUpdated =
    typeof generated === "number" ? new Date(generated).toISOString() : null;
  return { events, feedUpdated };
}

async function fetchFeed(url: string): Promise<UsgsFeedResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const error = new Error(
          `USGS feed request failed with status ${response.status} (${url}).`
        );
        // 4xx won't recover on retry; 5xx might.
        (error as { retryable?: boolean }).retryable = response.status >= 500;
        throw error;
      }
      return (await response.json()) as UsgsFeedResponse;
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

// --- Aggregation -------------------------------------------------------------

function buildMagnitudeBuckets(events: QuakeEvent[]): MagnitudeBucket[] {
  const counts = new Map<QuakeTier, number>();
  for (const event of events) {
    counts.set(event.tier, (counts.get(event.tier) ?? 0) + 1);
  }
  return TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    range: TIER_RANGES[tier],
    count: counts.get(tier) ?? 0,
  }));
}

function buildRegionCounts(events: QuakeEvent[]): RegionCount[] {
  const map = new Map<string, RegionCount>();
  for (const event of events) {
    const existing = map.get(event.region);
    if (!existing) {
      map.set(event.region, {
        region: event.region,
        count: 1,
        maxMagnitude: event.magnitude,
        strongestId: event.id,
      });
      continue;
    }
    existing.count += 1;
    if (event.magnitude > existing.maxMagnitude) {
      existing.maxMagnitude = event.magnitude;
      existing.strongestId = event.id;
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count || b.maxMagnitude - a.maxMagnitude)
    .slice(0, REGION_LIMIT);
}

export async function buildEarthquakeSnapshotData(): Promise<EarthquakeSnapshot> {
  const [dayFeed, weekFeed, significantFeed] = await Promise.all([
    fetchFeed(ALL_DAY_URL),
    fetchFeed(WEEK_URL),
    fetchFeed(SIGNIFICANT_MONTH_URL),
  ]);

  const day = parseFeed(dayFeed);
  const week = parseFeed(weekFeed);
  const significantParsed = parseFeed(significantFeed);

  if (
    day.events.length === 0 &&
    week.events.length === 0 &&
    significantParsed.events.length === 0
  ) {
    throw new Error("USGS feeds returned no earthquakes.");
  }

  const now = Date.now();
  const generatedAt = new Date(now).toISOString();
  const cutoff24h = now - 24 * 60 * 60 * 1000;
  const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;

  const dayEvents = day.events.filter(
    (event) => event.magnitude >= RECENT_MIN_MAGNITUDE
  );

  const recent = [...dayEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, RECENT_LIMIT);

  const significant = [...significantParsed.events]
    .sort((a, b) => b.magnitude - a.magnitude || b.significance - a.significance)
    .slice(0, SIGNIFICANT_LIMIT);

  const weekEvents = week.events.filter(
    (event) => new Date(event.time).getTime() >= cutoff7d
  );
  const last24h = day.events.filter(
    (event) => new Date(event.time).getTime() >= cutoff24h
  );

  const strongest24h = last24h.reduce<QuakeEvent | null>(
    (strongest, event) =>
      !strongest || event.magnitude > strongest.magnitude ? event : strongest,
    null
  );
  const largest7d = weekEvents.reduce<number | null>(
    (max, event) => (max === null || event.magnitude > max ? event.magnitude : max),
    null
  );
  const deepest = weekEvents.reduce<number | null>(
    (max, event) => (max === null || event.depthKm > max ? event.depthKm : max),
    null
  );

  const summary: EarthquakeSummary = {
    generatedAt,
    feedUpdated: day.feedUpdated ?? week.feedUpdated ?? significantParsed.feedUpdated,
    heroStats: {
      total24h: last24h.length,
      total7d: weekEvents.length,
      felt24h: last24h.filter((event) => event.felt !== null).length,
      strongest24hMag: strongest24h?.magnitude ?? null,
      strongest24hPlace: strongest24h?.place ?? null,
      significant30d: significantParsed.events.length,
      largest7dMag: largest7d,
      tsunamiAlerts7d: weekEvents.filter((event) => event.tsunami).length,
      deepestKm: deepest === null ? null : Math.round(deepest),
    },
    recent,
    significant,
    magnitudeBuckets: buildMagnitudeBuckets(weekEvents),
    regions: buildRegionCounts(weekEvents),
    quakeDetails: {},
  };

  // The detail panel reads from a flat id→event map. Significant events take
  // precedence over the (lighter) recent copy when the same quake appears in both.
  const details: Record<string, QuakeEvent> = {};
  for (const event of [...recent, ...significant]) {
    details[event.id] = event;
  }
  summary.quakeDetails = details;

  return { summary };
}
