import { renderHook, waitFor } from "@testing-library/react";
import { useCachedSnapshot } from "../useCachedSnapshot";

type Snapshot = { name: string };

function respond(status: number, body: unknown) {
  return Promise.resolve({ ok: status < 400, json: () => Promise.resolve(body) } as Response);
}

describe("useCachedSnapshot", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("serves the seeded snapshot, fetches a new id once, and keeps both", async () => {
    fetchMock.mockReturnValueOnce(respond(200, { name: "Celtics" }));
    const { result, rerender } = renderHook(
      ({ id }) =>
        useCachedSnapshot<Snapshot>("/api/nba/teams", id, { id: "lal", snapshot: { name: "Lakers" } }, "Unable"),
      { initialProps: { id: "lal" } }
    );

    expect(result.current.snapshot).toEqual({ name: "Lakers" });
    expect(fetchMock).not.toHaveBeenCalled();

    rerender({ id: "bos" });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.snapshot).toEqual({ name: "Celtics" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/nba/teams/bos", expect.anything());

    rerender({ id: "lal" });
    rerender({ id: "bos" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports the API's error, or the fallback when it gives none", async () => {
    fetchMock.mockReturnValueOnce(respond(404, { error: "Unknown team." }));
    const { result } = renderHook(() =>
      useCachedSnapshot<Snapshot>("/api/nba/teams", "zzz", { id: null, snapshot: null }, "Unable")
    );
    await waitFor(() => expect(result.current.error).toBe("Unknown team."));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.snapshot).toBeNull();
  });
});
