import { fireEvent, render, screen } from "@testing-library/react";
import { PointsLadder, type PointsLadderClub } from "../PointsLadderChart";

// An early-season table: 20 clubs inside 13 points, which is what pushes the
// labels furthest from their dots.
const POINTS = [13, 12, 11, 10, 10, 9, 9, 8, 8, 8, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0];
const clubs: PointsLadderClub[] = POINTS.map((points, i) => ({
  id: String(i + 1),
  position: i + 1,
  points,
  label: `C${i + 1}`,
}));

function renderWide(onSelect = jest.fn()) {
  const { container } = render(
    <PointsLadder clubs={clubs} selectedId={null} onSelect={onSelect} title="Points ladder" />
  );
  const svg = container.querySelector('svg[data-variant="wide"]')!;
  const hits = (kind: "dot" | "label") => {
    const found = Array.from(svg.querySelectorAll<SVGElement>(`[data-ladder-hit="${kind}"]`));
    expect(found).toHaveLength(clubs.length);
    return found;
  };
  return { onSelect, hits };
}

const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

describe("PointsLadder slots", () => {
  it("puts each ladder in its own slot, which the stylesheet shows one at a time", () => {
    const { container } = render(
      <PointsLadder clubs={clubs} selectedId={null} onSelect={jest.fn()} title="Points ladder" />
    );

    for (const variant of ["wide", "narrow"]) {
      const svg = container.querySelector(`svg[data-variant="${variant}"]`)!;
      expect(svg.parentElement).toHaveClass("c97-points-ladder-slot", `c97-points-ladder-slot--${variant}`);
    }
  });
});

describe("PointsLadder click targets", () => {
  it("selects the club whose dot was clicked", () => {
    const { onSelect, hits } = renderWide();
    const dot = hits("dot").find((el) => el.getAttribute("data-club-id") === "8")!;

    fireEvent.click(dot);

    expect(onSelect).toHaveBeenCalledWith("8");
  });

  it("selects the club whose label was clicked", () => {
    const { onSelect, hits } = renderWide();
    const label = hits("label").find((el) => el.getAttribute("data-club-id") === "12")!;

    fireEvent.click(label);

    expect(onSelect).toHaveBeenCalledWith("12");
  });

  it.each(["Enter", " "])("selects a focused club with %s", (key) => {
    const { onSelect } = renderWide();
    const mark = screen.getAllByRole("button", { name: "Show C12 details" })[0]!;

    mark.focus();
    fireEvent.keyDown(mark, { key });

    expect(onSelect).toHaveBeenCalledWith("12");
  });

  it("keeps every label target clear of the dots on the axis", () => {
    const { hits } = renderWide();
    const dotRightEdge = Math.max(...hits("dot").map((el) => num(el, "cx") + num(el, "r")));

    for (const label of hits("label")) {
      expect(num(label, "x")).toBeGreaterThanOrEqual(dotRightEdge);
    }
  });

  it("never overlaps two label targets", () => {
    const { hits } = renderWide();
    const boxes = hits("label")
      .map((el) => ({ top: num(el, "y"), bottom: num(el, "y") + num(el, "height") }))
      .sort((a, b) => a.top - b.top);

    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 0.001);
    }
  });
});
