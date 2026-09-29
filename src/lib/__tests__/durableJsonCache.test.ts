/**
 * @jest-environment node
 */
jest.mock("@netlify/blobs", () => ({
  getStore: jest.fn(),
}));

import { getStore } from "@netlify/blobs";
import { readDurableJson, writeDurableJson } from "@/lib/durableJsonCache";

const mockGetStore = getStore as jest.Mock;

const originalNetlify = process.env.NETLIFY;
const originalContext = process.env.NETLIFY_BLOBS_CONTEXT;

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.useRealTimers();
  if (originalNetlify === undefined) delete process.env.NETLIFY;
  else process.env.NETLIFY = originalNetlify;
  if (originalContext === undefined) delete process.env.NETLIFY_BLOBS_CONTEXT;
  else process.env.NETLIFY_BLOBS_CONTEXT = originalContext;
});

describe("durableJsonCache without a blobs context", () => {
  beforeEach(() => {
    delete process.env.NETLIFY;
    delete process.env.NETLIFY_BLOBS_CONTEXT;
  });

  it("is a safe no-op in local and test runtimes", async () => {
    await expect(readDurableJson("test/key", 1_000)).resolves.toBeNull();
    await expect(
      writeDurableJson("test/key", { ok: true })
    ).resolves.toBeUndefined();
    expect(mockGetStore).not.toHaveBeenCalled();
  });

  it("makes no store call when only the build-time NETLIFY flag is set", async () => {
    process.env.NETLIFY = "true";

    await expect(readDurableJson("test/key", 1_000)).resolves.toBeNull();
    await expect(
      writeDurableJson("test/key", { ok: true })
    ).resolves.toBeUndefined();
    expect(mockGetStore).not.toHaveBeenCalled();
  });
});

describe("durableJsonCache with a blobs context", () => {
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

    await expect(readDurableJson("test/key", 60_000)).resolves.toEqual({
      ok: true,
    });
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
