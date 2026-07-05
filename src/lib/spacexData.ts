import type {
  MissionCapsule,
  MissionControlCadence,
  MissionControlInsight,
  MissionControlStatus,
  MissionControlSnapshot,
  MissionControlSummary,
  MissionCore,
  MissionCrewMember,
  MissionLaunchCard,
  MissionLaunchDetail,
  MissionLaunchpad,
  MissionLinkSet,
  MissionPayload,
  MissionRocket,
} from "@/types/spacex";
import { resolveSpaceXImageUrl, resolveSpaceXImageUrls } from "@/lib/spacexImageManifest";
import { aggregateLaunchCadence } from "@/lib/spacexCadence";
import { deriveVehicleFamily } from "@/lib/spacexVehicleFamily";
import {
  getSpaceXSnapshotCadence,
  getSpaceXSnapshotLaunchDetail,
  getSpaceXSnapshotLaunchDetails,
  getSpaceXSnapshotLaunches,
  getSpaceXSnapshotSummary,
  hasSpaceXSnapshotData,
} from "@/lib/spacexSnapshot";

const LAUNCH_LIBRARY_API_BASE = "https://ll.thespacedevs.com/2.2.0";
const SPACEX_AGENCY_ID = 121;
const DEFAULT_BOARD_LIMIT = 12;
const MAX_BOARD_LIMIT = 24;
const REQUEST_TIMEOUT_MS = 12000;
const LAUNCH_ID_PATTERN =
  /^(?:[a-f0-9]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const UPCOMING_STALE_GRACE_MS = 30 * 60 * 1000;
const SUMMARY_CACHE_TTL_MS = 120 * 1000;
const LAUNCH_CARDS_CACHE_TTL_MS = 120 * 1000;
const LAUNCH_DETAIL_CACHE_TTL_MS = 300 * 1000;
const STALE_FALLBACK_TTL_MS = 30 * 60 * 1000;
const RATE_LIMIT_BASE_BACKOFF_MS = 60 * 1000;
const RATE_LIMIT_MAX_BACKOFF_MS = 5 * 60 * 1000;
// Per-status cap on hydrated launch details in the snapshot. The anonymous
// Launch Library tier allows only 15 calls/hour per IP, and each detail is one
// call (on top of the 2 list calls + 1 agency call). The quality gate needs 5
// details, so 3 per status keeps the full refresh comfortably under budget.
const SNAPSHOT_DETAIL_LIMIT_PER_STATUS = 3;
// Upper bound on total hydrated details once vehicle-family diversification
// (below) is folded in, so the snapshot refresh stays comfortably under the
// same 15-calls/hour budget the comment above describes.
const SNAPSHOT_DETAIL_ID_CAP = 8;
// Single extra list call (not one per month) to compute the trailing-12-month
// launch cadence. SpaceX's current cadence is roughly 150-200+ launches/year,
// so this generously covers a year of history in one request.
const CADENCE_HISTORY_LIMIT = 260;
const CADENCE_MONTHS_BACK = 12;

type LaunchCollectionMode = "upcoming" | "previous";
type MissionControlDataSource = "auto" | "live" | "snapshot";

interface MissionControlDataOptions {
  source?: MissionControlDataSource;
}

interface CachedValue<T> {
  value: T;
  storedAt: number;
}

interface RawLl2ListResponse<T> {
  count: number;
  results: T[];
}

interface RawLl2Status {
  name?: string | null;
  abbrev?: string | null;
  description?: string | null;
}

interface RawLl2Precision {
  name?: string | null;
  abbrev?: string | null;
  description?: string | null;
}

interface RawLl2Location {
  id?: number | null;
  name?: string | null;
  country_code?: string | null;
  timezone_name?: string | null;
  description?: string | null;
}

interface RawLl2Pad {
  id?: number | null;
  name?: string | null;
  description?: string | null;
  wiki_url?: string | null;
  map_url?: string | null;
  map_image?: string | null;
  location?: RawLl2Location | null;
}

interface RawLl2Agency {
  id?: number | null;
  name?: string | null;
  type?: string | null;
  country_code?: string | null;
  wiki_url?: string | null;
  info_url?: string | null;
  pending_launches?: number | null;
  successful_launches?: number | null;
  failed_launches?: number | null;
  total_launch_count?: number | null;
  launcher_list?: RawLl2LauncherConfiguration[] | null;
}

interface RawLl2MissionOrbit {
  id?: number | null;
  name?: string | null;
  abbrev?: string | null;
}

interface RawLl2LinkType {
  id?: number | null;
  name?: string | null;
}

interface RawLl2ExternalLink {
  priority?: number | null;
  source?: string | null;
  publisher?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  type?: RawLl2LinkType | null;
}

interface RawLl2Mission {
  id?: number | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  orbit?: RawLl2MissionOrbit | null;
  agencies?: RawLl2Agency[] | null;
  info_urls?: RawLl2ExternalLink[] | null;
  vid_urls?: RawLl2ExternalLink[] | null;
}

interface RawLl2MissionPatch {
  id?: number | null;
  name?: string | null;
  priority?: number | null;
  image_url?: string | null;
}

interface RawLl2Program {
  id?: number | null;
  name?: string | null;
  description?: string | null;
  info_url?: string | null;
  wiki_url?: string | null;
  mission_patches?: RawLl2MissionPatch[] | null;
}

interface RawLl2LauncherConfiguration {
  id?: number | null;
  name?: string | null;
  family?: string | null;
  full_name?: string | null;
  variant?: string | null;
  active?: boolean | null;
  reusable?: boolean | null;
  description?: string | null;
  manufacturer?: RawLl2Agency | null;
  min_stage?: number | null;
  max_stage?: number | null;
  length?: number | null;
  diameter?: number | null;
  maiden_flight?: string | null;
  launch_cost?: string | number | null;
  launch_mass?: string | number | null;
  successful_launches?: number | null;
  failed_launches?: number | null;
  pending_launches?: number | null;
  info_url?: string | null;
  wiki_url?: string | null;
  image_url?: string | null;
}

interface RawLl2Rocket {
  id?: number | null;
  configuration?: RawLl2LauncherConfiguration | null;
}

interface RawLl2Launcher {
  id?: number | null;
  serial_number?: string | null;
  flights?: number | null;
}

interface RawLl2LandingLocation {
  id?: number | null;
  name?: string | null;
  abbrev?: string | null;
  location?: RawLl2Location | null;
}

interface RawLl2LandingType {
  id?: number | null;
  name?: string | null;
}

interface RawLl2Landing {
  attempt?: boolean | null;
  success?: boolean | null;
  location?: RawLl2LandingLocation | null;
  type?: RawLl2LandingType | null;
}

interface RawLl2LauncherStage {
  id?: number | null;
  type?: string | null;
  reused?: boolean | null;
  launcher_flight_number?: number | null;
  launcher?: RawLl2Launcher | null;
  landing?: RawLl2Landing | null;
}

interface RawLl2AstronautRole {
  id?: number | null;
  role?: string | null;
}

interface RawLl2AstronautStatus {
  id?: number | null;
  name?: string | null;
}

interface RawLl2Astronaut {
  id?: number | null;
  name?: string | null;
  agency?: RawLl2Agency | null;
  status?: RawLl2AstronautStatus | null;
  profile_image?: string | null;
  wiki?: string | null;
}

interface RawLl2CrewAssignment {
  id?: number | null;
  role?: RawLl2AstronautRole | null;
  astronaut?: RawLl2Astronaut | null;
}

interface RawLl2SpacecraftStatus {
  id?: number | null;
  name?: string | null;
}

interface RawLl2SpacecraftType {
  id?: number | null;
  name?: string | null;
}

interface RawLl2SpacecraftConfig {
  id?: number | null;
  name?: string | null;
  type?: RawLl2SpacecraftType | null;
  details?: string | null;
  agency?: RawLl2Agency | null;
  wiki_link?: string | null;
  info_link?: string | null;
  image_url?: string | null;
  payload_capacity?: number | null;
}

interface RawLl2Spacecraft {
  id?: number | null;
  name?: string | null;
  serial_number?: string | null;
  status?: RawLl2SpacecraftStatus | null;
  description?: string | null;
  flights_count?: number | null;
  mission_ends_count?: number | null;
  spacecraft_config?: RawLl2SpacecraftConfig | null;
}

interface RawLl2SpacecraftStage {
  id?: number | null;
  mission_end?: string | null;
  destination?: string | null;
  launch_crew?: RawLl2CrewAssignment[] | null;
  onboard_crew?: RawLl2CrewAssignment[] | null;
  landing_crew?: RawLl2CrewAssignment[] | null;
  spacecraft?: RawLl2Spacecraft | null;
}

interface RawLl2Launch {
  id: string;
  url?: string | null;
  name?: string | null;
  status?: RawLl2Status | null;
  net?: string | null;
  net_precision?: RawLl2Precision | null;
  window_start?: string | null;
  window_end?: string | null;
  last_updated?: string | null;
  failreason?: string | null;
  holdreason?: string | null;
  launch_service_provider?: RawLl2Agency | null;
  rocket?: RawLl2Rocket | null;
  mission?: RawLl2Mission | null;
  pad?: RawLl2Pad | null;
  image?: string | null;
  infographic?: string | null;
  program?: RawLl2Program[] | null;
  mission_patches?: RawLl2MissionPatch[] | null;
  infoURLs?: RawLl2ExternalLink[] | null;
  vidURLs?: RawLl2ExternalLink[] | null;
  launcher_stage?: RawLl2LauncherStage[] | null;
  spacecraft_stage?: RawLl2SpacecraftStage | null;
  orbital_launch_attempt_count?: number | null;
  agency_launch_attempt_count?: number | null;
}

let launchLibraryRateLimitedUntil = 0;
let launchLibraryConsecutive429s = 0;

let missionControlSummaryCache: CachedValue<MissionControlSummary> | null = null;
let missionControlSummaryInflight: Promise<MissionControlSummary> | null = null;

const missionLaunchCardsCache = new Map<string, CachedValue<MissionLaunchCard[]>>();
const missionLaunchCardsInflight = new Map<string, Promise<MissionLaunchCard[]>>();

const missionLaunchDetailCache = new Map<string, CachedValue<MissionLaunchDetail>>();
const missionLaunchDetailInflight = new Map<string, Promise<MissionLaunchDetail>>();

function createSpaceXError(message: string, status = 500): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

function getCachedValue<T>(
  entry: CachedValue<T> | null | undefined,
  maxAgeMs: number
): T | null {
  if (!entry) {
    return null;
  }

  return Date.now() - entry.storedAt <= maxAgeMs ? entry.value : null;
}

function setCachedValue<T>(value: T): CachedValue<T> {
  return {
    value,
    storedAt: Date.now(),
  };
}

function isSpaceXRateLimitError(error: unknown): error is Error & { status: number } {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number" &&
    (error as { status: number }).status === 429
  );
}

