import type {
  MissionCapsule,
  MissionControlInsight,
  MissionControlStatus,
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

const LAUNCH_LIBRARY_API_BASE = "https://ll.thespacedevs.com/2.2.0";
const SPACEX_AGENCY_ID = 121;
const DEFAULT_BOARD_LIMIT = 12;
const MAX_BOARD_LIMIT = 24;
const REQUEST_TIMEOUT_MS = 12000;
const LAUNCH_ID_PATTERN =
  /^(?:[a-f0-9]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const UPCOMING_STALE_GRACE_MS = 30 * 60 * 1000;

type LaunchCollectionMode = "upcoming" | "previous";

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

function createSpaceXError(message: string, status = 500): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

async function fetchLaunchLibraryJson<T>(
  path: string,
  revalidateSeconds = 120
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${LAUNCH_LIBRARY_API_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: revalidateSeconds,
      },
    });

    if (!response.ok) {
      throw createSpaceXError(
        `Launch Library request failed with status ${response.status}`,
        response.status
      );
    }

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
  const patchImage = pickMissionPatch(launch);
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
    flickrOriginal: launch.image ? [launch.image] : [],
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
    patchImage: pickMissionPatch(launch) ?? launch.image ?? null,
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
        image: astronaut.profile_image ?? null,
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
    flickrImages: toStringArray([
      configuration.image_url ?? null,
      launch.image ?? null,
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
    image: pad.map_image ?? null,
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

export async function getMissionControlSummary(): Promise<MissionControlSummary> {
  const [upcomingResponse, previousResponse, agency] = await Promise.all([
    fetchLaunchCollection("upcoming", 6, 120),
    fetchLaunchCollection("previous", 4, 300),
    fetchSpaceXAgency(900),
  ]);

  const nextRawLaunch = filterLaunchCollection(upcomingResponse.results, "upcoming")[0] ?? null;
  const fallbackRawLaunch = filterLaunchCollection(previousResponse.results, "previous")[0] ?? null;
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

  return {
    heroLaunch,
    nextLaunch,
    fallbackLaunch,
    heroMode,
    heroMessage,
    insights: buildInsights(agency),
    generatedAt: new Date().toISOString(),
  };
}

export async function getMissionLaunchCards(
  status: MissionControlStatus,
  limit = DEFAULT_BOARD_LIMIT
): Promise<MissionLaunchCard[]> {
  ensureValidStatus(status);

  const clampedLimit = clampBoardLimit(limit);
  const mode: LaunchCollectionMode = status === "upcoming" ? "upcoming" : "previous";
  const response = await fetchLaunchCollection(mode, clampedLimit + 6, status === "upcoming" ? 120 : 300);

  return filterLaunchCollection(response.results, mode)
    .slice(0, clampedLimit)
    .map((launch) => normalizeLaunchCard(launch, status === "upcoming"));
}

export async function getMissionLaunchDetail(id: string): Promise<MissionLaunchDetail> {
  if (!isValidMissionLaunchId(id)) {
    throw createSpaceXError("Invalid launch id", 400);
  }

  const launch = await fetchLaunchDetail(id, 300);

  if (launch.launch_service_provider?.id !== SPACEX_AGENCY_ID) {
    throw createSpaceXError("Launch not found", 404);
  }

  return normalizeLaunchDetail(launch, !isPastDate(launch.net));
}
