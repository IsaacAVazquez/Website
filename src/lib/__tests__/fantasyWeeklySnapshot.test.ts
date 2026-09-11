import {
  FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION,
  FANTASY_WEEKLY_STARTABLE_DEPTH,
  describeFantasyWeeklySource,
  formatFantasyWeeklyProviderLabel,
  getFantasyWeeklySourceHost,
  getFantasyWeeklyWaiverCandidates,
  normalizeFantasyWeeklySnapshot,
  pickWorseFantasySnapshotStaleness,
  type FantasyWeeklyBoard,
  type FantasyWeeklyPlayer,
} from "@/lib/fantasyWeeklySnapshot";

function player(
  index: number,
  overrides: Partial<FantasyWeeklyPlayer> = {}
): FantasyWeeklyPlayer {
  return {
    id: `fp-${index}`,
    name: `Player ${index}`,
    team: "BUF",
    position: "WR",
    rank: index,
    ownership: 99,
    ...overrides,
  };
}

function board(overrides: Partial<FantasyWeeklyBoard> = {}): FantasyWeeklyBoard {
  const source = {
    provider: "FantasyPros",
    url: "https://example.com/weekly",
    asOf: "2026-09-09T12:00:00.000Z",
    expertCount: 8,
    playerCount: 2,
  };
  return {
    flex: [player(1), player(2)],
    quarterbacks: [player(1, { position: "QB" })],
    flexSource: source,
    quarterbackSource: source,
    ...overrides,
  };
}

function snapshotWith(boards: Partial<Record<string, FantasyWeeklyBoard>> = {}) {
  return {
    schemaVersion: FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION,
    season: 2026,
    week: 1,
    generatedAt: "2026-09-09T13:00:00.000Z",
    boards: {
      ppr: board(),
      half_ppr: board(),
      standard: board(),
      ...boards,
    },
  };
}

describe("normalizeFantasyWeeklySnapshot", () => {
  it("normalizes a complete snapshot", () => {
    const snapshot = normalizeFantasyWeeklySnapshot(snapshotWith());
    expect(snapshot.season).toBe(2026);
    expect(snapshot.week).toBe(1);
    expect(snapshot.boards.ppr.flex).toHaveLength(2);
    expect(snapshot.boards.standard.quarterbacks).toHaveLength(1);
  });

  it("rejects a week outside the regular season", () => {
    // The builder refuses to publish before Week 1, so a week-0 payload means
    // something upstream served a preseason board as an in-season one.
    expect(() => normalizeFantasyWeeklySnapshot({ ...snapshotWith(), week: 0 })).toThrow(
      /invalid week/
    );
    expect(() => normalizeFantasyWeeklySnapshot({ ...snapshotWith(), week: 19 })).toThrow(
      /invalid week/
    );
  });

  it("rejects a snapshot missing a scoring board", () => {
    const partial = snapshotWith();
    delete (partial.boards as Record<string, unknown>).half_ppr;
    expect(() => normalizeFantasyWeeklySnapshot(partial)).toThrow(/missing the half_ppr board/);
  });

  it("rejects a board that lost its players", () => {
    expect(() =>
      normalizeFantasyWeeklySnapshot(snapshotWith({ ppr: board({ flex: [] }) }))
    ).toThrow(/ppr board has no players/);
  });

  it("drops an out-of-range ownership rather than trusting it", () => {
    const snapshot = normalizeFantasyWeeklySnapshot(
      snapshotWith({ ppr: board({ flex: [player(1, { ownership: 140 }), player(2)] }) })
    );
    expect(snapshot.boards.ppr.flex[0].ownership).toBeUndefined();
  });
});

