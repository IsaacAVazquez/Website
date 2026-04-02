import React from "react";
import { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInterface } from "../SearchInterface";

const mockPush = jest.fn();
const mockFetch = jest.fn();
const originalFetch = global.fetch;
let syncUrlState = (_url: string) => {};

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
    jest.runOnlyPendingTimers();
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
    expect(screen.getByText(/1 result found/i)).toBeVisible();
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
});
