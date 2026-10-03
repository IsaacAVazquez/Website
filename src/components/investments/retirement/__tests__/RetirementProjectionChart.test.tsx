import React from "react";
import { render, screen } from "@testing-library/react";
import { RetirementProjectionChart } from "../RetirementProjectionChart";
import type { RetirementResult } from "@/lib/retirement";

type Band = { age: number; p10: number; p25: number; p50: number; p75: number; p90: number };

function bandsFor(fromAge: number, toAge: number): Band[] {
  return Array.from({ length: toAge - fromAge + 1 }, (_, i) => {
    const p50 = 100_000 + i * 40_000;
    return { age: fromAge + i, p10: p50 * 0.5, p25: p50 * 0.8, p50, p75: p50 * 1.2, p90: p50 * 1.6 };
  });
}

// Only the fields the chart reads; the engine's other outputs play no part here.
function resultFor(opts: { currentAge?: number; retirementAge?: number; horizonAge?: number; bands?: Band[] } = {}) {
  const { currentAge = 30, retirementAge = 65, horizonAge = 95 } = opts;
  return {
    input: { currentAge, retirementAge, horizonAge },
    monteCarlo: {
      bands: opts.bands ?? bandsFor(currentAge, horizonAge),
      balanceAtRetirement: { p10: 600_000, p50: 1_234_567, p90: 2_000_000 },
    },
  } as unknown as RetirementResult;
}

function svg() {
  return screen.getByRole("img") as unknown as SVGSVGElement;
}

function ageLabels() {
  return Array.from(svg().querySelectorAll("text.is-x")).map((t) => t.textContent);
}

function balanceLabels() {
  return Array.from(svg().querySelectorAll("text.invest-retire-chart-label:not(.is-x):not(.is-marker)")).map(
    (t) => t.textContent
  );
}

/** jsdom measures no text, so stand in a fixed width for every label. */
function withTextWidth(width: number, run: () => void) {
  const proto = SVGElement.prototype as unknown as { getComputedTextLength?: () => number };
  proto.getComputedTextLength = () => width;
  try {
    run();
  } finally {
    delete proto.getComputedTextLength;
  }
}

describe("RetirementProjectionChart", () => {
  it("summarises the projection for assistive tech in today's dollars", () => {
    render(<RetirementProjectionChart result={resultFor()} />);
    expect(screen.getByRole("figure", { name: "Projected balance over time" })).toBeInTheDocument();
    expect(svg()).toHaveAttribute(
      "aria-label",
      "Projected portfolio balance from age 30 to 95, today's dollars. Median at retirement $1.2M, with a 10th–90th percentile range."
    );
    expect(screen.getByText(/10–90th percentile/)).toBeInTheDocument();
  });

  it("draws the two percentile bands and the median line", () => {
    render(<RetirementProjectionChart result={resultFor()} />);
    const paths = Array.from(svg().querySelectorAll("path"));
    expect(paths).toHaveLength(3);
    for (const p of paths) {
      expect(p.getAttribute("d")).toMatch(/^M/);
      expect(p.getAttribute("d")).not.toMatch(/NaN/);
    }
    expect(paths[2].getAttribute("fill")).toBe("none"); // the median is a line, not a band
  });

  it("labels balances in compact dollars from zero and ages as whole years", () => {
    render(<RetirementProjectionChart result={resultFor()} />);
    const balances = balanceLabels();
    expect(balances[0]).toBe("$0");
    balances.forEach((label) => expect(label).toMatch(/^\$\d+(\.\d)?[KMB]?$/));
    // The highest 90th percentile is $4.32M, so the axis rounds up past it to $5M.
    expect(balances).toEqual(["$0", "$1M", "$2M", "$3M", "$4M", "$5M"]);
    expect(ageLabels()).toEqual(["30", "40", "50", "60", "70", "80", "90"]);
    expect(svg().querySelectorAll("line.grid")).toHaveLength(balances.length);
  });

  it("marks the retirement age inside the plan", () => {
    render(<RetirementProjectionChart result={resultFor()} />);
    const marker = svg().querySelector("text.is-marker") as SVGTextElement;
    expect(marker.textContent).toBe("retire 65");
    expect(marker.getAttribute("text-anchor")).toBe("start");
    expect(svg().querySelectorAll("line[stroke-dasharray='4 3']")).toHaveLength(1);
  });

  it("flips the retirement label left when it would run off the plot", () => {
    withTextWidth(40, () => {
      render(<RetirementProjectionChart result={resultFor({ retirementAge: 95 })} />);
      const marker = svg().querySelector("text.is-marker") as SVGTextElement;
      expect(marker.getAttribute("text-anchor")).toBe("end");
    });
  });

  it("leaves out the marker when retirement falls outside the bands", () => {
    render(<RetirementProjectionChart result={resultFor({ retirementAge: 100 })} />);
    expect(svg().querySelector("text.is-marker")).toBeNull();
  });

  it("ticks a short plan on whole years only", () => {
    render(
      <RetirementProjectionChart
        result={resultFor({ currentAge: 60, retirementAge: 61, horizonAge: 63 })}
      />
    );
    expect(ageLabels()).toEqual(["60", "61", "62", "63"]);
  });

  it("thins the age row when wide labels would crowd it", () => {
    let wide: (string | null)[] = [];
    withTextWidth(150, () => {
      render(<RetirementProjectionChart result={resultFor()} />);
      wide = ageLabels();
    });
    expect(wide.length).toBeGreaterThan(0);
    expect(wide.length).toBeLessThan(7);
  });

  it("grows the drawing to hold its margins", () => {
    render(<RetirementProjectionChart result={resultFor()} />);
    // 16 top + 288 plot + 36 bottom at the base type size.
    expect(svg().getAttribute("viewBox")).toBe("0 0 760 340");
  });

  it("draws nothing for an empty projection", () => {
    render(<RetirementProjectionChart result={resultFor({ bands: [] })} />);
    expect(svg().childElementCount).toBe(0);
  });

  it("redraws in place when the phone breakpoint changes, and stops listening on unmount", () => {
    const listeners: Array<() => void> = [];
    const removed: Array<() => void> = [];
    const original = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => removed.push(fn),
    })) as unknown as typeof window.matchMedia;

    try {
      const { unmount } = render(<RetirementProjectionChart result={resultFor()} />);
      expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 639px)");
      expect(listeners).toHaveLength(1);

      listeners[0]();
      expect(svg().querySelectorAll("path")).toHaveLength(3);
      expect(svg().querySelectorAll("text.is-marker")).toHaveLength(1);

      unmount();
      expect(removed).toEqual(listeners);
    } finally {
      window.matchMedia = original;
    }
  });
});
