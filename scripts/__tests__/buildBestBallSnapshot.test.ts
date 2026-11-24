/**
 * @jest-environment node
 */
import { assembleBestBallSnapshot } from "../buildBestBallSnapshot";
import {
  BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  type BestBallSnapshot,
} from "@/lib/bestBallSnapshot";
import type { FantasyAdpEntry } from "@/lib/fantasyAdpSource";
import { FANTASY_PROS_PUBLIC_SOURCE } from "@/lib/fantasyProsPublicSource";
import type { Player } from "@/types";

const SEASON = 2026;
const NOW = new Date("2026-08-20T12:00:00.000Z");
const BOARD_SIZE = 260;

// Letters only, so the ADP matcher's name normalizer cannot fold two rows together.
function letters(index: number): string {
  return [...String(index).padStart(3, "0")]
    .map((digit) => String.fromCharCode(97 + Number(digit)))
    .join("");
}

// The first 50 rows are quarterbacks, which clears the 42-player Superflex core.
const boardPlayers: Player[] = Array.from({ length: BOARD_SIZE }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${letters(index)}`,
  team: "KC",
  position: index < 50 ? "QB" : "RB",
  averageRank: index + 1,
  rankEcr: index + 1,
  positionRank: index < 50 ? index + 1 : index - 49,
}));

const rankings = {
  players: boardPlayers,
  season: SEASON,
  updatedAt: "2026-08-20T00:00:00.000Z",
  sourceUrl: "https://example.com/rankings",
  sourceLabel: FANTASY_PROS_PUBLIC_SOURCE,
  expertCount: 12,
};

const superflex = {
  ...rankings,
  players: boardPlayers.map((player, index) => ({ ...player, rankEcr: 500 + index, tier: 3 })),
  sourceUrl: "https://example.com/superflex",
};

function adpBoard(count: number) {
  const entries: FantasyAdpEntry[] = boardPlayers.slice(0, count).map((player, index) => ({
    name: player.name,
    team: player.team,
    position: player.position,
    adp: 100 + index,
  }));
  return {
    entries,
    updatedAt: "2026-08-20",
    sourceUrl: "https://example.com/adp",
    season: SEASON,
    format: "half",
    ranker: "underdog",
  };
}

const schedule = {
  season: SEASON,
  week: 17,
  opponents: { KC: "DEN", DEN: "KC" },
  sourceUrl: "https://example.com/schedule",
};

const previous: BestBallSnapshot = {
  schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
  season: SEASON,
  generatedAt: "2026-08-19T12:00:00.000Z",
  players: boardPlayers.map((player, index) => ({
    ...player,
    adp: 1 + index,
    byeWeek: 9,
    superflexRank: 900 + index,
    superflexTier: 7,
  })),
  rankingSource: { provider: "prior rankings", url: "https://example.com/prior", asOf: null },
  superflexSource: { provider: "prior superflex", url: "https://example.com/prior-sf", asOf: null },
  adpSource: { provider: "prior adp", url: "https://example.com/prior-adp", asOf: null, matchedCount: BOARD_SIZE },
  scheduleSource: { provider: "prior schedule", url: "https://example.com/prior-sched", asOf: null },
  week17Opponents: { KC: "LV" },
};

const fresh = {
  previous,
  rankings,
  superflexResult: superflex,
  freshAdpResult: adpBoard(BOARD_SIZE),
  scheduleResult: schedule,
  byeWeeks: new Map<string, number>(),
  now: NOW,
};

describe("assembleBestBallSnapshot", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("publishes every fresh layer and stamps the schedule with the build time", () => {
    const { snapshot, matchedCount } = assembleBestBallSnapshot(fresh);

    expect(matchedCount).toBe(BOARD_SIZE);
    expect(snapshot.generatedAt).toBe(NOW.toISOString());
    expect(snapshot.players[0]).toMatchObject({ adp: 100, superflexRank: 500, superflexTier: 3, byeWeek: 9 });
    expect(snapshot.adpSource).toMatchObject({ url: "https://example.com/adp", matchedCount: BOARD_SIZE });
    expect(snapshot.superflexSource?.url).toBe("https://example.com/superflex");
    expect(snapshot.scheduleSource).toMatchObject({ asOf: NOW.toISOString(), matchedCount: 2 });
    expect(snapshot.week17Opponents).toEqual({ KC: "DEN", DEN: "KC" });
  });

  it("keeps the prior prices when the fresh ADP board comes back thin", () => {
    const { snapshot, matchedCount } = assembleBestBallSnapshot({ ...fresh, freshAdpResult: adpBoard(20) });

    expect(matchedCount).toBe(0);
    expect(snapshot.players.map((player) => player.adp)).toEqual(previous.players.map((player) => player.adp));
    expect(snapshot.adpSource).toEqual(previous.adpSource);
    // The rankings and the Superflex layer still publish fresh.
    expect(snapshot.players[0].superflexRank).toBe(500);
  });

  it("keeps the prior Superflex ranks, schedule, and ADP when those fetches fail", () => {
    const { snapshot } = assembleBestBallSnapshot({
      ...fresh,
      superflexResult: null,
      freshAdpResult: null,
      scheduleResult: null,
    });

    expect(snapshot.players[3]).toMatchObject({ adp: 4, superflexRank: 903, superflexTier: 7 });
    expect(snapshot.superflexSource).toEqual(previous.superflexSource);
    expect(snapshot.adpSource).toEqual(previous.adpSource);
    expect(snapshot.scheduleSource).toEqual(previous.scheduleSource);
    expect(snapshot.week17Opponents).toEqual({ KC: "LV" });
  });

  it("carries nothing over from a snapshot of another season", () => {
    const lastSeason = { ...previous, season: SEASON - 1 };
    const { snapshot } = assembleBestBallSnapshot({
      ...fresh,
      previous: lastSeason,
      freshAdpResult: null,
      scheduleResult: null,
    });

    expect(snapshot.players.some((player) => player.adp !== undefined || player.byeWeek !== undefined)).toBe(false);
    expect(snapshot.adpSource).toBeNull();
    expect(snapshot.scheduleSource).toBeNull();
    expect(snapshot.week17Opponents).toEqual({});

    expect(() =>
      assembleBestBallSnapshot({ ...fresh, previous: lastSeason, freshAdpResult: adpBoard(20) })
    ).toThrow("No prior ADP to fall back on");
    expect(() =>
      assembleBestBallSnapshot({ ...fresh, previous: lastSeason, superflexResult: null })
    ).toThrow("no usable Superflex rankings source");
  });
});
