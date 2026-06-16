import {
  buildPolyline,
  formatMargin,
  formatNet,
  formatUpdated,
  getActiveViewStyle,
  getRatingPillStyle,
  getRowStyle,
  partyColor,
  partyLabel,
} from "../polling-aggregator-helpers";

describe("polling-aggregator-helpers", () => {
  it("formats margins, net approval values, and invalid update dates", () => {
    expect(formatMargin(0.01)).toBe("Even");
    expect(formatMargin(3.24)).toBe("D+3.2");
    expect(formatMargin(-1.46)).toBe("R+1.5");

    expect(formatNet(0)).toBe("Even");
    expect(formatNet(2.45)).toBe("+2.5");
    expect(formatNet(-1)).toBe("-1.0");
    expect(formatUpdated("not-a-date")).toBe("Unavailable");
  });

  it("returns party labels and fallback colors", () => {
    expect(partyLabel("D")).toBe("Dem.");
    expect(partyLabel("R")).toBe("Rep.");
    expect(partyLabel("I")).toBe("Ind.");
    expect(partyLabel("L")).toBe("L");

    expect(partyColor("D")).toBe("#2563EB");
    expect(partyColor("R")).toBe("#DC2626");
    expect(partyColor("I")).toBe("#64748B");
  });

  it("builds rating and view styles from helper branches", () => {
    expect(getRatingPillStyle("Lean D")).toEqual({
      background: "#93C5FD",
      color: "#1e3a5f",
      borderColor: "#93C5FD",
    });
    expect(getActiveViewStyle(true)).toMatchObject({
      background: "var(--home-ink)",
      color: "var(--home-paper)",
    });
    expect(getActiveViewStyle(false)).toMatchObject({
      color: "var(--home-ink-muted)",
    });
    expect(getRowStyle(true)).toMatchObject({
      borderColor: "color-mix(in srgb, var(--home-haze) 35%, var(--home-rule))",
    });
    expect(getRowStyle(false)).toMatchObject({
      borderColor: "var(--home-rule)",
    });
  });

  it("maps values into a compact SVG polyline on a shared Y-domain", () => {
    expect(buildPolyline([10, 20, 15], 100, 50, 10, 10, 20)).toBe(
      "10.0,40.0 50.0,10.0 90.0,25.0"
    );
    expect(buildPolyline([12], 100, 50, 8, 0, 100)).toBe("");
    expect(buildPolyline([5, 5], 20, 20, 0, 5, 5)).toBe("0.0,20.0 20.0,20.0");
  });
});
