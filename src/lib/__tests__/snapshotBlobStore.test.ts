/**
 * @jest-environment node
 */
jest.mock("@netlify/blobs", () => ({
  getStore: jest.fn(),
}));

import { getStore } from "@netlify/blobs";
import {
  readSnapshotBlob,
  writeSnapshotBlob,
} from "@/lib/snapshotBlobStore";

const mockGetStore = getStore as jest.Mock;

function withNetlifyRuntime() {
  process.env.NETLIFY = "true";
}

const originalNetlify = process.env.NETLIFY;
const originalLocal = process.env.NETLIFY_LOCAL;

afterEach(() => {
  jest.clearAllMocks();
  if (originalNetlify === undefined) delete process.env.NETLIFY;
  else process.env.NETLIFY = originalNetlify;
  if (originalLocal === undefined) delete process.env.NETLIFY_LOCAL;
  else process.env.NETLIFY_LOCAL = originalLocal;
});

describe("snapshotBlobStore outside Netlify", () => {
  beforeEach(() => {
    delete process.env.NETLIFY;
    delete process.env.NETLIFY_LOCAL;
  });

  it("reads null so callers fall back to the committed seed", async () => {
    await expect(readSnapshotBlob("frontier-models", 1_000)).resolves.toBeNull();
    expect(mockGetStore).not.toHaveBeenCalled();
  });

  it("throws on write so refresh functions cannot silently no-op", async () => {
    await expect(
      writeSnapshotBlob("frontier-models", { ok: true })
    ).rejects.toThrow(/Netlify runtime/);
  });
});

describe("snapshotBlobStore on Netlify", () => {
  beforeEach(withNetlifyRuntime);

  it("returns the envelope value and savedAt within max age", async () => {
    const savedAt = new Date().toISOString();
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({ savedAt, value: { models: [1] } }),
    });

    const read = await readSnapshotBlob<{ models: number[] }>(
      "frontier-models",
      60_000
    );

    expect(read).toEqual({ value: { models: [1] }, savedAt });
    expect(mockGetStore).toHaveBeenCalledWith({
      name: "dashboard-snapshots",
      consistency: "strong",
    });
  });

  it("treats an over-age envelope as missing", async () => {
    const savedAt = new Date(Date.now() - 10 * 60_000).toISOString();
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({ savedAt, value: { models: [1] } }),
    });

    await expect(
      readSnapshotBlob("frontier-models", 60_000)
    ).resolves.toBeNull();
  });

  it("swallows read errors", async () => {
    mockGetStore.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error("store down")),
    });

    await expect(
      readSnapshotBlob("frontier-models", 60_000)
    ).resolves.toBeNull();
  });

  it("writes an envelope and propagates write failures", async () => {
    const setJSON = jest.fn().mockResolvedValue(undefined);
    mockGetStore.mockReturnValue({ setJSON });

    await writeSnapshotBlob("frontier-models", { models: [1] });
    expect(setJSON).toHaveBeenCalledWith(
      "frontier-models",
      expect.objectContaining({
        savedAt: expect.any(String),
        value: { models: [1] },
      })
    );

    setJSON.mockRejectedValueOnce(new Error("write refused"));
    await expect(
      writeSnapshotBlob("frontier-models", { models: [2] })
    ).rejects.toThrow("write refused");
  });
});
