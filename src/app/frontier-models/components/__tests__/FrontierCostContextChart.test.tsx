import { act, fireEvent, render, screen } from "@testing-library/react";
import { FrontierCostContextChart } from "../FrontierCostContextChart";
import { makeModel, MODELS } from "./fixtures/models";

let observedWidth = 800;
const OriginalResizeObserver = global.ResizeObserver;

beforeAll(() => {
  global.ResizeObserver = class {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback(
        [{ contentRect: { width: observedWidth } } as ResizeObserverEntry],
        this as unknown as ResizeObserver
      );
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterAll(() => {
  global.ResizeObserver = OriginalResizeObserver;
});

beforeEach(() => {
  observedWidth = 800;
});

function points() {
  return Array.from(document.querySelectorAll<SVGCircleElement>("circle.point"));
}

describe("FrontierCostContextChart", () => {
  it("plots each priced model as a titled, pointer-only point", () => {
    render(<FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    const svg = document.querySelector("svg") as SVGSVGElement;
    expect(svg).toHaveAttribute("role", "img");
    expect(svg.getAttribute("aria-label")).toMatch(/for 3 frontier models/);

    expect(points()).toHaveLength(3);
    // Alpha blends (1.25 + 3 * 10) / 4 = 7.8125; Bravo has only an output price.
    const titles = points().map((point) => point.querySelector("title")?.textContent);
    expect(titles).toContain("Anthropic Alpha\nContext: 1M\nBlended price: $7.81 / 1M");
    expect(titles).toContain("OpenAI Bravo\nContext: 128K\nBlended price: $0.40 / 1M");
    // The spec sheet is the keyboard path, so no mark is a tab stop.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(points().every((point) => !point.hasAttribute("tabindex"))).toBe(true);
    expect(svg.textContent).toContain("CONTEXT WINDOW (TOKENS, LOG)");
    expect(svg.textContent).toContain("BLENDED PRICE / 1M (USD, LOG)");
  });

  it("lists providers in the legend and repeats the data in a screen-reader list", () => {
    render(<FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    for (const label of ["Anthropic", "OpenAI", "Google"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual([
      "Anthropic Alpha: context 1M, blended price $7.81 per million tokens.",
      "OpenAI Bravo: context 128K, blended price $0.40 per million tokens.",
      "Google Charlie: context 2M, blended price $16.25 per million tokens.",
    ]);
  });

  it("leaves unpriced models off the plot and shows an empty state when none remain", () => {
    const unpriced = makeModel({ id: "free", name: "Free", inputPricePerMTokens: null, outputPricePerMTokens: null });
    const zero = makeModel({ id: "zero", name: "Zero", inputPricePerMTokens: 0, outputPricePerMTokens: 0 });

    const { rerender } = render(
      <FrontierCostContextChart models={[MODELS[0], unpriced]} selectedModelId={null} onSelectModel={jest.fn()} />
    );
    expect(points()).toHaveLength(1);
    expect(screen.queryByText(/Free/)).toBeNull();

    rerender(<FrontierCostContextChart models={[unpriced, zero]} selectedModelId={null} onSelectModel={jest.fn()} />);
    expect(screen.getByText("No models match the current filters.")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("selects a point by click and clears the selected one", () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={onSelect} />
    );

    const point = (name: string) =>
      points().find((circle) => circle.querySelector("title")?.textContent?.includes(name)) as SVGCircleElement;
    fireEvent.click(point("Google Charlie"));
    expect(onSelect).toHaveBeenLastCalledWith("charlie");

    rerender(<FrontierCostContextChart models={MODELS} selectedModelId="charlie" onSelectModel={onSelect} />);
    expect(point("Google Charlie")).toHaveAttribute("r", "11");
    expect(point("Anthropic Alpha")).toHaveAttribute("r", "8");
    fireEvent.click(point("Google Charlie"));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("hides every other tick label on a phone-width chart", () => {
    observedWidth = 360;
    render(<FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    const hidden = document.querySelectorAll('.tick text[display="none"]');
    expect(hidden.length).toBeGreaterThan(0);
  });

  it("draws nothing into the svg before the container has a width", () => {
    observedWidth = 0;
    render(<FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);
    expect(points()).toHaveLength(0);
    // The screen-reader list still carries the data.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("redraws at a new width when the observer reports one", () => {
    let report: ((width: number) => void) | null = null;
    const Patched = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        report = (width) =>
          callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    try {
      render(<FrontierCostContextChart models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);
      expect(points()).toHaveLength(0);
      act(() => report?.(640));
      expect(document.querySelector("svg")).toHaveAttribute("width", "640");
      expect(points()).toHaveLength(3);
    } finally {
      global.ResizeObserver = Patched;
    }
  });
});
