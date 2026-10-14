import { render, screen } from "@testing-library/react";
import { FantasyRouteHeader, FantasySectionHeading, FreshnessParts, TitleAccent } from "../FantasyRouteHeader";

describe("FreshnessParts", () => {
  it("prints repeated labels without a duplicate key, since a league name is user text", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<FreshnessParts parts={[{ label: "PPR scoring" }, { label: "PPR scoring" }, { label: "ADP stale", tone: "warning" }]} />);
    expect(screen.getAllByText("PPR scoring")).toHaveLength(2);
    expect(screen.getByText("ADP stale")).toHaveClass("ffb-warn");
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("keeps a space between parts once the hidden dots are dropped, as a screen reader reads it", () => {
    const { container } = render(<FreshnessParts parts={[{ label: "2026" }, { label: "PPR" }, { label: "ADP stale", tone: "warning" }]} />);
    const line = container.querySelector("p") as HTMLElement;
    expect(line).toHaveTextContent("2026 · PPR · ADP stale");
    line.querySelectorAll('[aria-hidden="true"]').forEach((dot) => dot.remove());
    expect(line).toHaveTextContent(/^2026 PPR ADP stale$/);
  });
});

describe("FantasyRouteHeader", () => {
  it("shows the last word of a title that opens with the product name, and keeps the full accessible name", () => {
    render(
      <FantasyRouteHeader
        title={
          <>
            Fantasy Football <TitleAccent>Rankings</TitleAccent>
          </>
        }
        lead="The board pairs the expert consensus with market ADP."
        freshness={<FreshnessParts parts={[{ label: "2026" }, { label: "PPR" }]} />}
      />,
    );

    const title = screen.getByRole("heading", { level: 1, name: "Fantasy Football Rankings" });
    // The product bar prints the first two words right above, so here they are for assistive tech only.
    expect(screen.getByText("Fantasy Football")).toHaveClass("ffb-vh");
    expect(title).toHaveTextContent(/^Fantasy Football Rankings$/);
    const header = title.closest("header") as HTMLElement;
    expect(header).toHaveClass("c97-shell", "c97-frame");
    expect(header).toContainElement(screen.getByText("The board pairs the expert consensus with market ADP."));
    expect(header).toContainElement(screen.getByText("PPR"));
  });

  it("splits the product name off when the title arrives as separate text nodes", () => {
    render(
      <FantasyRouteHeader
        title={
          <>
            Fantasy Football{" "}
            <TitleAccent>{"Waivers"}</TitleAccent>
          </>
        }
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Fantasy Football Waivers" })).toBeInTheDocument();
    expect(screen.getByText("Fantasy Football")).toHaveClass("ffb-vh");
  });

  it("leaves every other title whole", () => {
    const { rerender } = render(<FantasyRouteHeader title="Build a Trade Offer" />);
    expect(screen.getByRole("heading", { level: 1, name: "Build a Trade Offer" })).toHaveTextContent(/^Build a Trade Offer$/);
    expect(document.querySelector(".ffb-vh")).toBeNull();

    rerender(
      <FantasyRouteHeader
        title={
          <>
            Best <TitleAccent>Ball</TitleAccent>
          </>
        }
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Best Ball" })).toBeInTheDocument();
    expect(document.querySelector(".ffb-vh")).toBeNull();

    // A title that is only the product name has nothing left to show, so it stays.
    rerender(<FantasyRouteHeader title="Fantasy Football" />);
    expect(screen.getByRole("heading", { level: 1, name: "Fantasy Football" })).toBeVisible();
    expect(document.querySelector(".ffb-vh")).toBeNull();
  });

  it("puts page actions and the full-width row inside the header, after the three lines", () => {
    render(
      <FantasyRouteHeader title="Build a Trade Offer" lead="Lead." aside={<a href="/fantasy-football">View rankings</a>}>
        <button type="button">Mania</button>
      </FantasyRouteHeader>,
    );

    const header = screen.getByRole("heading", { level: 1 }).closest("header") as HTMLElement;
    const order = [...header.querySelectorAll("h1, p, a, button")].map((node) => node.textContent);
    expect(order).toEqual(["Build a Trade Offer", "Lead.", "View rankings", "Mania"]);
  });
});

describe("FantasySectionHeading", () => {
  it("is a level two heading that keeps its id and takes a style", () => {
    render(
      <FantasySectionHeading id="weekly-board" style={{ marginTop: 4 }}>
        Flex rankings
      </FantasySectionHeading>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Flex rankings" });
    expect(heading).toHaveAttribute("id", "weekly-board");
    expect(heading).toHaveStyle({ marginTop: "4px" });
  });
});

describe("FreshnessParts when the line wraps", () => {
  it("keeps each dot inside the part before it, after a no-break space, so no line opens on a dot", () => {
    const { container } = render(
      <FreshnessParts parts={[{ label: "FantasyPros consensus Sep 9, 2026" }, { label: "ADP stale", tone: "warning" }, { label: "44 experts" }]} />,
    );

    const parts = [...container.querySelectorAll(".ffb-fresh-part")];
    expect(parts.map((part) => part.textContent)).toEqual([
      "FantasyPros consensus Sep 9, 2026\u00A0·",
      "ADP stale\u00A0·",
      "44 experts",
    ]);
    // The only places the line can break are the plain spaces between parts.
    const line = container.querySelector("p") as HTMLElement;
    const between = [...line.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent);
    expect(between).toEqual([" ", " "]);
    // The tone still sits on the label alone, so the dot stays the line's own colour.
    expect(screen.getByText("ADP stale")).toHaveClass("ffb-warn");
    expect(parts[1].querySelector('[aria-hidden="true"]')).toHaveTextContent("·");
  });

  it("prints no dot after a single part", () => {
    const { container } = render(<FreshnessParts parts={[{ label: "2026 Week 5" }]} />);
    expect(container.querySelector("p")).toHaveTextContent(/^2026 Week 5$/);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
