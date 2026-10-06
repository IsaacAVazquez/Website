import { fireEvent, render, screen, within } from "@testing-library/react";
import { AiDevToolsClient } from "../ai-dev-tools-client";
import { DEFAULT_AI_DEV_TOOLS_STATE } from "../ai-dev-tools-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

describe("AiDevToolsClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders the directory and navigates when filters change", () => {
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /ai dev tool ecosystem/i })
    ).toBeVisible();
    expect(screen.getByText(/tools shown/i)).toBeVisible();

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "terminal-agent" },
    });

    expect(mockPush).toHaveBeenLastCalledWith(
      "/ai-dev-tools?category=terminal-agent",
      { scroll: false }
    );

    fireEvent.change(screen.getByLabelText("Search tools"), {
      target: { value: "codex" },
    });

    expect(mockPush).toHaveBeenLastCalledWith("/ai-dev-tools?q=codex", {
      scroll: false,
    });
  });

  it("uses managed search params and resets them back to the default route", () => {
    currentSearchParams = new URLSearchParams(
      "category=terminal-agent&pricing=subscription&tool=openai-codex"
    );

    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    expect(screen.getByLabelText("Category")).toHaveValue("terminal-agent");

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(mockPush).toHaveBeenLastCalledWith("/ai-dev-tools", {
      scroll: false,
    });
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
    expect(mockPush).toHaveBeenLastCalledWith("/ai-dev-tools?tool=cursor", { scroll: false });
  });

  it("shows a deep-linked tool in a named drawer and clears it from the URL on close", () => {
    currentSearchParams = new URLSearchParams("q=Cursor&tool=cursor");
    render(<AiDevToolsClient initialState={DEFAULT_AI_DEV_TOOLS_STATE} />);

    const drawer = screen.getByRole("dialog", { name: "Cursor detail" });
    expect(within(drawer).getByRole("heading", { level: 2, name: "Cursor" })).toBeInTheDocument();
    expect(within(drawer).getByText("Sources")).toBeInTheDocument();
    expect(drawer).toHaveFocus();

    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));
    expect(mockPush).toHaveBeenLastCalledWith("/ai-dev-tools?q=Cursor", { scroll: false });

    mockPush.mockClear();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockPush).toHaveBeenLastCalledWith("/ai-dev-tools?q=Cursor", { scroll: false });
  });
});
