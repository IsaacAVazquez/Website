/**
 * @jest-environment node
 */
const mockBuildMlbSnapshot = jest.fn();
const mockBuildNbaSnapshot = jest.fn();
const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockRenameSync = jest.fn();

jest.mock("node:fs", () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  renameSync: (...args: unknown[]) => mockRenameSync(...args),
}));
jest.mock("../../src/lib/mlbData", () => ({
  buildMlbSnapshot: (...args: unknown[]) => mockBuildMlbSnapshot(...args),
}));
jest.mock("../../src/lib/nbaData", () => ({
  buildNbaSnapshot: (...args: unknown[]) => mockBuildNbaSnapshot(...args),
  preservePriorFixtures: (snapshot: unknown) => snapshot,
}));

const lanes = [
  {
    script: "updateMlbSnapshot",
    build: mockBuildMlbSnapshot,
    committed: { standings: [{ teamId: 1 }] },
    built: {
      teams: [],
      standings: [{ teamId: 1 }],
      recentGames: [],
      upcomingGames: [],
      teamSnapshots: {},
    },
  },
  {
    script: "updateNbaSnapshot",
    build: mockBuildNbaSnapshot,
    committed: { teamsByConference: { east: [{ id: "bos" }], west: [] } },
    built: {
      teamsByConference: { east: [{ id: "bos" }], west: [] },
      scorers: [],
      recentFixtures: [],
      upcomingFixtures: [],
      teamSnapshots: {},
    },
  },
];

describe.each(lanes)("$script", ({ script, build, committed, built }) => {
  const exitCodeBefore = process.exitCode;

  // The script runs main() on import and exports nothing to await.
  async function runScript() {
    jest.resetModules();
    await import(`../${script}`);
    await new Promise((resolve) => setImmediate(resolve));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockReadFileSync.mockReturnValue(`${JSON.stringify(committed)}\n`);
  });

  afterEach(() => {
    process.exitCode = exitCodeBefore;
    jest.restoreAllMocks();
  });

  it("fails the run and keeps the committed snapshot when the build throws", async () => {
    build.mockRejectedValue(new Error("upstream is down"));

    await runScript();

    expect(process.exitCode).toBe(1);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  it("writes the snapshot and leaves the exit code alone when the build succeeds", async () => {
    build.mockResolvedValue(built);

    await runScript();

    expect(process.exitCode).toBe(exitCodeBefore);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockRenameSync).toHaveBeenCalledTimes(1);
  });
});

export {};
