import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { useKeepPressedInView } from "../useKeepPressedInView";

// jsdom lays nothing out, so each element reads its box from its own attributes.
function Switch({ active }: { active: "table" | "play-in" }) {
  const rowRef = useRef<HTMLDivElement>(null);
  useKeepPressedInView(rowRef, active);
  return (
    <div ref={rowRef} data-testid="row" data-left="0" data-width="300">
      <button type="button" aria-pressed={active === "table"} data-left="0" data-width="120">
        Table
      </button>
      <button type="button" aria-pressed={false} data-left="130" data-width="120">
        West
      </button>
      <button type="button" aria-pressed={active === "play-in"} data-left="400" data-width="120">
        Play-in race
      </button>
    </div>
  );
}

describe("useKeepPressedInView", () => {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const left = Number(this.dataset.left ?? 0);
      const width = Number(this.dataset.width ?? 0);
      return { left, width, right: left + width } as DOMRect;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("centres a pressed pill that opened outside the row", () => {
    render(<Switch active="play-in" />);

    // The pill's centre is at 460 and the row's at 150.
    expect(screen.getByTestId("row").scrollLeft).toBe(310);
  });

  it("leaves the row alone while the pressed pill is in view", () => {
    render(<Switch active="table" />);

    expect(screen.getByTestId("row").scrollLeft).toBe(0);
  });

  it("centres a pill that takes keyboard focus outside the row", () => {
    render(<Switch active="table" />);

    screen.getByRole("button", { name: "Play-in race" }).focus();

    expect(screen.getByTestId("row").scrollLeft).toBe(310);
  });

  it("leaves a focused pill alone when it is in view with room for its ring", () => {
    render(<Switch active="table" />);

    screen.getByRole("button", { name: "West" }).focus();

    expect(screen.getByTestId("row").scrollLeft).toBe(0);
  });
});
