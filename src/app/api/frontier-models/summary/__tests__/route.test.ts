/**
 * @jest-environment node
 */
jest.mock("@/lib/frontierModelsSnapshot", () => ({
  getFrontierModelsSnapshot: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { GET } from "../route";
import { getFrontierModelsSnapshot } from "@/lib/frontierModelsSnapshot";
import { logger } from "@/lib/logger";

const mockGetSnapshot = getFrontierModelsSnapshot as jest.MockedFunction<
  typeof getFrontierModelsSnapshot
>;
const mockLoggerError = logger.error as jest.MockedFunction<
  typeof logger.error
>;

function makeSnapshot(withLiveFacts: boolean) {
  return {
    generatedAt: "2026-07-20T07:30:00.000Z",
    asOf: "2026-07-20",
    verified: false,
    sourceLabel: "Curated by Isaac Vazquez",
    models: [
      {
        id: "anthropic-claude-opus-4-8",
        provider: "anthropic" as const,
        providerLabel: "Anthropic",
        name: "Claude Opus 4.8",
        releaseDate: "2026-06-01",
        knowledgeCutoff: "2026-01",
        contextWindow: 200000,
        maxOutputTokens: 64000,
        inputPricePerMTokens: 15,
        outputPricePerMTokens: 75,
        priceTier: "premium" as const,
        modalities: ["text" as const],
        reasoning: true,
        editorialNote: "Note.",
        docsUrl: null,
      },
    ],
    providers: [{ id: "anthropic" as const, label: "Anthropic", count: 1 }],
    priceTiers: [{ id: "premium" as const, label: "Premium", count: 1 }],
    ...(withLiveFacts
      ? {
          liveFacts: {
            checkedAt: "2026-07-20T07:30:00.000Z",
            sources: ["models.dev", "openrouter"],
            updated: 1,
            confirmed: 0,
            curatedOnly: 0,
          },
        }
      : {}),
  };
}

describe("GET /api/frontier-models/summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the snapshot with cache headers and the surface cache tag", async () => {
    mockGetSnapshot.mockResolvedValue(makeSnapshot(true));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.models).toHaveLength(1);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=300, stale-while-revalidate=3600"
    );
    expect(response.headers.get("Netlify-Cache-Tag")).toBe("frontier-models");
    expect(response.headers.get("X-Data-Source")).toBe(
      "curated-with-daily-fact-check"
    );
    expect(response.headers.get("X-Data-Revision")).toMatch(/^[a-f0-9]{64}$/);
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("labels the curated seed when no fact check has run", async () => {
    mockGetSnapshot.mockResolvedValue(makeSnapshot(false));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Data-Source")).toBe("curated-seed");
  });

  it("returns a logged, uncached 500 on failure", async () => {
    mockGetSnapshot.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("boom");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
