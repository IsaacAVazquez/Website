import {
  FANTASY_RANK_HISTORY_RETENTION_DAYS,
  appendFantasyRankHistory,
  createEmptyFantasyRankHistory,
  decodeFantasyRankHistory,
  resolveFantasyRankMovement,
  stampFantasyRankMovement,
} from "@/lib/fantasyRankHistory";
import type { Player } from "@/types";

function player(id: string, rankEcr?: number, adp?: number): Player {
  return {
    id,
    name: id,
    team: "SF",
    position: "WR",
    averageRank: rankEcr ?? 999,
    ...(rankEcr !== undefined ? { rankEcr } : {}),
    ...(adp !== undefined ? { adp } : {}),
  };
}

describe("fantasy rank history", () => {
  it("appends dated readings, replaces same-day re-runs, and trims the window", () => {
    let history = createEmptyFantasyRankHistory();
    history = appendFantasyRankHistory(history, "ppr", "2026-08-01", [player("a", 20, 25)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-01", [player("a", 19, 24)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-31", [player("a", 12, 14)]);

    const days = history.formats.ppr ?? [];
    // The August 1 reading is 30 days old on the 31st, past retention, so
    // only the same-day replacement rule is visible through what survived.
    expect(days.map((day) => day.date)).toEqual(["2026-08-31"]);
    expect(days[0].players.a).toEqual({ ecr: 12, adp: 14 });

    let recent = createEmptyFantasyRankHistory();
    recent = appendFantasyRankHistory(recent, "ppr", "2026-08-20", [player("a", 20)]);
    recent = appendFantasyRankHistory(recent, "ppr", "2026-08-20", [player("a", 18)]);
    recent = appendFantasyRankHistory(recent, "ppr", "2026-08-24", [player("a", 15)]);
    expect((recent.formats.ppr ?? []).map((day) => day.players.a?.ecr)).toEqual([18, 15]);
  });

  it("keeps a reading exactly at the retention edge and drops older ones", () => {
    let history = createEmptyFantasyRankHistory();
    history = appendFantasyRankHistory(history, "ppr", "2026-08-01", [player("a", 30)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-14", [player("a", 22)]);
    const anchor = `2026-08-${String(1 + FANTASY_RANK_HISTORY_RETENTION_DAYS).padStart(2, "0")}`;
    history = appendFantasyRankHistory(history, "ppr", anchor, [player("a", 12)]);
    expect((history.formats.ppr ?? []).map((day) => day.date)).toEqual([
      "2026-08-01",
      "2026-08-14",
      anchor,
    ]);
  });

  it("resolves movement against the most recent reading at least the window old", () => {
    let history = createEmptyFantasyRankHistory();
    history = appendFantasyRankHistory(history, "ppr", "2026-08-16", [player("a", 24, 30)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-22", [player("a", 18, 22)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-31", [player("a", 12, 14)]);

    const movement = resolveFantasyRankMovement(history, "ppr", "2026-08-31", "a");
    // The 7-day window reaches back to Aug 24, so Aug 22 is the reference;
    // the 14-day window reaches to Aug 17, so Aug 16 is the reference.
    expect(movement).toEqual({
      rankMove7d: 6,
      adpMove7d: 8,
      rankMove14d: 12,
      adpMove14d: 16,
    });

    // A history younger than the window stays silent instead of guessing.
    let young = createEmptyFantasyRankHistory();
    young = appendFantasyRankHistory(young, "ppr", "2026-08-29", [player("a", 20)]);
    young = appendFantasyRankHistory(young, "ppr", "2026-08-31", [player("a", 12)]);
    expect(resolveFantasyRankMovement(young, "ppr", "2026-08-31", "a")).toEqual({});
  });

  it("stamps movement onto players and survives a decode round trip", () => {
    let history = createEmptyFantasyRankHistory();
    history = appendFantasyRankHistory(history, "ppr", "2026-08-16", [player("a", 24, 30)]);
    history = appendFantasyRankHistory(history, "ppr", "2026-08-31", [player("a", 12, 14)]);
    const decoded = decodeFantasyRankHistory(JSON.parse(JSON.stringify(history)));
    expect(decoded).toEqual(history);

    const board = [player("a", 12, 14), player("b", 40)];
    stampFantasyRankMovement(board, decoded, "ppr", "2026-08-31");
    // The only old reading sits 15 days back: outside the 7-day window's
    // three-day grace, inside the 14-day window's, so a 15-day move is
    // never labeled as a 7-day one.
    expect(board[0].rankMove7d).toBeUndefined();
    expect(board[0].adpMove7d).toBeUndefined();
    expect(board[0].rankMove14d).toBe(12);
    expect(board[0].adpMove14d).toBe(16);
    // No history for b, so no fields appear.
    expect(board[1].rankMove7d).toBeUndefined();
  });

  it("returns an empty history for malformed input", () => {
    expect(decodeFantasyRankHistory("junk")).toEqual(createEmptyFantasyRankHistory());
    expect(decodeFantasyRankHistory({ version: 99, formats: {} })).toEqual(
      createEmptyFantasyRankHistory()
    );
    expect(
      decodeFantasyRankHistory({
        version: 1,
        formats: { ppr: [{ date: "not-a-date", players: {} }, null] },
      })
    ).toEqual(createEmptyFantasyRankHistory());
  });
});
