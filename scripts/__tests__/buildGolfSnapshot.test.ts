/** @jest-environment node */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { golfSnapshot } from "../../src/data/golfSnapshot";
import { GolfNoLiveEventError, buildGolfSnapshotData } from "../../src/lib/golfData";
import type { GolfSnapshot, GolfTournament } from "../../src/types/golf";
import { buildGolfSnapshot } from "../buildGolfSnapshot";
import { readGeneratedSnapshot } from "../snapshotFallback";

jest.mock("../../src/lib/golfData", () => ({
  ...jest.requireActual("../../src/lib/golfData"),
  buildGolfSnapshotData: jest.fn(),
}));

const now = new Date("2026-10-02T12:00:00.000Z");
const oldTimestamp = "2026-09-28T16:00:00.000Z";
const directories: string[] = [];

async function writePriorBoard(overrides: Partial<GolfTournament>): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "golf-snapshot-"));
  directories.push(directory);
  const outPath = path.join(directory, "golfSnapshot.json");
  const prior: GolfSnapshot = {
    ...golfSnapshot,
    summary: {
      ...golfSnapshot.summary,
      tournament: {
        ...golfSnapshot.summary.tournament!,
        endDate: "2026-09-28",
        status: "Final",
        generatedAt: oldTimestamp,
        ...overrides,
      },
    },
  };
  await fs.writeFile(outPath, JSON.stringify(prior, null, 2) + "\n");
  return outPath;
}

describe("golf off-week verification", () => {
  beforeEach(() => {
    jest.mocked(buildGolfSnapshotData).mockRejectedValue(
      new GolfNoLiveEventError("Next tournament", "2026-10-08")
    );
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await Promise.all(directories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
  });

  it.each([
    { status: "Round 4 - In Progress" },
    { status: "Round 4 Complete" },
    { status: "Final", completed: false },
    { status: "Final", completed: true, endDate: "2026-10-08" },
    { status: "Final", completed: true, endDate: "2026-08-01" },
  ])("preserves the timestamp when completion or age is unverified (%j)", async (overrides) => {
    const outPath = await writePriorBoard(overrides);
    const before = await fs.readFile(outPath, "utf8");

    await buildGolfSnapshot(outPath, now);

    expect(await fs.readFile(outPath, "utf8")).toBe(before);
  });

  it.each([
    { status: "Tournament ended", completed: true },
    { status: "Final", completed: undefined },
  ])("re-verifies a recent final board without changing its scores (%j)", async (overrides) => {
    const outPath = await writePriorBoard(overrides);
    const prior = readGeneratedSnapshot<GolfSnapshot>(outPath)!;

    await buildGolfSnapshot(outPath, now);

    const next = readGeneratedSnapshot<GolfSnapshot>(outPath)!;
    expect(next.summary.tournament?.generatedAt).toBe(now.toISOString());
    expect(next.summary.leaderboard).toEqual(prior.summary.leaderboard);
    expect(next.playerSnapshots).toEqual(prior.playerSnapshots);
  });

  it("keeps a final board's timestamp on an actual fetch failure", async () => {
    jest.mocked(buildGolfSnapshotData).mockRejectedValue(new Error("Provider unavailable"));
    const outPath = await writePriorBoard({ completed: true });
    const before = await fs.readFile(outPath, "utf8");

    await buildGolfSnapshot(outPath, now);

    expect(await fs.readFile(outPath, "utf8")).toBe(before);
  });
});
