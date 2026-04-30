import type { HTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { DecisionLabClient } from "../decision-lab-client";
import { DEFAULT_DECISION_LAB_STATE } from "../decision-lab-state";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockWriteText = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

describe("DecisionLabClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockReplace.mockReset();
    mockPush.mockReset();
    mockWriteText.mockReset();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });
  });

  it("renders the default support-copilot scenario when no params are present", () => {
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect(screen.getByRole("heading", { level: 1, name: /^Decision Lab$/i })).toBeVisible();
    expect(screen.getByText(/i built this to pressure-test product bets/i)).toBeVisible();
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("82");
  });

  it("canonicalizes invalid query params to the normalized decision-lab href", () => {
    currentSearchParams = new URLSearchParams("preset=nope&impact=140&confidence=abc");

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect(mockReplace).toHaveBeenCalledWith("/decision-lab?impact=100", { scroll: false });
  });

  it("updates preset selection, slider state, and the URL together", () => {
    currentSearchParams = new URLSearchParams("preset=notification-rewrite");

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("44");
    expect(screen.getByText(/I would hold this for now\./i)).toBeVisible();

    // Both the sidebar nav and the rail expose preset buttons with the
    // same accessible name. Use the first match (sidebar) — either fires
    // the same handler.
    fireEvent.click(screen.getAllByRole("button", { name: /onboarding refresh/i })[0]);

    expect(mockReplace).toHaveBeenCalledWith("/decision-lab?preset=onboarding-refresh", {
      scroll: false,
    });
    expect(screen.getByText(/I would ship this\./i)).toBeVisible();
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("73");

    fireEvent.change(screen.getByLabelText("Confidence"), { target: { value: "52" } });

    expect(mockReplace).toHaveBeenLastCalledWith(
      "/decision-lab?preset=onboarding-refresh&confidence=52",
      { scroll: false }
    );
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("52");
  });

  it("can reset the active preset and copy the current deep link", async () => {
    currentSearchParams = new URLSearchParams("preset=onboarding-refresh&confidence=52");
    mockWriteText.mockResolvedValue(undefined);

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("52");
    expect(screen.getByText("-21 vs preset")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(mockWriteText).toHaveBeenCalledWith(
      "http://localhost/decision-lab?preset=onboarding-refresh&confidence=52"
    );
    expect(await screen.findByText("Link copied")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /reset to defaults/i }));

    expect(mockReplace).toHaveBeenLastCalledWith("/decision-lab?preset=onboarding-refresh", {
      scroll: false,
    });
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("73");
    expect(screen.getAllByText("Preset").length).toBeGreaterThan(0);
  });
});
