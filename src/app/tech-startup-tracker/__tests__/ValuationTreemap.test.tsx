import { fireEvent, render } from "@testing-library/react";
import { ValuationTreemap } from "../ValuationTreemap";

const startups = [
  { id: "a", name: "Alpha", sector: "ai", valuation: 300 },
  { id: "b", name: "Beta", sector: "ai", valuation: 60 },
  { id: "c", name: "Gamma", sector: "fintech", valuation: 70 },
];

it("keeps its marks out of the tab order, since the table below is the keyboard path", () => {
  const { container } = render(<ValuationTreemap startups={startups} selectedId={null} onSelect={() => {}} />);
  const svg = container.querySelector('svg[role="img"]')!;
  expect(svg.querySelectorAll("[tabindex]")).toHaveLength(0);
  expect(svg.querySelectorAll('[role="button"]')).toHaveLength(0);
});

it("still selects a startup from a pointer click on its tile", () => {
  const onSelect = jest.fn();
  const { container } = render(<ValuationTreemap startups={startups} selectedId={null} onSelect={onSelect} />);
  fireEvent.click(container.querySelector(".c97-startup-treemap-tile")!);
  expect(onSelect).toHaveBeenCalledWith("a");
});