function parseRetryAfterMs(retryAfterHeader: string | null): number | null {
  if (!retryAfterHeader) {
    return null;
  }

  const numericSeconds = Number.parseInt(retryAfterHeader, 10);
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return numericSeconds * 1000;
  }

  const retryAt = Date.parse(retryAfterHeader);
  if (!Number.isFinite(retryAt)) {
    return null;
  }

  return Math.max(retryAt - Date.now(), 0);
}

function applyLaunchLibraryRateLimit(retryAfterHeader: string | null) {
  launchLibraryConsecutive429s += 1;
  const exponentialBackoffMs = Math.min(
    RATE_LIMIT_BASE_BACKOFF_MS * Math.pow(2, launchLibraryConsecutive429s - 1),
    RATE_LIMIT_MAX_BACKOFF_MS
  );
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
  const backoffMs = Math.min(
    Math.max(retryAfterMs ?? exponentialBackoffMs, RATE_LIMIT_BASE_BACKOFF_MS),
    RATE_LIMIT_MAX_BACKOFF_MS
  );

  launchLibraryRateLimitedUntil = Date.now() + backoffMs;
}

function clearLaunchLibraryRateLimit() {
  launchLibraryRateLimitedUntil = 0;
  launchLibraryConsecutive429s = 0;
}

