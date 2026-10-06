import { act, fireEvent, render, screen } from "@testing-library/react";
import { HeaderSearchPanel } from "../HeaderSearchPanel";

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockRouterPush }) }));
jest.mock("@/lib/analytics", () => ({ trackNavigationClick: jest.fn() }));

const originalFetch = global.fetch;
const mockFetch = jest.fn();

function response(title: string) {
  return {
    ok: true,
    json: async () => ({
      results: [{ id: title, title, excerpt: title, url: "/writing", type: "post" }],
      total: 1,
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
    expect(screen.queryByRole("link", { name: /Older result/ })).not.toBeInTheDocument();
    expect(screen.getByText("Searching…")).toBeVisible();
    await act(async () => requests[1](response("Newer result")));
    expect(screen.getByRole("link", { name: /Newer result/ })).toBeVisible();
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
    expect(screen.getByRole("link", { name: /Newer result/ })).toBeVisible();
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
    expect(screen.queryByRole("link", { name: /Stale result/ })).not.toBeInTheDocument();
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
    const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
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

    fireEvent.click(screen.getByRole("link", { name: /New tab result/ }), { [modifier]: true });

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
