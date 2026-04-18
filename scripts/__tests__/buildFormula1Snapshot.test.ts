/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { buildFormula1Snapshot } from "../buildFormula1Snapshot";
import { buildFormula1SnapshotData } from "../../src/lib/formula1Data";
import type { Formula1Snapshot } from "../../src/types/formula1";

jest.mock("../../src/lib/formula1Data", () => ({
  buildFormula1SnapshotData: jest.fn(),
}));

const mockBuildFormula1SnapshotData = jest.mocked(buildFormula1SnapshotData);

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "formula1-data-snapshot-"));
}

async function readSnapshot(projectRoot: string): Promise<Formula1Snapshot> {
  const snapshotPath = path.join(projectRoot, "src", "data", "formula1Snapshot.ts");
  const rawSnapshot = await fs.readFile(snapshotPath, "utf8");
  const match = rawSnapshot.match(
    /export const formula1Snapshot: Formula1Snapshot = (\{[\s\S]*\});\s*$/
  );

  if (!match) {
    throw new Error("Formula 1 snapshot fixture could not be parsed.");
  }

  return JSON.parse(match[1]) as Formula1Snapshot;
}

describe("buildFormula1Snapshot", () => {
  afterEach(async () => {
    mockBuildFormula1SnapshotData.mockReset();

    const tempRootEntries = await fs.readdir(os.tmpdir());
    await Promise.all(
      tempRootEntries
        .filter((entry) => entry.startsWith("formula1-data-snapshot-"))
        .map((entry) => fs.rm(path.join(os.tmpdir(), entry), { recursive: true, force: true }))
    );
  });

  it("writes the generated Formula 1 snapshot to the repo data path", async () => {
    const projectRoot = await makeProjectRoot();
    const snapshot: Formula1Snapshot = {
      sourceLabel: "OpenF1 historical snapshot",
      sourceUrls: {
        docs: "https://openf1.org/docs/",
        apiBase: "https://openf1.org/",
        meetings: "https://api.openf1.org/v1/meetings?year=2026",
        sessions: "https://api.openf1.org/v1/sessions?year=2026",
        drivers: "https://api.openf1.org/v1/drivers?session_key=11261",
        driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11261",
        constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11261",
      },
      season: 2026,
      generatedAt: "2026-04-15T00:00:00.000Z",
      defaultMeetingKey: "1283",
      standingsMeetingKey: "1282",
      meetings: [],
      driverStandings: [],
      constructorStandings: [],
      seasonMetrics: {
        season: 2026,
        totalRaces: 24,
        completedRaces: 4,
        upcomingRaces: 20,
        sprintWeekends: 6,
      },
      nextMeeting: null,
      lastCompletedMeeting: null,
    };

    mockBuildFormula1SnapshotData.mockResolvedValue(snapshot);

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot).toEqual(snapshot);
    expect(result.snapshotPath).toBe(path.join(projectRoot, "src", "data", "formula1Snapshot.ts"));
    await expect(readSnapshot(projectRoot)).resolves.toEqual(snapshot);
  });

  it("keeps the existing snapshot when a refresh fails", async () => {
    const projectRoot = await makeProjectRoot();
    const existingSnapshot: Formula1Snapshot = {
      sourceLabel: "OpenF1 historical snapshot",
      sourceUrls: {
        docs: "https://openf1.org/docs/",
        apiBase: "https://openf1.org/",
        meetings: "https://api.openf1.org/v1/meetings?year=2026",
        sessions: "https://api.openf1.org/v1/sessions?year=2026",
        drivers: "https://api.openf1.org/v1/drivers?session_key=11253",
        driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11253",
        constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11253",
      },
      season: 2026,
      generatedAt: "2026-04-14T00:00:00.000Z",
      defaultMeetingKey: "1282",
      standingsMeetingKey: "1281",
      meetings: [
        {
          key: "1281",
          name: "Japanese Grand Prix",
          officialName: "FORMULA 1 JAPANESE GRAND PRIX 2026",
          location: "Suzuka",
          countryName: "Japan",
          countryCode: "JPN",
          countryFlag: null,
          circuitKey: "46",
          circuitShortName: "Suzuka",
          circuitType: "Permanent",
          circuitImage: null,
          gmtOffset: "09:00:00",
          startAt: "2026-03-27T02:30:00+00:00",
          endAt: "2026-03-29T07:00:00+00:00",
          status: "completed",
          hasSprint: false,
          raceSessionKey: "11253",
          raceStartsAt: "2026-03-29T05:00:00+00:00",
          sessions: [],
          classification: [],
          podium: [],
          resultPublished: false,
        },
      ],
      driverStandings: [],
      constructorStandings: [],
      seasonMetrics: {
        season: 2026,
        totalRaces: 1,
        completedRaces: 1,
        upcomingRaces: 0,
        sprintWeekends: 0,
      },
      nextMeeting: null,
      lastCompletedMeeting: {
        key: "1281",
        name: "Japanese Grand Prix",
        officialName: "FORMULA 1 JAPANESE GRAND PRIX 2026",
        location: "Suzuka",
        countryName: "Japan",
        countryCode: "JPN",
        countryFlag: null,
        circuitKey: "46",
        circuitShortName: "Suzuka",
        circuitType: "Permanent",
        circuitImage: null,
        gmtOffset: "09:00:00",
        startAt: "2026-03-27T02:30:00+00:00",
        endAt: "2026-03-29T07:00:00+00:00",
        status: "completed",
        hasSprint: false,
        raceSessionKey: "11253",
        raceStartsAt: "2026-03-29T05:00:00+00:00",
        sessions: [],
        classification: [],
        podium: [],
        resultPublished: false,
      },
    };

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "formula1Snapshot.ts"),
      `import type { Formula1Snapshot } from "@/types/formula1";

// Generated by scripts/buildFormula1Snapshot.ts.
export const formula1Snapshot: Formula1Snapshot = ${JSON.stringify(existingSnapshot, null, 2)};
`,
      "utf8"
    );

    mockBuildFormula1SnapshotData.mockRejectedValue(new Error("OpenF1 unavailable"));

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot).toEqual(existingSnapshot);
    await expect(readSnapshot(projectRoot)).resolves.toEqual(existingSnapshot);
  });
});
