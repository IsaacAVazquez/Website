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

describe("RetirementPlanner", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders a verdict and levers from the default plan", async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();

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

    expect(container.textContent).toMatch(/Use my portfolio balance/i);
  });
});
