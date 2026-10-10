import { act, fireEvent, render, screen } from "@testing-library/react";
import { DecisionLabClient } from "../decision-lab-client";
import { DEFAULT_DECISION_LAB_STATE } from "../decision-lab-state";

const mockWriteText = jest.fn();
let currentSearchParams = new URLSearchParams();
// The page writes its state with the native history API, which the router
// syncs into useSearchParams. The spy calls through so jsdom's bar moves the
// way the page reads it, and the router mock is fed by hand where a test
// needs the router to have caught up.
const replaceBar = window.history.replaceState.bind(window.history);
let replaceState: jest.SpyInstance;
const lastHref = () => String(replaceState.mock.calls.at(-1)?.[2]);

jest.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

/** Opens the page at this query, in the bar and in the router's copy of it. */
function visit(query = "") {
  currentSearchParams = new URLSearchParams(query);
  replaceBar(null, "", query ? `/decision-lab?${query}` : "/decision-lab");
}

// The URL follows the draft after a short pause, so a test lets that pause run.
function settleUrl() {
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("DecisionLabClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    visit();
    replaceState = jest.spyOn(window.history, "replaceState").mockImplementation(replaceBar);
    mockWriteText.mockReset();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });
  });

  afterEach(() => {
    replaceState.mockRestore();
    jest.useRealTimers();
  });

  it("renders the default support-copilot scenario when no params are present", () => {
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect(screen.getByRole("heading", { level: 1, name: /^Decision Lab$/i })).toBeVisible();
    expect(screen.getByText(/i built this to pressure-test product bets/i)).toBeVisible();
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("82");
  });

  it("canonicalizes invalid query params to the normalized decision-lab href in place", () => {
    visit("preset=nope&impact=140&confidence=abc");

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect(replaceState).toHaveBeenCalledWith(null, "", "/decision-lab?impact=100");
  });

  it("updates preset selection, slider state, and the URL together", () => {
    visit("preset=notification-rewrite");

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("44");
    expect(screen.getByText(/I would hold this for now\./i)).toBeVisible();

    // Both the sidebar nav and the rail expose preset buttons with the
    // same accessible name. Use the first match (sidebar), since either fires
    // the same handler.
    fireEvent.click(screen.getAllByRole("button", { name: /onboarding refresh/i })[0]);
    settleUrl();

    expect(replaceState).toHaveBeenCalledWith(null, "", "/decision-lab?preset=onboarding-refresh");
    expect(screen.getByText(/I would ship this\./i)).toBeVisible();
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("73");

    // A drag is a burst of changes; only the settled value reaches the URL.
    for (const value of ["60", "55", "52"]) {
      fireEvent.change(screen.getByLabelText("Confidence"), { target: { value } });
    }
    expect(replaceState).toHaveBeenCalledTimes(1);
    settleUrl();

    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(lastHref()).toBe("/decision-lab?preset=onboarding-refresh&confidence=52");
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("52");
  });

  it("can reset the active preset and copy the current deep link", async () => {
    visit("preset=onboarding-refresh&confidence=52");
    mockWriteText.mockResolvedValue(undefined);

    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("52");
    expect(screen.getByText("-21 vs preset")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    expect(mockWriteText).toHaveBeenCalledWith(
      "http://localhost/decision-lab?preset=onboarding-refresh&confidence=52"
    );
    expect(await screen.findByText("Link copied", { selector: ":not(.sr-only)" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /reset to preset/i }));
    settleUrl();

    expect(lastHref()).toBe("/decision-lab?preset=onboarding-refresh");
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("73");
    expect(screen.getAllByText("Preset").length).toBeGreaterThan(0);
  });

  it("keeps the slider mounted on its own commits and re-seeds on back or forward", () => {
    visit("preset=onboarding-refresh");
    const ui = () => <DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />;
    const view = render(ui());

    const slider = screen.getByLabelText("Confidence") as HTMLInputElement;
    slider.focus();
    fireEvent.change(slider, { target: { value: "52" } });
    settleUrl();
    expect(lastHref()).toBe("/decision-lab?preset=onboarding-refresh&confidence=52");

    // The router catches up with the href the draft just committed.
    currentSearchParams = new URLSearchParams("preset=onboarding-refresh&confidence=52");
    view.rerender(ui());

    expect(screen.getByLabelText("Confidence")).toBe(slider);
    expect(document.activeElement).toBe(slider);
    expect(slider.value).toBe("52");

    // Back or forward moves the URL somewhere the draft never committed.
    replaceBar(null, "", "/decision-lab?preset=notification-rewrite");
    fireEvent.popState(window);

    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("44");
    expect(screen.getByText(/I would hold this for now\./i)).toBeVisible();
    settleUrl();
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("ends on the last of two quick slider moves whichever commit the router shows first", () => {
    visit("preset=onboarding-refresh");
    const ui = () => <DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />;
    const view = render(ui());
    const slider = screen.getByLabelText("Confidence") as HTMLInputElement;

    fireEvent.change(slider, { target: { value: "52" } });
    settleUrl();
    fireEvent.change(slider, { target: { value: "40" } });
    settleUrl();
    expect(lastHref()).toBe("/decision-lab?preset=onboarding-refresh&confidence=40");

    // The router reports the older commit first, then the newer one.
    currentSearchParams = new URLSearchParams("preset=onboarding-refresh&confidence=52");
    view.rerender(ui());
    expect(slider.value).toBe("40");
    currentSearchParams = new URLSearchParams("preset=onboarding-refresh&confidence=40");
    view.rerender(ui());
    settleUrl();

    expect(slider.value).toBe("40");
    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(lastHref()).toBe("/decision-lab?preset=onboarding-refresh&confidence=40");
  });

  it("puts the four sliders beside the verdict and keeps the calculation ledger below", () => {
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);
    const ledger = screen.getByRole("heading", { level: 2, name: "Why this verdict" });
    const verdict = screen.getByText(/^Score .+ · /);

    for (const label of ["Impact", "Confidence", "Effort", "Reversibility"]) {
      const slider = screen.getByLabelText(label);
      expect(verdict.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(slider.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    // The ledger still shows each axis's weighted contribution.
    expect(screen.getByTestId("decision-lab-shell")).toHaveTextContent(/82 × 0\.\d+ = /);
  });
});
