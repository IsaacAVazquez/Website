/**
 * @jest-environment node
 */
jest.mock("@netlify/functions", () => ({
  purgeCache: jest.fn(),
}));

import { purgeCache } from "@netlify/functions";
import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { handler } from "../purge-cache";

const originalEnv = { ...process.env };
const mockPurgeCache = purgeCache as jest.Mock;

function makeEvent(
  headers: Record<string, string> = {},
  queryStringParameters: Record<string, string> | null = null
) {
  return {
    headers,
    queryStringParameters,
  } as unknown as HandlerEvent;
}

async function callHandler(event: ReturnType<typeof makeEvent>) {
  return await handler(event, {} as HandlerContext, jest.fn());
}

describe("purge-cache function auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mockPurgeCache.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("accepts Authorization bearer credentials", async () => {
    const response = await callHandler(
      makeEvent({ authorization: "Bearer test-cron-secret" })
    );

    expect(response.statusCode).toBe(200);
    expect(mockPurgeCache).toHaveBeenCalledTimes(1);
  });

  it("accepts x-cron-secret credentials", async () => {
    const response = await callHandler(
      makeEvent({ "x-cron-secret": "test-cron-secret" })
    );

    expect(response.statusCode).toBe(200);
    expect(mockPurgeCache).toHaveBeenCalledTimes(1);
  });

  it("rejects query-string secrets", async () => {
    const response = await callHandler(
      makeEvent({}, { secret: "test-cron-secret" })
    );

    expect(response.statusCode).toBe(401);
    expect(mockPurgeCache).not.toHaveBeenCalled();
  });

  it("returns a generic error when purge fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockPurgeCache.mockRejectedValueOnce(new Error("provider internals"));

    const response = await callHandler(
      makeEvent({ authorization: "Bearer test-cron-secret" })
    );
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.error).toBe("Durable Cache purge failed");
    expect(body.error).not.toContain("provider internals");

    consoleSpy.mockRestore();
  });
});
