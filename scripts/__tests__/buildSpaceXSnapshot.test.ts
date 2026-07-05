/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { buildSpaceXSnapshot } from "../buildSpaceXSnapshot";
import { buildMissionControlSnapshot } from "../../src/lib/spacexData";
import type { MissionControlSnapshot } from "../../src/types/spacex";

jest.mock("../../src/lib/spacexData", () => ({
  buildMissionControlSnapshot: jest.fn(),
}));

const mockBuildMissionControlSnapshot = jest.mocked(buildMissionControlSnapshot);

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "spacex-data-snapshot-"));
}

async function readSnapshot(projectRoot: string): Promise<MissionControlSnapshot> {
  const snapshotPath = path.join(projectRoot, "src", "data", "spacexSnapshot.generated.json");
  const rawSnapshot = await fs.readFile(snapshotPath, "utf8");
  return JSON.parse(rawSnapshot) as MissionControlSnapshot;
}

describe("buildSpaceXSnapshot", () => {
  afterEach(async () => {
    mockBuildMissionControlSnapshot.mockReset();

    const tempRootEntries = await fs.readdir(os.tmpdir());
    await Promise.all(
      tempRootEntries
        .filter((entry) => entry.startsWith("spacex-data-snapshot-"))
        .map((entry) =>
          fs.rm(path.join(os.tmpdir(), entry), { recursive: true, force: true })
        )
    );
  });

  it("writes the generated SpaceX snapshot to the repo data path", async () => {
    const projectRoot = await makeProjectRoot();
    const snapshot: MissionControlSnapshot = {
      generatedAt: "2026-04-12T00:00:00.000Z",
      sourceLabel: "launch-library-2 snapshot",
      summary: null,
      upcomingLaunches: [],
      pastLaunches: [],
      launchDetails: {},
      cadence: null,
    };

    mockBuildMissionControlSnapshot.mockResolvedValue(snapshot);

    const result = await buildSpaceXSnapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot).toEqual(snapshot);
    expect(result.snapshotPath).toBe(
      path.join(projectRoot, "src", "data", "spacexSnapshot.generated.json")
    );
    await expect(readSnapshot(projectRoot)).resolves.toEqual(snapshot);
  });

  it("keeps the existing snapshot when a refresh hits upstream rate limiting", async () => {
    const projectRoot = await makeProjectRoot();
    const existingSnapshot: MissionControlSnapshot = {
      generatedAt: "2026-04-11T00:00:00.000Z",
      sourceLabel: "launch-library-2 snapshot",
      summary: null,
      upcomingLaunches: [
        {
          id: "63aa7636-d2b7-457f-a3e6-27e564e42941",
          name: "Existing Mission",
          flightNumber: 700,
          upcoming: true,
          success: null,
          details: null,
          dateUtc: "2027-04-02T11:55:10Z",
          dateUnix: 1806666910,
          dateLocal: "2027-04-02T11:55:10Z",
          datePrecision: "hour",
          tbd: false,
          net: true,
          rocketName: "Falcon 9",
          launchpadName: "SLC-40",
          launchpadLocation: "Cape Canaveral, Florida",
          patchImage: null,
          vehicleImage: null,
          crewCount: 0,
          payloadCount: 1,
          capsuleCount: 0,
          coreCount: 1,
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
        },
      ],
      pastLaunches: [],
      launchDetails: {},
      cadence: null,
    };

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "spacexSnapshot.generated.json"),
      `${JSON.stringify(existingSnapshot, null, 2)}\n`,
      "utf8"
    );

    mockBuildMissionControlSnapshot.mockRejectedValue(
      Object.assign(new Error("Launch Library temporarily rate limited"), { status: 429 })
    );

    const result = await buildSpaceXSnapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot).toEqual(existingSnapshot);
    await expect(readSnapshot(projectRoot)).resolves.toEqual(existingSnapshot);
  });
});
