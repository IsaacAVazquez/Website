import { render, screen } from "@testing-library/react";

import type { FantasyTradeEvaluation } from "@/lib/fantasyTrade";
import { TradeBalanceScale } from "../trade-balance-scale";

// The scale reads three fields of the evaluation and nothing else.
function result(
  verdict: FantasyTradeEvaluation["verdict"],
  winner: FantasyTradeEvaluation["winner"],
  relativeGap: number | null,
): FantasyTradeEvaluation {
  return { verdict, winner, relativeGap } as FantasyTradeEvaluation;
}

function marker(container: HTMLElement): Element {
  return container.querySelector(".ffb-tr-scale-marker") as Element;
}

describe("TradeBalanceScale", () => {
  it("moves the marker toward GIVE when the players given carry the higher estimate", () => {
    const { container } = render(<TradeBalanceScale result={result("leans-side-a", "side-a", 0.25)} />);

    // One point of relative gap is 3.2 units, so 25% is 80 units left of centre.
    expect(marker(container).getAttribute("style")).toContain("translateX(-80px)");
    expect(marker(container)).not.toHaveClass("ffb-tr-scale-rest");
    expect(
      screen.getByRole("img", { name: "The players you give carry the higher central estimate." }),
    ).toBeInTheDocument();
  });

  it("moves the marker toward GET by the same distance for the other side", () => {
    const { container } = render(<TradeBalanceScale result={result("leans-side-b", "side-b", 0.25)} />);

    expect(marker(container).getAttribute("style")).toContain("translateX(80px)");
    expect(
      screen.getByRole("img", { name: "The players you get carry the higher central estimate." }),
    ).toBeInTheDocument();
  });

  it("clamps a gap past 30% to the outer tick", () => {
    const { container } = render(<TradeBalanceScale result={result("clear-edge-side-b", "side-b", 0.5)} />);

    expect(marker(container).getAttribute("style")).toContain("translateX(96px)");
  });

  it("pins a balanced result to centre", () => {
    const { container } = render(<TradeBalanceScale result={result("balanced", null, 0.03)} />);

    expect(marker(container).getAttribute("style")).toContain("translateX(0px)");
    expect(marker(container)).not.toHaveClass("ffb-tr-scale-rest");
    expect(
      screen.getByRole("img", { name: "The central estimates sit inside the 5% balanced band." }),
    ).toBeInTheDocument();
  });

  it("rests the marker at centre as an open socket when the verdict is withheld or there is no result", () => {
    const { container, rerender } = render(<TradeBalanceScale result={result("insufficient", null, null)} />);

    expect(marker(container).getAttribute("style")).toContain("translateX(0px)");
    expect(marker(container)).toHaveClass("ffb-tr-scale-rest");
    expect(screen.getByRole("img", { name: "A directional trade estimate is unavailable." })).toBeInTheDocument();

    rerender(<TradeBalanceScale result={null} />);
    expect(marker(container)).toHaveClass("ffb-tr-scale-rest");
  });
});
