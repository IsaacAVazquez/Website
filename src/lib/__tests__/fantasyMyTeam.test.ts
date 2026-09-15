import { buildMyTeamLineup, compareMyTeamWaiver, emptyMyTeam, importMyTeamDraft, parseMyTeam, type MyTeamPlayer } from "../fantasyMyTeam";
import type { FantasyWeeklyBoard } from "../fantasyWeeklySnapshot";

const player = (id: string, position: MyTeamPlayer["position"]): MyTeamPlayer => ({ id, name: id, position, team: "BUF" });
const rb = player("rb", "RB");
const wr = player("wr", "WR");
const te = player("te", "TE");
const qb = player("qb", "QB");
const add = player("add", "WR");
const source = { provider: "test", url: "https://example.com", asOf: new Date().toISOString(), expertCount: 10, playerCount: 5 };
const board: FantasyWeeklyBoard = {
  flex: [{ ...rb, rank: 15 }, { ...wr, rank: 20 }, { ...te, rank: 40 }, { ...add, rank: 2 }],
  quarterbacks: [{ ...qb, rank: 1 }], flexSource: source, quarterbackSource: source,
};
const team = { ...emptyMyTeam(2026), players: [rb, wr, te, qb], lineup: { QB: 1 as const, RB: 1, WR: 1, TE: 1, FLEX: 1, K: 0, DST: 0 } };

it("fills required positions before flex without duplicating players", () => {
  const slots = buildMyTeamLineup({ ...team, players: [...team.players, add] }, board);
  expect(slots.map(slot => [slot.slot, slot.player?.id])).toEqual([
    ["QB 1", "qb"], ["RB 1", "rb"], ["WR 1", "add"], ["TE 1", "te"], ["FLEX 1", "wr"],
  ]);
});

it("reports the starting slot and the gap left by a cross-position drop", () => {
  const result = compareMyTeamWaiver(team, board, add, rb.id);
  expect(result.startingSlot).toBe("WR 1");
  expect(result.rankGain).toBe(13);
  expect(result.newGaps.map(slot => slot.slot)).toEqual(["RB 1"]);
});

it("never subtracts QB ranks from flex ranks", () => {
  expect(compareMyTeamWaiver(team, board, add, qb.id).rankGain).toBeNull();
});

it("keeps unranked roster players and reports incomplete coverage", () => {
  const unknown = player("unknown", "RB");
  const result = compareMyTeamWaiver({ ...team, players: [...team.players, unknown] }, board, add, unknown.id);
  expect(result.rankGain).toBeNull();
  expect(result.missing).toEqual([unknown]);
});

it("rejects damaged and previous-season storage, deduplicates players, and excludes rostered availability", () => {
  expect(parseMyTeam("{", 2026)).toEqual(emptyMyTeam(2026));
  expect(parseMyTeam(JSON.stringify(team), 2027)).toEqual(emptyMyTeam(2027));
  const result = parseMyTeam(JSON.stringify({ ...team, players: [rb, rb, null], availableIds: [rb.id, add.id, add.id, 2], leagueSize: 999 }), 2026);
  expect(result.players).toEqual([rb]);
  expect(result.availableIds).toEqual([add.id]);
  expect(result.leagueSize).toBe(12);
});

it("imports only actual picks for the user's team, with scoring and lineup settings", () => {
  const result = importMyTeamDraft(JSON.stringify({ settings: { totalTeams: 10, userTeam: 2, scoringFormat: "HALF_PPR", lineup: team.lineup },
    picks: [{ teamNumber: 1, player: qb }, { teamNumber: 2, player: rb }, { teamNumber: 2, player: { ...wr, byeWeek: 8 } }],
    teams: [{ teamNumber: 2, picks: [{ player: te }] }],
  }));
  expect(result?.players.map(p => p.id)).toEqual([rb.id, wr.id]);
  expect(result?.players[1].byeWeek).toBe(8);
  expect(result?.scoring).toBe("half_ppr");
  expect(result?.leagueSize).toBe(10);
  expect(importMyTeamDraft("null")).toBeNull();
});
