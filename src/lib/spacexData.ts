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

const SPACEX_API_BASE = "https://api.spacexdata.com";
const DEFAULT_BOARD_LIMIT = 12;
const MAX_BOARD_LIMIT = 24;
const REQUEST_TIMEOUT_MS = 12000;
const LAUNCH_ID_PATTERN = /^[a-f0-9]{24}$/i;

type QuerySortDirection = "asc" | "desc";

interface RawQueryResponse<T> {
  docs: T[];
  totalDocs: number;
}

interface RawLinkGroup {
  patch?: {
    small?: string | null;
    large?: string | null;
  } | null;
  reddit?: {
    campaign?: string | null;
    launch?: string | null;
    media?: string | null;
  } | null;
  flickr?: {
    original?: string[] | null;
  } | null;
  presskit?: string | null;
  webcast?: string | null;
  youtube_id?: string | null;
  article?: string | null;
  wikipedia?: string | null;
}

interface RawRocket {
  id?: string;
  name?: string | null;
  type?: string | null;
  active?: boolean | null;
  boosters?: number | null;
  stages?: number | null;
  cost_per_launch?: number | null;
  success_rate_pct?: number | null;
  first_flight?: string | null;
  company?: string | null;
  country?: string | null;
  description?: string | null;
  wikipedia?: string | null;
  height?: { meters?: number | null } | null;
  diameter?: { meters?: number | null } | null;
  mass?: { kg?: number | null } | null;
  flickr_images?: string[] | null;
}

interface RawLaunchpad {
  id?: string;
  name?: string | null;
  full_name?: string | null;
  locality?: string | null;
  region?: string | null;
  timezone?: string | null;
  status?: string | null;
  details?: string | null;
  images?: {
    large?: string[] | null;
  } | null;
}

interface RawPayload {
  id?: string;
  name?: string | null;
  type?: string | null;
  customers?: string[] | null;
  manufacturers?: string[] | null;
  nationalities?: string[] | null;
  orbit?: string | null;
  regime?: string | null;
  mass_kg?: number | null;
  mass_lbs?: number | null;
}

interface RawCapsule {
  id?: string;
  serial?: string | null;
  status?: string | null;
  type?: string | null;
  reuse_count?: number | null;
  water_landings?: number | null;
  land_landings?: number | null;
  last_update?: string | null;
}

interface RawCrewMember {
  id?: string;
  name?: string | null;
  agency?: string | null;
  status?: string | null;
  image?: string | null;
  wikipedia?: string | null;
}

interface RawCoreEntity {
  id?: string;
  serial?: string | null;
}

interface RawLandpadEntity {
  id?: string;
  name?: string | null;
  full_name?: string | null;
  locality?: string | null;
  region?: string | null;
}

interface RawLaunch {
  id: string;
  name: string;
  flight_number: number;
  upcoming: boolean;
  success?: boolean | null;
  details?: string | null;
  date_utc: string;
  date_unix?: number | null;
  date_local?: string | null;
  date_precision: string;
  tbd?: boolean | null;
  net?: boolean | null;
  rocket?: string | RawRocket | null;
  launchpad?: string | RawLaunchpad | null;
  payloads?: Array<string | RawPayload> | null;
  crew?: Array<
    | string
    | {
        crew?: string | RawCrewMember | null;
        role?: string | null;
      }
  > | null;
  capsules?: Array<string | RawCapsule> | null;
  cores?: Array<{
    core?: string | RawCoreEntity | null;
    flight?: number | null;
    reused?: boolean | null;
    landing_attempt?: boolean | null;
    landing_success?: boolean | null;
    landing_type?: string | null;
    landpad?: string | RawLandpadEntity | null;
  }> | null;
  links?: RawLinkGroup | null;
  static_fire_date_utc?: string | null;
  window?: number | null;
  failures?: Array<{
    time?: number | null;
    altitude?: number | null;
    reason?: string | null;
  }> | null;
}

function createSpaceXError(message: string, status = 500): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

