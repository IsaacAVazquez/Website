import { act, fireEvent, render, screen } from "@testing-library/react";
import { HeaderSearchPanel } from "../HeaderSearchPanel";

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockRouterPush }) }));
const mockTrackNavigationClick = jest.fn();
jest.mock("@/lib/analytics", () => ({
  trackNavigationClick: (...args: unknown[]) => mockTrackNavigationClick(...args),
}));

const originalFetch = global.fetch;
const mockFetch = jest.fn();

function response(...titles: string[]) {
  return {
    ok: true,
    json: async () => ({
      results: titles.map((title) => ({ id: title, title, excerpt: title, url: "/writing", type: "post" })),
      total: titles.length,
    }),
  };
}

function changeQuery(value: string) {
  fireEvent.change(screen.getByRole("combobox"), { target: { value } });
  act(() => jest.advanceTimersByTime(220));
}

describe("HeaderSearchPanel request lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockReset();
    mockRouterPush.mockReset();
    mockTrackNavigationClick.mockReset();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it("ignores an older response and its loading completion while a newer request waits", async () => {
    const requests: Array<(value: unknown) => void> = [];
    mockFetch.mockImplementation(() => new Promise((resolve) => requests.push(resolve)));
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("older");
    const olderSignal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    changeQuery("newer");
    expect(olderSignal.aborted).toBe(true);
    await act(async () => requests[0](response("Older result")));
    expect(screen.queryByRole("option", { name: /Older result/ })).not.toBeInTheDocument();
    expect(screen.getByText("Searching…")).toBeVisible();
    await act(async () => requests[1](response("Newer result")));
    expect(screen.getByRole("option", { name: /Newer result/ })).toBeVisible();
  });

  it("ignores a stale rejection after newer results have loaded", async () => {
    let rejectOlder!: (error: Error) => void;
    mockFetch
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectOlder = reject; }))
      .mockResolvedValueOnce(response("Newer result"));
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("older");
    changeQuery("newer");
    await act(async () => { await Promise.resolve(); });
    await act(async () => rejectOlder(new Error("Old network failure")));
    expect(screen.getByRole("option", { name: /Newer result/ })).toBeVisible();
  });

  it("cancels on clear immediately and does not restore stale results", async () => {
    let finish!: (value: unknown) => void;
    mockFetch.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("pending");
    const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(signal.aborted).toBe(true);
    await act(async () => finish(response("Stale result")));
    expect(screen.queryByRole("option", { name: /Stale result/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Press Esc to close/)).toBeVisible();
    expect(screen.queryByText("Searching…")).not.toBeInTheDocument();
  });

  it("aborts on unmount and rejects failed HTTP response bodies", async () => {
    const json = jest.fn().mockResolvedValue({ results: [] });
    mockFetch.mockResolvedValue({ ok: false, status: 503, json });
    const { unmount } = render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("failed");
    await act(async () => { await Promise.resolve(); });
    expect(json).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Search isn't answering right now, so try again in a moment.");
    const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("says so in the status region, which is there before any message, when nothing matches", async () => {
    mockFetch.mockResolvedValue(response());
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    changeQuery("zzz");
    expect(status).toHaveTextContent("Searching…");
    await act(async () => { await Promise.resolve(); });
    expect(status).toHaveTextContent("No results for “zzz”.");
  });

  it("moves Up from nothing selected to the last result, then on up the list", async () => {
    mockFetch.mockResolvedValue(response("First", "Second", "Third"));
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("three");
    await act(async () => { await Promise.resolve(); });

    const input = screen.getByRole("combobox");
    const options = screen.getAllByRole("option");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", options[2].id);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", options[2].id);
  });

  it("keeps keyboard focus inside search and closes with Escape from the close button", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const onClose = jest.fn();
    const { unmount } = render(<HeaderSearchPanel onClose={onClose} />);
    const input = screen.getByRole("combobox");
    const close = screen.getByRole("button", { name: "Close search" });

    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(input).toHaveFocus();

    close.focus();
    fireEvent.keyDown(close, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it.each(["ctrlKey", "metaKey"])("preserves native result navigation with %s", async (modifier) => {
    mockFetch.mockResolvedValue(response("New tab result"));
    const onClose = jest.fn();
    render(<HeaderSearchPanel onClose={onClose} />);
    changeQuery("new tab");
    await act(async () => { await Promise.resolve(); });
    // jsdom cannot open a tab and logs an error when a modified click reaches
    // the anchor, so the click's default is cancelled before it gets there.
    document.addEventListener("click", (event) => event.preventDefault(), { capture: true, once: true });

    fireEvent.click(screen.getByRole("option", { name: /New tab result/ }), { [modifier]: true });

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("makes each result one control that stays out of the Tab order", async () => {
    mockFetch.mockResolvedValue(response("Only result"));
    render(<HeaderSearchPanel onClose={jest.fn()} />);
    changeQuery("only");
    await act(async () => { await Promise.resolve(); });

    const option = screen.getByRole("option", { name: /Only result/ });
    expect(option.tagName).toBe("A");
    expect(option).toHaveAttribute("tabindex", "-1");
    expect(option.querySelector("a, button")).toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", option.id);
    expect(option).toHaveAttribute("aria-selected", "true");
  });

  it("sends the View all click to analytics without the typed query", async () => {
    mockFetch.mockResolvedValue(response("Only result"));
    const onClose = jest.fn();
    render(<HeaderSearchPanel onClose={onClose} />);
    changeQuery("my private query");
    await act(async () => { await Promise.resolve(); });

    fireEvent.click(screen.getByRole("button", { name: /View all results/ }));

    expect(mockRouterPush).toHaveBeenCalledWith("/search?q=my%20private%20query");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockTrackNavigationClick).toHaveBeenCalledWith({
      link_text: "View all results",
      link_url: "/search",
      nav_location: "header_search_view_all",
    });
  });
});
