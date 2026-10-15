import { act, fireEvent, render, screen } from "@testing-library/react";
import { DecisionLabClient } from "../decision-lab-client";
import { DEFAULT_DECISION_LAB_STATE, normalizeDecisionLabState } from "../decision-lab-state";

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

    fireEvent.click(screen.getByRole("button", { name: "Onboarding refresh" }));
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

  it("returns to the default scenario after a deep link's last parameter is cleared", () => {
    visit("preset=onboarding-refresh");
    // The server reads the same link, so its state names the deep link's preset.
    const initialState = normalizeDecisionLabState(currentSearchParams);
    const ui = () => <DecisionLabClient initialState={initialState} />;
    const view = render(ui());
    expect((screen.getByLabelText("Confidence") as HTMLInputElement).value).toBe("73");

    fireEvent.click(screen.getByRole("button", { name: "Support copilot rollout" }));
    settleUrl();
    expect(lastHref()).toBe("/decision-lab");

    // The router catches up with the emptied query, while the server's prop still names the deep link.
    currentSearchParams = new URLSearchParams();
    view.rerender(ui());
    settleUrl();

    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("82");
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
  });

  it("shows the default scenario when Back restores the page with a deep link's server state", () => {
    // Back from another page can hand the page the server's state for the deep
    // link it first rendered, while the URL the visitor left is the plain page.
    visit("");
    const initialState = normalizeDecisionLabState(new URLSearchParams("preset=onboarding-refresh"));
    render(<DecisionLabClient initialState={initialState} />);

    expect((screen.getByLabelText("Impact") as HTMLInputElement).value).toBe("82");
    expect(screen.getByText(/I would test this before I commit fully\./i)).toBeVisible();
    settleUrl();
    expect(replaceState).not.toHaveBeenCalled();
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

  // Two of the pricing preset's rows end on a half (10.25 and 10.75), and the
  // default state's total does (59.85), which a one-place total cannot print.
  it.each([
    ["the pricing experiment preset", "preset=pricing-experiment"],
    ["the default state", ""],
  ])("prints ledger rows that add up to the weighted score row under them for %s", (_state, query) => {
    visit(query);
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);

    const printed = (selector: string) =>
      Array.from(document.querySelectorAll(selector)).map((figure) => Number(figure.textContent));
    const rows = printed(".dl-contribution:not(.dl-contribution-total) strong");
    const [total] = printed(".dl-contribution-total strong");

    expect(rows).toHaveLength(4);
    expect(rows.reduce((sum, value) => sum + value, 0)).toBeCloseTo(total, 5);
  });

  it("names the preset a custom state started from and drops that preset's hint", () => {
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);
    expect(screen.getByText(/High upside with thin proof/)).toBeVisible();

    fireEvent.change(screen.getByLabelText("Impact"), { target: { value: "10" } });

    expect(screen.queryByText(/High upside with thin proof/)).toBeNull();
    expect(screen.getByText("Custom, from Support copilot rollout.")).toBeVisible();
  });

  it("scrolls the pressed chip into view when the page opens on a later preset", () => {
    // jsdom lays nothing out, so the row reads as 300 wide and only the pressed chip sits past its edge.
    const boxes = jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      const left = this.getAttribute("aria-pressed") === "true" ? 400 : 0;
      const width = this.classList.contains("dl-chips") ? 300 : 120;
      return { left, width, right: left + width } as DOMRect;
    });
    visit("preset=notification-rewrite");
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);
    boxes.mockRestore();

    // The chip's centre is at 460 and the row's at 150.
    expect(document.querySelector(".dl-chips")?.scrollLeft).toBe(310);
  });

  it("tilts the stamp from a group outside the one its animation transforms", () => {
    render(<DecisionLabClient initialState={DEFAULT_DECISION_LAB_STATE} />);
    const stamp = document.querySelector(".dl-stamp") as SVGGElement;

    expect(stamp).not.toHaveAttribute("transform");
    expect(stamp.parentElement).toHaveAttribute("transform", expect.stringMatching(/^rotate\(-9 /));
  });
});
