/**
 * @jest-environment node
 */
jest.mock("../../../src/lib/pollingData", () => ({
  POLLING_BLOB_KEY: "polling",
  buildPollingSnapshotData: jest.fn(),
}));

jest.mock("../../../src/lib/snapshotBlobStore", () => ({
  writeSnapshotBlob: jest.fn(),
}));

import { buildPollingSnapshotData } from "../../../src/lib/pollingData";
import { writeSnapshotBlob } from "../../../src/lib/snapshotBlobStore";
import handler, { config } from "../refresh-polling";

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
  });

  it("runs every six hours", () => {
    expect(config.schedule).toBe("45 */6 * * *");
  });

  it("writes the refreshed snapshot to the blob store", async () => {
    const response = await handler();
    const body = await response.json();

    expect(mockWrite).toHaveBeenCalledWith("polling", snapshot);
    expect(body).toEqual({
      ok: true,
      generatedAt: "2026-07-20T12:45:00.000Z",
      sourceAsOf: "2026-07-19",
    });
  });

  it("does not write when the VoteHub fetch fails its quality gate", async () => {
    mockBuild.mockRejectedValue(new Error("too little usable data"));

    await expect(handler()).rejects.toThrow("too little usable data");
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("still writes when the source has published nothing new for months", async () => {
    const quietSource = { ...snapshot, sourceAsOf: "2026-04-01" };
    mockBuild.mockResolvedValue(quietSource);

    const response = await handler();
    const body = await response.json();

    expect(mockWrite).toHaveBeenCalledWith("polling", quietSource);
    expect(body.ok).toBe(true);
  });

  it("propagates write failures so the run shows as failed", async () => {
    mockWrite.mockRejectedValue(new Error("store down"));

    await expect(handler()).rejects.toThrow("store down");
  });
});
