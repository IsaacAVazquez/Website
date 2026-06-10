import { fireEvent, render, screen } from "@testing-library/react";
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
});
