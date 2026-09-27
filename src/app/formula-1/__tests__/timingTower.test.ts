import { formatDeficit, timingTower } from "../timingTower";

interface Row {
  position: number;
  previousPosition: number | null;
  points: number;
  pointsDelta: number;
  teamColor: string | null;
}

const row = (overrides: Partial<Row>): Row => ({
  position: 1,
  previousPosition: 1,
  points: 0,
  pointsDelta: 0,
  teamColor: null,
  ...overrides,
});

describe("timingTower", () => {
  it("returns nothing for an empty grid", () => {
    expect(timingTower([])).toEqual([]);
  });

  it("gives the leader no gap and no interval, and everyone else a gap to the leader and an interval to the car ahead", () => {
    const rows = timingTower([
      row({ position: 1, points: 300, previousPosition: 1 }),
      row({ position: 2, points: 210, previousPosition: 2 }),
      row({ position: 3, points: 40, previousPosition: 3 }),
    ]);

    expect(rows[0]).toMatchObject({ gapToLeader: 0, intervalToAhead: null });
    // A runaway leader: the trailing car's gap to the leader is the full
    // 260-point deficit, not just the 170 it trails the car ahead of it.
    expect(rows[2]).toMatchObject({ gapToLeader: 260, intervalToAhead: 170 });
    expect(rows[1]).toMatchObject({ gapToLeader: 90, intervalToAhead: 90 });
  });

  it("gives tied points a zero gap and a zero interval", () => {
    const rows = timingTower([
      row({ position: 1, points: 100 }),
      row({ position: 2, points: 100 }),
    ]);

    expect(rows[1]).toMatchObject({ gapToLeader: 0, intervalToAhead: 0 });
  });

  it("reports movement from previousPosition and position, and null when the prior round is unknown", () => {
    const rows = timingTower([
      row({ position: 1, previousPosition: 3 }),
      row({ position: 2, previousPosition: null }),
    ]);

    // Gained two places (was 3rd, now 1st).
    expect(rows[0].movement).toBe(2);
    expect(rows[1].movement).toBeNull();
  });

  it("normalises a livery colour that arrives without a leading # and returns null when the snapshot has none", () => {
    const rows = timingTower([
      row({ position: 1, teamColor: "00D7B6" }),
      row({ position: 2, teamColor: "#F47600" }),
      row({ position: 3, teamColor: null }),
    ]);

    expect(rows[0].livery).toBe("#00D7B6");
    expect(rows[1].livery).toBe("#F47600");
    expect(rows[2].livery).toBeNull();
  });

  it("sorts by position regardless of input order", () => {
    const rows = timingTower([
      row({ position: 2, points: 50 }),
      row({ position: 1, points: 90 }),
    ]);

    expect(rows.map((r) => r.position)).toEqual([1, 2]);
  });
});

describe("formatDeficit", () => {
  it("prints a points deficit with a minus sign and a tie as level", () => {
    expect(formatDeficit(66)).toBe("−66");
    expect(formatDeficit(0)).toBe("Level");
  });
});
