/**
 * @jest-environment node
 */
jest.mock("@netlify/blobs", () => ({
  getStore: jest.fn(),
}));

import { getStore } from "@netlify/blobs";
import {
  readDurableJson,
  readSnapshotBlob,
  writeDurableJson,
  writeSnapshotBlob,
} from "@/lib/netlifyBlobs";

const mockGetStore = getStore as jest.Mock;

const originalNetlify = process.env.NETLIFY;
const originalContext = process.env.NETLIFY_BLOBS_CONTEXT;

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.useRealTimers();
  delete globalThis.netlifyBlobsContext;
  if (originalNetlify === undefined) delete process.env.NETLIFY;
  else process.env.NETLIFY = originalNetlify;
  if (originalContext === undefined) delete process.env.NETLIFY_BLOBS_CONTEXT;
  else process.env.NETLIFY_BLOBS_CONTEXT = originalContext;
});

describe("without a blobs context", () => {
  beforeEach(() => {
    delete process.env.NETLIFY;
    delete process.env.NETLIFY_BLOBS_CONTEXT;
  });

  it("reads null and no-ops durable writes in local and test runtimes", async () => {
    await expect(readDurableJson("test/key", 1_000)).resolves.toBeNull();
    await expect(writeDurableJson("test/key", { ok: true })).resolves.toBeUndefined();
    await expect(readSnapshotBlob("frontier-models", 1_000)).resolves.toBeNull();
    expect(mockGetStore).not.toHaveBeenCalled();
  });

  it("throws on a snapshot write so refresh functions cannot silently no-op", async () => {
    await expect(writeSnapshotBlob("frontier-models", { ok: true })).rejects.toThrow(
      /Netlify runtime/
    );
  });

  it("makes no store call when only the build-time NETLIFY flag is set", async () => {
    process.env.NETLIFY = "true";

    await expect(readDurableJson("test/key", 1_000)).resolves.toBeNull();
    await expect(writeDurableJson("test/key", { ok: true })).resolves.toBeUndefined();
    await expect(readSnapshotBlob("frontier-models", 1_000)).resolves.toBeNull();
    await expect(writeSnapshotBlob("frontier-models", { ok: true })).rejects.toThrow(
      /Netlify runtime/
    );
    expect(mockGetStore).not.toHaveBeenCalled();
  });
});

describe("runtime-last-good with a blobs context", () => {
  beforeEach(() => {
    delete process.env.NETLIFY;
    process.env.NETLIFY_BLOBS_CONTEXT = "context";
  });

  it("uses the store when NETLIFY is unset, which is the function runtime", async () => {
    const setJSON = jest.fn().mockResolvedValue(undefined);
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        savedAt: new Date().toISOString(),
        value: { ok: true },
      }),
      setJSON,
    });

    await expect(readDurableJson("test/key", 60_000)).resolves.toEqual({ ok: true });
    await writeDurableJson("test/key", { ok: true });

    expect(mockGetStore).toHaveBeenCalledWith({
      name: "runtime-last-good",
      consistency: "strong",
    });
    expect(setJSON).toHaveBeenCalledWith(
      "test/key",
      expect.objectContaining({ value: { ok: true } })
    );
  });

  it("treats a read that outlasts three seconds as a miss", async () => {
    jest.useFakeTimers();
    mockGetStore.mockReturnValue({
      get: jest.fn(() => new Promise(() => undefined)),
    });

    const read = readDurableJson("test/key", 60_000);
    await jest.advanceTimersByTimeAsync(3_000);

    await expect(read).resolves.toBeNull();
  });

  it("logs and drops a write that outlasts three seconds", async () => {
    jest.useFakeTimers();
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockGetStore.mockReturnValue({
      setJSON: jest.fn(() => new Promise(() => undefined)),
    });

    const write = writeDurableJson("test/key", { ok: true });
    await jest.advanceTimersByTimeAsync(3_000);

    await expect(write).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining("test/key"),
      expect.objectContaining({ message: expect.stringMatching(/3000 ms/) })
    );
  });
});

describe("dashboard-snapshots with a blobs context", () => {
  beforeEach(() => {
    delete process.env.NETLIFY;
    process.env.NETLIFY_BLOBS_CONTEXT = "context";
  });

  it("uses the store when NETLIFY is unset, which is the function runtime", async () => {
    const savedAt = new Date().toISOString();
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({ savedAt, value: { models: [1] } }),
    });

    const read = await readSnapshotBlob<{ models: number[] }>("frontier-models", 60_000);

    expect(read).toEqual({ value: { models: [1] }, savedAt });
    expect(mockGetStore).toHaveBeenCalledWith({
      name: "dashboard-snapshots",
      consistency: "strong",
    });
  });

  it("uses the store when the context arrives as the global", async () => {
    delete process.env.NETLIFY_BLOBS_CONTEXT;
    globalThis.netlifyBlobsContext = "context";
    const savedAt = new Date().toISOString();
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({ savedAt, value: { models: [1] } }),
    });

    await expect(readSnapshotBlob("frontier-models", 60_000)).resolves.toEqual({
      value: { models: [1] },
      savedAt,
    });
  });

  it("treats an over-age envelope as missing", async () => {
    const savedAt = new Date(Date.now() - 10 * 60_000).toISOString();
    mockGetStore.mockReturnValue({
      get: jest.fn().mockResolvedValue({ savedAt, value: { models: [1] } }),
    });

    await expect(readSnapshotBlob("frontier-models", 60_000)).resolves.toBeNull();
  });

  it("swallows read errors", async () => {
    mockGetStore.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error("store down")),
    });

    await expect(readSnapshotBlob("frontier-models", 60_000)).resolves.toBeNull();
  });

  it("treats a read that outlasts three seconds as a miss", async () => {
    jest.useFakeTimers();
    mockGetStore.mockReturnValue({
      get: jest.fn(() => new Promise(() => undefined)),
    });

    const read = readSnapshotBlob("frontier-models", 60_000);
    await jest.advanceTimersByTimeAsync(3_000);

    await expect(read).resolves.toBeNull();
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
    await expect(writeSnapshotBlob("frontier-models", { models: [2] })).rejects.toThrow(
      "write refused"
    );
  });

  it("fails a write that outlasts three seconds", async () => {
    jest.useFakeTimers();
    mockGetStore.mockReturnValue({
      setJSON: jest.fn(() => new Promise(() => undefined)),
    });

    const write = expect(writeSnapshotBlob("frontier-models", { models: [1] })).rejects.toThrow(
      /3000 ms/
    );
    await jest.advanceTimersByTimeAsync(3_000);

    await write;
  });
});
