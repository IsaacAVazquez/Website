import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { AiDevToolsClient } from "../ai-dev-tools-client";
import { DEFAULT_AI_DEV_TOOLS_STATE } from "../ai-dev-tools-state";

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
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

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

    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    expect(screen.getByLabelText("Category")).toHaveValue("terminal-agent");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(lastHref()).toBe("/ai-dev-tools");
  });

  it("keeps the field empty after a reset instead of writing the old search back", () => {
    visit("q=codex");
    const ui = () => <AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />;
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
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);
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
    const ui = () => <AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />;
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

  it("prints search and the directory before the phone's category map", () => {
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    const search = screen.getByLabelText("Search tools");
    const phoneMap = screen.getByRole("heading", { level: 2, name: "By category and pricing" });
    expect(search.compareDocumentPosition(phoneMap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The hero keeps the wide grid, which the stylesheet hides below 960px.
    expect(screen.getByRole("table", { name: /by category and pricing model/i })).toBeInTheDocument();
  });

  it("opens no drawer until a tool is picked, then names it in the URL", () => {
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    expect(screen.queryByRole("dialog")).toBeNull();
    // Each tool has a directory row and a plate on each map, and any of them opens it.
    const cursorButtons = screen.getAllByRole("button", { name: /^Cursor/ });
    expect(cursorButtons.length).toBeGreaterThan(1);
    fireEvent.click(cursorButtons[0]);
    // The drawer is the one change that gets a history entry, so Back closes it.
    expect(lastPushedHref()).toBe("/ai-dev-tools?tool=cursor");
  });

  it("shows a deep-linked tool in a named drawer and clears it from the URL on close", () => {
    visit("q=Cursor&tool=cursor");
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

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
});
