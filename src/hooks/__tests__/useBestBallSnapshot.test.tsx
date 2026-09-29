import fs from "fs";
import { renderHook, waitFor } from "@testing-library/react";
import { useBestBallSnapshot } from "../useBestBallSnapshot";

const published = JSON.parse(fs.readFileSync("public/data/fantasy/best-ball.json", "utf8"));

describe("useBestBallSnapshot", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // The best ball file is rebuilt on its own schedule, so the redraft revision
  // says nothing about it, and force-cache never asks how old a stored copy is.
  it("requests the file with no version and leaves caching to the response headers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => published,
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useBestBallSnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.snapshot?.generatedAt).toBe(published.generatedAt);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/data/fantasy/best-ball.json");
    expect(init).not.toHaveProperty("cache");
  });
});
