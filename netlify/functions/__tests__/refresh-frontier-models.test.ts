/**
 * @jest-environment node
 */
jest.mock("../../../src/lib/frontierModelsLive", () => ({
  FRONTIER_MODELS_BLOB_KEY: "frontier-models",
  fetchLiveModelFacts: jest.fn(),
  applyLiveModelFacts: jest.fn(),
}));

jest.mock("../../../src/lib/snapshotBlobStore", () => ({
  writeSnapshotBlob: jest.fn(),
}));

import {
  applyLiveModelFacts,
  fetchLiveModelFacts,
} from "../../../src/lib/frontierModelsLive";
import { writeSnapshotBlob } from "../../../src/lib/snapshotBlobStore";
import handler, { config } from "../refresh-frontier-models";

const mockFetchFacts = fetchLiveModelFacts as jest.Mock;
const mockApply = applyLiveModelFacts as jest.Mock;
const mockWrite = writeSnapshotBlob as jest.Mock;

const refreshedSnapshot = {
  models: [{ id: "m" }],
  liveFacts: {
    checkedAt: "2026-07-20T07:30:00.000Z",
    sources: ["models.dev", "openrouter"],
    updated: 1,
    confirmed: 2,
    curatedOnly: 3,
  },
};

describe("refresh-frontier-models scheduled function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFacts.mockResolvedValue({ fetchedAt: "now", byProvider: {} });
    mockApply.mockReturnValue(refreshedSnapshot);
    mockWrite.mockResolvedValue(undefined);
  });

  it("runs on a daily schedule", () => {
    expect(config.schedule).toBe("30 7 * * *");
  });

  it("writes the refreshed snapshot to the blob store", async () => {
    const response = await handler();
    const body = await response.json();

    expect(mockWrite).toHaveBeenCalledWith(
      "frontier-models",
      refreshedSnapshot
    );
    expect(body.ok).toBe(true);
    expect(body.liveFacts.updated).toBe(1);
  });

  it("does not write when the upstream fetch fails", async () => {
    mockFetchFacts.mockRejectedValue(new Error("degraded catalog"));

    await expect(handler()).rejects.toThrow("degraded catalog");
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("propagates write failures so the run shows as failed", async () => {
    mockWrite.mockRejectedValue(new Error("store down"));

    await expect(handler()).rejects.toThrow("store down");
  });
});
