import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";

import { useFirstRowCount } from "../useFirstRowCount";

function Strip({ tops }: { tops: number[] }) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const fit = useFirstRowCount(listRef, tops.length);
  return (
    <ol ref={listRef} data-fit={fit === null ? "unmeasured" : String(fit)}>
      {tops.map((top, index) => (
        <li key={index} data-top={top} style={fit !== null && index >= fit ? { visibility: "hidden" } : undefined}>
          <button type="button">Pick {index + 1}</button>
        </li>
      ))}
    </ol>
  );
}

describe("useFirstRowCount", () => {
  const original = global.ResizeObserver;
  let notify: () => void = () => {};

  beforeEach(() => {
    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        notify = () => callback([], this as unknown as ResizeObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    // jsdom lays nothing out, so each item reports the top the test gave it.
    jest.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset.top ?? 0);
    });
  });

  afterEach(() => {
    global.ResizeObserver = original;
    jest.restoreAllMocks();
  });

  it("is unmeasured until the list reports, then counts the items on the first row", () => {
    render(<Strip tops={[0, 0, 0, 62, 62]} />);
    expect(screen.getByRole("list")).toHaveAttribute("data-fit", "unmeasured");

    act(() => notify());

    expect(screen.getByRole("list")).toHaveAttribute("data-fit", "3");
    // The two that fell off the first row are hidden, so they leave the tab order.
    const items = screen.getAllByRole("listitem", { hidden: true });
    expect(items.slice(0, 3).every((item) => item.style.visibility === "")).toBe(true);
    expect(items.slice(3).every((item) => item.style.visibility === "hidden")).toBe(true);
  });

  it("counts again when the list is resized", () => {
    const { rerender } = render(<Strip tops={[0, 0, 62]} />);
    act(() => notify());
    expect(screen.getByRole("list")).toHaveAttribute("data-fit", "2");

    rerender(<Strip tops={[0, 0, 0]} />);
    act(() => notify());
    expect(screen.getByRole("list")).toHaveAttribute("data-fit", "3");
  });
});
