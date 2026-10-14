import { render, screen } from "@testing-library/react";
import { LeaderLedger } from "../LeaderLedger";

describe("LeaderLedger", () => {
  it("lets a long value and its unit widen the value box", () => {
    // "1,381yds" is one unbreakable run wider than a fixed 48px box.
    render(
      <LeaderLedger
        title="Passing yards"
        unit="yds"
        entries={[{ rank: 1, name: "A. Passer", clubCode: "KC", value: "1,381" }]}
      />
    );

    const valueBox = screen.getByText("yds").parentElement;
    expect(valueBox).toHaveClass("min-w-12");
    expect(valueBox).not.toHaveClass("w-12");
  });
});
