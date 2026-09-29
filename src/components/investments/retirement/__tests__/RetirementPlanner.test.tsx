import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// The D3 chart manipulates SVG; stub it so the smoke test focuses on the flow.
jest.mock("../RetirementProjectionChart", () => ({
  RetirementProjectionChart: () => null,
}));

import { RetirementPlanner } from "../RetirementPlanner";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function flush() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0)); // deferred levers
  });
}

// jest.setup.js installs an observer that never fires. This one hands its
// callback to the test, which decides when the section comes into view.
let reportIntersection: ((isIntersecting: boolean) => void) | null = null;
const SetupIntersectionObserver = global.IntersectionObserver;

class ControlledIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    reportIntersection = (isIntersecting) =>
      callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

async function bringIntoView() {
  await act(async () => {
    reportIntersection?.(true);
  });
  await flush();
}

describe("RetirementPlanner", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
    reportIntersection = null;
    global.IntersectionObserver =
      ControlledIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    global.IntersectionObserver = SetupIntersectionObserver;
  });

  it("holds the projection until the section is near the viewport", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();

    // The section, its anchor, and the disclaimer are there from first paint.
    expect(container.querySelector("#retirement")).not.toBeNull();
    expect(container.textContent).toContain("Retirement planner");
    expect(container.textContent).toMatch(/educational purposes only/i);
    // No projection has run, and the header does not claim one is running.
    expect(container.textContent).toContain("Crunching scenarios");
    expect(container.textContent).not.toMatch(/\d+ of 100/);
    expect(container.textContent).not.toContain("updating");

    await act(async () => {
      reportIntersection?.(false);
    });
    await flush();
    expect(container.textContent).not.toMatch(/\d+ of 100/);

    await bringIntoView();
    expect(container.textContent).toMatch(/\d+ of 100/);
    expect(container.textContent).toContain("Save more");
  });

  it("renders a verdict and levers from the default plan", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();
    await bringIntoView();

    // Headline verdict paints from the fast core path.
    expect(container.textContent).toContain("Retirement planner");
    expect(container.textContent).toMatch(/scenarios\s+fund/i);
    // Probability is framed as "N of 100", not a bare percent.
    expect(container.textContent).toMatch(/\d+ of 100/);
    // Levers fill in after the deferred computation.
    expect(container.textContent).toContain("Save more");
    // The compliance disclaimer is always present on output.
    expect(container.textContent).toMatch(/educational purposes only/i);
  });

  it("offers the portfolio balance as a starting seed", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner portfolioValue={250000} />);
    });
    await flush();
    await bringIntoView();

    expect(container.textContent).toMatch(/Use my portfolio balance/i);
  });
});
