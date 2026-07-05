import {
  FANTASY_BOARD_LEGEND,
  FANTASY_REACH_TOOLTIP,
  FANTASY_VALUE_TOOLTIP,
  getFantasyAdpFreshness,
  getSnapshotStaleness,
  getSnapshotStalenessLabel,
  getTierPlateAccent,
  getTierRailIntensity,
  getTierRailTone,
  getValueVsAdp,
} from "@/lib/fantasyUtils";
import type { Player } from "@/types";

const MS_PER_DAY = 86_400_000;

/** Minimal Player factory — only the fields getValueVsAdp reads matter here. */
const playerWith = (fields: Partial<Player>): Player => fields as Player;

describe("getSnapshotStaleness", () => {
  it("buckets a recent date as fresh", () => {
    const recent = new Date(Date.now() - 1 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(recent)).toBe("fresh");
  });

  it("buckets an 8-14 day old date as aging", () => {
    const aging = new Date(Date.now() - 10 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(aging)).toBe("aging");
  });

  it("buckets a date older than two weeks as stale", () => {
    const stale = new Date(Date.now() - 30 * MS_PER_DAY).toISOString();
    expect(getSnapshotStaleness(stale)).toBe("stale");
  });

  it("treats a missing or invalid date as stale rather than fresh", () => {
    expect(getSnapshotStaleness(null)).toBe("stale");
    expect(getSnapshotStaleness(undefined)).toBe("stale");
    expect(getSnapshotStaleness("not-a-date")).toBe("stale");
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
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", 2026)).toBe("prior-season");
  });

  it("treats same-season ADP as current", () => {
    expect(getFantasyAdpFreshness("2026-07-01T00:00:00.000Z", 2026)).toBe("current");
  });

  it("does not flag ADP dated after the season starts", () => {
    expect(getFantasyAdpFreshness("2027-01-02T00:00:00.000Z", 2026)).toBe("current");
  });

  it("returns current when there is nothing to compare against", () => {
    expect(getFantasyAdpFreshness(null, 2026)).toBe("current");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", null)).toBe("current");
    expect(getFantasyAdpFreshness("2025-09-10T00:00:00.000Z", undefined)).toBe("current");
    expect(getFantasyAdpFreshness("not-a-date", 2026)).toBe("current");
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

  it("falls back to averageRank when rankEcr is missing", () => {
    expect(getValueVsAdp(playerWith({ averageRank: 12, adp: 30 }))).toEqual({ delta: 18, signal: "value" });
  });

  it("returns null when there is no ADP or no usable rank", () => {
    expect(getValueVsAdp(playerWith({ rankEcr: 20 }))).toBeNull();
    expect(getValueVsAdp(playerWith({ adp: 30 }))).toBeNull();
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

describe("getTierPlateAccent", () => {
  it("gives the top plate the top weight and the bottom plate the bottom weight", () => {
    expect(getTierPlateAccent(0, 4)).toBe("26%");
    expect(getTierPlateAccent(3, 4)).toBe("8%");
  });

  it("returns a fixed accent when there is only one tier on screen", () => {
    expect(getTierPlateAccent(0, 1)).toBe("24%");
  });
});

describe("FANTASY_BOARD_LEGEND", () => {
  it("covers every term a reader meets on the board", () => {
    const terms = FANTASY_BOARD_LEGEND.map((entry) => entry.term);
    expect(terms).toEqual(
      expect.arrayContaining(["Published rank", "Expert range", "Avg", "ADP", "Value", "Reach", "Tiers", "Freshness"])
    );
  });

  it("gives every entry a non-empty term and definition", () => {
    for (const entry of FANTASY_BOARD_LEGEND) {
      expect(entry.term.trim().length).toBeGreaterThan(0);
      expect(entry.definition.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the Value and Reach entries in sync with the inline hover copy", () => {
    const value = FANTASY_BOARD_LEGEND.find((entry) => entry.term === "Value");
    const reach = FANTASY_BOARD_LEGEND.find((entry) => entry.term === "Reach");
    expect(value).toMatchObject({ tone: "value", definition: FANTASY_VALUE_TOOLTIP });
    expect(reach).toMatchObject({ tone: "reach", definition: FANTASY_REACH_TOOLTIP });
  });

  it("honors the writing voice (no em dashes, no colon-as-connector labels)", () => {
    for (const entry of FANTASY_BOARD_LEGEND) {
      expect(entry.definition).not.toContain("—");
    }
    // "Value:" / "Reach:" would be a colon connector; the copy uses "... means ...".
    expect(FANTASY_VALUE_TOOLTIP).not.toMatch(/^Value:/);
    expect(FANTASY_REACH_TOOLTIP).not.toMatch(/^Reach:/);
  });
});
