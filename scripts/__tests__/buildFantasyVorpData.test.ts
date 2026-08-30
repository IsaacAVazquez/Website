/**
 * @jest-environment node
 */
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildFantasyVorpData,
  renderFantasyVorpDataModule,
  resolveVorpDataset,
  type FantasyVorpDataset,
} from "../buildFantasyVorpData";
import { readGeneratedSnapshot } from "../snapshotFallback";
import type {
  FantasyProsVorpBoard,
  FantasyProsVorpPlayer,
  FantasyVorpTeamSize,
} from "@/lib/fantasyProsVorpSource";
import { getSnapshotSeason } from "@/lib/fantasySnapshotBuilder";
import type { ScoringFormat } from "@/types";

const SEASON = getSnapshotSeason();
const SCORING_FORMATS: ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];
const TEAM_SIZES: FantasyVorpTeamSize[] = [10, 12, 14];

function players(label: string, count = 3): FantasyProsVorpPlayer[] {
  return Array.from({ length: count }, (_, index) => ({
    playerId: `fp-${label}-${index + 1}`,
    name: `${label} ${index + 1}`,
    team: "SF",
    position: "RB",
    positionRank: index + 1,
    rank: index + 1,
    value: count - index,
  }));
}

function dataset(label: string, season = SEASON, count = 3): FantasyVorpDataset {
  return {
    season,
    sourceUrl: `https://www.fantasypros.com/nfl/rankings/${label}.php`,
    accessedAt: "2026-08-20T12:00:00.000Z",
    players: players(label, count),
  };
}

function fullRecord(label: string, season = SEASON) {
  return Object.fromEntries(
    SCORING_FORMATS.map((scoring) => [
      scoring,
      Object.fromEntries(
        TEAM_SIZES.map((teamSize) => [teamSize, dataset(`${label}-${scoring}-${teamSize}`, season)])
      ),
    ])
  ) as Record<ScoringFormat, Record<FantasyVorpTeamSize, FantasyVorpDataset>>;
}

type VorpRecord = ReturnType<typeof fullRecord>;

function board(scoringFormat: ScoringFormat, teamSize: FantasyVorpTeamSize): FantasyProsVorpBoard {
  return {
    scoringFormat,
    teamSize,
    season: SEASON,
    sourceUrl: `https://www.fantasypros.com/nfl/rankings/fresh-${scoringFormat}.php?team_size=${teamSize}`,
    accessedAt: "2026-08-29T12:00:00.000Z",
    players: players(`fresh-${scoringFormat}-${teamSize}`),
  };
}

// A 404-shaped error is not retryable, so withRetry gives up on the first try.
function down() {
  return Object.assign(new Error("down"), { status: 404, headers: new Headers() });
}

const tempDirs: string[] = [];

async function seedModule(record: VorpRecord): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fantasy-vorp-"));
  tempDirs.push(dir);
  const target = path.join(dir, "fantasyVorpData.generated.ts");
  await fs.writeFile(target, renderFantasyVorpDataModule(record, "2026-08-20T12:00:00.000Z"), "utf8");
  return target;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("resolveVorpDataset", () => {
  const previous = dataset("previous");

  it("uses a usable fresh board", () => {
    const fresh = dataset("fresh");
    expect(resolveVorpDataset(fresh, previous, SEASON)).toEqual({ record: fresh, source: "fresh" });
  });

  it("keeps the previous same-season board when the fetch failed", () => {
    expect(resolveVorpDataset(null, previous, SEASON)).toEqual({ record: previous, source: "previous" });
  });

  it("does not carry a prior-season board forward", () => {
    expect(resolveVorpDataset(null, dataset("old", SEASON - 1), SEASON)).toEqual({
      record: null,
      source: "empty",
    });
  });

  it("treats an empty previous board as nothing usable", () => {
    expect(resolveVorpDataset(null, dataset("empty", SEASON, 0), SEASON)).toEqual({
      record: null,
      source: "empty",
    });
  });

  it("returns empty when neither board exists", () => {
    expect(resolveVorpDataset(null, null, SEASON)).toEqual({ record: null, source: "empty" });
  });
});

describe("buildFantasyVorpData", () => {
  it("keeps the previous board for the one report that failed and refreshes the rest", async () => {
    const target = await seedModule(fullRecord("seed"));
    const fetchBoard = jest.fn(async (scoringFormat: ScoringFormat, teamSize: FantasyVorpTeamSize) => {
      if (scoringFormat === "PPR" && teamSize === 10) throw down();
      return board(scoringFormat, teamSize);
    });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      await buildFantasyVorpData(fetchBoard, target);
    } finally {
      warn.mockRestore();
      log.mockRestore();
    }

    const written = readGeneratedSnapshot<VorpRecord>(target, "fantasyVorpData");
    expect(written?.PPR[10].players.map((player) => player.playerId)).toEqual(
      players("seed-PPR-10").map((player) => player.playerId)
    );
    expect(written?.PPR[12].players[0].playerId).toBe("fp-fresh-PPR-12-1");
    expect(written?.STANDARD[14].players[0].playerId).toBe("fp-fresh-STANDARD-14-1");
    expect(fetchBoard).toHaveBeenCalledTimes(9);
  });

  it("leaves the module untouched when nothing fresh or same-season is usable", async () => {
    const target = await seedModule(fullRecord("old", SEASON - 1));
    const before = await fs.readFile(target, "utf8");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await buildFantasyVorpData(async () => {
        throw down();
      }, target);
    } finally {
      warn.mockRestore();
    }
    expect(await fs.readFile(target, "utf8")).toBe(before);
  });
});
