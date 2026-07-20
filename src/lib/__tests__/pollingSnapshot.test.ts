/**
 * @jest-environment node
 */
jest.mock("@/lib/snapshotBlobStore", () => ({
  readSnapshotBlob: jest.fn(),
}));

import { pollingSnapshot } from "@/data/pollingSnapshot";
import {
  getPollingSnapshot,
  resetPollingCacheForTests,
} from "@/lib/pollingSnapshot";
import { readSnapshotBlob } from "@/lib/snapshotBlobStore";
import type { PollingSnapshot } from "@/types/polling";

const mockRead = readSnapshotBlob as jest.MockedFunction<
  typeof readSnapshotBlob
>;

function blobSnapshot(): PollingSnapshot {
  return {
    ...pollingSnapshot,
    generatedAt: "2026-07-20T12:45:00.000Z",
    sourceAsOf: "2026-07-19",
  };
}

describe("getPollingSnapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPollingCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("serves the blob-backed snapshot when the scheduled refresh has written one", async () => {
    const fromBlob = blobSnapshot();
    mockRead.mockResolvedValue({
      value: fromBlob,
      savedAt: fromBlob.generatedAt,
    });

    const snapshot = await getPollingSnapshot();

    expect(snapshot.generatedAt).toBe("2026-07-20T12:45:00.000Z");
    expect(mockRead).toHaveBeenCalledWith("polling", 36 * 60 * 60 * 1000);
  });

  it("falls back to the committed seed when no blob exists", async () => {
    mockRead.mockResolvedValue(null);

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it("refuses a blob with empty poll tables", async () => {
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), approvalPolls: [] },
      savedAt: "2026-07-20T12:45:00.000Z",
    });

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it("falls back to the committed seed when the blob read rejects", async () => {
    mockRead.mockRejectedValue(new Error("store down"));

    await expect(getPollingSnapshot()).resolves.toBe(pollingSnapshot);
  });

  it("caches the result for the TTL, then re-reads", async () => {
    jest.useFakeTimers();
    mockRead.mockResolvedValue(null);

    await getPollingSnapshot();
    await getPollingSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
    await getPollingSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(2);
  });
});
