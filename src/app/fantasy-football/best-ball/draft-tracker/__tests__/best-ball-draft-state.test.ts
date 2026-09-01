import type { Player } from "@/types";
import {
  addBestBallDraftPick,
  createBestBallDraftState,
  getBestBallDraftBackupKey,
  getBestBallDraftStorageKey,
  getBestBallTeamForPick,
  parseBestBallDraftState,
  redoBestBallDraftPick,
  startBestBallDraft,
  undoBestBallDraftPick,
  undoBestBallDraftPickTo,
  type BestBallRoomRules,
} from "../best-ball-draft-state";

const rules: BestBallRoomRules = {
  contestId: "best-ball-mania",
  rulesSchemaVersion: 2,
  competitionFormat: "tournament",
  lineupVariant: "standard",
  scoring: "HALF_PPR",
  teams: 12,
  rounds: 18,
  rosterSize: 18,
  lineup: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
};

const player: Player = {
  id: "fp-1",
  name: "Ja'Marr Chase",
  team: "CIN",
  position: "WR",
  averageRank: 1,
  standardDeviation: 0.5,
  adp: 1.2,
};

describe("best ball draft state", () => {
  it("keeps each season and contest in a separate storage key", () => {
    expect(getBestBallDraftStorageKey(2026, "best-ball-mania")).toBe(
      "fantasy-best-ball-draft-v1-2026-best-ball-mania"
    );
    expect(getBestBallDraftStorageKey(2026, "weekly-winners")).not.toBe(
      getBestBallDraftStorageKey(2026, "best-ball-mania")
    );
    expect(getBestBallDraftBackupKey(2026, "best-ball-mania")).toBe(
      "fantasy-best-ball-draft-v1-2026-best-ball-mania-previous"
    );
  });

  it("tracks a 12-team snake room in both directions", () => {
    expect(getBestBallTeamForPick(1, 12)).toBe(1);
    expect(getBestBallTeamForPick(12, 12)).toBe(12);
    expect(getBestBallTeamForPick(13, 12)).toBe(12);
    expect(getBestBallTeamForPick(24, 12)).toBe(1);
    expect(getBestBallTeamForPick(25, 12)).toBe(1);
  });

  it("logs the room pick and can undo it without mutating the prior state", () => {
    const initial = createBestBallDraftState(2026, rules, 7, new Date("2026-08-02T12:00:00Z"));
    const drafted = addBestBallDraftPick(initial, player, new Date("2026-08-02T12:01:00Z"));

    expect(initial.picks).toHaveLength(0);
    expect(drafted.picks[0]).toMatchObject({
      pickNumber: 1,
      round: 1,
      teamNumber: 1,
      player,
    });
    expect(undoBestBallDraftPick(drafted).picks).toHaveLength(0);
  });

  it("persists an open room without requiring a logged pick", () => {
    const initial = createBestBallDraftState(
      2026,
      rules,
      7,
      new Date("2026-08-02T12:00:00Z")
    );
    const started = startBestBallDraft(initial, new Date("2026-08-02T12:01:00Z"));
    const restored = parseBestBallDraftState(JSON.stringify(started), 2026, rules);

    expect(initial.startedAt).toBeNull();
    expect(restored).toMatchObject({
      picks: [],
      undoHistory: [],
      startedAt: "2026-08-02T12:01:00.000Z",
    });
  });

  it("restores only a valid draft written for the same catalog rules", () => {
    const initial = createBestBallDraftState(2026, rules, 3, new Date("2026-08-02T12:00:00Z"));
    const drafted = addBestBallDraftPick(initial, player, new Date("2026-08-02T12:01:00Z"));
    const raw = JSON.stringify(drafted);

    expect(parseBestBallDraftState(raw, 2026, rules)?.picks).toHaveLength(1);
    expect(
      parseBestBallDraftState(raw, 2026, { ...rules, rulesSchemaVersion: 3 })
    ).toBeNull();
    expect(parseBestBallDraftState(raw, 2027, rules)).toBeNull();
  });

  it("round-trips a drafted player without expert spread", () => {
    const { standardDeviation: _spread, ...playerWithoutSpread } = player;
    const drafted = addBestBallDraftPick(
      createBestBallDraftState(2026, rules, 3, new Date("2026-08-02T12:00:00Z")),
      playerWithoutSpread,
      new Date("2026-08-02T12:01:00Z")
    );
    const raw = JSON.stringify(drafted);
    const saved = JSON.parse(raw) as {
      picks: Array<{ player: Record<string, unknown> }>;
    };

    expect(saved.picks[0].player).not.toHaveProperty("standardDeviation");

    const restored = parseBestBallDraftState(raw, 2026, rules);
    expect(restored?.picks[0].player).toMatchObject({
      id: "fp-1",
      position: "WR",
      averageRank: 1,
    });
    expect(restored?.picks[0].player).not.toHaveProperty("standardDeviation");
    expect(undoBestBallDraftPick(restored!)).toMatchObject({ picks: [] });
  });

  it("rejects the legacy overloaded format fingerprint for backup", () => {
    const initial = createBestBallDraftState(2026, rules, 3);
    const legacy = {
      ...initial,
      rules: {
        ...initial.rules,
        rulesSchemaVersion: 1,
        format: "tournament",
      },
    };
    delete (legacy.rules as Partial<BestBallRoomRules>).competitionFormat;
    delete (legacy.rules as Partial<BestBallRoomRules>).lineupVariant;

    expect(parseBestBallDraftState(JSON.stringify(legacy), 2026, rules)).toBeNull();
  });

  it("rejects a draft whose saved picks do not match snake order", () => {
    const drafted = addBestBallDraftPick(
      createBestBallDraftState(2026, rules, 3),
      player
    );
    const tampered = {
      ...drafted,
      picks: [{ ...drafted.picks[0], teamNumber: 12 }],
    };

    expect(parseBestBallDraftState(JSON.stringify(tampered), 2026, rules)).toBeNull();
  });

  it("returns a clean miss for malformed local data", () => {
    expect(
      parseBestBallDraftState(
        JSON.stringify({
          schemaVersion: 1,
          season: 2026,
          contestId: rules.contestId,
          rules: {},
          userSlot: 1,
          picks: [null],
          startedAt: null,
          updatedAt: "2026-08-02T12:00:00.000Z",
        }),
        2026,
        rules
      )
    ).toBeNull();
  });

  it("rewinds to a target pick, dropping it and everything after", () => {
    const second: Player = { ...player, id: "fp-2", name: "Bijan Robinson", position: "RB" };
    const third: Player = { ...player, id: "fp-3", name: "CeeDee Lamb" };
    let state = createBestBallDraftState(2026, rules, 7, new Date("2026-08-02T12:00:00Z"));
    state = addBestBallDraftPick(state, player);
    state = addBestBallDraftPick(state, second);
    state = addBestBallDraftPick(state, third);

    const rewound = undoBestBallDraftPickTo(state, 2, new Date("2026-08-02T12:05:00Z"));
    expect(rewound.picks.map((pick) => pick.player.id)).toEqual(["fp-1"]);
    expect(rewound.undoHistory.map((pick) => pick.player.id)).toEqual(["fp-3", "fp-2"]);
    expect(rewound.updatedAt).toBe("2026-08-02T12:05:00.000Z");

    const redoneSecond = redoBestBallDraftPick(
      rewound,
      new Date("2026-08-02T12:06:00Z")
    );
    const redoneThird = redoBestBallDraftPick(
      redoneSecond,
      new Date("2026-08-02T12:07:00Z")
    );
    expect(redoneSecond.picks.map((pick) => pick.player.id)).toEqual(["fp-1", "fp-2"]);
    expect(redoneThird.picks.map((pick) => pick.player.id)).toEqual([
      "fp-1",
      "fp-2",
      "fp-3",
    ]);
    expect(redoneThird.undoHistory).toEqual([]);
    // Out-of-range targets leave the state alone.
    expect(undoBestBallDraftPickTo(state, 9)).toBe(state);
    expect(undoBestBallDraftPickTo(state, 0)).toBe(state);
  });

  it("persists redo history and clears it when a fresh pick branches the room", () => {
    const second: Player = { ...player, id: "fp-2", name: "Bijan Robinson", position: "RB" };
    let state = startBestBallDraft(createBestBallDraftState(2026, rules, 7));
    state = addBestBallDraftPick(state, player);
    state = addBestBallDraftPick(state, second);
    state = undoBestBallDraftPickTo(state, 1);

    const restored = parseBestBallDraftState(JSON.stringify(state), 2026, rules);
    expect(restored?.picks).toEqual([]);
    expect(restored?.startedAt).not.toBeNull();
    expect(restored?.undoHistory.map((pick) => pick.player.id)).toEqual(["fp-2", "fp-1"]);

    const replacement = { ...player, id: "fp-3", name: "CeeDee Lamb" };
    const branched = addBestBallDraftPick(restored!, replacement);
    expect(branched.undoHistory).toEqual([]);
    expect(branched.picks[0].player.id).toBe("fp-3");
  });
});
