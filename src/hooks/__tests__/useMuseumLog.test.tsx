import { act, renderHook, waitFor } from "@testing-library/react";
import type { UserMuseumState, UserVisit } from "@/types/museum";
import { useMuseumLog } from "../useMuseumLog";

const STORAGE_KEY = "museum_log_user_state_v1";

function readStored(): UserMuseumState {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as UserMuseumState;
}

describe("useMuseumLog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hydrates to an empty state and flips the hydrated flag", async () => {
    const { result } = renderHook(() => useMuseumLog());

    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.state.visited).toEqual([]);
    expect(result.current.state.watchlist).toEqual([]);
    expect(result.current.state.liked).toEqual([]);
  });

  it("toggles watchlist and liked, persisting each change", async () => {
    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.toggleWatchlist("met");
    });
    expect(result.current.isWatchlisted("met")).toBe(true);
    expect(result.current.state.watchlist).toEqual(["met"]);
    expect(readStored().watchlist).toEqual(["met"]);

    act(() => {
      result.current.toggleLiked("moma");
    });
    expect(result.current.isLiked("moma")).toBe(true);
    expect(readStored().liked).toEqual(["moma"]);

    // Toggling again removes them.
    act(() => {
      result.current.toggleWatchlist("met");
      result.current.toggleLiked("moma");
    });
    expect(result.current.isWatchlisted("met")).toBe(false);
    expect(result.current.isLiked("moma")).toBe(false);
    expect(readStored().watchlist).toEqual([]);
    expect(readStored().liked).toEqual([]);
  });

  it("logs a visit, clears the matching watchlist intent, and persists", async () => {
    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.toggleWatchlist("met");
    });
    expect(result.current.isWatchlisted("met")).toBe(true);

    const visit: UserVisit = {
      museumId: "met",
      date: "2026-06-01",
      rating: 4.5,
      note: "Egyptian wing",
    };

    act(() => {
      result.current.logVisit(visit);
    });

    expect(result.current.findVisit("met")).toEqual(visit);
    // Logging a visit removes it from the watchlist.
    expect(result.current.isWatchlisted("met")).toBe(false);
    expect(readStored().visited).toHaveLength(1);
    expect(readStored().visited[0].museumId).toBe("met");
  });

  it("keeps visits sorted by date descending and de-duplicates by museum", async () => {
    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.logVisit({ museumId: "met", date: "2026-01-01", rating: 4 });
      result.current.logVisit({ museumId: "moma", date: "2026-05-01", rating: 5 });
    });

    expect(result.current.state.visited.map((v) => v.museumId)).toEqual(["moma", "met"]);

    // Re-logging the same museum replaces the prior entry rather than duplicating it.
    act(() => {
      result.current.logVisit({ museumId: "met", date: "2026-06-15", rating: 3.5 });
    });

    expect(result.current.state.visited).toHaveLength(2);
    expect(result.current.findVisit("met")?.rating).toBe(3.5);
    expect(result.current.state.visited.map((v) => v.museumId)).toEqual(["met", "moma"]);
  });

  it("removes a visit and persists the change", async () => {
    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.logVisit({ museumId: "met", date: "2026-01-01", rating: 4 });
    });
    expect(result.current.state.visited).toHaveLength(1);

    act(() => {
      result.current.removeVisit("met");
    });

    expect(result.current.state.visited).toHaveLength(0);
    expect(result.current.findVisit("met")).toBeUndefined();
    expect(readStored().visited).toEqual([]);
  });

  it("hydrates from a pre-seeded localStorage value on mount", async () => {
    const seeded: UserMuseumState = {
      visited: [{ museumId: "tate", date: "2026-03-03", rating: 5 }],
      watchlist: ["guggenheim"],
      liked: ["tate"],
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.findVisit("tate")?.rating).toBe(5);
    expect(result.current.isWatchlisted("guggenheim")).toBe(true);
    expect(result.current.isLiked("tate")).toBe(true);
  });

  it("reset clears all state and persists the empty state", async () => {
    const { result } = renderHook(() => useMuseumLog());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.toggleLiked("met");
      result.current.logVisit({ museumId: "moma", date: "2026-02-02", rating: 4 });
    });
    expect(result.current.state.visited).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({ visited: [], watchlist: [], liked: [] });
    expect(readStored()).toEqual({ visited: [], watchlist: [], liked: [] });
  });
});
