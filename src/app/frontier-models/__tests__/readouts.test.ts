import { frontierReadouts } from "../readouts";
import type { FrontierModel } from "@/types/frontierModels";

function model(overrides: Partial<FrontierModel> & { id: string }): FrontierModel {
  return {
    provider: "openai",
    providerLabel: "OpenAI",
    name: "Model",
    releaseDate: "2026-01-01",
    knowledgeCutoff: null,
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputPricePerMTokens: 1,
    outputPricePerMTokens: 2,
    priceTier: "standard",
    modalities: ["text"],
    reasoning: false,
    editorialNote: "",
    docsUrl: null,
    ...overrides,
  };
}

describe("frontierReadouts", () => {
  it("counts every model", () => {
    expect(frontierReadouts([model({ id: "a" }), model({ id: "b" })]).count).toBe(2);
  });

  it("picks the cheapest model by input price", () => {
    const cheap = model({ id: "cheap", name: "Cheap", inputPricePerMTokens: 0.5 });
    const pricey = model({ id: "pricey", name: "Pricey", inputPricePerMTokens: 5 });
    expect(frontierReadouts([pricey, cheap]).cheapest).toBe(cheap);
  });

  it("breaks a price tie on name", () => {
    const zed = model({ id: "zed", name: "Zed", inputPricePerMTokens: 1 });
    const alpha = model({ id: "alpha", name: "Alpha", inputPricePerMTokens: 1 });
    expect(frontierReadouts([zed, alpha]).cheapest).toBe(alpha);
  });

  it("leaves out models with no listed price from cheapest", () => {
    const unpriced = model({ id: "unpriced", inputPricePerMTokens: null });
    const priced = model({ id: "priced", inputPricePerMTokens: 3 });
    expect(frontierReadouts([unpriced, priced]).cheapest).toBe(priced);
  });

  it("picks the largest context window", () => {
    const small = model({ id: "small", contextWindow: 32000 });
    const big = model({ id: "big", contextWindow: 2000000 });
    expect(frontierReadouts([small, big]).largestContext).toBe(big);
  });

  it("returns nulls and zero for an empty snapshot", () => {
    expect(frontierReadouts([])).toEqual({ count: 0, cheapest: null, largestContext: null });
  });
});
