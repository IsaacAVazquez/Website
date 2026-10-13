import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { PositionFilterBar } from "../PositionFilterBar";

describe("PositionFilterBar", () => {
  it("uses one tab stop and moves selection with arrow keys while skipping unavailable options", () => {
    const onChange = jest.fn();
    render(
      <PositionFilterBar
        ariaLabel="Position"
        value="overall"
        onChange={onChange}
        options={[
          { value: "overall", label: "Overall" },
          { value: "qb", label: "QB", available: false, unavailableLabel: "QB unavailable" },
          { value: "rb", label: "RB" },
        ]}
      />
    );

    const overall = screen.getByRole("radio", { name: "Overall" });
    const quarterback = screen.getByRole("radio", { name: /QB, QB unavailable/ });
    const runningBack = screen.getByRole("radio", { name: "RB" });

    expect(overall).toHaveAttribute("tabindex", "0");
    expect(quarterback).toBeDisabled();
    expect(quarterback).toHaveAttribute("tabindex", "-1");
    expect(runningBack).toHaveAttribute("tabindex", "-1");

    overall.focus();
    fireEvent.keyDown(overall, { key: "ArrowRight" });

    expect(onChange).toHaveBeenCalledWith("rb");
    expect(runningBack).toHaveFocus();
  });

  it("supports Home and End navigation", () => {
    const onChange = jest.fn();
    render(
      <PositionFilterBar
        ariaLabel="Position"
        value="rb"
        onChange={onChange}
        options={[
          { value: "overall", label: "Overall" },
          { value: "rb", label: "RB" },
          { value: "wr", label: "WR" },
        ]}
      />
    );

    const runningBack = screen.getByRole("radio", { name: "RB" });
    fireEvent.keyDown(runningBack, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("wr");
    expect(screen.getByRole("radio", { name: "WR" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("radio", { name: "WR" }), { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("overall");
    expect(screen.getByRole("radio", { name: "Overall" })).toHaveFocus();
  });
});

/** Renders one option whose value is the position and returns the class the switch gave it. */
function positionClassOf(value: string): string {
  const { container, unmount } = render(
    <PositionFilterBar ariaLabel="One" value="none" onChange={jest.fn()} options={[{ value, label: "One option" }]} />,
  );
  const className = (container.querySelector("button") as HTMLElement).className.replace("ffb-seg-btn", "").trim();
  unmount();
  return className;
}

describe("PositionFilterBar as the kit's position switch", () => {
  const options = [
    { value: "ALL", label: "All" },
    { value: "QB", label: "QB", position: "QB" },
    { value: "FLEX", label: "Flex" },
    { value: "K", label: "K", position: "K", available: false, unavailableLabel: "No kicker board this week" },
  ];

  it("gives each position its colour class, the flex board the thirds, and the all button none", () => {
    render(<PositionFilterBar ariaLabel="Position" value="QB" onChange={jest.fn()} options={options} />);

    expect(screen.getByRole("radiogroup", { name: "Position" })).toHaveClass("ffb-seg", "ffb-seg-pos");
    expect(screen.getByRole("radio", { name: "All" }).className).toBe("ffb-seg-btn");
    expect(screen.getByRole("radio", { name: "QB" })).toHaveClass("ffb-seg-btn", "ffb-pos-qb");
    expect(screen.getByRole("radio", { name: "QB" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Flex" })).toHaveClass("ffb-pos-flex");
    // A lower-case value still finds its position, as the rankings route passes them.
    expect(positionClassOf("qb")).toBe("ffb-pos-qb");
  });

  it("keeps the word on an unavailable position: NA in the button, the reason in its name and title", () => {
    const onChange = jest.fn();
    render(<PositionFilterBar ariaLabel="Position" value="ALL" onChange={onChange} options={options} />);

    const kicker = screen.getByRole("radio", { name: "K, No kicker board this week" });
    expect(kicker).toBeDisabled();
    expect(kicker).toHaveAttribute("title", "No kicker board this week");
    // Two words with a real space between them, so nothing reads "KNA".
    expect(kicker).toHaveTextContent(/^K NA$/);
    fireEvent.click(kicker);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every button and leaves no tab stop when the bar is disabled", () => {
    render(<PositionFilterBar ariaLabel="Position" value="ALL" onChange={jest.fn()} options={options} disabled />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
      expect(radio).toHaveAttribute("tabindex", "-1");
    });
  });
});