describe("getFantasyWeeklyWaiverCandidates", () => {
  it("skips players who are already widely rostered", () => {
    const candidates = getFantasyWeeklyWaiverCandidates(
      board({ flex: [player(1, { ownership: 95 }), player(2, { ownership: 88 })] })
    );
    expect(candidates).toHaveLength(0);
  });

  it("skips a low-owned player who is too deep on the board to start", () => {
    // The first board built from live data put a receiver ranked 142nd of 284
    // at the top of the list on a 2.9 percent rostered rate. That is a real
    // discrepancy and not a start, which is what the depth floor exists for.
    const deep = Array.from({ length: 200 }, (_, index) =>
      player(index + 1, { ownership: index >= FANTASY_WEEKLY_STARTABLE_DEPTH.flex ? 3 : 99 })
    );
    expect(getFantasyWeeklyWaiverCandidates(board({ flex: deep, quarterbacks: [] }))).toHaveLength(
      0
    );
  });

  it("surfaces a startable, lightly rostered player and reproduces its own gap", () => {
    const flex = Array.from({ length: 200 }, (_, index) =>
      player(index + 1, { ownership: index === 9 ? 10 : 99 })
    );
    const [candidate] = getFantasyWeeklyWaiverCandidates(
      board({ flex, quarterbacks: [] })
    );

    expect(candidate.player.id).toBe("fp-10");
    // Tenth of 200 is the 95.5th percentile, and 95.5 minus 10 is 85.5. The
    // page prints both inputs so a reader can redo this line by hand.
    expect(candidate.rankPercentile).toBe(95.5);
    expect(candidate.ownership).toBe(10);
    expect(candidate.gap).toBe(85.5);
    expect(candidate.gap).toBeCloseTo(candidate.rankPercentile - candidate.ownership, 5);
  });

  it("orders by gap and keeps flex and quarterback candidates in one list", () => {
    const flex = Array.from({ length: 100 }, (_, index) =>
      player(index + 1, { ownership: index === 49 ? 20 : 99 })
    );
    const quarterbacks = Array.from({ length: 20 }, (_, index) =>
      player(index + 1, { position: "QB", ownership: index === 1 ? 5 : 99 })
    );

    const candidates = getFantasyWeeklyWaiverCandidates(board({ flex, quarterbacks }));

    expect(candidates.map((entry) => entry.board)).toEqual(["quarterback", "flex"]);
    expect(candidates[0].gap).toBeGreaterThan(candidates[1].gap);
  });
});

describe("describeFantasyWeeklySource", () => {
  const boilerplate =
    "FantasyPros public consensus cheatsheets. Flex is derived locally from the published overall board.";

  it("names the board and ignores the draft pipeline's prose when the URL is a FantasyPros page", () => {
    expect(
      describeFantasyWeeklySource(
        { provider: boilerplate, url: "https://www.fantasypros.com/nfl/rankings/ppr-flex.php" },
        "flex"
      )
    ).toBe("FantasyPros weekly flex board");
    expect(
      describeFantasyWeeklySource(
        { provider: boilerplate, url: "https://www.fantasypros.com/nfl/rankings/qb.php" },
        "quarterback"
      )
    ).toBe(formatFantasyWeeklyProviderLabel("quarterback"));
  });

  it("prints the provider as written for a host it does not know", () => {
    expect(
      describeFantasyWeeklySource(
        { provider: "Some other consensus", url: "https://example.com/board" },
        "flex"
      )
    ).toBe("Some other consensus");
    expect(describeFantasyWeeklySource({ provider: "Fallback", url: "not a url" }, "flex")).toBe(
      "Fallback"
    );
  });

  it("reads the host without its www prefix and gives up on a bad URL", () => {
    expect(
      getFantasyWeeklySourceHost({ url: "https://www.fantasypros.com/nfl/rankings/qb.php" })
    ).toBe("fantasypros.com");
    expect(getFantasyWeeklySourceHost({ url: "https://example.com/x" })).toBe("example.com");
    expect(getFantasyWeeklySourceHost({ url: "" })).toBeNull();
  });
});

describe("pickWorseFantasySnapshotStaleness", () => {
  it("returns the worse of the two readings in either order", () => {
    expect(pickWorseFantasySnapshotStaleness("fresh", "stale")).toBe("stale");
    expect(pickWorseFantasySnapshotStaleness("stale", "fresh")).toBe("stale");
    expect(pickWorseFantasySnapshotStaleness("fresh", "aging")).toBe("aging");
    expect(pickWorseFantasySnapshotStaleness("aging", "fresh")).toBe("aging");
    expect(pickWorseFantasySnapshotStaleness("fresh", "fresh")).toBe("fresh");
  });
});
