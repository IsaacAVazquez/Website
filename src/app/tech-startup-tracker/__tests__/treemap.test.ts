import { valuationTreemap } from "../treemap";

const startup = (id: string, sector: string, valuation: number | null) =>
  ({ id, name: id, sector, valuation }) as never;

it("returns nothing for empty input", () => {
  expect(valuationTreemap([], 1000, 520)).toEqual([]);
});

it("drops startups with a missing, zero, or negative valuation", () => {
  const result = valuationTreemap(
    [
      startup("a", "ai", 100),
      startup("b", "ai", 0),
      startup("c", "ai", -5),
      startup("d", "ai", null),
    ],
    1000,
    520
  );
  const ids = result.flatMap((sector) => sector.tiles.map((tile) => tile.id));
  expect(ids).toEqual(["a"]);
});

it("sizes tiles proportional to valuation and keeps them inside their sector", () => {
  const [sector] = valuationTreemap(
    [startup("big", "ai", 300), startup("small", "ai", 100)],
    1000,
    520
  );
  const big = sector.tiles.find((tile) => tile.id === "big")!;
  const small = sector.tiles.find((tile) => tile.id === "small")!;
  const area = (t: typeof big) => (t.x1 - t.x0) * (t.y1 - t.y0);
  const ratio = area(big) / area(small);
  expect(Math.abs(ratio - 3) / 3).toBeLessThan(0.02);

  for (const tile of sector.tiles) {
    expect(tile.x0).toBeGreaterThanOrEqual(sector.x0 - 0.01);
    expect(tile.x1).toBeLessThanOrEqual(sector.x1 + 0.01);
    expect(tile.y0).toBeGreaterThanOrEqual(sector.y0 - 0.01);
    expect(tile.y1).toBeLessThanOrEqual(sector.y1 + 0.01);
  }
});

it("keeps every sector inside the frame", () => {
  const result = valuationTreemap(
    [startup("a", "ai", 300), startup("b", "fintech", 200), startup("c", "fintech", 50)],
    1000,
    520
  );
  for (const sector of result) {
    expect(sector.x0).toBeGreaterThanOrEqual(0);
    expect(sector.y0).toBeGreaterThanOrEqual(0);
    expect(sector.x1).toBeLessThanOrEqual(1000);
    expect(sector.y1).toBeLessThanOrEqual(520);
  }
});

it("keeps tiles close to square instead of slicing a busy sector into slivers", () => {
  const startups = Array.from({ length: 12 }, (_, i) => ({
    id: `s${i}`,
    name: `S${i}`,
    sector: "ai",
    valuation: 10,
  }));
  const [sector] = valuationTreemap(startups, 1000, 520);
  const worst = Math.max(
    ...sector.tiles.map((t) => {
      const w = t.x1 - t.x0;
      const h = t.y1 - t.y0;
      return Math.max(w / h, h / w);
    }),
  );
  expect(worst).toBeLessThanOrEqual(3);
});
