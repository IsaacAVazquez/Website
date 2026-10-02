/**
 * @jest-environment node
 */
jest.mock("@/lib/netlifyBlobs", () => ({
  readSnapshotBlob: jest.fn(),
}));

import { pollingSnapshot } from "@/data/pollingSnapshot";
import { buildPollingSnapshotData } from "@/lib/pollingData";
import {
  getPollingSnapshot,
  resetPollingCacheForTests,
} from "@/lib/pollingSnapshot";
import { readSnapshotBlob } from "@/lib/netlifyBlobs";
import type { PollingSnapshot } from "@/types/polling";
import {
  votehubApprovalPolls,
  votehubGenericBallotPolls,
} from "./fixtures/votehubPolls.fixture";

const mockRead = readSnapshotBlob as jest.MockedFunction<
  typeof readSnapshotBlob
>;

// The seed is regenerated daily, so every time here hangs off its own stamp.
const SEED_TIME = Date.parse(pollingSnapshot.generatedAt);
const AFTER_SEED = new Date(SEED_TIME + 60 * 60 * 1000).toISOString();
const BEFORE_SEED = new Date(SEED_TIME - 60 * 60 * 1000).toISOString();

function blobSnapshot(): PollingSnapshot {
  return { ...pollingSnapshot, generatedAt: AFTER_SEED };
}

describe("getPollingSnapshot", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetPollingCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("serves the blob-backed snapshot when the scheduled refresh has written one", async () => {
    mockRead.mockResolvedValue({ value: blobSnapshot(), savedAt: AFTER_SEED });

    const snapshot = await getPollingSnapshot();

    expect(snapshot.generatedAt).toBe(AFTER_SEED);
    expect(mockRead).toHaveBeenCalledWith("polling", 36 * 60 * 60 * 1000);
  });

  it("falls back to the committed seed when no blob exists", async () => {
    mockRead.mockResolvedValue(null);

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it("refuses a blob saved before the deployed seed was generated, without logging", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({ value: blobSnapshot(), savedAt: BEFORE_SEED });

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
    expect(logged).not.toHaveBeenCalled();
  });

  it("refuses a blob with empty poll tables", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), approvalPolls: [] },
      savedAt: AFTER_SEED,
    });

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it.each([
    ["no approval average", { approvalAvg: undefined }],
    ["a generic ballot average without a margin", { genericBallotAvg: { dem: 44, rep: 41 } }],
    ["no approval trend", { approvalTrend: undefined }],
    ["no race arrays", { senateRaces: undefined }],
    [
      "poll rows without a sample size",
      {
        genericBallotPolls: pollingSnapshot.genericBallotPolls.map(
          ({ sampleSize: _sampleSize, ...poll }) => poll
        ),
      },
    ],
    [
      "poll rows under another schema's field names",
      {
        approvalPolls: pollingSnapshot.approvalPolls.map(
          ({ approve, disapprove: _disapprove, ...poll }) => ({
            ...poll,
            yes: approve,
          })
        ),
      },
    ],
  ])("refuses and logs a blob with %s", async (_label, broken) => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), ...broken } as unknown as PollingSnapshot,
      savedAt: AFTER_SEED,
    });

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining("failed its shape check"),
      expect.anything()
    );
  });

  it("serves a blob whose newest poll is months old, since that is the source's state", async () => {
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), sourceAsOf: "2026-06-01" },
      savedAt: AFTER_SEED,
    });

    const snapshot = await getPollingSnapshot();

    expect(snapshot.generatedAt).toBe(AFTER_SEED);
    expect(snapshot.sourceAsOf).toBe("2026-06-01");
  });

  it("serves what the builder writes from real VoteHub rows", async () => {
    jest.spyOn(global, "fetch").mockImplementation(async (input) =>
      Response.json(
        String(input).includes("poll_type=approval")
          ? votehubApprovalPolls
          : votehubGenericBallotPolls
      )
    );
    const built = await buildPollingSnapshotData();
    jest.restoreAllMocks();
    mockRead.mockResolvedValue({ value: built, savedAt: AFTER_SEED });

    await expect(getPollingSnapshot()).resolves.toBe(built);
  });

  it("falls back to the committed seed when the blob read rejects", async () => {
    mockRead.mockRejectedValue(new Error("store down"));

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it("caches the result for the TTL, then re-reads", async () => {
    mockRead.mockResolvedValue(null);

    await getPollingSnapshot();
    await getPollingSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
    await getPollingSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(2);
  });
});
