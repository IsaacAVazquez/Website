import { leagueZone, pointsLadder, type PointsLadderRow, formatPointsGap } from "../ladderGeometry";

function row(id: string, position: number, points: number): PointsLadderRow {
  return { id, position, points };
}

describe("leagueZone", () => {
  it("places the top four in the Champions League zone", () => {
    expect(leagueZone(1, 20)).toBe("champions");
    expect(leagueZone(4, 20)).toBe("champions");
  });

  it("gives fifth and sixth their own European zones", () => {
    expect(leagueZone(5, 20)).toBe("europa");
    expect(leagueZone(6, 20)).toBe("conference");
  });

  it("relegates the bottom three of the club count", () => {
    expect(leagueZone(18, 20)).toBe("relegation");
    expect(leagueZone(19, 20)).toBe("relegation");
    expect(leagueZone(20, 20)).toBe("relegation");
    expect(leagueZone(17, 20)).toBe("midtable");
  });

  it("leaves the rest as midtable", () => {
    expect(leagueZone(10, 20)).toBe("midtable");
  });
});

describe("pointsLadder", () => {
  const LABEL_HEIGHT = 1 / 20;

  it("returns nothing for an empty table", () => {
    expect(pointsLadder([], { labelHeight: LABEL_HEIGHT })).toEqual({ marks: [], lines: [] });
  });

  it("puts a runaway leader at the top with zero gap and keeps every mark finite", () => {
    const rows: PointsLadderRow[] = [
      row("leader", 1, 80),
      ...Array.from({ length: 19 }, (_, i) => row(`club-${i}`, i + 2, 20 - i * 0.2)),
    ];
    const { marks } = pointsLadder(rows, { labelHeight: LABEL_HEIGHT });
    const leader = marks.find((m) => m.id === "leader")!;
    expect(leader.y).toBe(0);
    expect(leader.gapFromLeader).toBe(0);
    for (const mark of marks) {
      expect(Number.isFinite(mark.y)).toBe(true);
      expect(Number.isFinite(mark.labelY)).toBe(true);
      expect(mark.y).toBeGreaterThanOrEqual(0);
      expect(mark.y).toBeLessThanOrEqual(1);
    }
    expect(marks.find((m) => m.id === "club-0")!.gapFromLeader).toBeGreaterThan(50);
  });

  it("nudges clubs level on points apart so their labels never overlap", () => {
    const rows: PointsLadderRow[] = Array.from({ length: 6 }, (_, i) => row(`club-${i}`, i + 1, 40));
    const { marks } = pointsLadder(rows, { labelHeight: LABEL_HEIGHT });
    const labelYs = marks.map((m) => m.labelY).sort((a, b) => a - b);
    for (let i = 1; i < labelYs.length; i++) {
      expect(labelYs[i] - labelYs[i - 1]).toBeGreaterThanOrEqual(LABEL_HEIGHT - 1e-9);
    }
  });

  it("keeps every label distinct on an early-season table with several separate tie clusters", () => {
    // Five games in and bunched into a 2-15 points range, the way a real
    // opening-month snapshot reads: no single pair looks crowded, but six
    // separate tie clusters compound enough forced pushing to blow well past
    // the axis unless the whole run rescales instead of clamping.
    const points = [15, 12, 10, 9, 9, 9, 9, 8, 8, 7, 6, 5, 5, 4, 4, 4, 3, 3, 2, 2];
    const rows: PointsLadderRow[] = points.map((pts, i) => row(`club-${i}`, i + 1, pts));
    const { marks } = pointsLadder(rows, { labelHeight: LABEL_HEIGHT });
    const labelYs = marks.map((m) => m.labelY).sort((a, b) => a - b);
    for (let i = 1; i < labelYs.length; i++) {
      expect(labelYs[i]).toBeGreaterThan(labelYs[i - 1]);
    }
    expect(labelYs[0]).toBeGreaterThanOrEqual(0);
    expect(labelYs[labelYs.length - 1]).toBeLessThanOrEqual(1);
  });

  it("lays out a full 20-club table with the four zone lines and their gaps", () => {
    const rows: PointsLadderRow[] = Array.from({ length: 20 }, (_, i) =>
      row(`club-${i}`, i + 1, 60 - i * 2)
    );
    const { marks, lines } = pointsLadder(rows, { labelHeight: LABEL_HEIGHT });
    expect(marks).toHaveLength(20);
    expect(lines.map((l) => l.afterPosition)).toEqual([4, 5, 6, 17]);
    for (const line of lines) {
      expect(line.gap).toBeCloseTo(2);
      expect(line.y).toBeGreaterThan(0);
      expect(line.y).toBeLessThan(1);
    }
  });

  it("nudges zone line labels apart when a tie spans several zone boundaries", () => {
    // Four clubs level at 9 points across positions 4-7 put the Champions
    // League and Europa League lines at the exact same y (both fall between
    // clubs on 9 points), so their labels need separating too.
    const points = [15, 12, 10, 9, 9, 9, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 0];
    const rows: PointsLadderRow[] = points.map((pts, i) => row(`club-${i}`, i + 1, pts));
    const { lines } = pointsLadder(rows, { labelHeight: LABEL_HEIGHT });
    const labelYs = lines.map((l) => l.labelY).sort((a, b) => a - b);
    for (let i = 1; i < labelYs.length; i++) {
      expect(labelYs[i] - labelYs[i - 1]).toBeGreaterThanOrEqual(LABEL_HEIGHT - 1e-9);
    }
  });
});

describe("formatPointsGap", () => {
  it("reads a tie as level and pluralises points", () => {
    expect(formatPointsGap(0)).toBe("Level");
    expect(formatPointsGap(1)).toBe("1 pt");
    expect(formatPointsGap(4)).toBe("4 pts");
  });
});
