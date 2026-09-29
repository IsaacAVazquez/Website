import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

// The D3 chart manipulates SVG; stub it so the smoke test focuses on the flow.
jest.mock("../RetirementProjectionChart", () => ({
  RetirementProjectionChart: () => null,
}));

// The engine stays real. The default plan runs 100 simulations where the app
// runs 1,000, since no test here reads a figure that depends on the count, and
// 100 is the fewest a stored plan may ask for. That about halves a lever
// search, and it goes no lower because the search solves its targets at a
// fixed 250 simulations whatever the plan says.
jest.mock("@/lib/retirement", () => {
  const actual = jest.requireActual("@/lib/retirement");
  return {
    ...actual,
    createDefaultPlan: () => {
      const plan = actual.createDefaultPlan();
      plan.assumptions.simulations = 100;
      return plan;
    },
  };
});

import { RetirementPlanner } from "../RetirementPlanner";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// The projection and the lever search are CPU bound, so they take as long as
// the machine lets them. On a saturated machine they ran up to fourteen times
// slower than alone, which Jest's 5 second default does not allow for. No test
// waits on this limit, and it only ends a test that hangs.
jest.setTimeout(30_000);

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

// The browser lays a print out from the DOM as it stands when the beforeprint
// handlers return. It does not scroll, so the observer never reports the
// section, and it does not wait for a timer. This copies the planner at that
// moment, before anything queued can run.
function pageAtPrint(container: HTMLElement): HTMLElement {
  const copies: HTMLElement[] = [];
  act(() => {
    window.dispatchEvent(new Event("beforeprint"));
    copies.push(container.cloneNode(true) as HTMLElement);
  });
  return copies[0];
}

// Jest stops waiting for a test that passes its time limit, but the body keeps
// running. It shares the container, the root, and the observer callback with
// the next test, and React counts act scopes in one place for the whole file,
// so a body that resumed during the next test opened scopes that overlapped
// that test's, and every later act in the file stopped flushing when it
// closed. Each test runs through this, and afterEach waits for its body to
// finish before it takes the planner down, so a test that times out fails
// alone.
let testBody: Promise<unknown> = Promise.resolve();
function tracked(body: () => Promise<unknown>) {
  return () => (testBody = body());
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

  afterEach(async () => {
    await testBody.catch(() => undefined);
    act(() => root.unmount());
    container.remove();
    global.IntersectionObserver = SetupIntersectionObserver;
  });

  it("holds the projection until the section is near the viewport", tracked(async () => {
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
  }));

  it("prints the verdict when the section never came near the viewport", tracked(async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();
    expect(container.textContent).toContain("Crunching scenarios");

    const printed = pageAtPrint(container);

    expect(printed.textContent).toMatch(/\d+ of 100/);
    expect(printed.textContent).not.toContain("Crunching scenarios");
  }));

  it("prints the levers, which otherwise arrive a tick after the verdict", tracked(async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();

    const printed = pageAtPrint(container);

    expect(printed.textContent).toContain("Save more");
    expect(printed.querySelector(".invest-retire-lever-skeleton")).toBeNull();
  }));

  it("prints the assumptions and the disclaimer with the projection", tracked(async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner />);
    });
    await flush();

    const printed = pageAtPrint(container);

    expect(printed.querySelector('[aria-label="Assumptions used"]')).not.toBeNull();
    expect(printed.textContent).toContain("Capital market assumptions:");
    expect(printed.textContent).toMatch(/educational purposes only/i);
  }));

  it("renders a verdict and levers from the default plan", tracked(async () => {
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
  }));

  it("offers the portfolio balance as a starting seed", tracked(async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(<RetirementPlanner portfolioValue={250000} />);
    });
    await flush();
    await bringIntoView();

    expect(container.textContent).toMatch(/Use my portfolio balance/i);
  }));
});