// Optional Launch Library 2 API key. The anonymous tier is throttled hard
// (and shared CI IPs get 429'd almost immediately), so the refresh job should
// run authenticated. thespacedevs uses DRF token auth: `Authorization: Token <key>`.
// Read lazily so a dotenv-loaded value is picked up regardless of import order.
function getLaunchLibraryAuthHeaders(): Record<string, string> {
  const token = process.env.SPACEDEVS_API_TOKEN?.trim();
  return token ? { Authorization: `Token ${token}` } : {};
}

async function fetchLaunchLibraryJson<T>(
  path: string,
  revalidateSeconds = 120
): Promise<T> {
  if (Date.now() < launchLibraryRateLimitedUntil) {
    throw createSpaceXError("Launch Library temporarily rate limited", 429);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LAUNCH_LIBRARY_API_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...getLaunchLibraryAuthHeaders(),
      },
      next: {
        revalidate: revalidateSeconds,
      },
    });

    if (response.status === 429) {
      applyLaunchLibraryRateLimit(response.headers.get("retry-after"));
      throw createSpaceXError("Launch Library temporarily rate limited", 429);
    }

    if (!response.ok) {
      throw createSpaceXError(
        `Launch Library request failed with status ${response.status}`,
        response.status
      );
    }

    clearLaunchLibraryRateLimit();
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createSpaceXError("Launch Library request timed out", 504);
    }

    if (error instanceof Error && "status" in error) {
      throw error;
    }

    throw createSpaceXError("Unable to reach Launch Library", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function buildLaunchCollectionPath(
  mode: LaunchCollectionMode,
  limit: number,
  ordering: string
): string {
  const params = new URLSearchParams({
    format: "json",
    limit: `${limit}`,
    ordering,
    lsp__ids: `${SPACEX_AGENCY_ID}`,
  });

  return `/launch/${mode}/?${params.toString()}`;
}

async function fetchLaunchCollection(
  mode: LaunchCollectionMode,
  limit: number,
  revalidateSeconds = 120
): Promise<RawLl2ListResponse<RawLl2Launch>> {
  return fetchLaunchLibraryJson<RawLl2ListResponse<RawLl2Launch>>(
    buildLaunchCollectionPath(mode, limit, mode === "upcoming" ? "net" : "-net"),
    revalidateSeconds
  );
}

async function fetchLaunchDetail(
  id: string,
  revalidateSeconds = 300
): Promise<RawLl2Launch> {
  return fetchLaunchLibraryJson<RawLl2Launch>(`/launch/${id}/?format=json`, revalidateSeconds);
}

async function fetchSpaceXAgency(revalidateSeconds = 900): Promise<RawLl2Agency> {
  return fetchLaunchLibraryJson<RawLl2Agency>(
    `/agencies/${SPACEX_AGENCY_ID}/?format=json`,
    revalidateSeconds
  );
}

function toStringArray(values: Array<string | null | undefined> | null | undefined): string[] {
  return Array.isArray(values) ? values.filter((value): value is string => Boolean(value)) : [];
}

function parseNullableNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseMassKg(value: number | string | null | undefined): number | null {
  const parsed = parseNullableNumber(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return (parsed ?? 0) < 10000 ? Math.round((parsed ?? 0) * 1000) : Math.round(parsed ?? 0);
}

function normalizePrecision(precision?: RawLl2Precision | null): string {
  const name = precision?.name?.toLowerCase() ?? "";
  const abbrev = precision?.abbrev?.toLowerCase() ?? "";

  if (name.includes("second") || name.includes("minute") || name.includes("hour")) {
    return "hour";
  }

  if (name.includes("day")) {
    return "day";
  }

  if (name.includes("month") || abbrev === "m") {
    return "month";
  }

  if (name.includes("quarter") || abbrev.startsWith("q")) {
    return "quarter";
  }

  if (name.includes("half")) {
    return "half";
  }

  if (name.includes("year") || abbrev === "y") {
    return "year";
  }

  return "day";
}

function normalizeSuccess(status?: RawLl2Status | null): boolean | null {
  const abbrev = status?.abbrev?.toLowerCase() ?? "";
  const name = status?.name?.toLowerCase() ?? "";

  if (abbrev.includes("success") || name.includes("success")) {
    return true;
  }

  if (abbrev.includes("failure") || name.includes("failure") || name.includes("cancel")) {
    return false;
  }

  return null;
}

function isPastDate(dateUtc?: string | null, graceMs = 0): boolean {
  if (!dateUtc) {
    return false;
  }

  const timestamp = Date.parse(dateUtc);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return timestamp < Date.now() - graceMs;
}

function dedupeLaunches(launches: RawLl2Launch[]): RawLl2Launch[] {
  const seen = new Set<string>();

  return launches.filter((launch) => {
    if (!launch.id || seen.has(launch.id)) {
      return false;
    }

    seen.add(launch.id);
    return true;
  });
}

function filterLaunchCollection(
  launches: RawLl2Launch[],
  mode: LaunchCollectionMode
): RawLl2Launch[] {
  return dedupeLaunches(launches).filter((launch) =>
    mode === "upcoming"
      ? !isPastDate(launch.net, UPCOMING_STALE_GRACE_MS)
      : !launch.net || Date.parse(launch.net) <= Date.now()
  );
}

function clampBoardLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_BOARD_LIMIT;
  }

  return Math.max(1, Math.min(MAX_BOARD_LIMIT, Math.trunc(limit)));
}

