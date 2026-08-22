import {
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  ADP_SIGNAL_MIN_TIMES_DRAFTED,
  getAdpSignalThreshold,
  getConsensusSpread,
  getFantasyAdpFreshness,
  getFantasySourceCapabilities,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getTierRailIntensity,
  getTierRailTone,
  getValueVsAdp,
  formatPickDelta,
  ADP_COMPARABLE_MAX_RANK,
  resolveDraftPicksForModel,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

const MS_PER_DAY = 86_400_000;

/** Minimal Player factory — only the fields getValueVsAdp reads matter here. */
const playerWith = (fields: Partial<Player>): Player => fields as Player;

describe("getConsensusSpread", () => {
  it("returns no label when the source does not publish expert spread", () => {
    expect(getConsensusSpread(playerWith({ rankEcr: 12 }))).toBeNull();
  });
});

describe("getSnapshotStaleness", () => {
  const draftSeasonNow = new Date("2026-08-07T12:00:00.000Z");

  it("buckets a recent date as fresh", () => {
    const recent = new Date(draftSeasonNow.getTime() - 1 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(recent, draftSeasonNow)).toBe("fresh");
  });

  it("uses the daily refresh schedule during draft season", () => {
    const aging = new Date(draftSeasonNow.getTime() - 3 * MS_PER_DAY).toISOString();
    const stale = new Date(draftSeasonNow.getTime() - 5 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(aging, draftSeasonNow)).toBe("aging");
    expect(getSnapshotStaleness(stale, draftSeasonNow)).toBe("stale");
  });

  it("keeps the weekly thresholds outside draft season", () => {
    const offseasonNow = new Date("2026-01-20T12:00:00.000Z");
    const aging = new Date(offseasonNow.getTime() - 10 * MS_PER_DAY).toISOString();
    const stale = new Date(offseasonNow.getTime() - 30 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(aging, offseasonNow)).toBe("aging");
    expect(getSnapshotStaleness(stale, offseasonNow)).toBe("stale");
  });

  it("holds the daily thresholds through the season, not just through September", () => {
    // The daily refresh lane runs July through December. The window used to
    // stop September 30, so a board refreshing every day was judged against
    // the 14-day offseason band for the whole regular season.
    const inSeasonNow = new Date("2026-11-10T12:00:00.000Z");
    const aging = new Date(inSeasonNow.getTime() - 3 * MS_PER_DAY).toISOString();
    const stale = new Date(inSeasonNow.getTime() - 5 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(aging, inSeasonNow)).toBe("aging");
    expect(getSnapshotStaleness(stale, inSeasonNow)).toBe("stale");
  });

  it("treats a missing or invalid date as stale rather than fresh", () => {
    expect(getSnapshotStaleness(null)).toBe("stale");
    expect(getSnapshotStaleness(undefined)).toBe("stale");
    expect(getSnapshotStaleness("not-a-date")).toBe("stale");
  });

  it("rejects a future source date", () => {
    expect(
      getSnapshotStaleness(
        "2099-01-01T00:00:00.000Z",
        new Date("2026-08-07T12:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("allows five minutes of publisher and device clock skew", () => {
    expect(
      getSnapshotStaleness(
        "2026-08-07T12:04:59.000Z",
        new Date("2026-08-07T12:00:00.000Z")
      )
    ).toBe("fresh");
  });
});

describe("getSnapshotStalenessLabel", () => {
  it("maps each band to a short label", () => {
    expect(getSnapshotStalenessLabel("fresh")).toBe("Current");
    expect(getSnapshotStalenessLabel("aging")).toBe("Aging");
    expect(getSnapshotStalenessLabel("stale")).toBe("Stale");
  });
});

describe("getFantasyAdpFreshness", () => {
  it("flags ADP from a calendar year before the snapshot season as prior-season", () => {
    expect(
      getFantasyAdpFreshness(
        "2025-09-10T00:00:00.000Z",
        2026,
        new Date("2026-05-01T00:00:00.000Z")
      )
    ).toBe("prior-season");
  });

  it("treats prior-season ADP as stale once draft season begins", () => {
    expect(
      getFantasyAdpFreshness(
        "2025-09-10T00:00:00.000Z",
        2026,
        new Date("2026-08-07T00:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("treats same-season ADP as current", () => {
    expect(
      getFantasyAdpFreshness(
        "2026-08-06T00:00:00.000Z",
        2026,
        new Date("2026-08-07T00:00:00.000Z")
      )
    ).toBe("current");
  });

  it("flags an old same-season ADP sample during draft season", () => {
    expect(
      getFantasyAdpFreshness(
        "2026-08-01T00:00:00.000Z",
        2026,
        new Date("2026-08-07T00:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("uses the fourteen-day boundary outside draft season", () => {
    expect(
      getFantasyAdpFreshness(
        "2026-08-01T00:00:00.000Z",
        2026,
        new Date("2026-10-01T00:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("rejects a future ADP source date", () => {
    expect(
      getFantasyAdpFreshness(
        "2099-01-01T00:00:00.000Z",
        2026,
        new Date("2026-08-07T00:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("allows five minutes of ADP publisher and device clock skew", () => {
    expect(
      getFantasyAdpFreshness(
        "2026-08-07T00:04:59.000Z",
        2026,
        new Date("2026-08-07T00:00:00.000Z")
      )
    ).toBe("current");
  });

  it("does not flag ADP dated after the season starts", () => {
    expect(
      getFantasyAdpFreshness(
        "2027-01-02T00:00:00.000Z",
        2026,
        new Date("2027-01-03T00:00:00.000Z")
      )
    ).toBe("current");
  });

  it("flags a frozen draft market as stale once the season is under way", () => {
    // Mock-draft ADP stops moving when real drafts end. The age check used to
    // run only from July through September, so from October a September board
    // fell through to a bare year comparison and read as a live market.
    expect(
      getFantasyAdpFreshness(
        "2026-09-09T00:00:00.000Z",
        2026,
        new Date("2026-11-10T00:00:00.000Z")
      )
    ).toBe("stale");
  });

  it("keeps a weekly spring refresh current rather than calling it stale", () => {
    // February through June the cron runs weekly, so a six-day-old board is
    // the pipeline working. The unconditional age check has to use the
    // offseason band here or it would raise a false alarm every week.
    expect(
      getFantasyAdpFreshness(
        "2026-04-01T00:00:00.000Z",
        2026,
        new Date("2026-04-07T00:00:00.000Z")
      )
    ).toBe("current");
  });

  it("fails closed when the source date or season is missing or invalid", () => {
    expect(getFantasyAdpFreshness(null, 2026)).toBe("stale");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", null)).toBe("stale");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", undefined)).toBe("stale");
    expect(getFantasyAdpFreshness("not-a-date", 2026)).toBe("stale");
  });
});

describe("getFantasySourceCapabilities", () => {
  it("separates current model inputs from a stale schedule", () => {
    const capabilities = getFantasySourceCapabilities({
      rankingAsOf: "2026-08-21T00:00:00.000Z",
      marketAsOf: "2026-08-21T00:00:00.000Z",
      scheduleAsOf: "2026-08-01T00:00:00.000Z",
      season: 2026,
      now: new Date("2026-08-22T00:00:00.000Z"),
    });

    expect(capabilities.ranking).toEqual({ freshness: "fresh", usable: true });
    expect(capabilities.market).toEqual({
      freshness: "current",
      usable: true,
      current: true,
    });
    expect(capabilities.schedule).toEqual({ freshness: "stale", usable: false });
  });

  it("keeps prior-season ADP as a labeled reference outside draft season", () => {
    const capabilities = getFantasySourceCapabilities({
      rankingAsOf: "2026-04-30T00:00:00.000Z",
      marketAsOf: "2025-09-10T00:00:00.000Z",
      season: 2026,
      now: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(capabilities.market).toEqual({
      freshness: "prior-season",
      usable: true,
      current: false,
    });
  });
});

describe("resolveDraftPicksForModel", () => {
  it("uses the current player record and removes unsupported ADP", () => {
    const savedPlayer = playerWith({ id: "wr-1", name: "Saved", position: "WR", adp: 25 });
    const currentPlayer = playerWith({
      id: "wr-1",
      name: "Current",
      position: "WR",
      rankEcr: 30,
      adp: 35,
      adpTimesDrafted: 100,
    });

    const [pick] = resolveDraftPicksForModel(
      [{ pickNumber: 40, player: savedPlayer }],
      [currentPlayer],
      false
    );

    expect(pick.player).toMatchObject({ name: "Current", rankEcr: 30 });
    expect(pick.player.adp).toBeUndefined();
    expect(pick.player.adpTimesDrafted).toBeUndefined();
  });

  it("never trusts market or expert baselines from an orphaned saved player", () => {
    const savedPlayer = playerWith({
      id: "wr-old",
      name: "Old",
      position: "WR",
      averageRank: 20,
      rankEcr: 18,
      adp: 25,
      superflexRank: 12,
    });
    const [pick] = resolveDraftPicksForModel(
      [{ pickNumber: 40, player: savedPlayer }],
      [],
      true
    );

    expect(pick.player.adp).toBeUndefined();
    expect(pick.player.rankEcr).toBeUndefined();
    expect(pick.player.superflexRank).toBeUndefined();
    expect(Number.isNaN(pick.player.averageRank)).toBe(true);
  });

  it("refreshes identity for a position-only player without using its position rank as an overall baseline", () => {
    const savedPlayer = playerWith({
      id: "k-position-only",
      name: "Old Kicker",
      team: "OLD",
      position: "K",
      averageRank: 9,
      rankEcr: 9,
      byeWeek: 4,
    });
    const currentPositionPlayer = playerWith({
      id: "k-position-only",
      name: "Current Kicker",
      team: "DAL",
      position: "K",
      averageRank: 2,
      rankEcr: 2,
      byeWeek: 10,
      adp: 170,
    });

    const [pick] = resolveDraftPicksForModel(
      [{ pickNumber: 160, player: savedPlayer }],
      [],
      true,
      [currentPositionPlayer]
    );

    expect(pick.player).toMatchObject({
      name: "Current Kicker",
      team: "DAL",
      position: "K",
      byeWeek: 10,
    });
    expect(pick.player.adp).toBeUndefined();
    expect(pick.player.rankEcr).toBeUndefined();
    expect(Number.isNaN(pick.player.averageRank)).toBe(true);
  });
});

describe("getValueVsAdp", () => {
  it("flags a value when the market drafts a player later than experts rank him", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20, adp: 35 }))).toEqual({ delta: 15, signal: "value" });
  });

  it("flags a reach when the market drafts a player earlier than experts rank him", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20, adp: 8 }))).toEqual({ delta: -12, signal: "reach" });
  });

  it("treats a sub-threshold gap as a delta with no signal", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20, adp: 25 }))).toEqual({ delta: 5, signal: null });
  });

  it("includes the boundary gap in the signal (>= and <= the threshold)", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20, adp: 30 }))?.signal).toBe("value");
    expect(getValueVsAdp(playerWith({ rankEcr: 20, adp: 10 }))?.signal).toBe("reach");
  });

  it("uses combined ADP and expert uncertainty when the source publishes it", () => {
    const player = playerWith({
      rankEcr: 20,
      adp: 28,
      adpStandardDeviation: 6,
      standardDeviation: 8,
      adpTimesDrafted: 100,
    });

    expect(getAdpSignalThreshold(player)).toBe(10);
    expect(getValueVsAdp(player)).toEqual({ delta: 8, signal: null });
    expect(getValueVsAdp({ ...player, adp: 30 })).toEqual({ delta: 10, signal: "value" });
  });

  it("keeps a six-pick noise floor for stable ADP and expert readings", () => {
    const player = playerWith({
      rankEcr: 20,
      adp: 26,
      adpStandardDeviation: 1,
      standardDeviation: 2,
      adpTimesDrafted: 100,
    });

    expect(getAdpSignalThreshold(player)).toBe(6);
    expect(getValueVsAdp(player)?.signal).toBe("value");
  });

  it("keeps the legacy ten-pick floor when expert spread is unavailable", () => {
    const player = playerWith({
      rankEcr: 20,
      adp: 29,
      adpStandardDeviation: 1,
      adpTimesDrafted: 100,
    });

    expect(getAdpSignalThreshold(player)).toBe(10);
    expect(getValueVsAdp(player)?.signal).toBeNull();
  });

  it("uses the observed ADP range when its standard deviation is unavailable", () => {
    const player = playerWith({
      adpHigh: 10,
      adpLow: 50,
      standardDeviation: 0,
    });

    expect(getAdpSignalThreshold(player)).toBe(10);
  });

  it("suppresses a label when fewer than twenty mock drafts selected the player", () => {
    const player = playerWith({
      rankEcr: 20,
      adp: 50,
      adpStandardDeviation: 2,
      standardDeviation: 2,
      adpTimesDrafted: ADP_SIGNAL_MIN_TIMES_DRAFTED - 1,
    });

    expect(getValueVsAdp(player)).toEqual({ delta: 30, signal: null });
    expect(getValueVsAdp({ ...player, adpTimesDrafted: ADP_SIGNAL_MIN_TIMES_DRAFTED })?.signal).toBe(
      "value"
    );
  });

  it("falls back to averageRank when rankEcr is missing", () => {
    expect(getValueVsAdp(playerWith({ averageRank: 12, adp: 30 }))).toEqual({ delta: 18, signal: "value" });
  });

  it("returns null when there is no ADP or no usable rank", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20 }))).toBeNull();
    expect(getValueVsAdp(playerWith({ adp: 30 }))).toBeNull();
  });

  it("returns null past the rank where a 12-team draft board runs out of picks", () => {
    // A rank-300 player cannot go later than the last pick, so the gap only
    // measures the length of the draft.
    expect(
      getValueVsAdp(playerWith({ rankEcr: ADP_COMPARABLE_MAX_RANK + 1, adp: 180, adpTimesDrafted: 500 }))
    ).toBeNull();
    expect(
      getValueVsAdp(playerWith({ rankEcr: ADP_COMPARABLE_MAX_RANK, adp: 180, adpTimesDrafted: 500 }))
    ).toEqual({ delta: 30, signal: "value" });
  });

  it("keeps a sub-pick gap sub-pick instead of rounding it to a whole slot", () => {
    // Gibbs on the 2026-08-16 half PPR board: ECR 1, ADP 1.5. Rounding read "+1".
    const gibbs = playerWith({ rankEcr: 1, adp: 1.5, adpTimesDrafted: 358 });
    expect(getValueVsAdp(gibbs)?.delta).toBeCloseTo(0.5);
    expect(formatPickDelta(getValueVsAdp(gibbs)!.delta)).toBe("+0.5");
  });

  it("returns null for kickers and defenses, which consensus does not rank on the draft scale", () => {
    for (const position of ["K", "DST"] as const) {
      expect(
        getValueVsAdp(playerWith({ position, rankEcr: 140, adp: 100, adpTimesDrafted: 500 }))
      ).toBeNull();
    }
  });
});

