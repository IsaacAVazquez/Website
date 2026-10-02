/**
 * @jest-environment node
 */
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import {
  buildFormula1Snapshot,
  isWithinLiveSessionWindow,
  main,
} from "../buildFormula1Snapshot";
import { buildFormula1SnapshotData } from "../../src/lib/formula1Data";
import type {
  Formula1MeetingSummary,
  Formula1RaceResultEntry,
  Formula1Snapshot,
} from "../../src/types/formula1";

jest.mock("../../src/lib/formula1Data", () => ({
  buildFormula1SnapshotData: jest.fn(),
}));

const mockBuildFormula1SnapshotData = jest.mocked(buildFormula1SnapshotData);

async function makeProjectRoot(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "formula1-data-snapshot-"));
}

async function readSnapshot(projectRoot: string): Promise<Formula1Snapshot> {
  const snapshotPath = path.join(projectRoot, "src", "data", "formula1Snapshot.json");
  return JSON.parse(await fs.readFile(snapshotPath, "utf8")) as Formula1Snapshot;
}

async function writeExistingSnapshot(
  projectRoot: string,
  snapshot: Formula1Snapshot
): Promise<void> {
  await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, "src", "data", "formula1Snapshot.json"),
    JSON.stringify(snapshot, null, 2),
    "utf8"
  );
}