function ensureValidStatus(status: MissionControlStatus): void {
  if (status !== "upcoming" && status !== "past") {
    throw createSpaceXError("Invalid launch status", 400);
  }
}

function sortByPriority<T extends { priority?: number | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

function pickMissionPatch(launch: RawLl2Launch): string | null {
  const missionPatches = sortByPriority(launch.mission_patches ?? []);
  if (missionPatches[0]?.image_url) {
    return missionPatches[0].image_url;
  }

  for (const program of launch.program ?? []) {
    const programPatch = sortByPriority(program.mission_patches ?? [])[0]?.image_url;
    if (programPatch) {
      return programPatch;
    }
  }

  return null;
}

function pickSpacecraftImage(launch: RawLl2Launch): string | null {
  return launch.spacecraft_stage?.spacecraft?.spacecraft_config?.image_url ?? null;
}

function pickVehicleImage(launch: RawLl2Launch): string | null {
  return (
    launch.image ??
    pickSpacecraftImage(launch) ??
    launch.rocket?.configuration?.image_url ??
    null
  );
}

function extractYoutubeId(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );

  return youtubeMatch?.[1] ?? null;
}

function pickLink(
  links: RawLl2ExternalLink[],
  matcher?: (link: RawLl2ExternalLink) => boolean
): string | null {
  const candidates = matcher ? links.filter(matcher) : links;
  const sorted = sortByPriority(candidates);

  return sorted.find((link) => link.url)?.url ?? null;
}

function normalizeLinks(launch: RawLl2Launch): MissionLinkSet {
  const infoLinks = [
    ...(launch.infoURLs ?? []),
    ...(launch.mission?.info_urls ?? []),
    ...(launch.program ?? [])
      .map((program) => ({
        url: program.info_url ?? null,
        title: program.name ?? null,
        priority: 5,
      }))
      .filter((link) => Boolean(link.url)),
  ] as RawLl2ExternalLink[];
  const videoLinks = [...(launch.vidURLs ?? []), ...(launch.mission?.vid_urls ?? [])];
  const patchImage = resolveSpaceXImageUrl(pickMissionPatch(launch));
  const webcast =
    pickLink(
      videoLinks,
      (link) =>
        /official/i.test(link.type?.name ?? "") ||
        /spacex|nasa/i.test(`${link.publisher ?? ""} ${link.source ?? ""}`)
    ) ?? pickLink(videoLinks);
  const article =
    pickLink(
      infoLinks,
      (link) =>
        /official/i.test(link.type?.name ?? "") ||
        /spacex\.com|nasa\.gov|axiomspace\.com/i.test(link.url ?? "")
    ) ?? pickLink(infoLinks);
  const presskit =
    pickLink(infoLinks, (link) => /press.?kit/i.test(`${link.title ?? ""} ${link.url ?? ""}`)) ??
    null;
  const wikipedia =
    launch.program?.map((program) => program.wiki_url ?? null).find(Boolean) ??
    launch.mission?.agencies?.map((agency) => agency.wiki_url ?? null).find(Boolean) ??
    launch.launch_service_provider?.wiki_url ??
    launch.pad?.wiki_url ??
    null;

  return {
    webcast,
    article,
    wikipedia,
    presskit,
    redditLaunch: null,
    redditCampaign: null,
    redditMedia: null,
    youtubeId: extractYoutubeId(webcast ?? pickLink(videoLinks)),
    patchSmall: patchImage,
    patchLarge: patchImage,
    flickrOriginal: resolveSpaceXImageUrls([launch.image]),
  };
}

function normalizeLocationName(location?: RawLl2Location | null): string | null {
  return location?.name ?? null;
}

function deriveCoreCount(launch: RawLl2Launch): number {
  if (launch.launcher_stage?.length) {
    return launch.launcher_stage.length;
  }

  const rocketName = launch.rocket?.configuration?.full_name ?? launch.rocket?.configuration?.name ?? "";

  if (/falcon heavy/i.test(rocketName)) {
    return 3;
  }

  if (/starship/i.test(rocketName)) {
    return 2;
  }

  if (rocketName) {
    return 1;
  }

  return 0;
}

function derivePayloadCount(launch: RawLl2Launch): number {
  const crewCount = launch.spacecraft_stage?.launch_crew?.length ?? 0;
  if (crewCount > 0) {
    return crewCount;
  }

  const description = launch.mission?.description ?? "";
  const numericMatch =
    description.match(/batch of (\d+)/i) ??
    description.match(/carry(?:ing)? (\d+) satellites/i) ??
    description.match(/(\d+) satellites/i);

  if (numericMatch) {
    return Number.parseInt(numericMatch[1] ?? "0", 10) || 1;
  }

  return launch.mission ? 1 : 0;
}

