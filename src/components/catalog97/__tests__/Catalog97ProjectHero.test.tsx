import { render, screen } from "@testing-library/react";
import { Catalog97ProjectHero } from "../Catalog97ProjectHero";

describe("Catalog97ProjectHero", () => {
  it("prints the title as the page's one poster h1 on the lead ink", () => {
    const { container } = render(
      <Catalog97ProjectHero ink="teal" title="Earthquake Pulse" standfirst="Standfirst." meta="Snapshot Sep 24">
        <svg aria-label="signature" />
      </Catalog97ProjectHero>,
    );
    const h1 = screen.getByRole("heading", { level: 1, name: "Earthquake Pulse" });
    expect(h1).toHaveClass("c97-poster");
    expect(container.querySelector('[data-c97-surface="ink-teal"]')).toContainElement(h1);
    expect(screen.getByLabelText("signature")).toBeInTheDocument();
    expect(screen.getByText("Snapshot Sep 24")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("renders each readout as a label and value pair", () => {
    render(
      <Catalog97ProjectHero
        ink="blue"
        title="T"
        readouts={[{ label: "Strongest", value: "M5.3", detail: "Papua New Guinea" }]}
      />,
    );
    expect(screen.getByText("Strongest")).toHaveClass("c97-stat-label");
    expect(screen.getByText("M5.3")).toHaveClass("c97-stat-value");
    expect(screen.getByText("Papua New Guinea")).toHaveClass("c97-stat-delta");
  });

  it("renders no readout list or signature slot when there are none", () => {
    const { container } = render(<Catalog97ProjectHero ink="blue" title="T" />);
    expect(container.querySelector("dl")).toBeNull();
    expect(container.querySelector(".c97-project-hero-signature")).toBeNull();
  });
});
