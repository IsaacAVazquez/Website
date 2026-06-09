import type {
  TechStartup,
  TechStartupSegment,
  TechStartupSnapshot,
} from "@/types/techStartup";
import {
  buildTechStartupHref,
  DEFAULT_TECH_STARTUP_STATE,
  normalizeTechStartupState,
  resolveTechStartupState,
} from "../tech-startup-state";

const startup: TechStartup = {
  id: "openai",
  name: "OpenAI",
  description: "Fixture startup",
  sector: "sector-ai",
  stage: "stage-late",
  headquarters: "San Francisco, CA",
  country: "United States",
  founded: 2015,
  website: "https://openai.com",
  totalRaised: 64_000_000_000,
  valuation: 300_000_000_000,
  employees: "1,001-5,000",
  lastRound: {
    stage: "Late-stage round",
    amount: 40_000_000_000,
    date: "2025-03",
    leadInvestors: ["SoftBank"],
  },
  notableInvestors: ["Microsoft"],
  tags: ["foundation models"],
  momentumScore: 74,
};

function segment(overrides: Partial<TechStartupSegment>): TechStartupSegment {
  return {
    key: "sector-ai",
    label: "AI & ML",
    kind: "sector",
    startupIds: ["openai"],
    startupCount: 1,
    totalRaised: 64_000_000_000,
    totalValuation: 300_000_000_000,
    topStartupId: "openai",
    ...overrides,
  };
}

const snapshot: TechStartupSnapshot = {
  generatedAt: "2026-06-09T00:00:00.000Z",
  asOf: "2026-05-01",
  verified: false,
  sourceLabel: "Fixture",
  sourceUrl: "https://example.com",
  disclaimer: "Illustrative.",
  currency: "USD",
  startups: [startup],
  sectors: [segment({ key: "sector-ai", label: "AI & ML", kind: "sector" })],
  stages: [
    segment({ key: "stage-late", label: "Late stage", kind: "stage" }),
  ],
  totals: {
    startups: 1,
    sectors: 1,
    stages: 1,
    totalRaised: 64_000_000_000,
    totalValuation: 300_000_000_000,
    unicornCount: 1,
  },
};

describe("tech-startup-state", () => {
  it("normalizes valid and invalid params", () => {
    expect(normalizeTechStartupState({})).toEqual(DEFAULT_TECH_STARTUP_STATE);
    expect(
      normalizeTechStartupState({
        view: "stage",
        segment: " stage-late ",
        sort: "valuation",
        startup: " openai ",
      })
    ).toEqual({
      kind: "stage",
      segment: "stage-late",
      sort: "valuation",
      selectedStartupId: "openai",
    });
    expect(
      normalizeTechStartupState({
        view: "country",
        sort: "headcount",
      })
    ).toEqual(DEFAULT_TECH_STARTUP_STATE);
  });

  it("resolves segment and startup ids against the snapshot", () => {
    expect(
      resolveTechStartupState(
        {
          kind: "stage",
          segment: "stage-late",
          sort: "recent",
          selectedStartupId: "openai",
        },
        snapshot
      )
    ).toEqual({
      kind: "stage",
      segment: "stage-late",
      sort: "recent",
      selectedStartupId: "openai",
    });

    expect(
      resolveTechStartupState(
        {
          kind: "sector",
          segment: "missing",
          sort: "momentum",
          selectedStartupId: "unknown",
        },
        snapshot
      )
    ).toEqual({
      kind: "sector",
      segment: "all",
      sort: "momentum",
      selectedStartupId: null,
    });
  });

  it("builds hrefs while preserving unrelated params and clearing defaults", () => {
    expect(
      buildTechStartupHref(
        {
          kind: "stage",
          segment: "stage-late",
          sort: "valuation",
          selectedStartupId: "openai",
        },
        new URLSearchParams("ref=portfolio")
      )
    ).toBe(
      "/tech-startup-tracker?ref=portfolio&view=stage&segment=stage-late&sort=valuation&startup=openai"
    );

    expect(
      buildTechStartupHref(
        DEFAULT_TECH_STARTUP_STATE,
        new URLSearchParams(
          "ref=portfolio&view=stage&segment=stage-late&sort=valuation&startup=openai"
        )
      )
    ).toBe("/tech-startup-tracker?ref=portfolio");
  });
});
