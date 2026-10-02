/**
 * @jest-environment node
 */
const mockBuildNflSnapshot = jest.fn();
const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockRenameSync = jest.fn();

jest.mock("node:fs", () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  renameSync: (...args: unknown[]) => mockRenameSync(...args),
}));
jest.mock("../../src/lib/nflData", () => ({
  buildNflSnapshot: (...args: unknown[]) => mockBuildNflSnapshot(...args),
}));

const committed = { updatedAt: "2026-09-22", teams: [{ id: "kc" }] };
const committedFile = `export const nflSnapshot: NFLSnapshot = ${JSON.stringify(committed)};\n`;

// The script runs main() on import and exports nothing to await.
async function runScript() {
  jest.resetModules();
  await import("../updateNflSnapshot");
  await new Promise((resolve) => setImmediate(resolve));
}

describe("updateNflSnapshot", () => {
  const exitCodeBefore = process.exitCode;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    mockReadFileSync.mockReturnValue(committedFile);
  });

  afterEach(() => {
    process.exitCode = exitCodeBefore;
    jest.restoreAllMocks();
  });

  it("fails the run and keeps the committed snapshot when the build throws", async () => {
    mockBuildNflSnapshot.mockRejectedValue(new Error("upstream is down"));

    await runScript();

    expect(process.exitCode).toBe(1);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockRenameSync).not.toHaveBeenCalled();
  });

  it("fails the run and keeps the committed snapshot when the build has no teams", async () => {
    mockBuildNflSnapshot.mockResolvedValue({ updatedAt: "2026-09-27", teams: [] });

    await runScript();

    expect(process.exitCode).toBe(1);
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it("writes the snapshot and leaves the exit code alone when the build succeeds", async () => {
    mockBuildNflSnapshot.mockResolvedValue({
      season: "2026",
      week: 2,
      updatedAt: "2026-09-27",
      teams: [{ id: "kc" }],
      recentFixtures: [],
      upcomingFixtures: [],
      leaders: { passing: [] },
      teamSnapshots: {},
    });

    await runScript();

    expect(process.exitCode).toBe(exitCodeBefore);
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    expect(mockRenameSync).toHaveBeenCalledTimes(1);
  });
});
