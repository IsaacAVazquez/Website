export type MissionControlStatus = "upcoming" | "past";
export type MissionControlPanel = "overview" | "vehicle" | "payloads" | "links";

export interface MissionControlSearchState {
  status: MissionControlStatus;
  launch: string | null;
  panel: MissionControlPanel;
}

export interface MissionLinkSet {
  webcast: string | null;
  article: string | null;
  wikipedia: string | null;
  presskit: string | null;
  redditLaunch: string | null;
  redditCampaign: string | null;
  redditMedia: string | null;
  youtubeId: string | null;
  patchSmall: string | null;
  patchLarge: string | null;
  flickrOriginal: string[];
}

export interface MissionLaunchCard {
  id: string;
  name: string;
  flightNumber: number;
  upcoming: boolean;
  success: boolean | null;
  details: string | null;
  dateUtc: string;
  dateUnix: number | null;
  dateLocal: string | null;
  datePrecision: string;
  tbd: boolean;
  net: boolean;
  rocketName: string | null;
  launchpadName: string | null;
  launchpadLocation: string | null;
  patchImage: string | null;
  vehicleImage: string | null;
  crewCount: number;
  payloadCount: number;
  capsuleCount: number;
  coreCount: number;
  hasExactTime: boolean;
  isStaleSchedule: boolean;
  links: MissionLinkSet;
}

export interface MissionControlInsight {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface MissionControlSummary {
  heroLaunch: MissionLaunchCard | null;
  nextLaunch: MissionLaunchCard | null;
  fallbackLaunch: MissionLaunchCard | null;
  heroMode: "next" | "fallback";
  heroMessage: string | null;
  insights: MissionControlInsight[];
  generatedAt: string;
}

export interface MissionControlInitialData {
  summary: MissionControlSummary | null;
  summaryError: string | null;
  launches: MissionLaunchCard[];
  launchesError: string | null;
  detail: MissionLaunchDetail | null;
  detailError: string | null;
}

export interface MissionCrewMember {
  id: string;
  name: string;
  role: string | null;
  agency: string | null;
  status: string | null;
  image: string | null;
  wikipedia: string | null;
}

export interface MissionPayload {
  id: string;
  name: string;
  type: string | null;
  customers: string[];
  manufacturers: string[];
  nationalities: string[];
  orbit: string | null;
  regime: string | null;
  massKg: number | null;
  massLbs: number | null;
}

export interface MissionCapsule {
  id: string;
  serial: string | null;
  status: string | null;
  type: string | null;
  reuseCount: number | null;
  waterLandings: number | null;
  landLandings: number | null;
  lastUpdate: string | null;
}

export interface MissionCore {
  id: string | null;
  serial: string | null;
  flight: number | null;
  reused: boolean | null;
  landingAttempt: boolean | null;
  landingSuccess: boolean | null;
  landingType: string | null;
  landpadName: string | null;
  landpadLocation: string | null;
}

export interface MissionRocket {
  id: string | null;
  name: string | null;
  type: string | null;
  active: boolean | null;
  boosters: number | null;
  stages: number | null;
  costPerLaunch: number | null;
  successRatePct: number | null;
  firstFlight: string | null;
  company: string | null;
  country: string | null;
  description: string | null;
  wikipedia: string | null;
  heightMeters: number | null;
  diameterMeters: number | null;
  massKg: number | null;
  image: string | null;
  flickrImages: string[];
}

export interface MissionLaunchpad {
  id: string | null;
  name: string | null;
  fullName: string | null;
  locality: string | null;
  region: string | null;
  timezone: string | null;
  status: string | null;
  details: string | null;
  image: string | null;
}

export interface MissionLaunchDetail extends MissionLaunchCard {
  staticFireDateUtc: string | null;
  window: number | null;
  failures: Array<{
    time: number | null;
    altitude: number | null;
    reason: string | null;
  }>;
  rocket: MissionRocket | null;
  launchpad: MissionLaunchpad | null;
  crew: MissionCrewMember[];
  payloads: MissionPayload[];
  capsules: MissionCapsule[];
  cores: MissionCore[];
}

export interface MissionControlSnapshot {
  generatedAt: string | null;
  sourceLabel: string | null;
  summary: MissionControlSummary | null;
  upcomingLaunches: MissionLaunchCard[];
  pastLaunches: MissionLaunchCard[];
  launchDetails: Record<string, MissionLaunchDetail>;
}