function normalizeLaunchCard(
  launch: RawLl2Launch,
  upcoming: boolean
): MissionLaunchCard {
  const dateUtc = launch.net ?? launch.window_start ?? new Date().toISOString();
  const dateUnix = Number.isFinite(Date.parse(dateUtc))
    ? Math.floor(Date.parse(dateUtc) / 1000)
    : null;
  const links = normalizeLinks(launch);
  const datePrecision = normalizePrecision(launch.net_precision);
  const staleSchedule = upcoming && isPastDate(dateUtc, UPCOMING_STALE_GRACE_MS);
  const tbd = (launch.status?.abbrev ?? "").toUpperCase() === "TBD";
  const patchImage = resolveSpaceXImageUrl(pickMissionPatch(launch));

  return {
    id: launch.id,
    name: launch.mission?.name ?? launch.name ?? "Unnamed launch",
    flightNumber:
      launch.agency_launch_attempt_count ?? launch.orbital_launch_attempt_count ?? 0,
    upcoming,
    success: normalizeSuccess(launch.status),
    details: launch.mission?.description ?? null,
    dateUtc,
    dateUnix,
    dateLocal: dateUtc,
    datePrecision,
    tbd,
    net: Boolean(launch.net),
    rocketName:
      launch.rocket?.configuration?.full_name ??
      launch.rocket?.configuration?.name ??
      null,
    launchpadName: launch.pad?.name ?? null,
    launchpadLocation: normalizeLocationName(launch.pad?.location),
    patchImage,
    vehicleImage: resolveSpaceXImageUrl(pickVehicleImage(launch)),
    crewCount: launch.spacecraft_stage?.launch_crew?.length ?? 0,
    payloadCount: derivePayloadCount(launch),
    capsuleCount: launch.spacecraft_stage?.spacecraft ? 1 : 0,
    coreCount: deriveCoreCount(launch),
    hasExactTime: datePrecision === "hour" && !tbd && !staleSchedule,
    isStaleSchedule: staleSchedule,
    links,
  };
}

function normalizeCrewMembers(launch: RawLl2Launch): MissionCrewMember[] {
  const entries = [
    ...(launch.spacecraft_stage?.launch_crew ?? []),
    ...(launch.spacecraft_stage?.onboard_crew ?? []),
  ];
  const deduped = new Map<number, MissionCrewMember>();

  for (const entry of entries) {
    const astronaut = entry.astronaut;
    if (!astronaut?.id) {
      continue;
    }

    if (!deduped.has(astronaut.id)) {
      deduped.set(astronaut.id, {
        id: `${astronaut.id}`,
        name: astronaut.name ?? "Unnamed crew member",
        role: entry.role?.role ?? null,
        agency: astronaut.agency?.name ?? null,
        status: astronaut.status?.name ?? null,
        image: resolveSpaceXImageUrl(astronaut.profile_image),
        wikipedia: astronaut.wiki ?? null,
      });
    }
  }

  return Array.from(deduped.values());
}

function normalizePayloads(launch: RawLl2Launch): MissionPayload[] {
  const mission = launch.mission;
  if (!mission) {
    return [];
  }

  const spacecraftPayloadCapacity =
    launch.spacecraft_stage?.spacecraft?.spacecraft_config?.payload_capacity ?? null;

  return [
    {
      id: `${mission.id ?? launch.id}`,
      name: mission.name ?? launch.name ?? "Mission payload",
      type: mission.type ?? null,
      customers: mission.agencies?.map((agency) => agency.name ?? "").filter(Boolean) ?? [],
      manufacturers: toStringArray([
        launch.rocket?.configuration?.manufacturer?.name ?? launch.launch_service_provider?.name,
      ]),
      nationalities: toStringArray(
        mission.agencies?.map((agency) => agency.country_code ?? null) ?? []
      ),
      orbit: mission.orbit?.name ?? null,
      regime: mission.orbit?.abbrev ?? null,
      massKg: spacecraftPayloadCapacity,
      massLbs: null,
    },
  ];
}

function normalizeCapsules(launch: RawLl2Launch): MissionCapsule[] {
  const spacecraft = launch.spacecraft_stage?.spacecraft;
  if (!spacecraft) {
    return [];
  }

  return [
    {
      id: `${spacecraft.id ?? launch.id}`,
      serial: spacecraft.serial_number ?? null,
      status: spacecraft.status?.name ?? null,
      type: spacecraft.spacecraft_config?.type?.name ?? null,
      reuseCount:
        typeof spacecraft.flights_count === "number" ? Math.max(spacecraft.flights_count - 1, 0) : null,
      waterLandings: null,
      landLandings: null,
      lastUpdate: launch.spacecraft_stage?.mission_end ?? null,
    },
  ];
}

function normalizeCores(launch: RawLl2Launch): MissionCore[] {
  return (launch.launcher_stage ?? []).map((stage) => ({
    id: stage.launcher?.id ? `${stage.launcher.id}` : null,
    serial: stage.launcher?.serial_number ?? null,
    flight: stage.launcher_flight_number ?? null,
    reused: stage.reused ?? null,
    landingAttempt: stage.landing?.attempt ?? null,
    landingSuccess: stage.landing?.success ?? null,
    landingType: stage.landing?.type?.name ?? null,
    landpadName: stage.landing?.location?.name ?? null,
    landpadLocation: normalizeLocationName(stage.landing?.location?.location),
  }));
}

