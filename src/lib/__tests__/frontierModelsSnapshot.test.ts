/**
 * @jest-environment node
 */
jest.mock("@/lib/snapshotBlobStore", () => ({
  readSnapshotBlob: jest.fn(),
}));

import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import {
  getFrontierModelsSnapshot,
  resetFrontierModelsCacheForTests,
} from "@/lib/frontierModelsSnapshot";
import { readSnapshotBlob } from "@/lib/snapshotBlobStore";
import type { FrontierModelsSnapshot } from "@/types/frontierModels";

const mockRead = readSnapshotBlob as jest.MockedFunction<
  typeof readSnapshotBlob
>;

function blobSnapshot(): FrontierModelsSnapshot {
  return {
    ...frontierModelsSnapshot,
    generatedAt: "2026-07-20T07:30:00.000Z",
    liveFacts: {
      checkedAt: "2026-07-20T07:30:00.000Z",
      sources: ["models.dev", "openrouter"],
      updated: 2,
      confirmed: 10,
      curatedOnly: 1,
    },
  };
}

describe("getFrontierModelsSnapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetFrontierModelsCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("serves the blob-backed snapshot when the daily refresh has written one", async () => {
    const fromBlob = blobSnapshot();
    mockRead.mockResolvedValue({
      value: fromBlob,
      savedAt: fromBlob.generatedAt,
    });

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot.liveFacts?.updated).toBe(2);
    expect(mockRead).toHaveBeenCalledWith(
      "frontier-models",
      3 * 24 * 60 * 60 * 1000
    );
  });

  it("falls back to the committed seed when no blob exists", async () => {
    mockRead.mockResolvedValue(null);

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot).toBe(frontierModelsSnapshot);
  });

  it("refuses a blob with no models", async () => {
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), models: [] },
      savedAt: "2026-07-20T07:30:00.000Z",
    });

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot).toBe(frontierModelsSnapshot);
  });

  it("falls back to the committed seed when the blob read rejects", async () => {
    mockRead.mockRejectedValue(new Error("store down"));

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot).toBe(frontierModelsSnapshot);
  });

  it("caches the result for the TTL, then re-reads", async () => {
    jest.useFakeTimers();
    mockRead.mockResolvedValue(null);

    await getFrontierModelsSnapshot();
    await getFrontierModelsSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
    await getFrontierModelsSnapshot();
    expect(mockRead).toHaveBeenCalledTimes(2);
  });
});
