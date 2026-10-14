import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { AiDevToolsClient } from "../ai-dev-tools-client";

let currentSearchParams = new URLSearchParams();
// The page writes its state with the native history API, which the router
// syncs into useSearchParams. The spy calls through so jsdom's bar moves the
// way the page reads it, and the router mock is fed by hand where a test
// needs the router to have caught up.
const replaceBar = window.history.replaceState.bind(window.history);
const pushBar = window.history.pushState.bind(window.history);
let replaceState: jest.SpyInstance;
let pushState: jest.SpyInstance;
const lastHref = () => String(replaceState.mock.calls.at(-1)?.[2]);
const lastPushedHref = () => String(pushState.mock.calls.at(-1)?.[2]);

jest.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

/** Opens the page at this query, in the bar and in the router's copy of it. */
function visit(query = "") {
  currentSearchParams = new URLSearchParams(query);
  replaceBar(null, "", query ? `/ai-dev-tools?${query}` : "/ai-dev-tools");
}

/** Lets the search field's pause run, so the URL catches up. */
function settleUrl() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("AiDevToolsClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    visit();
    replaceState = jest.spyOn(window.history, "replaceState").mockImplementation(replaceBar);
    pushState = jest.spyOn(window.history, "pushState").mockImplementation(pushBar);
  });

  afterEach(() => {
    replaceState.mockRestore();
    pushState.mockRestore();
    jest.useRealTimers();
  });

  it("renders the directory and writes filters and search to the URL in place", () => {
    render(<AiDevToolsClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: /ai dev tool ecosystem/i })
    ).toBeVisible();
    expect(screen.getByText(/tools shown/i)).toBeVisible();

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "terminal-agent" },
    });

    expect(replaceState).toHaveBeenLastCalledWith(null, "", "/ai-dev-tools?category=terminal-agent");

    // The field keeps every keystroke and the URL follows after a pause, so
    // typing never loses characters and never writes the URL per key.
    const search = screen.getByLabelText("Search tools") as HTMLInputElement;
    for (const value of ["c", "co", "cod", "code", "codex"]) {
      fireEvent.change(search, { target: { value } });
    }
    expect(search.value).toBe("codex");
    expect(replaceState).toHaveBeenCalledTimes(1);
    settleUrl();
    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(lastHref()).toBe("/ai-dev-tools?category=terminal-agent&q=codex");
  });

  it("uses managed search params and resets them back to the default route", () => {
    visit("category=terminal-agent&pricing=subscription&tool=openai-codex");

    render(<AiDevToolsClient />);

    expect(screen.getByLabelText("Category")).toHaveValue("terminal-agent");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(lastHref()).toBe("/ai-dev-tools");
  });

  it("keeps the field empty after a reset instead of writing the old search back", () => {
    visit("q=codex");
    const ui = () => <AiDevToolsClient />;
    const view = render(ui());
    const search = screen.getByLabelText("Search tools") as HTMLInputElement;
    expect(search.value).toBe("codex");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(search.value).toBe("");
    expect(lastHref()).toBe("/ai-dev-tools");

    // The router lands on the default URL, and the pause that used to hold
    // "codex" runs out, and neither puts the old search back.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    settleUrl();
    expect(search.value).toBe("");
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(lastHref()).toBe("/ai-dev-tools");
  });

  it("keeps both the text and a filter picked while the search pause is running", () => {
    render(<AiDevToolsClient />);
    const search = screen.getByLabelText("Search tools") as HTMLInputElement;

    fireEvent.change(search, { target: { value: "cursor" } });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "terminal-agent" },
    });
    expect(lastHref()).toBe("/ai-dev-tools?category=terminal-agent&q=cursor");

    settleUrl();
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(lastHref()).toBe("/ai-dev-tools?category=terminal-agent&q=cursor");
    expect(search.value).toBe("cursor");
  });

  it("re-seeds the field only when back or forward moves the URL", () => {
    visit("q=codex");
    const ui = () => <AiDevToolsClient />;
    const view = render(ui());
    const search = screen.getByLabelText("Search tools") as HTMLInputElement;

    // The router reporting a different search is not a navigation.
    currentSearchParams = new URLSearchParams("q=cline");
    view.rerender(ui());
    expect(search.value).toBe("codex");

    replaceBar(null, "", "/ai-dev-tools?q=cline");
    fireEvent.popState(window);
    expect(search.value).toBe("cline");
    settleUrl();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("opens the directory as a list and switches to the category map", () => {
    render(<AiDevToolsClient />);

    // The map moved out of the hero on 2026-10-12 and became the directory's
    // second view, so the list prints first and the map waits for the switch.
    const views = screen.getByRole("group", { name: "Directory view" });
    expect(within(views).getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("table", { name: /by category and pricing model/i })).toBeNull();

    // The jest matchMedia mock reports a narrow window, so the map mounts as
    // the stacked list, and only that one layout mounts.
    fireEvent.click(within(views).getByRole("button", { name: "Map" }));
    expect(within(views).getByRole("button", { name: "Map" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("table", { name: /by category and pricing model/i })).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Cursor/ })).toHaveLength(1);
  });

  it("mounts the map's two-axis grid alone on a wide window", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...original(query),
      matches: query === "(min-width: 960px)",
    })) as typeof window.matchMedia;
    try {
      render(<AiDevToolsClient />);
      fireEvent.click(screen.getByRole("button", { name: "Map" }));
      expect(screen.getByRole("table", { name: /by category and pricing model/i })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Cursor/ })).toHaveLength(1);
    } finally {
      window.matchMedia = original;
    }
  });

  it("opens no drawer until a tool is picked, then names it in the URL", () => {
    render(<AiDevToolsClient />);

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /^Cursor/ })[0]);
    // The drawer is the one change that gets a history entry, so Back closes it.
    expect(lastPushedHref()).toBe("/ai-dev-tools?tool=cursor");

    // A plate on the map opens the same drawer.
    replaceBar(null, "", "/ai-dev-tools");
    pushState.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Map" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Cursor/ })[0]);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(lastPushedHref()).toBe("/ai-dev-tools?tool=cursor");
  });

  it("shows a deep-linked tool in a named drawer and clears it from the URL on close", () => {
    visit("q=Cursor&tool=cursor");
    render(<AiDevToolsClient />);

    const drawer = screen.getByRole("dialog", { name: "Cursor detail" });
    expect(within(drawer).getByRole("heading", { level: 2, name: "Cursor" })).toBeInTheDocument();
    expect(within(drawer).getByText("Sources")).toBeInTheDocument();
    expect(drawer).toHaveFocus();

    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));
    expect(lastHref()).toBe("/ai-dev-tools?q=Cursor");

    // Escape closes it the same way once the bar shows the tool again.
    visit("q=Cursor&tool=cursor");
    replaceState.mockClear();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(lastHref()).toBe("/ai-dev-tools?q=Cursor");
  });

  it("closes a deep-linked drawer once the URL no longer names the tool", () => {
    visit("tool=cursor");
    const ui = () => <AiDevToolsClient />;
    const view = render(ui());

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(lastHref()).toBe("/ai-dev-tools");

    // The router catches up with the cleared bar, and nothing else names the tool.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("goes back on close when the drawer was opened from the list", () => {
    const back = jest.spyOn(window.history, "back").mockImplementation(() => {});
    const ui = () => <AiDevToolsClient />;
    const view = render(ui());

    fireEvent.click(screen.getAllByRole("button", { name: /^Cursor/ })[0]);
    currentSearchParams = new URLSearchParams("tool=cursor");
    view.rerender(ui());

    // Back drops the entry the drawer pushed, where a replace would leave a
    // second copy of the list behind it.
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }));
    expect(back).toHaveBeenCalledTimes(1);
    expect(replaceState).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it("goes back once when the drawer is closed twice before the first close lands", () => {
    const back = jest.spyOn(window.history, "back").mockImplementation(() => {});
    const ui = () => <AiDevToolsClient />;
    const view = render(ui());

    fireEvent.click(screen.getAllByRole("button", { name: /^Cursor/ })[0]);
    currentSearchParams = new URLSearchParams("tool=cursor");
    view.rerender(ui());

    // The bar still shows the drawer's entry until the traversal lands, and a
    // second Back from there would leave the page.
    const close = within(screen.getByRole("dialog")).getByRole("button", { name: "Close" });
    fireEvent.click(close);
    fireEvent.click(close);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(back).toHaveBeenCalledTimes(1);

    // Once it lands, a drawer reopened with Forward closes again.
    fireEvent.popState(window);
    fireEvent.click(close);
    expect(back).toHaveBeenCalledTimes(2);
    back.mockRestore();
  });

  it("writes the field's text to the list's entry before the drawer's entry goes on top", () => {
    render(<AiDevToolsClient />);

    // A row pressed inside the search pause, so Back from the drawer keeps the text.
    fireEvent.change(screen.getByLabelText("Search tools"), { target: { value: "cursor" } });
    fireEvent.click(screen.getAllByRole("button", { name: /^Cursor/ })[0]);

    expect(lastHref()).toBe("/ai-dev-tools?q=cursor");
    expect(lastPushedHref()).toBe("/ai-dev-tools?q=cursor&tool=cursor");
    expect(replaceState.mock.invocationCallOrder[0]).toBeLessThan(pushState.mock.invocationCallOrder[0]);
  });
});
