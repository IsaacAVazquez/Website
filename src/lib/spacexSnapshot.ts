import generatedSnapshot from "@/data/spacexSnapshot.generated.json";
import type {
  MissionControlCadence,
  MissionControlSnapshot,
  MissionControlStatus,
  MissionLaunchCard,
  MissionLaunchDetail,
  MissionControlSummary,
} from "@/types/spacex";

const EMPTY_SPACEX_SNAPSHOT: MissionControlSnapshot = {
  generatedAt: null,
  sourceLabel: null,
  summary: null,
  upcomingLaunches: [],
  pastLaunches: [],
  launchDetails: {},
  cadence: null,
};

let snapshotOverride: MissionControlSnapshot | null = null;

function isLaunchCardArray(value: unknown): value is MissionLaunchCard[] {
  return Array.isArray(value);
}

function isLaunchDetailRecord(value: unknown): value is Record<string, MissionLaunchDetail> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSnapshot(value: unknown): MissionControlSnapshot {
  if (!value || typeof value !== "object") {
    return EMPTY_SPACEX_SNAPSHOT;
  }

  const snapshot = value as Partial<MissionControlSnapshot>;

  return {
    generatedAt: typeof snapshot.generatedAt === "string" ? snapshot.generatedAt : null,
    sourceLabel: typeof snapshot.sourceLabel === "string" ? snapshot.sourceLabel : null,
    summary:
      snapshot.summary && typeof snapshot.summary === "object"
        ? (snapshot.summary as MissionControlSummary)
        : null,
    upcomingLaunches: isLaunchCardArray(snapshot.upcomingLaunches) ? snapshot.upcomingLaunches : [],
    pastLaunches: isLaunchCardArray(snapshot.pastLaunches) ? snapshot.pastLaunches : [],
    launchDetails: isLaunchDetailRecord(snapshot.launchDetails) ? snapshot.launchDetails : {},
    cadence:
      snapshot.cadence && typeof snapshot.cadence === "object"
        ? (snapshot.cadence as MissionControlCadence)
        : null,
  };
}

function createCardDetailFallback(card: MissionLaunchCard): MissionLaunchDetail {
  return {
    ...card,
    staticFireDateUtc: null,
    window: null,
    failures: [],
    rocket: card.rocketName
      ? {
          id: null,
          name: card.rocketName,
          type: null,
          active: null,
          boosters: null,
          stages: null,
          costPerLaunch: null,
          successRatePct: null,
          firstFlight: null,
          company: "SpaceX",
          country: null,
          description: null,
          wikipedia: null,
          heightMeters: null,
          diameterMeters: null,
          massKg: null,
          image: card.vehicleImage,
          flickrImages: card.vehicleImage ? [card.vehicleImage] : [],
        }
      : null,
    launchpad:
      card.launchpadName || card.launchpadLocation
        ? {
            id: null,
            name: card.launchpadName,
            fullName: card.launchpadName,
            locality: card.launchpadLocation,
            region: null,
            timezone: null,
            status: null,
            details: null,
            image: null,
          }
        : null,
    crew: [],
    payloads: [],
    capsules: [],
    cores: [],
  };
}

export function getSpaceXSnapshot(): MissionControlSnapshot {
  return snapshotOverride ?? normalizeSnapshot(generatedSnapshot);
}

export function getSpaceXSnapshotSummary(): MissionControlSummary | null {
  return getSpaceXSnapshot().summary;
}

export function getSpaceXSnapshotLaunches(
  status: MissionControlStatus,
  limit: number
): MissionLaunchCard[] {
  const launches =
    status === "upcoming"
      ? getSpaceXSnapshot().upcomingLaunches
      : getSpaceXSnapshot().pastLaunches;

  return launches.slice(0, Math.max(0, limit));
}

export function getSpaceXSnapshotLaunchDetail(id: string): MissionLaunchDetail | null {
  const snapshot = getSpaceXSnapshot();
  const hydratedDetail = snapshot.launchDetails[id];
  if (hydratedDetail) {
    return hydratedDetail;
  }

  const card = [...snapshot.upcomingLaunches, ...snapshot.pastLaunches].find(
    (launch) => launch.id === id
  );

  return card ? createCardDetailFallback(card) : null;
}

export function getSpaceXSnapshotLaunchDetails(): Record<string, MissionLaunchDetail> {
  return getSpaceXSnapshot().launchDetails;
}

export function getSpaceXSnapshotCadence(): MissionControlCadence | null {
  return getSpaceXSnapshot().cadence;
}

export function hasSpaceXSnapshotData(): boolean {
  const snapshot = getSpaceXSnapshot();

  return Boolean(
    snapshot.summary ||
      snapshot.upcomingLaunches.length > 0 ||
      snapshot.pastLaunches.length > 0 ||
      Object.keys(snapshot.launchDetails).length > 0
  );
}

export function setSpaceXSnapshotForTests(snapshot: MissionControlSnapshot | null) {
  snapshotOverride = snapshot;
}