function normalizeRocket(launch: RawLl2Launch): MissionRocket | null {
  const configuration = launch.rocket?.configuration;
  if (!configuration) {
    return null;
  }

  const successful = configuration.successful_launches ?? null;
  const failed = configuration.failed_launches ?? null;
  const totalKnown =
    successful !== null || failed !== null ? (successful ?? 0) + (failed ?? 0) : null;

  return {
    id: configuration.id ? `${configuration.id}` : null,
    name: configuration.full_name ?? configuration.name ?? null,
    type: configuration.variant ?? configuration.family ?? null,
    active:
      configuration.active ??
      (configuration.pending_launches !== null && configuration.pending_launches !== undefined
        ? configuration.pending_launches > 0
        : null),
    boosters: /falcon heavy/i.test(configuration.full_name ?? "") ? 2 : 0,
    stages: configuration.max_stage ?? configuration.min_stage ?? null,
    costPerLaunch: parseNullableNumber(configuration.launch_cost),
    successRatePct:
      totalKnown && totalKnown > 0 && successful !== null
        ? Math.round((successful / totalKnown) * 100)
        : null,
    firstFlight: configuration.maiden_flight ?? null,
    company: configuration.manufacturer?.name ?? launch.launch_service_provider?.name ?? null,
    country: configuration.manufacturer?.country_code ?? null,
    description: configuration.description ?? null,
    wikipedia: configuration.wiki_url ?? null,
    heightMeters: configuration.length ?? null,
    diameterMeters: configuration.diameter ?? null,
    massKg: parseMassKg(configuration.launch_mass),
    image: resolveSpaceXImageUrl(configuration.image_url),
    flickrImages: resolveSpaceXImageUrls([
      configuration.image_url ?? null,
      launch.image ?? null,
      pickSpacecraftImage(launch),
    ]),
  };
}

function normalizeLaunchpad(launch: RawLl2Launch): MissionLaunchpad | null {
  const pad = launch.pad;
  if (!pad) {
    return null;
  }

  return {
    id: pad.id ? `${pad.id}` : null,
    name: pad.name ?? null,
    fullName: pad.name ?? null,
    locality: pad.location?.name ?? null,
    region: null,
    timezone: pad.location?.timezone_name ?? null,
    status: null,
    details: pad.description ?? pad.location?.description ?? null,
    image: resolveSpaceXImageUrl(pad.map_image),
  };
}