// Cut down from the snapshot committed on 2026-09-27.
const azerbaijanPodium: Formula1RaceResultEntry[] = [
  { position: 1, driverNumber: 63, driverName: "George RUSSELL", broadcastName: "G RUSSELL", acronym: "RUS", teamName: "Mercedes", teamColor: "#00D7B6", headshotUrl: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png", lapsCompleted: 51, points: 25, status: "classified", statusLabel: "Finished", gapToLeaderLabel: "Leader", durationLabel: "1:38:02.143" },
  { position: 2, driverNumber: 3, driverName: "Max VERSTAPPEN", broadcastName: "M VERSTAPPEN", acronym: "VER", teamName: "Red Bull Racing", teamColor: "#4781D7", headshotUrl: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png", lapsCompleted: 51, points: 18, status: "classified", statusLabel: "Finished", gapToLeaderLabel: "+0.196s", durationLabel: "1:38:02.339" },
  { position: 3, driverNumber: 6, driverName: "Isack HADJAR", broadcastName: "I HADJAR", acronym: "HAD", teamName: "Red Bull Racing", teamColor: "#4781D7", headshotUrl: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png", lapsCompleted: 51, points: 15, status: "classified", statusLabel: "Finished", gapToLeaderLabel: "+10.704s", durationLabel: "1:38:12.847" },
];

const azerbaijan: Formula1MeetingSummary = {
  key: "1295",
  name: "Azerbaijan Grand Prix",
  officialName: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2026",
  location: "Baku",
  countryName: "Azerbaijan",
  countryCode: "AZE",
  countryFlag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/azerbaijan-flag.png",
  circuitKey: "144",
  circuitShortName: "Baku",
  circuitType: "Temporary - Street",
  circuitImage: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Azerbaijan%20carbon.png",
  gmtOffset: "04:00:00",
  startAt: "2026-09-24T08:30:00+00:00",
  endAt: "2026-09-26T13:00:00+00:00",
  status: "completed",
  hasSprint: false,
  raceSessionKey: "11377",
  raceStartsAt: "2026-09-26T11:00:00+00:00",
  sessions: [
    { key: "11373", name: "Qualifying", type: "Qualifying", startAt: "2026-09-25T12:00:00+00:00", endAt: "2026-09-25T13:00:00+00:00" },
    { key: "11377", name: "Race", type: "Race", startAt: "2026-09-26T11:00:00+00:00", endAt: "2026-09-26T13:00:00+00:00" },
  ],
  classification: azerbaijanPodium,
  podium: azerbaijanPodium,
  resultPublished: true,
};

const publishedSnapshot: Formula1Snapshot = {
  sourceLabel: "OpenF1 historical snapshot",
  sourceUrls: {
    docs: "https://openf1.org/docs/",
    apiBase: "https://openf1.org/",
    meetings: "https://api.openf1.org/v1/meetings?year=2026",
    sessions: "https://api.openf1.org/v1/sessions?year=2026",
    drivers: "https://api.openf1.org/v1/drivers?session_key=11377",
    driverStandings: "https://api.openf1.org/v1/championship_drivers?session_key=11377",
    constructorStandings: "https://api.openf1.org/v1/championship_teams?session_key=11377",
  },
  season: 2026,
  generatedAt: "2026-09-27T16:54:03.162Z",
  defaultMeetingKey: "1295",
  standingsMeetingKey: "1295",
  meetings: [azerbaijan],
  driverStandings: [
    { position: 1, previousPosition: 1, driverNumber: 12, driverName: "Kimi ANTONELLI", broadcastName: "K ANTONELLI", acronym: "ANT", teamName: "Mercedes", teamColor: "#00D7B6", headshotUrl: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png", points: 302, pointsBeforeRace: 292, pointsDelta: 10 },
  ],
  constructorStandings: [
    { position: 1, previousPosition: 1, teamName: "Mercedes", teamColor: "#00D7B6", points: 538, pointsBeforeRace: 503, pointsDelta: 35 },
  ],
  seasonMetrics: { season: 2026, totalRaces: 1, completedRaces: 1, upcomingRaces: 0, sprintWeekends: 0 },
  nextMeeting: null,
  lastCompletedMeeting: azerbaijan,
};

// The shape the builder throws when OpenF1 answers with a status it will not retry.
function refusal(status: number): Error {
  return Object.assign(new Error(`Formula 1 data request failed with status ${status}.`), {
    status,
  });
}

// Run 36238279292 started at this time, sixteen minutes into the Azerbaijan race.
const duringTheRace = new Date("2026-09-26T11:15:56.000Z");
const dayAfterTheRace = new Date("2026-09-27T19:00:00.000Z");

describe("isWithinLiveSessionWindow", () => {
  it.each([
    ["46 minutes before the race starts", "2026-09-26T10:14:00.000Z", false],
    ["44 minutes before the race starts", "2026-09-26T10:16:00.000Z", true],
    ["sixteen minutes into the race", "2026-09-26T11:15:56.000Z", true],
    ["44 minutes after the race ends", "2026-09-26T13:44:00.000Z", true],
    ["46 minutes after the race ends", "2026-09-26T13:46:00.000Z", false],
  ])("%s", (_label, iso, expected) => {
    expect(isWithinLiveSessionWindow(publishedSnapshot, new Date(iso))).toBe(expected);
  });

  it("is false when there is no snapshot to read sessions from", () => {
    expect(isWithinLiveSessionWindow(null, duringTheRace)).toBe(false);
  });
});

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
    expect(result.snapshotPath).toBe(path.join(projectRoot, "src", "data", "formula1Snapshot.json"));
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
      path.join(projectRoot, "src", "data", "formula1Snapshot.json"),
      JSON.stringify(existingSnapshot, null, 2),
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

  // On January 1 the build resolves the new season as soon as OpenF1 lists one
  // meeting for it, but no race has run, so standings come back empty. The
  // meetings check cannot see that, and the completed season's final tables
  // would be overwritten by empty ones for roughly two months.
  it("keeps the completed season when a rollover build returns no standings", async () => {
    const projectRoot = await makeProjectRoot();

    const meeting = {
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
      status: "completed" as const,
      hasSprint: false,
      raceSessionKey: "11253",
      raceStartsAt: "2026-03-29T05:00:00+00:00",
      sessions: [],
      classification: [],
      podium: [],
      resultPublished: false,
    };

    const completedSeason: Formula1Snapshot = {
      sourceLabel: "OpenF1 historical snapshot",
      sourceUrls: {
        docs: "https://openf1.org/docs/",
        apiBase: "https://openf1.org/",
        meetings: "https://api.openf1.org/v1/meetings?year=2026",
        sessions: "https://api.openf1.org/v1/sessions?year=2026",
        drivers: "https://api.openf1.org/v1/drivers?session_key=11253",
        driverStandings:
          "https://api.openf1.org/v1/championship_drivers?session_key=11253",
        constructorStandings:
          "https://api.openf1.org/v1/championship_teams?session_key=11253",
      },
      season: 2026,
      generatedAt: "2026-12-20T00:00:00.000Z",
      defaultMeetingKey: "1281",
      standingsMeetingKey: "1281",
      meetings: [meeting],
      driverStandings: [
        {
          position: 1,
          previousPosition: 1,
          driverNumber: 1,
          driverName: "A Driver",
          broadcastName: null,
          acronym: null,
          teamName: "A Team",
          teamColor: null,
          headshotUrl: null,
          points: 400,
          pointsBeforeRace: 375,
          pointsDelta: 25,
        },
      ],
      constructorStandings: [
        {
          position: 1,
          previousPosition: 1,
          teamName: "A Team",
          teamColor: null,
          points: 700,
          pointsBeforeRace: 660,
          pointsDelta: 40,
        },
      ],
      seasonMetrics: {
        season: 2026,
        totalRaces: 24,
        completedRaces: 24,
        upcomingRaces: 0,
        sprintWeekends: 6,
      },
      nextMeeting: null,
      lastCompletedMeeting: meeting,
    };

    await fs.mkdir(path.join(projectRoot, "src", "data"), { recursive: true });
    await fs.writeFile(
      path.join(projectRoot, "src", "data", "formula1Snapshot.json"),
      JSON.stringify(completedSeason, null, 2),
      "utf8"
    );

    // A healthy January build: the new season's calendar is published, but no
    // race has run, so both standings arrays are empty.
    mockBuildFormula1SnapshotData.mockResolvedValue({
      ...completedSeason,
      season: 2027,
      generatedAt: "2027-01-01T06:00:00.000Z",
      standingsMeetingKey: null,
      meetings: [{ ...meeting, key: "1300", status: "upcoming" as const }],
      driverStandings: [],
      constructorStandings: [],
      lastCompletedMeeting: null,
    });

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot).toEqual(completedSeason);
    expect(result.snapshot.season).toBe(2026);
    expect(result.snapshot.driverStandings).toHaveLength(1);
    await expect(readSnapshot(projectRoot)).resolves.toEqual(completedSeason);
  });

  it("takes the new season over once its first race produces standings", async () => {
    const projectRoot = await makeProjectRoot();

    const meeting = {
      key: "1300",
      name: "Australian Grand Prix",
      officialName: "FORMULA 1 AUSTRALIAN GRAND PRIX 2027",
      location: "Melbourne",
      countryName: "Australia",
      countryCode: "AUS",
      countryFlag: null,
      circuitKey: "10",
      circuitShortName: "Melbourne",
      circuitType: "Street",
      circuitImage: null,
      gmtOffset: "11:00:00",
      startAt: "2027-03-05T01:30:00+00:00",
      endAt: "2027-03-07T06:00:00+00:00",
      status: "completed" as const,
      hasSprint: false,
      raceSessionKey: "12000",
      raceStartsAt: "2027-03-07T04:00:00+00:00",
      sessions: [],
      classification: [],
      podium: [],
      resultPublished: true,
    };

    const newSeason: Formula1Snapshot = {
      sourceLabel: "OpenF1 historical snapshot",
      sourceUrls: {
        docs: "https://openf1.org/docs/",
        apiBase: "https://openf1.org/",
        meetings: "https://api.openf1.org/v1/meetings?year=2027",
        sessions: "https://api.openf1.org/v1/sessions?year=2027",
        drivers: "https://api.openf1.org/v1/drivers?session_key=12000",
        driverStandings:
          "https://api.openf1.org/v1/championship_drivers?session_key=12000",
        constructorStandings:
          "https://api.openf1.org/v1/championship_teams?session_key=12000",
      },
      season: 2027,
      generatedAt: "2027-03-07T22:00:00.000Z",
      defaultMeetingKey: "1300",
      standingsMeetingKey: "1300",
      meetings: [meeting],
      driverStandings: [
        {
          position: 1,
          previousPosition: null,
          driverNumber: 4,
          driverName: "B Driver",
          broadcastName: null,
          acronym: null,
          teamName: "B Team",
          teamColor: null,
          headshotUrl: null,
          points: 25,
          pointsBeforeRace: 0,
          pointsDelta: 25,
        },
      ],
      constructorStandings: [
        {
          position: 1,
          previousPosition: null,
          teamName: "B Team",
          teamColor: null,
          points: 25,
          pointsBeforeRace: 0,
          pointsDelta: 25,
        },
      ],
      seasonMetrics: {
        season: 2027,
        totalRaces: 24,
        completedRaces: 1,
        upcomingRaces: 23,
        sprintWeekends: 6,
      },
      nextMeeting: null,
      lastCompletedMeeting: meeting,
    };

    mockBuildFormula1SnapshotData.mockResolvedValue(newSeason);

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot.season).toBe(2027);
    await expect(readSnapshot(projectRoot)).resolves.toEqual(newSeason);
  });

  it("logs the status and message of the error that failed the refresh", async () => {
    const projectRoot = await makeProjectRoot();
    await writeExistingSnapshot(projectRoot, publishedSnapshot);
    mockBuildFormula1SnapshotData.mockRejectedValue(refusal(503));
    const logger = { log: jest.fn(), error: jest.fn() };

    const result = await buildFormula1Snapshot({ projectRoot, logger, now: dayAfterTheRace });

    expect(result.snapshot).toEqual(publishedSnapshot);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("status 503"));
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("Formula 1 data request failed with status 503.")
    );
  });

  it.each([401, 403])(
    "reports a live lock when OpenF1 answers %i during a session",
    async (status) => {
      const projectRoot = await makeProjectRoot();
      await writeExistingSnapshot(projectRoot, publishedSnapshot);
      mockBuildFormula1SnapshotData.mockRejectedValue(refusal(status));
      const logger = { log: jest.fn(), error: jest.fn() };

      const result = await buildFormula1Snapshot({ projectRoot, logger, now: duringTheRace });

      expect(result.liveLock).toBe(true);
      expect(result.snapshot).toEqual(publishedSnapshot);
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringContaining("locked for a live session")
      );
      await expect(readSnapshot(projectRoot)).resolves.toEqual(publishedSnapshot);
    }
  );

  it("treats a 401 outside any session window as a plain failure", async () => {
    const projectRoot = await makeProjectRoot();
    await writeExistingSnapshot(projectRoot, publishedSnapshot);
    mockBuildFormula1SnapshotData.mockRejectedValue(refusal(401));
    const logger = { log: jest.fn(), error: jest.fn() };

    const result = await buildFormula1Snapshot({ projectRoot, logger, now: dayAfterTheRace });

    expect(result.liveLock).toBeFalsy();
    expect(result.snapshot).toEqual(publishedSnapshot);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("status 401"));
    expect(logger.log).not.toHaveBeenCalledWith(
      expect.stringContaining("locked for a live session")
    );
  });

  it("does not call a server error during a session a live lock", async () => {
    const projectRoot = await makeProjectRoot();
    await writeExistingSnapshot(projectRoot, publishedSnapshot);
    mockBuildFormula1SnapshotData.mockRejectedValue(refusal(503));

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
      now: duringTheRace,
    });

    expect(result.liveLock).toBeFalsy();
  });

  it("keeps a published classification when the new build returns none for that round", async () => {
    const projectRoot = await makeProjectRoot();
    await writeExistingSnapshot(projectRoot, publishedSnapshot);
    const blanked: Formula1MeetingSummary = {
      ...azerbaijan,
      classification: [],
      podium: [],
      resultPublished: false,
    };
    mockBuildFormula1SnapshotData.mockResolvedValue({
      ...publishedSnapshot,
      generatedAt: "2026-09-27T19:54:03.162Z",
      meetings: [blanked],
      lastCompletedMeeting: blanked,
    });
    const logger = { log: jest.fn(), error: jest.fn() };

    const result = await buildFormula1Snapshot({ projectRoot, logger });

    expect(result.snapshot.generatedAt).toBe("2026-09-27T19:54:03.162Z");
    expect(result.snapshot.meetings).toEqual([azerbaijan]);
    expect(result.snapshot.lastCompletedMeeting).toEqual(azerbaijan);
    await expect(readSnapshot(projectRoot)).resolves.toEqual(result.snapshot);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining("Azerbaijan Grand Prix"));
  });

  it("takes the new classification when the build returns one", async () => {
    const projectRoot = await makeProjectRoot();
    await writeExistingSnapshot(projectRoot, publishedSnapshot);
    const reclassified: Formula1MeetingSummary = {
      ...azerbaijan,
      classification: azerbaijanPodium.slice(1),
      podium: azerbaijanPodium.slice(1),
    };
    mockBuildFormula1SnapshotData.mockResolvedValue({
      ...publishedSnapshot,
      meetings: [reclassified],
      lastCompletedMeeting: reclassified,
    });

    const result = await buildFormula1Snapshot({
      projectRoot,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    expect(result.snapshot.meetings).toEqual([reclassified]);
  });

  describe("main", () => {
    const originalOutput = process.env.GITHUB_OUTPUT;

    afterEach(() => {
      if (originalOutput === undefined) {
        delete process.env.GITHUB_OUTPUT;
      } else {
        process.env.GITHUB_OUTPUT = originalOutput;
      }
    });

    async function runMainAt(now: Date): Promise<string> {
      const projectRoot = await makeProjectRoot();
      await writeExistingSnapshot(projectRoot, publishedSnapshot);
      const outputPath = path.join(projectRoot, "github-output");
      await fs.writeFile(outputPath, "", "utf8");
      process.env.GITHUB_OUTPUT = outputPath;
      mockBuildFormula1SnapshotData.mockRejectedValue(refusal(401));

      await main({ projectRoot, logger: { log: jest.fn(), error: jest.fn() }, now });

      return fs.readFile(outputPath, "utf8");
    }

    it("writes live_lock=true to GITHUB_OUTPUT when OpenF1 is locked", async () => {
      await expect(runMainAt(duringTheRace)).resolves.toBe("live_lock=true\n");
    });

    it("writes nothing to GITHUB_OUTPUT for a plain failure", async () => {
      await expect(runMainAt(dayAfterTheRace)).resolves.toBe("");
    });
  });
});
