/**
 * @jest-environment node
 */
jest.mock("@netlify/functions", () => ({
  purgeCache: jest.fn(),
}));

jest.mock("../../../src/lib/frontierModelsLive", () => ({
  FRONTIER_MODELS_BLOB_KEY: "frontier-models",
  fetchLiveModelFacts: jest.fn(),
  applyLiveModelFacts: jest.fn(),
}));

jest.mock("../../../src/lib/snapshotBlobStore", () => ({
  writeSnapshotBlob: jest.fn(),
}));

import { purgeCache } from "@netlify/functions";
import {
  applyLiveModelFacts,
  fetchLiveModelFacts,
} from "../../../src/lib/frontierModelsLive";
import { writeSnapshotBlob } from "../../../src/lib/snapshotBlobStore";
import handler, { config } from "../refresh-frontier-models";

const mockPurge = purgeCache as jest.Mock;
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
    mockPurge.mockResolvedValue(undefined);
  });

  it("runs on a daily schedule", () => {
    expect(config.schedule).toBe("30 7 * * *");
  });

  it("writes the refreshed snapshot to the blob store, then purges the tag", async () => {
    const response = await handler();
    const body = await response.json();

    expect(mockWrite).toHaveBeenCalledWith(
      "frontier-models",
      refreshedSnapshot
    );
    expect(mockPurge).toHaveBeenCalledWith({ tags: ["frontier-models"] });
    expect(body.ok).toBe(true);
    expect(body.liveFacts.updated).toBe(1);
  });

  it("does not write when the upstream fetch fails", async () => {
    mockFetchFacts.mockRejectedValue(new Error("degraded catalog"));

    await expect(handler()).rejects.toThrow("degraded catalog");
    expect(mockWrite).not.toHaveBeenCalled();
    expect(mockPurge).not.toHaveBeenCalled();
  });

  it("propagates write failures so the run shows as failed", async () => {
    mockWrite.mockRejectedValue(new Error("store down"));

    await expect(handler()).rejects.toThrow("store down");
    expect(mockPurge).not.toHaveBeenCalled();
  });

  it("still succeeds when only the purge fails", async () => {
    mockPurge.mockRejectedValue(new Error("purge api down"));

    const response = await handler();
    const body = await response.json();

    expect(body.ok).toBe(true);
    expect(mockWrite).toHaveBeenCalled();
  });
});
