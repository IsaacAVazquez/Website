import { leadStory, coverageMatrix } from "../front-page";

const cluster = (id: string, sources: Record<string, number>, totalCount: number) =>
  ({ id, topic: id, sources, totalCount, articles: [] }) as never;

it("leads with the story the most outlets carried", () => {
  const wide = cluster("wide", { bbc: 1, nyt: 1, npr: 1 }, 3);
  const loud = cluster("loud", { bbc: 9 }, 9);
  expect(leadStory([loud, wide])).toBe(wide);
});

it("breaks outlet ties on total count", () => {
  const a = cluster("a", { bbc: 1, nyt: 1 }, 2);
  const b = cluster("b", { bbc: 3, nyt: 2 }, 5);
  expect(leadStory([a, b])).toBe(b);
});

it("fills zeros and keeps outlet order in the matrix", () => {
  const m = coverageMatrix([{ topic: "fed", count: 3, sources: { nyt: 3 } }] as never, ["bbc", "nyt"] as never);
  expect(m.rows).toEqual([{ outlet: "bbc", counts: [0] }, { outlet: "nyt", counts: [3] }]);
  expect(m.max).toBe(3);
});

it("handles an empty pull", () => {
  expect(leadStory([])).toBeNull();
  expect(coverageMatrix([], ["bbc"] as never)).toEqual({ topics: [], rows: [{ outlet: "bbc", counts: [] }], max: 0 });
});
