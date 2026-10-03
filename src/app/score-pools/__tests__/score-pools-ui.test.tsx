import { render, screen } from "@testing-library/react";
import {
  ConfidenceChip,
  EpMeter,
  LockBadge,
  SampleDataNotice,
  formatAge,
  formatKickoff,
  formatPercent,
  formatPoints,
  formatScoreline,
  leagueOptionLabel,
} from "../score-pools-ui";
import { league, snapshot } from "./fixtures/scorePoolsTestData";

const NOW = "2026-10-03T12:00:00.000Z";

describe("score-pools formatting", () => {
  it("formats scorelines, percents, and points", () => {
    expect(formatScoreline({ home: 2, away: 0 })).toBe("2-0");
    expect(formatPercent(0.4567)).toBe("46%");
    expect(formatPercent(0.4567, 1)).toBe("45.7%");
    expect(formatPoints(1.5)).toBe("1.50");
  });

  it.each([
    ["2026-10-03T11:59:45.000Z", "just now"],
    ["2026-10-03T11:19:00.000Z", "41m ago"],
    ["2026-10-03T06:00:00.000Z", "6h ago"],
    ["2026-10-01T13:00:00.000Z", "47h ago"],
    ["2026-09-30T12:00:00.000Z", "3d ago"],
    ["not a date", "unknown age"],
  ])("ages %s as %s", (iso, expected) => {
    expect(formatAge(iso, NOW)).toBe(expected);
  });

  it("prints kickoffs in the pool's timezone", () => {
    expect(formatKickoff("2026-10-03T19:00:00.000Z", "UTC")).toMatch(/^Sat, Oct 3, 7:00\sPM$/);
    expect(formatKickoff("2026-10-03T19:00:00.000Z", "America/New_York")).toMatch(/^Sat, Oct 3, 3:00\sPM$/);
  });

  it("falls back to UTC text for an unknown timezone", () => {
    expect(formatKickoff("2026-10-03T19:00:00.000Z", "Mars/Olympus")).toBe("Sat, 03 Oct 2026 19:00:00 GMT");
  });

  it("labels empty and sample leagues in the league picker", () => {
    expect(leagueOptionLabel(league({ name: "Cup" }))).toBe("Cup");
    expect(leagueOptionLabel(league({ name: "Cup", sample: true }))).toBe("Cup (sample data)");
    expect(leagueOptionLabel(league({ name: "Cup", fixtures: [] }))).toBe("Cup · no fixtures yet");
  });
});

describe("score-pools chips", () => {
  it.each([
    ["high", "●", "High"],
    ["medium", "◐", "Medium"],
    ["low", "○", "Low"],
  ] as const)("shows %s confidence with a glyph and a word", (level, glyph, word) => {
    const { container } = render(<ConfidenceChip level={level} />);
    expect(container).toHaveTextContent(`${glyph}${word}`);
    expect(screen.getByText(glyph)).toHaveAttribute("aria-hidden", "true");
  });

  it("only shows the lock badge once locked", () => {
    const { rerender, container } = render(<LockBadge locked={false} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<LockBadge locked />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("carries the expected points as text and sizes the meter against the max", () => {
    const { container, rerender } = render(<EpMeter value={1.2} max={2.4} />);
    expect(screen.getByText("1.20")).toBeInTheDocument();
    const bar = () => container.querySelector(".c97-meter > span") as HTMLElement;
    expect(bar().style.width).toBe("50%");
    rerender(<EpMeter value={0.001} max={2.4} />);
    expect(bar().style.width).toBe("2%");
    rerender(<EpMeter value={1} max={0} />);
    expect(bar().style.width).toBe("0%");
  });

  it("says the build date is unknown when the snapshot stamp is bad", () => {
    const snap = { ...snapshot([league({ sample: true })]), generatedAt: "garbage" };
    render(<SampleDataNotice snapshot={snap} />);
    expect(screen.getByText(/The sample was built on an unknown date/)).toBeInTheDocument();
  });
});
