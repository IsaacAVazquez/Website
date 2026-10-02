import React from "react";
import { act } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInterface } from "../SearchInterface";

const mockPush = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;
let syncUrlState = (_url: string) => {};

jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn() } }));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string, options: { scroll: boolean }) => {
      mockPush(url, options);
      syncUrlState(url);
    },
  }),
}));

function buildSearchResponse(query: string) {
  return Promise.resolve({
    ok: true,
    json: async () => ({
      results: query
        ? [
            {
              id: `${query}-result`,
              title: `${query} result`,
              excerpt: `${query} excerpt`,
              url: "/writing",
              type: "page",
              relevanceScore: 42,
            },
          ]
        : [],
      total: query ? 1 : 0,
      query,
      filters: {
        type: "all",
        category: "all",
      },
    }),
  });
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function SearchHarness() {
  const [, forceSync] = React.useReducer((count) => count + 1, 0);

  React.useEffect(() => {
    syncUrlState = (url: string) => {
      window.history.replaceState({}, "", url);
      forceSync();
    };

    return () => {
      syncUrlState = () => {};
    };
  }, []);

  const params = new URLSearchParams(window.location.search);

  return (
    <SearchInterface
      initialQuery={params.get("q") ?? ""}
      initialType={params.get("type") ?? "all"}
      initialCategory={params.get("category") ?? "all"}
    />
  );
}

describe("SearchInterface", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    mockFetch.mockReset();
    syncUrlState = () => {};
    global.fetch = mockFetch as unknown as typeof fetch;
    window.history.replaceState({}, "", "/search");
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      const query = url.searchParams.get("q") ?? "";

      return buildSearchResponse(query);
    });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("does not duplicate the initial fetch when hydrated state already matches the URL", async () => {
    window.history.replaceState(
      {},
      "",
      "/search?q=resume&type=page&category=Fantasy%20Football%20Analytics"
    );

    render(<SearchHarness />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain("q=resume");
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain("type=page");
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain(
      "category=Fantasy+Football+Analytics"
    );

    act(() => {
      jest.advanceTimersByTime(400);
    });
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
    // Target the heading specifically: the count is intentionally mirrored in a
    // visually-hidden aria-live region, so a plain getByText would match twice.
    expect(
      screen.getByRole("heading", { name: /1 result found/i })
    ).toBeVisible();
  });

  it("syncs debounced searches and filter changes into the URL, then clears back to /search", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchHarness />);

    const input = screen.getByRole("textbox", { name: /search content/i });
    await user.type(input, "fantasy");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    expect(mockPush).toHaveBeenLastCalledWith("/search?q=fantasy", {
      scroll: false,
    });

    await user.click(screen.getByRole("button", { name: /show filters/i }));
    await user.click(screen.getByRole("button", { name: /^projects$/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenLastCalledWith("/search?q=fantasy&type=project", {
        scroll: false,
      })
    );

    await user.click(screen.getByRole("button", { name: /fantasy football/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenLastCalledWith(
        "/search?q=fantasy&type=project&category=Fantasy+Football+Analytics",
        { scroll: false }
      )
    );

    await user.click(screen.getByRole("button", { name: /clear all filters/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenLastCalledWith("/search?q=fantasy", {
        scroll: false,
      })
    );

    const fetchCallsBeforeClear = mockFetch.mock.calls.length;

    await user.click(screen.getByRole("button", { name: /clear search/i }));

    expect(input).toHaveValue("");
    expect(screen.queryByText(/active filters:/i)).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenLastCalledWith("/search", {
      scroll: false,
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(fetchCallsBeforeClear);
    expect(screen.getByText(/search tips/i)).toBeVisible();
  });

  it("keeps the newer response when an older search finishes last", async () => {
    const requests: Array<(response: unknown) => void> = [];
    mockFetch.mockImplementation(() => new Promise((resolve) => requests.push(resolve)));
    window.history.replaceState({}, "", "/search?q=older");
    render(<SearchHarness />);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const olderSignal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    fireEvent.change(screen.getByRole("textbox", { name: /search content/i }), { target: { value: "newer" } });
    expect(olderSignal.aborted).toBe(true);
    act(() => jest.advanceTimersByTime(300));
    await flushPromises();
    expect(requests).toHaveLength(2);
    await act(async () => requests[1](await buildSearchResponse("newer")));
    await act(async () => requests[0](await buildSearchResponse("older")));
    expect(screen.getByRole("link", { name: "newer result" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "older result" })).not.toBeInTheDocument();
  });

  it("clears and cancels a pending search without restoring its results", async () => {
    let finish!: (response: unknown) => void;
    mockFetch.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    window.history.replaceState({}, "", "/search?q=pending");
    const { unmount } = render(<SearchHarness />);
    const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    await flushPromises();
    expect(signal.aborted).toBe(true);
    await act(async () => finish(await buildSearchResponse("pending")));
    expect(screen.queryByRole("link", { name: "pending result" })).not.toBeInTheDocument();
    expect(screen.getByText(/search tips/i)).toBeVisible();
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();
    unmount();
  });

  it("ignores an older rejection while a newer request is loading", async () => {
    let rejectOlder!: (error: Error) => void;
    let finishNewer!: (response: unknown) => void;
    mockFetch
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOlder = reject; }))
      .mockImplementationOnce(() => new Promise((resolve) => { finishNewer = resolve; }));
    window.history.replaceState({}, "", "/search?q=older");
    render(<SearchHarness />);
    fireEvent.change(screen.getByRole("textbox", { name: /search content/i }), { target: { value: "newer" } });
    act(() => jest.advanceTimersByTime(300));
    await flushPromises();
    await act(async () => rejectOlder(new Error("Old failure")));
    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
    await act(async () => finishNewer(await buildSearchResponse("newer")));
    expect(screen.getByRole("link", { name: "newer result" })).toBeVisible();
  });

  it("aborts a pending request when unmounted", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    window.history.replaceState({}, "", "/search?q=pending");
    const { unmount } = render(<SearchHarness />);
    const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("does not consume a failed HTTP response as search results", async () => {
    const json = jest.fn().mockResolvedValue({ results: [] });
    mockFetch.mockResolvedValue({ ok: false, status: 503, json });
    window.history.replaceState({}, "", "/search?q=unavailable");
    render(<SearchHarness />);
    await flushPromises();
    expect(json).not.toHaveBeenCalled();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("routes the Writing content-type filter to type=post (matching the API taxonomy)", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchHarness />);

    const input = screen.getByRole("textbox", { name: /search content/i });
    await user.type(input, "ai");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /show filters/i }));
    await user.click(screen.getByRole("button", { name: /^writing$/i }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenLastCalledWith("/search?q=ai&type=post", {
        scroll: false,
      })
    );
  });
});