function normalizeLaunchDetail(
  launch: RawLl2Launch,
  upcoming: boolean
): MissionLaunchDetail {
  const windowSeconds =
    launch.window_start && launch.window_end
      ? Math.max(
          0,
          Math.round((Date.parse(launch.window_end) - Date.parse(launch.window_start)) / 1000)
        )
      : null;

  const failreason = launch.failreason?.trim();

  return {
    ...normalizeLaunchCard(launch, upcoming),
    staticFireDateUtc: null,
    window: windowSeconds,
    failures: failreason
      ? [
          {
            time: null,
            altitude: null,
            reason: failreason,
          },
        ]
      : [],
    rocket: normalizeRocket(launch),
    launchpad: normalizeLaunchpad(launch),
    crew: normalizeCrewMembers(launch),
    payloads: normalizePayloads(launch),
    capsules: normalizeCapsules(launch),
    cores: normalizeCores(launch),
  };
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function buildInsights(agency: RawLl2Agency): MissionControlInsight[] {
  const totalPast = agency.total_launch_count ?? 0;
  const totalSuccessfulPast = agency.successful_launches ?? 0;
  const successRate = totalPast > 0 ? Math.round((totalSuccessfulPast / totalPast) * 100) : 0;
  const activeRocketFamilies = new Set(
    (agency.launcher_list ?? [])
      .filter((launcher) => (launcher.pending_launches ?? 0) > 0)
      .map((launcher) => launcher.family ?? launcher.name ?? launcher.full_name ?? "Unknown")
  ).size;

  return [
    {
      id: "upcoming",
      label: "Upcoming queue",
      value: formatCompactNumber(agency.pending_launches ?? 0),
      description: "currently published future SpaceX missions from Launch Library 2",
    },
    {
      id: "past",
      label: "Completed archive",
      value: formatCompactNumber(totalPast),
      description: "historical SpaceX launches available from the active provider",
    },
    {
      id: "success-rate",
      label: "Historical success",
      value: `${successRate}%`,
      description: "successful SpaceX launches across the published completed record",
    },
    {
      id: "rocket-families",
      label: "Active rockets",
      value: `${activeRocketFamilies}`,
      description: "rocket families with pending SpaceX missions in the current feed",
    },
  ];
}

async function getLaunchCardForSummary(
  launch: RawLl2Launch | null,
  upcoming: boolean
): Promise<MissionLaunchCard | null> {
  if (!launch) {
    return null;
  }

  try {
    const detail = await fetchLaunchDetail(launch.id, upcoming ? 120 : 300);
    return normalizeLaunchCard(detail, upcoming);
  } catch {
    return normalizeLaunchCard(launch, upcoming);
  }
}

export function isValidMissionLaunchId(value: string): boolean {
  return LAUNCH_ID_PATTERN.test(value);
}

// Vehicle catalog + recovery split are read directly from the committed
// snapshot's hydrated launch details — they don't need live-fetch parity
// (a handful of hydrated details only changes on each snapshot rebuild, not
// minute to minute), so these are thin, synchronous pass-throughs rather
// than fetch functions. Exposed from this module (not spacexSnapshot.ts
// directly) so callers keep a single data-layer import boundary.
export function getMissionControlCadence(): MissionControlCadence | null {
  return getSpaceXSnapshotCadence();
}

export function getMissionControlVehicleCatalogData(): Record<string, MissionLaunchDetail> {
  return getSpaceXSnapshotLaunchDetails();
}

function shouldReadFromSnapshot(source: MissionControlDataSource = "auto"): boolean {
  return source !== "live";
}

function shouldAllowLiveFallback(source: MissionControlDataSource = "auto"): boolean {
  return source !== "snapshot";
}

export async function getMissionControlSummary(
  options: MissionControlDataOptions = {}
): Promise<MissionControlSummary> {
  const source = options.source ?? "auto";

  if (shouldReadFromSnapshot(source)) {
    const snapshotSummary = getSpaceXSnapshotSummary();
    if (snapshotSummary) {
      return snapshotSummary;
    }

    if (!shouldAllowLiveFallback(source)) {
      throw createSpaceXError("SpaceX snapshot summary is unavailable", 503);
    }
  }

  const cachedSummary = getCachedValue(missionControlSummaryCache, SUMMARY_CACHE_TTL_MS);
  if (cachedSummary) {
    return cachedSummary;
  }

  if (missionControlSummaryInflight) {
    return missionControlSummaryInflight;
  }

  const promise = (async () => {
    const [upcomingResponse, previousResponse, agency] = await Promise.all([
      fetchLaunchCollection("upcoming", 6, 120),
      fetchLaunchCollection("previous", 4, 300),
      fetchSpaceXAgency(900),
    ]);

    const nextRawLaunch = filterLaunchCollection(upcomingResponse.results, "upcoming")[0] ?? null;
    const fallbackRawLaunch =
      filterLaunchCollection(previousResponse.results, "previous")[0] ?? null;
    const [nextLaunch, fallbackLaunch] = await Promise.all([
      getLaunchCardForSummary(nextRawLaunch, true),
      getLaunchCardForSummary(fallbackRawLaunch, false),
    ]);

    let heroLaunch = nextLaunch;
    let heroMode: MissionControlSummary["heroMode"] = "next";
    let heroMessage: string | null = null;

    if (!heroLaunch && fallbackLaunch) {
      heroLaunch = fallbackLaunch;
      heroMode = "fallback";
      heroMessage =
        "No future SpaceX mission is currently published by the live provider. Showing the latest completed launch instead.";
    }

    const summary = {
      heroLaunch,
      nextLaunch,
      fallbackLaunch,
      heroMode,
      heroMessage,
      insights: buildInsights(agency),
      generatedAt: new Date().toISOString(),
    };

    missionControlSummaryCache = setCachedValue(summary);
    return summary;
  })()
    .catch((error) => {
      if (isSpaceXRateLimitError(error)) {
        const staleSummary = getCachedValue(missionControlSummaryCache, STALE_FALLBACK_TTL_MS);
        if (staleSummary) {
          return staleSummary;
        }
      }

      throw error;
    })
    .finally(() => {
      missionControlSummaryInflight = null;
    });

  missionControlSummaryInflight = promise;
  return promise;
}

export async function getMissionLaunchCards(
  status: MissionControlStatus,
  limit = DEFAULT_BOARD_LIMIT,
  options: MissionControlDataOptions = {}
): Promise<MissionLaunchCard[]> {
  ensureValidStatus(status);

  const clampedLimit = clampBoardLimit(limit);
  const source = options.source ?? "auto";

  if (shouldReadFromSnapshot(source)) {
    const snapshotLaunches = getSpaceXSnapshotLaunches(status, clampedLimit);
    if (snapshotLaunches.length > 0 || hasSpaceXSnapshotData()) {
      return snapshotLaunches;
    }

    if (!shouldAllowLiveFallback(source)) {
      throw createSpaceXError(`SpaceX snapshot launches are unavailable for ${status}`, 503);
    }
  }

  const cacheKey = `${status}:${clampedLimit}`;
  const cachedLaunches = getCachedValue(
    missionLaunchCardsCache.get(cacheKey),
    LAUNCH_CARDS_CACHE_TTL_MS
  );

  if (cachedLaunches) {
    return cachedLaunches;
  }

  const existing = missionLaunchCardsInflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const mode: LaunchCollectionMode = status === "upcoming" ? "upcoming" : "previous";
    const response = await fetchLaunchCollection(
      mode,
      clampedLimit + 6,
      status === "upcoming" ? 120 : 300
    );

    const launches = filterLaunchCollection(response.results, mode)
      .slice(0, clampedLimit)
      .map((launch) => normalizeLaunchCard(launch, status === "upcoming"));

    missionLaunchCardsCache.set(cacheKey, setCachedValue(launches));
    return launches;
  })()
    .catch((error) => {
      if (isSpaceXRateLimitError(error)) {
        const staleLaunches = getCachedValue(
          missionLaunchCardsCache.get(cacheKey),
          STALE_FALLBACK_TTL_MS
        );
        if (staleLaunches) {
          return staleLaunches;
        }
      }

      throw error;
    })
    .finally(() => {
      missionLaunchCardsInflight.delete(cacheKey);
    });

  missionLaunchCardsInflight.set(cacheKey, promise);
  return promise;
}

