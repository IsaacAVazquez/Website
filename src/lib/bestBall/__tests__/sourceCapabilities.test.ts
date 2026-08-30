/**
 * @jest-environment node
 */
import {
  getBestBallModelSourceIssue,
  getBestBallRankingSource,
} from "@/lib/bestBall/sourceCapabilities";
import { getContestPreset } from "@/lib/bestBall/contests";
import {
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  type BestBallSnapshot,
  type BestBallSourceMetadata,
} from "@/lib/bestBallSnapshot";

const NOW = new Date("2026-08-10T12:00:00.000Z");
const FRESH_AS_OF = "2026-08-09T12:00:00.000Z";
const STALE_AS_OF = "2026-08-01T00:00:00.000Z";

function source(
  provider: string,
  asOf: string = FRESH_AS_OF
): BestBallSourceMetadata {
  return {
    provider,
    url: `https://example.com/${provider.toLowerCase().replaceAll(" ", "-")}`,
    asOf,
  };
}

const COMPLETE_WEEK_17 = Object.fromEntries(
  Array.from({ length: 30 }, (_, index) => [
    `TEAM-${index + 1}`,
    `OPP-${index + 1}`,
  ])
);

function snapshot(overrides: Partial<BestBallSnapshot> = {}): BestBallSnapshot {
  return {
    schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
    season: 2026,
    generatedAt: FRESH_AS_OF,
    players: [],
    rankingSource: source("Standard rankings"),
    superflexSource: source("Superflex rankings"),
    adpSource: source("Underdog ADP"),
    scheduleSource: source("Week 17 schedule"),
    week17Opponents: COMPLETE_WEEK_17,
    ...overrides,
  };
}

describe("best ball source capabilities", () => {
  it("allows an exact standard contest when every required source is fresh and complete", () => {
    const current = snapshot();
    const preset = getContestPreset("bbm-vii");

    expect(getBestBallRankingSource(current, preset)).toBe(current.rankingSource);
    expect(getBestBallModelSourceIssue(current, preset, NOW)).toBeNull();
  });

  it.each([
    {
      label: "missing",
      adpSource: null,
      issue: "the matching standard-season Underdog ADP source is unavailable",
    },
    {
      label: "stale",
      adpSource: source("Underdog ADP", STALE_AS_OF),
      issue: "the matching standard-season Underdog ADP source is stale",
    },
  ])("withholds an exact standard contest when matching ADP is $label", ({ adpSource, issue }) => {
    expect(
      getBestBallModelSourceIssue(
        snapshot({ adpSource }),
        getContestPreset("bbm-vii"),
        NOW
      )
    ).toBe(issue);
  });

  it("does not require matching ADP or a Week 17 schedule for a reference profile that uses neither", () => {
    const reference = snapshot({
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });

    expect(
      getBestBallModelSourceIssue(reference, getContestPreset("eliminator"), NOW)
    ).toBeNull();
  });

  it("uses the Superflex ranking source instead of the stale standard board", () => {
    const current = snapshot({
      rankingSource: source("Standard rankings", STALE_AS_OF),
      superflexSource: source("Superflex rankings"),
      adpSource: null,
      scheduleSource: null,
      week17Opponents: {},
    });
    const preset = getContestPreset("superflex");

    expect(getBestBallRankingSource(current, preset)).toBe(current.superflexSource);
    expect(getBestBallModelSourceIssue(current, preset, NOW)).toBeNull();
  });

  it("withholds a Week 17 profile when the fresh schedule mapping is incomplete", () => {
    const incomplete = Object.fromEntries(Object.entries(COMPLETE_WEEK_17).slice(0, 29));

    expect(
      getBestBallModelSourceIssue(
        snapshot({ week17Opponents: incomplete }),
        getContestPreset("bbm-vii"),
        NOW
      )
    ).toBe("the Week 17 schedule source is incomplete");
  });
});
