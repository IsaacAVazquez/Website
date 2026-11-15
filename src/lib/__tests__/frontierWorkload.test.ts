import { makeModel } from "@/app/frontier-models/components/__tests__/fixtures/models";
import {
  DEFAULT_FRONTIER_WORKLOAD,
  compareFrontierWorkload,
  decodeFrontierWorkload,
  parseFrontierComparisons,
} from "../frontierWorkload";

const input = { ...DEFAULT_FRONTIER_WORKLOAD };
const model = makeModel({ id: "alpha", name: "Alpha" });
const saved = {
  id: "comparison-one",
  name: "Support replies",
  input,
  modelIds: ["alpha"],
  savedAt: "2026-10-24T12:00:00.000Z",
  snapshotGeneratedAt: "2026-10-23T07:30:00.000Z",
};

it("prices the same monthly workload with separate input and output costs", () => {
  const result = compareFrontierWorkload(model, input);
  expect(result).toMatchObject({
    inputCost: 60,
    outputCost: 75,
    totalCost: 135,
    unmet: [],
    unconfirmed: [],
  });
});

it("does not turn a missing price into a complete estimate", () => {
  const result = compareFrontierWorkload(
    { ...model, outputPricePerMTokens: null },
    input,
  );
  expect(result).toMatchObject({
    inputCost: 60,
    outputCost: null,
    totalCost: null,
  });
  expect(
    compareFrontierWorkload(
      { ...model, inputPricePerMTokens: null },
      { ...input, inputTokens: 0 },
    ).totalCost,
  ).toBe(75);
  expect(
    compareFrontierWorkload(
      { ...model, inputPricePerMTokens: null, outputPricePerMTokens: null },
      { ...input, monthlyRequests: 0 },
    ).totalCost,
  ).toBe(0);
});

it("checks combined context, output limits, and every requested capability", () => {
  const result = compareFrontierWorkload(
    {
      ...model,
      contextWindow: 2_100,
      maxOutputTokens: 100,
      modalities: ["text"],
      reasoning: false,
    },
    { ...input, vision: true, audio: true, reasoning: true },
  );
  expect(result.unmet).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/context/i),
      expect.stringMatching(/output limit/i),
      expect.stringMatching(/vision/i),
      expect.stringMatching(/audio/i),
      expect.stringMatching(/reasoning/i),
    ]),
  );
  expect(result.unmet).toHaveLength(5);
  expect(result.totalCost).toBe(135);
});

it("accepts exact context and output boundaries and distinguishes an unpublished limit", () => {
  expect(
    compareFrontierWorkload(
      { ...model, contextWindow: 2_500, maxOutputTokens: 500 },
      input,
    ).unmet,
  ).toEqual([]);
  expect(
    compareFrontierWorkload({ ...model, maxOutputTokens: null }, input)
      .unconfirmed,
  ).toEqual([expect.stringMatching(/output limit/i)]);
});

it("keeps invalid source prices and arithmetic overflow unknown", () => {
  for (const price of [-1, Infinity, NaN, Number.MAX_VALUE]) {
    expect(
      compareFrontierWorkload({ ...model, inputPricePerMTokens: price }, input)
        .totalCost,
    ).toBeNull();
  }
});

it.each([NaN, Infinity, -1, 0.5, 1_000_000_001, "1000", null])(
  "rejects invalid request counts %p",
  (monthlyRequests) => {
    expect(decodeFrontierWorkload({ ...input, monthlyRequests })).toBeNull();
  },
);

it("requires explicit valid token counts and capability flags", () => {
  expect(
    decodeFrontierWorkload({ ...input, inputTokens: 10_000_001 }),
  ).toBeNull();
  expect(decodeFrontierWorkload({ ...input, outputTokens: -1 })).toBeNull();
  expect(decodeFrontierWorkload({ ...input, vision: "false" })).toBeNull();
  expect(decodeFrontierWorkload({ monthlyRequests: 10 })).toBeNull();
  expect(
    decodeFrontierWorkload({
      ...input,
      monthlyRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
    }),
  ).not.toBeNull();
});

it("restores validated records and retains identifiers missing from the current catalog", () => {
  expect(
    parseFrontierComparisons(
      JSON.stringify([{ ...saved, modelIds: ["old-model", "alpha", "alpha"] }]),
    ),
  ).toEqual([{ ...saved, modelIds: ["old-model", "alpha"] }]);
});

it("rejects malformed records, impossible timestamps, and invalid restored numbers", () => {
  const records = [
    saved,
    saved,
    { ...saved, id: "bad-input", input: { ...input, outputTokens: -1 } },
    { ...saved, id: "bad-date", savedAt: "2026-02-30T00:00:00.000Z" },
    { ...saved, id: "empty", modelIds: [] },
    { ...saved, id: "bad-id", modelIds: ["javascript:alert(1)"] },
  ];
  expect(parseFrontierComparisons(JSON.stringify(records))).toEqual([saved]);
  expect(parseFrontierComparisons("not json")).toEqual([]);
  expect(parseFrontierComparisons("{}")).toEqual([]);
});

it("bounds the restored collection and rejects overlarge comparisons", () => {
  expect(
    parseFrontierComparisons(
      JSON.stringify(
        Array.from({ length: 25 }, (_, i) => ({
          ...saved,
          id: `comparison-${i}`,
        })),
      ),
    ),
  ).toHaveLength(20);
  expect(
    parseFrontierComparisons(
      JSON.stringify([{ ...saved, modelIds: ["a", "b", "c", "d", "e"] }]),
    ),
  ).toEqual([]);
});