export async function getMissionLaunchDetail(
  id: string,
  options: MissionControlDataOptions = {}
): Promise<MissionLaunchDetail> {
  if (!isValidMissionLaunchId(id)) {
    throw createSpaceXError("Invalid launch id", 400);
  }

  const source = options.source ?? "auto";
  if (shouldReadFromSnapshot(source)) {
    const snapshotDetail = getSpaceXSnapshotLaunchDetail(id);
    if (snapshotDetail) {
      return snapshotDetail;
    }

    if (!shouldAllowLiveFallback(source)) {
      throw createSpaceXError("SpaceX snapshot launch detail is unavailable", 503);
    }
  }

  const cachedDetail = getCachedValue(missionLaunchDetailCache.get(id), LAUNCH_DETAIL_CACHE_TTL_MS);
  if (cachedDetail) {
    return cachedDetail;
  }

  const existing = missionLaunchDetailInflight.get(id);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const launch = await fetchLaunchDetail(id, 300);

    if (launch.launch_service_provider?.id !== SPACEX_AGENCY_ID) {
      throw createSpaceXError("Launch not found", 404);
    }

    const detail = normalizeLaunchDetail(launch, !isPastDate(launch.net));
    missionLaunchDetailCache.set(id, setCachedValue(detail));
    return detail;
  })()
    .catch((error) => {
      if (isSpaceXRateLimitError(error)) {
        const staleDetail = getCachedValue(
          missionLaunchDetailCache.get(id),
          STALE_FALLBACK_TTL_MS
        );
        if (staleDetail) {
          return staleDetail;
        }
      }

      throw error;
    })
    .finally(() => {
      missionLaunchDetailInflight.delete(id);
    });

  missionLaunchDetailInflight.set(id, promise);
  return promise;
}

export async function buildMissionControlSnapshot(): Promise<MissionControlSnapshot> {
  const upcomingResponse = await fetchLaunchCollection(
    "upcoming",
    MAX_BOARD_LIMIT + 6,
    120
  );
  const previousResponse = await fetchLaunchCollection(
    "previous",
    MAX_BOARD_LIMIT + 6,
    300
  );
  const agency = await fetchSpaceXAgency(900);

  const upcomingLaunches = filterLaunchCollection(upcomingResponse.results, "upcoming")
    .slice(0, MAX_BOARD_LIMIT)
    .map((launch) => normalizeLaunchCard(launch, true));
  const pastLaunches = filterLaunchCollection(previousResponse.results, "previous")
    .slice(0, MAX_BOARD_LIMIT)
    .map((launch) => normalizeLaunchCard(launch, false));

  const nextLaunch = upcomingLaunches[0] ?? null;
  const fallbackLaunch = pastLaunches[0] ?? null;
  let heroLaunch = nextLaunch;
  let heroMode: MissionControlSummary["heroMode"] = "next";
  let heroMessage: string | null = null;

  if (!heroLaunch && fallbackLaunch) {
    heroLaunch = fallbackLaunch;
    heroMode = "fallback";
    heroMessage =
      "No future SpaceX mission is currently published by the live provider. Showing the latest completed launch instead.";
  }

  const summary: MissionControlSummary = {
    heroLaunch,
    nextLaunch,
    fallbackLaunch,
    heroMode,
    heroMessage,
    insights: buildInsights(agency),
    generatedAt: new Date().toISOString(),
  };

  // Prioritize one detail hydration per distinct vehicle family seen across
  // the current upcoming+past window (e.g. Falcon 9, Falcon Heavy, Starship)
  // ahead of the plain per-status fill, so the vehicle catalog gets real
  // rocket records for more than just whichever family happens to launch
  // most often, whenever the window actually contains that variety.
  const allCards = [...upcomingLaunches, ...pastLaunches];
  const familyFirstIds = new Map<string, string>();
  for (const card of allCards) {
    const family = deriveVehicleFamily(card.rocketName);
    if (!familyFirstIds.has(family)) {
      familyFirstIds.set(family, card.id);
    }
  }

  const detailIds = Array.from(
    new Set(
      [
        ...familyFirstIds.values(),
        summary.heroLaunch?.id ?? null,
        summary.nextLaunch?.id ?? null,
        summary.fallbackLaunch?.id ?? null,
        ...upcomingLaunches
          .slice(0, SNAPSHOT_DETAIL_LIMIT_PER_STATUS)
          .map((launch) => launch.id),
        ...pastLaunches
          .slice(0, SNAPSHOT_DETAIL_LIMIT_PER_STATUS)
          .map((launch) => launch.id),
      ].filter((id): id is string => Boolean(id))
    )
  ).slice(0, SNAPSHOT_DETAIL_ID_CAP);

  const detailEntries: Array<readonly [string, MissionLaunchDetail]> = [];

  for (const id of detailIds) {
    try {
      detailEntries.push([id, await getMissionLaunchDetail(id, { source: "live" })]);
    } catch (error) {
      if (isSpaceXRateLimitError(error)) {
        break;
      }
    }
  }

  // Trailing-12-month launch cadence. Best-effort and isolated from the rest
  // of the build: a failure here (rate limit, network) just leaves cadence
  // null so the UI renders its empty state instead of failing the whole
  // snapshot refresh.
  let cadence: MissionControlCadence | null;
  try {
    const cadenceResponse = await fetchLaunchCollection("previous", CADENCE_HISTORY_LIMIT, 3600);
    const cadenceDates = filterLaunchCollection(cadenceResponse.results, "previous").map(
      (launch) => launch.net ?? launch.window_start ?? null
    );
    cadence = aggregateLaunchCadence(cadenceDates, Date.now(), CADENCE_MONTHS_BACK);
  } catch {
    cadence = null;
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceLabel: "launch-library-2 snapshot",
    summary,
    upcomingLaunches,
    pastLaunches,
    launchDetails: Object.fromEntries(detailEntries),
    cadence,
  };
}

export function resetSpaceXDataCacheForTests() {
  clearLaunchLibraryRateLimit();
  missionControlSummaryCache = null;
  missionControlSummaryInflight = null;
  missionLaunchCardsCache.clear();
  missionLaunchCardsInflight.clear();
  missionLaunchDetailCache.clear();
  missionLaunchDetailInflight.clear();
}
