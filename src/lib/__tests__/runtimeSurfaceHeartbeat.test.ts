import { readDurableJson, writeDurableJson } from "@/lib/durableJsonCache";
import {
  readRuntimeSurfaceHeartbeat,
  recordRuntimeSurfaceHeartbeat,
} from "@/lib/runtimeSurfaceHeartbeat";

jest.mock("@/lib/durableJsonCache", () => ({
  readDurableJson: jest.fn(),
  writeDurableJson: jest.fn(),
}));

const mockRead = readDurableJson as jest.Mock;
const mockWrite = writeDurableJson as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("runtimeSurfaceHeartbeat", () => {
  it("writes a heartbeat under a fixed per-surface key", async () => {
    const heartbeat = {
      fetchedAt: "2026-07-20T00:00:00.000Z",
      status: "fresh" as const,
    };
    await recordRuntimeSurfaceHeartbeat("news-pulse", heartbeat);

    expect(mockWrite).toHaveBeenCalledWith("heartbeat/news-pulse", heartbeat);
  });

  it("never overwrites the last known-good heartbeat with an unavailable one", async () => {
    await recordRuntimeSurfaceHeartbeat("mba-jobs", {
      fetchedAt: "2026-07-20T00:00:00.000Z",
      status: "unavailable",
    });

    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("reads the heartbeat for a surface by its fixed key", async () => {
    mockRead.mockResolvedValue({ fetchedAt: "2026-07-20", status: "degraded" });

    const heartbeat = await readRuntimeSurfaceHeartbeat("mba-jobs");

    expect(mockRead).toHaveBeenCalledWith(
      "heartbeat/mba-jobs",
      expect.any(Number)
    );
    expect(heartbeat).toEqual({ fetchedAt: "2026-07-20", status: "degraded" });
  });
});
