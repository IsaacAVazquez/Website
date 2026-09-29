import { BRACKET, type RegionData } from "../march-madness-data";
import { regionBracket } from "../bracketLayout";

describe("regionBracket", () => {
  it("flags a real upset pick (East: UCF 10-seed over UCLA 7-seed)", () => {
    const layout = regionBracket(BRACKET.east);
    const game = layout.games.find(
      (g) => g.round === "r1" && g.slots.some((slot) => slot.name === "UCF")
    );

    expect(game).toBeDefined();
    expect(game!.slots[0]).toEqual({ name: "UCF", seed: 10 });
    expect(game!.slots[1]).toEqual({ name: "UCLA", seed: 7 });
    expect(game!.winnerIndex).toBe(0);
    expect(game!.isUpset).toBe(true);
  });

  it("looks up seeds for later rounds from round one", () => {
    const layout = regionBracket(BRACKET.east);
    const r2Game = layout.games.find((g) => g.round === "r2" && g.index === 0);

    expect(r2Game).toBeDefined();
    expect(r2Game!.slots).toEqual([
      { name: "Duke", seed: 1 },
      { name: "Ohio St.", seed: 8 },
    ]);

    const e8Game = layout.games.find((g) => g.round === "e8");
    expect(e8Game).toBeDefined();
    expect(e8Game!.slots).toEqual([
      { name: "Duke", seed: 1 },
      { name: "Michigan St.", seed: 3 },
    ]);
    expect(e8Game!.note).toContain("Duke to Final Four");
  });

  it("computes y-centres that flow from round one into later rounds", () => {
    const layout = regionBracket(BRACKET.east);
    const r1 = layout.games.filter((g) => g.round === "r1");
    const r2Game0 = layout.games.find((g) => g.round === "r2" && g.index === 0)!;

    expect(r2Game0.feederY).toEqual([r1[0].y, r1[1].y]);
    expect(r2Game0.y).toBeCloseTo((r1[0].y + r1[1].y) / 2);
  });

  it("reports no upsets for a region where every pick is chalk", () => {
    const chalk = {
      region: "Chalk",
      site: "Nowhere, USA",
      winner: "Alpha",
      r1: [
        { s1: 1, t1: "Alpha", s2: 16, t2: "Zulu", w: 1, tags: [] },
        { s1: 8, t1: "Bravo", s2: 9, t2: "Yankee", w: 1, tags: [] },
      ],
      r2: [{ t1: "Alpha", t2: "Bravo", w: 1, tags: [] }],
      s16: [],
      e8: { t1: "", t2: "", w: 0, note: "" },
    };

    const layout = regionBracket(chalk);
    expect(layout.games.some((g) => g.isUpset)).toBe(false);
  });

  it("does not throw on a malformed or missing later round", () => {
    const malformed = {
      region: "Malformed",
      site: "Nowhere, USA",
      winner: "Alpha",
      r1: [{ s1: 1, t1: "Alpha", s2: 16, t2: "Zulu", w: 1, tags: [] }],
      // r2 missing entirely, s16 wrong shape, e8 undefined
      r2: undefined as unknown as never,
      s16: null as unknown as never,
      e8: undefined as unknown as never,
    };

    expect(() => regionBracket(malformed)).not.toThrow();
    const layout = regionBracket(malformed);
    expect(layout.games.filter((g) => g.round === "r1")).toHaveLength(1);
    expect(layout.games.filter((g) => g.round === "r2")).toHaveLength(0);
    expect(layout.games.filter((g) => g.round === "e8")).toHaveLength(0);
  });

  it("keeps a later round's fallback y-centre inside the 0..1 bracket height when only some of its games have a feeder pair", () => {
    // r1 only has 2 games (a malformed/incomplete round), but r2 has 2 games,
    // so r2 index 0 has a feeder pair (r1[0]/r1[1]) while r2 index 1 does not
    // (r1[2]/r1[3] don't exist) and must fall back.
    const partial = {
      region: "Partial",
      site: "Nowhere, USA",
      winner: null,
      r1: [
        { s1: 1, t1: "Alpha", s2: 16, t2: "Zulu", w: 1, tags: [] },
        { s1: 8, t1: "Bravo", s2: 9, t2: "Yankee", w: 1, tags: [] },
      ],
      r2: [
        { t1: "Alpha", t2: "Bravo", w: 0, tags: [] },
        { t1: "Charlie", t2: "Delta", w: 0, tags: [] },
      ],
      s16: [],
    } as unknown as RegionData;

    const layout = regionBracket(partial);
    const r2Games = layout.games.filter((g) => g.round === "r2");
    expect(r2Games).toHaveLength(2);

    expect(r2Games[0].feederY).not.toBeNull();
    expect(r2Games[1].feederY).toBeNull();
    // The old fallback (`index + 0.5`) gave 1.5, well outside the 0..1 range
    // BracketGame.y documents and RegionBracket.tsx multiplies by the chart's
    // full height, which pushed the game far below the visible bracket.
    expect(r2Games[1].y).toBeCloseTo(0.75);
    expect(r2Games[1].y).toBeGreaterThanOrEqual(0);
    expect(r2Games[1].y).toBeLessThanOrEqual(1);
  });

  it("handles a missing region without throwing", () => {
    expect(() => regionBracket(undefined)).not.toThrow();
    expect(regionBracket(undefined).games).toHaveLength(0);
  });
});
