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
