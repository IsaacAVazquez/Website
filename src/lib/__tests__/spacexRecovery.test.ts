import { aggregateMissionRecovery } from "@/lib/spacexRecovery";
import type { MissionCore, MissionLaunchDetail } from "@/types/spacex";

function makeCore(overrides: Partial<MissionCore> = {}): MissionCore {
  return {
    id: null,
    serial: null,
    flight: null,
    reused: null,
    landingAttempt: null,
    landingSuccess: null,
    landingType: null,
    landpadName: null,
    landpadLocation: null,
    ...overrides,
  };
}

function makeDetail(
  id: string,
  name: string,
  cores: MissionCore[]
): MissionLaunchDetail {
  return {
    id,
    name,
    flightNumber: 1,
    upcoming: false,
    success: true,
    details: null,
    dateUtc: "2026-01-01T00:00:00.000Z",
    dateUnix: null,
    dateLocal: null,
    datePrecision: "hour",
    tbd: false,
    net: true,
    rocketName: "Falcon 9",
    launchpadName: null,
    launchpadLocation: null,
    patchImage: null,
    vehicleImage: null,
    crewCount: 0,
    payloadCount: 1,
    capsuleCount: 0,
    coreCount: cores.length,
    hasExactTime: true,
    isStaleSchedule: false,
    links: {
      webcast: null,
      article: null,
      wikipedia: null,
      presskit: null,
      redditLaunch: null,
      redditCampaign: null,
      redditMedia: null,
      youtubeId: null,
      patchSmall: null,
      patchLarge: null,
      flickrOriginal: [],
    },
    staticFireDateUtc: null,
    window: null,
    failures: [],
    rocket: null,
    launchpad: null,
    crew: [],
    payloads: [],
    capsules: [],
    cores,
  };
}

describe("aggregateMissionRecovery", () => {
  it("returns null when no launch detail has any populated core data", () => {
    const launchDetails = {
      a: makeDetail("a", "Mission A", []),
      b: makeDetail("b", "Mission B", [makeCore()]),
    };

    expect(aggregateMissionRecovery(launchDetails)).toBeNull();
  });

  it("buckets landing types and ranks fleet leaders by distinct flight numbers", () => {
    const launchDetails = {
      a: makeDetail("a", "Starlink 1", [
        makeCore({ serial: "B1067", flight: 10, landingType: "Drone Ship", landingAttempt: true }),
      ]),
      b: makeDetail("b", "Starlink 2", [
        makeCore({ serial: "B1067", flight: 11, landingType: "Drone Ship", landingAttempt: true }),
      ]),
      c: makeDetail("c", "Crew-11", [
        makeCore({ serial: "B1080", flight: 3, landingType: "Ground Pad", landingAttempt: true }),
      ]),
      d: makeDetail("d", "IFT-9", [makeCore({ serial: "B99", flight: 1, landingAttempt: false })]),
    };

    const recovery = aggregateMissionRecovery(launchDetails);

    expect(recovery).not.toBeNull();
    expect(recovery?.total).toBe(4);
    expect(recovery?.split).toEqual(
      expect.arrayContaining([
        { label: "Droneship", count: 2, tone: "signal" },
        { label: "Return to pad", count: 1, tone: "ink" },
        { label: "Expended", count: 1, tone: "stone" },
      ])
    );
    expect(recovery?.fleetLeaders[0]).toEqual({
      serial: "B1067",
      flights: 2,
      lastMissionName: "Starlink 2",
    });
  });
});
