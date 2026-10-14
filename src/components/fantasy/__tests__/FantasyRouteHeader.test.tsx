import { render, screen } from "@testing-library/react";
import { FreshnessParts } from "../FantasyRouteHeader";

describe("FreshnessParts", () => {
  it("prints repeated labels without a duplicate key, since a league name is user text", () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<FreshnessParts parts={[{ label: "PPR scoring" }, { label: "PPR scoring" }, { label: "ADP stale", tone: "warning" }]} />);
    expect(screen.getAllByText("PPR scoring")).toHaveLength(2);
    expect(screen.getByText("ADP stale")).toHaveStyle({ color: "var(--c97-warning)" });
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