async function fetchSpaceXJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SPACEX_API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw createSpaceXError(`SpaceX API request failed with status ${response.status}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createSpaceXError("SpaceX API request timed out", 504);
    }

    if (error instanceof Error && "status" in error) {
      throw error;
    }

    throw createSpaceXError("Unable to reach SpaceX API", 502);
  } finally {
    clearTimeout(timeout);
  }
}

async function queryLaunches(
  query: Record<string, unknown>,
  {
    limit = DEFAULT_BOARD_LIMIT,
    sortDirection,
    populate = [],
  }: {
    limit?: number;
    sortDirection: QuerySortDirection;
    populate?: Array<string | { path: string }>;
  }
): Promise<RawQueryResponse<RawLaunch>> {
  return fetchSpaceXJson<RawQueryResponse<RawLaunch>>("/v5/launches/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      options: {
        limit,
        sort: {
          flight_number: sortDirection,
        },
        populate,
      },
    }),
  });
}

function toStringArray(values: string[] | null | undefined): string[] {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function entityId(value: { id?: string } | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id ?? null;
}

function formatLocation(locality?: string | null, region?: string | null): string | null {
  const parts = [locality, region].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeLinks(rawLinks?: RawLinkGroup | null): MissionLinkSet {
  return {
    webcast: rawLinks?.webcast ?? null,
    article: rawLinks?.article ?? null,
    wikipedia: rawLinks?.wikipedia ?? null,
    presskit: rawLinks?.presskit ?? null,
    redditLaunch: rawLinks?.reddit?.launch ?? null,
    redditCampaign: rawLinks?.reddit?.campaign ?? null,
    redditMedia: rawLinks?.reddit?.media ?? null,
    youtubeId: rawLinks?.youtube_id ?? null,
    patchSmall: rawLinks?.patch?.small ?? null,
    patchLarge: rawLinks?.patch?.large ?? null,
    flickrOriginal: toStringArray(rawLinks?.flickr?.original ?? []),
  };
}

function isStaleSchedule(launch: RawLaunch): boolean {
  if (!launch.upcoming || !launch.date_utc) {
    return false;
  }

  return Date.parse(launch.date_utc) < Date.now();
}

function normalizeLaunchCard(launch: RawLaunch): MissionLaunchCard {
  const links = normalizeLinks(launch.links);
  const launchpad =
    launch.launchpad && typeof launch.launchpad !== "string" ? launch.launchpad : null;
  const rocket = launch.rocket && typeof launch.rocket !== "string" ? launch.rocket : null;
  const staleSchedule = isStaleSchedule(launch);

  return {
    id: launch.id,
    name: launch.name,
    flightNumber: launch.flight_number,
    upcoming: launch.upcoming,
    success: launch.success ?? null,
    details: launch.details ?? null,
    dateUtc: launch.date_utc,
    dateUnix: launch.date_unix ?? null,
    dateLocal: launch.date_local ?? null,
    datePrecision: launch.date_precision,
    tbd: launch.tbd ?? false,
    net: launch.net ?? false,
    rocketName: rocket?.name ?? null,
    launchpadName: launchpad?.name ?? launchpad?.full_name ?? null,
    launchpadLocation: formatLocation(launchpad?.locality, launchpad?.region),
    patchImage: links.patchLarge ?? links.patchSmall,
    crewCount: launch.crew?.length ?? 0,
    payloadCount: launch.payloads?.length ?? 0,
    capsuleCount: launch.capsules?.length ?? 0,
    coreCount: launch.cores?.length ?? 0,
    hasExactTime: launch.date_precision === "hour" && !(launch.tbd ?? false) && !staleSchedule,
    isStaleSchedule: staleSchedule,
    links,
  };
}

function normalizeCrew(crew: RawLaunch["crew"]): MissionCrewMember[] {
  return (crew ?? []).flatMap((entry) => {
    if (!entry || typeof entry === "string" || !("crew" in entry) || !entry.crew || typeof entry.crew === "string") {
      return [];
    }

    return [
      {
        id: entry.crew.id ?? "",
        name: entry.crew.name ?? "Unnamed crew member",
        role: entry.role ?? null,
        agency: entry.crew.agency ?? null,
        status: entry.crew.status ?? null,
        image: entry.crew.image ?? null,
        wikipedia: entry.crew.wikipedia ?? null,
      },
    ];
  });
}

function normalizePayloads(payloads: RawLaunch["payloads"]): MissionPayload[] {
  return (payloads ?? []).flatMap((payload) => {
    if (!payload || typeof payload === "string") {
      return [];
    }

    return [
      {
        id: payload.id ?? "",
        name: payload.name ?? "Unnamed payload",
        type: payload.type ?? null,
        customers: toStringArray(payload.customers),
        manufacturers: toStringArray(payload.manufacturers),
        nationalities: toStringArray(payload.nationalities),
        orbit: payload.orbit ?? null,
        regime: payload.regime ?? null,
        massKg: payload.mass_kg ?? null,
        massLbs: payload.mass_lbs ?? null,
      },
    ];
  });
}

function normalizeCapsules(capsules: RawLaunch["capsules"]): MissionCapsule[] {
  return (capsules ?? []).flatMap((capsule) => {
    if (!capsule || typeof capsule === "string") {
      return [];
    }

    return [
      {
        id: capsule.id ?? "",
        serial: capsule.serial ?? null,
        status: capsule.status ?? null,
        type: capsule.type ?? null,
        reuseCount: capsule.reuse_count ?? null,
        waterLandings: capsule.water_landings ?? null,
        landLandings: capsule.land_landings ?? null,
        lastUpdate: capsule.last_update ?? null,
      },
    ];
  });
}

function normalizeCores(cores: RawLaunch["cores"]): MissionCore[] {
  return (cores ?? []).map((core) => {
    const rawCore = core.core && typeof core.core !== "string" ? core.core : null;
    const rawLandpad = core.landpad && typeof core.landpad !== "string" ? core.landpad : null;

    return {
      id: entityId(rawCore),
      serial: rawCore?.serial ?? null,
      flight: core.flight ?? null,
      reused: core.reused ?? null,
      landingAttempt: core.landing_attempt ?? null,
      landingSuccess: core.landing_success ?? null,
      landingType: core.landing_type ?? null,
      landpadName: rawLandpad?.full_name ?? rawLandpad?.name ?? null,
      landpadLocation: formatLocation(rawLandpad?.locality, rawLandpad?.region),
    };
  });
}

function normalizeRocket(rocket: RawLaunch["rocket"]): MissionRocket | null {
  if (!rocket || typeof rocket === "string") {
    return null;
  }

  return {
    id: rocket.id ?? null,
    name: rocket.name ?? null,
    type: rocket.type ?? null,
    active: rocket.active ?? null,
    boosters: rocket.boosters ?? null,
    stages: rocket.stages ?? null,
    costPerLaunch: rocket.cost_per_launch ?? null,
    successRatePct: rocket.success_rate_pct ?? null,
    firstFlight: rocket.first_flight ?? null,
    company: rocket.company ?? null,
    country: rocket.country ?? null,
    description: rocket.description ?? null,
    wikipedia: rocket.wikipedia ?? null,
    heightMeters: rocket.height?.meters ?? null,
    diameterMeters: rocket.diameter?.meters ?? null,
    massKg: rocket.mass?.kg ?? null,
    flickrImages: toStringArray(rocket.flickr_images),
  };
}

function normalizeLaunchpad(launchpad: RawLaunch["launchpad"]): MissionLaunchpad | null {
  if (!launchpad || typeof launchpad === "string") {
    return null;
  }

  return {
    id: launchpad.id ?? null,
    name: launchpad.name ?? null,
    fullName: launchpad.full_name ?? null,
    locality: launchpad.locality ?? null,
    region: launchpad.region ?? null,
    timezone: launchpad.timezone ?? null,
    status: launchpad.status ?? null,
    details: launchpad.details ?? null,
    image: launchpad.images?.large?.[0] ?? null,
  };
}

function normalizeLaunchDetail(launch: RawLaunch): MissionLaunchDetail {
  return {
    ...normalizeLaunchCard(launch),
    staticFireDateUtc: launch.static_fire_date_utc ?? null,
    window: launch.window ?? null,
    failures: (launch.failures ?? []).map((failure) => ({
      time: failure.time ?? null,
      altitude: failure.altitude ?? null,
      reason: failure.reason ?? null,
    })),
    rocket: normalizeRocket(launch.rocket),
    launchpad: normalizeLaunchpad(launch.launchpad),
    crew: normalizeCrew(launch.crew),
    payloads: normalizePayloads(launch.payloads),
    capsules: normalizeCapsules(launch.capsules),
    cores: normalizeCores(launch.cores),
  };
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

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function buildInsights({
  totalUpcoming,
  totalPast,
  totalSuccessfulPast,
  activeRocketFamilies,
}: {
  totalUpcoming: number;
  totalPast: number;
  totalSuccessfulPast: number;
  activeRocketFamilies: number;
}): MissionControlInsight[] {
  const successRate = totalPast > 0 ? Math.round((totalSuccessfulPast / totalPast) * 100) : 0;

  return [
    {
      id: "upcoming",
      label: "Upcoming queue",
      value: formatCompactNumber(totalUpcoming),
      description: "missions currently marked upcoming by the upstream API",
    },
    {
      id: "past",
      label: "Completed archive",
      value: formatCompactNumber(totalPast),
      description: "published historical launches available for browsing",
    },
    {
      id: "success-rate",
      label: "Historical success",
      value: `${successRate}%`,
      description: "successful missions across the published past-launch record",
    },
    {
      id: "rocket-families",
      label: "Active rockets",
      value: `${activeRocketFamilies}`,
      description: "rocket families currently marked active in the tracked dataset",
    },
  ];
}

export function isValidMissionLaunchId(value: string): boolean {
  return LAUNCH_ID_PATTERN.test(value);
}

export async function getMissionControlSummary(): Promise<MissionControlSummary> {
  const [
    nextLaunchResponse,
    latestPastResponse,
    upcomingCountResponse,
    pastCountResponse,
    successfulPastCountResponse,
    rockets,
  ] = await Promise.all([
    queryLaunches(
      { upcoming: true },
      {
        limit: 1,
        sortDirection: "asc",
        populate: ["rocket", "launchpad"],
      }
    ),
    queryLaunches(
      { upcoming: false },
      {
        limit: 1,
        sortDirection: "desc",
        populate: ["rocket", "launchpad"],
      }
    ),
    queryLaunches(
      { upcoming: true },
      {
        limit: 1,
        sortDirection: "asc",
      }
    ),
    queryLaunches(
      { upcoming: false },
      {
        limit: 1,
        sortDirection: "desc",
      }
    ),
    queryLaunches(
      { upcoming: false, success: true },
      {
        limit: 1,
        sortDirection: "desc",
      }
    ),
    fetchSpaceXJson<RawRocket[]>("/v4/rockets"),
  ]);

  const nextLaunch = nextLaunchResponse.docs[0] ? normalizeLaunchCard(nextLaunchResponse.docs[0]) : null;
  const fallbackLaunch = latestPastResponse.docs[0] ? normalizeLaunchCard(latestPastResponse.docs[0]) : null;
  const activeRocketFamilies = rockets.filter((rocket) => rocket.active).length;

  let heroLaunch = nextLaunch;
  let heroMode: MissionControlSummary["heroMode"] = "next";
  let heroMessage: string | null = null;

  if (!heroLaunch && fallbackLaunch) {
    heroLaunch = fallbackLaunch;
    heroMode = "fallback";
    heroMessage =
      "No upcoming launch is currently available from the upstream API. Showing the latest completed mission instead.";
  } else if (heroLaunch?.isStaleSchedule) {
    heroMessage =
      "The upstream API still marks this mission as upcoming, but the scheduled date is already in the past. Countdown is suppressed until the schedule is refreshed.";
  }

  return {
    heroLaunch,
    nextLaunch,
    fallbackLaunch,
    heroMode,
    heroMessage,
    insights: buildInsights({
      totalUpcoming: upcomingCountResponse.totalDocs,
      totalPast: pastCountResponse.totalDocs,
      totalSuccessfulPast: successfulPastCountResponse.totalDocs,
      activeRocketFamilies,
    }),
    generatedAt: new Date().toISOString(),
  };
}

export async function getMissionLaunchCards(
  status: MissionControlStatus,
  limit = DEFAULT_BOARD_LIMIT
): Promise<MissionLaunchCard[]> {
  ensureValidStatus(status);

  const response = await queryLaunches(
    { upcoming: status === "upcoming" },
    {
      limit: clampBoardLimit(limit),
      sortDirection: status === "upcoming" ? "asc" : "desc",
      populate: ["rocket", "launchpad"],
    }
  );

  return response.docs.map(normalizeLaunchCard);
}

export async function getMissionLaunchDetail(id: string): Promise<MissionLaunchDetail> {
  if (!isValidMissionLaunchId(id)) {
    throw createSpaceXError("Invalid launch id", 400);
  }

  const response = await queryLaunches(
    { _id: id },
    {
      limit: 1,
      sortDirection: "desc",
      populate: [
        { path: "crew.crew" },
        { path: "cores.core" },
        { path: "cores.landpad" },
        "rocket",
        "launchpad",
        "payloads",
        "capsules",
      ],
    }
  );

  const launch = response.docs[0];

  if (!launch) {
    throw createSpaceXError("Launch not found", 404);
  }

  return normalizeLaunchDetail(launch);
}