describe("getTierRailIntensity", () => {
  it("is solid at tier 1", () => {
    expect(getTierRailIntensity(1)).toBe(100);
  });

  it("fades by 13 points per tier", () => {
    expect(getTierRailIntensity(2)).toBe(87);
    expect(getTierRailIntensity(3)).toBe(74);
  });

  it("floors at 12 rather than fading to zero or negative", () => {
    expect(getTierRailIntensity(8)).toBe(12);
    expect(getTierRailIntensity(20)).toBe(12);
  });

  it("returns 0 for an untiered or invalid tier", () => {
    expect(getTierRailIntensity(undefined)).toBe(0);
    expect(getTierRailIntensity(null)).toBe(0);
    expect(getTierRailIntensity(Number.NaN)).toBe(0);
  });
});

describe("getTierRailTone", () => {
  it("formats the intensity as a color-mix percentage", () => {
    expect(getTierRailTone(1)).toBe("100%");
    expect(getTierRailTone(8)).toBe("12%");
    expect(getTierRailTone(undefined)).toBe("0%");
  });
});

describe("tooltip copy", () => {
  it("honors the writing voice (no em dashes, no colon-as-connector labels)", () => {
    expect(FANTASY_VALUE_TOOLTIP).not.toContain("—");
    expect(FANTASY_REACH_TOOLTIP).not.toContain("—");
    // "Value:" / "Reach:" would be a colon connector; the copy uses "... means ...".
    expect(FANTASY_VALUE_TOOLTIP).not.toMatch(/^Value:/);
    expect(FANTASY_REACH_TOOLTIP).not.toMatch(/^Reach:/);
  });
});

describe("formatPickDelta", () => {
  it("signs the gap and drops a trailing zero", () => {
    expect(formatPickDelta(12)).toBe("+12");
    expect(formatPickDelta(-12)).toBe("\u221212");
    expect(formatPickDelta(0.5)).toBe("+0.5");
    expect(formatPickDelta(-0.5)).toBe("\u22120.5");
  });

  it("shows an unsigned zero rather than a signed rounding artifact", () => {
    expect(formatPickDelta(0)).toBe("0");
    expect(formatPickDelta(-0.04)).toBe("0");
  });
});
