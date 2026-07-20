/**
 * @jest-environment node
 */
jest.mock("@netlify/functions", () => ({
  purgeCache: jest.fn(),
}));

jest.mock("../../../src/lib/pollingData", () => ({
  POLLING_BLOB_KEY: "polling",
  buildPollingSnapshotData: jest.fn(),
}));

jest.mock("../../../src/lib/snapshotBlobStore", () => ({
  writeSnapshotBlob: jest.fn(),
}));

import { purgeCache } from "@netlify/functions";
import { buildPollingSnapshotData } from "../../../src/lib/pollingData";
import { writeSnapshotBlob } from "../../../src/lib/snapshotBlobStore";
import handler, { config } from "../refresh-polling";

const mockPurge = purgeCache as jest.Mock;
const mockBuild = buildPollingSnapshotData as jest.Mock;
const mockWrite = writeSnapshotBlob as jest.Mock;

const snapshot = {
  generatedAt: "2026-07-20T12:45:00.000Z",
  sourceAsOf: "2026-07-19",
  approvalPolls: [{ id: "a1" }],
  genericBallotPolls: [{ id: "g1" }],
};

describe("refresh-polling scheduled function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBuild.mockResolvedValue(snapshot);
    mockWrite.mockResolvedValue(undefined);
    mockPurge.mockResolvedValue(undefined);
  });

  it("runs every six hours", () => {
    expect(config.schedule).toBe("45 */6 * * *");
  });

  it("writes the refreshed snapshot to the blob store, then purges the tag", async () => {
    const response = await handler();
    const body = await response.json();

    expect(mockWrite).toHaveBeenCalledWith("polling", snapshot);
    expect(mockPurge).toHaveBeenCalledWith({ tags: ["polling"] });
    expect(body).toEqual({ ok: true, sourceAsOf: "2026-07-19" });
  });

  it("does not write when the VoteHub fetch fails its quality gate", async () => {
    mockBuild.mockRejectedValue(new Error("too little usable data"));

    await expect(handler()).rejects.toThrow("too little usable data");
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
