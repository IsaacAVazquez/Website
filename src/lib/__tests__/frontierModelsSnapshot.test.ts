/**
 * @jest-environment node
 */
jest.mock("@/lib/netlifyBlobs", () => ({
  readSnapshotBlob: jest.fn(),
}));

import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { applyLiveModelFacts } from "@/lib/frontierModelsLive";
import {
  getFrontierModelsSnapshot,
  resetFrontierModelsCacheForTests,
} from "@/lib/frontierModelsSnapshot";
import { readSnapshotBlob } from "@/lib/netlifyBlobs";
import type { FrontierModelsSnapshot } from "@/types/frontierModels";

const mockRead = readSnapshotBlob as jest.MockedFunction<
  typeof readSnapshotBlob
>;

// The seed is regenerated on every curation pass, so every time here hangs
// off its own stamp.
const SEED_TIME = Date.parse(frontierModelsSnapshot.generatedAt);
const AFTER_SEED = new Date(SEED_TIME + 60 * 60 * 1000).toISOString();
const BEFORE_SEED = new Date(SEED_TIME - 60 * 60 * 1000).toISOString();

function blobSnapshot(): FrontierModelsSnapshot {
  return {
    ...frontierModelsSnapshot,
    generatedAt: AFTER_SEED,
    liveFacts: {
      checkedAt: AFTER_SEED,
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
    jest.restoreAllMocks();
  });

  it("serves the blob-backed snapshot when the daily refresh has written one", async () => {
    mockRead.mockResolvedValue({ value: blobSnapshot(), savedAt: AFTER_SEED });

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot.liveFacts?.updated).toBe(2);
    expect(mockRead).toHaveBeenCalledWith(
      "frontier-models",
      3 * 24 * 60 * 60 * 1000
    );
  });

  it("serves what the fact check writes", async () => {
    const written = applyLiveModelFacts(frontierModelsSnapshot, {
      fetchedAt: AFTER_SEED,
      byProvider: {},
    });
    mockRead.mockResolvedValue({ value: written, savedAt: AFTER_SEED });

    await expect(getFrontierModelsSnapshot()).resolves.toBe(written);
  });

  it("falls back to the committed seed when no blob exists", async () => {
    mockRead.mockResolvedValue(null);

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot).toBe(frontierModelsSnapshot);
  });

  it("refuses a blob saved before the deployed seed was generated, without logging", async () => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({ value: blobSnapshot(), savedAt: BEFORE_SEED });

    await expect(getFrontierModelsSnapshot()).resolves.toBe(
      frontierModelsSnapshot
    );
    expect(logged).not.toHaveBeenCalled();
  });

  it("refuses a blob with no models", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), models: [] },
      savedAt: AFTER_SEED,
    });

    const snapshot = await getFrontierModelsSnapshot();

    expect(snapshot).toBe(frontierModelsSnapshot);
  });

  it.each([
    ["no provider summary", { providers: undefined }],
    ["a fact check stamp without its sources", { liveFacts: { checkedAt: AFTER_SEED } }],
    [
      "models without an output limit",
      {
        models: frontierModelsSnapshot.models.map(
          ({ maxOutputTokens: _maxOutputTokens, ...model }) => model
        ),
      },
    ],
    [
      "models whose price is missing instead of null",
      {
        models: frontierModelsSnapshot.models.map(
          ({ inputPricePerMTokens: _inputPrice, ...model }) => model
        ),
      },
    ],
    [
      "models without modalities",
      {
        models: frontierModelsSnapshot.models.map(
          ({ modalities: _modalities, ...model }) => model
        ),
      },
    ],
  ])("refuses and logs a blob with %s", async (_label, broken) => {
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockRead.mockResolvedValue({
      value: { ...blobSnapshot(), ...broken } as unknown as FrontierModelsSnapshot,
      savedAt: AFTER_SEED,
    });

    await expect(getFrontierModelsSnapshot()).resolves.toBe(
      frontierModelsSnapshot
    );
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining("failed its shape check"),
      expect.anything()
    );
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
