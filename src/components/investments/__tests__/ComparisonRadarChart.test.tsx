import React from "react";
import { render, screen } from "@testing-library/react";
import { ComparisonRadarChart, type RadarDimension } from "../ComparisonRadarChart";

const data: RadarDimension[] = [
  { dimension: "Valuation", scoreA: 50, scoreB: 100 },
  { dimension: "Growth", scoreA: 80, scoreB: 40 },
  { dimension: "Profitability", scoreA: 20, scoreB: 60 },
  { dimension: "Safety", scoreA: 70, scoreB: 30 },
];

// The plot radius is (320 - 2 * 60) / 2 = 100, so a score maps straight to a
// distance from the centre and the first axis points straight up.
function dots(svg: SVGSVGElement) {
  return Array.from(svg.querySelectorAll("circle[cx]")).map((c) => ({
    x: Number(c.getAttribute("cx")),
    y: Number(c.getAttribute("cy")),
  }));
}

describe("ComparisonRadarChart", () => {
  it("draws rings, axes, labels, both polygons, and a dot per score", () => {
    const { container } = render(<ComparisonRadarChart data={data} symbolA="AAPL" symbolB="MSFT" />);
    const svg = container.querySelector("svg") as SVGSVGElement;

    expect(svg).toHaveAttribute("aria-label", "Radar comparison chart: AAPL vs MSFT");
    expect(Array.from(svg.querySelectorAll("text")).map((t) => t.textContent)).toEqual([
      "Valuation",
      "Growth",
      "Profitability",
      "Safety",
    ]);
    expect(svg.querySelectorAll("circle:not([cx])")).toHaveLength(4); // concentric rings
    expect(svg.querySelectorAll("line")).toHaveLength(4); // one axis per dimension
    const paths = svg.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    paths.forEach((p) => expect(p.getAttribute("d")).toMatch(/^M.+L.+/));

    const points = dots(svg);
    expect(points).toHaveLength(8);
    // A's dots come first: Valuation up, Growth right, Profitability down, Safety left.
    expect(points[0].x).toBeCloseTo(0);
    expect(points[0].y).toBeCloseTo(-50);
    expect(points[1].x).toBeCloseTo(80);
    expect(points[2].y).toBeCloseTo(20);
    expect(points[3].x).toBeCloseTo(-70);
    // Then B's.
    expect(points[4].y).toBeCloseTo(-100);
    expect(points[5].x).toBeCloseTo(40);
  });

  it("anchors labels by side so they sit outside the plot", () => {
    const { container } = render(<ComparisonRadarChart data={data} symbolA="AAPL" symbolB="MSFT" />);
    const anchors = Array.from(container.querySelectorAll("svg text")).map((t) => t.getAttribute("text-anchor"));
    expect(anchors).toEqual(["middle", "start", "middle", "end"]);
  });

  it("names both symbols in the legend", () => {
    render(<ComparisonRadarChart data={data} symbolA="AAPL" symbolB="MSFT" />);
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
  });

  it("redraws in place rather than stacking a second chart", () => {
    const { container, rerender } = render(<ComparisonRadarChart data={data} symbolA="AAPL" symbolB="MSFT" />);
    const three = data.slice(0, 3).map((d) => ({ ...d, scoreA: 90 }));
    rerender(<ComparisonRadarChart data={three} symbolA="AAPL" symbolB="V" />);

    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg.querySelectorAll("path")).toHaveLength(2);
    expect(dots(svg)).toHaveLength(6);
    expect(dots(svg)[0].y).toBeCloseTo(-90);
    expect(svg).toHaveAttribute("aria-label", "Radar comparison chart: AAPL vs V");
  });

  it("explains instead of drawing when fewer than three dimensions are shared", () => {
    const { container } = render(<ComparisonRadarChart data={data.slice(0, 2)} symbolA="AAPL" symbolB="MSFT" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(
      screen.getByText("There are not enough shared, verified metrics to draw this comparison.")
    ).toBeInTheDocument();
  });

  it("handles an empty dimension list", () => {
    const { container } = render(<ComparisonRadarChart data={[]} symbolA="AAPL" symbolB="MSFT" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText(/not enough shared, verified metrics/)).toBeInTheDocument();
  });
});
