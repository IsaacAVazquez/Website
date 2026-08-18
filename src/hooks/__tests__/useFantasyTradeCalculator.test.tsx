import { act, renderHook } from "@testing-library/react";

import { useFantasyTradeCalculator } from "@/hooks/useFantasyTradeCalculator";
import {
  resetBrowserStorageMemory,
  writeBrowserStorageString,
} from "@/lib/browserStorage";
import { FANTASY_TRADE_MODEL_VERSION } from "@/lib/fantasyTrade";
import {
  FANTASY_TRADE_MAX_PLAYERS_PER_SIDE,
  FANTASY_TRADE_PERSISTENCE_VERSION,
  getFantasyTradeStorageKey,
  parseFantasyTradePersistenceState,
} from "@/lib/fantasyTradePersistence";
import type { FantasyRouteScoring } from "@/lib/fantasy";

const SEASON = 2026;

function readPersisted(scoring: FantasyRouteScoring) {
  return parseFantasyTradePersistenceState(
    window.localStorage.getItem(
      getFantasyTradeStorageKey({ season: SEASON, scoring }),
    ),
    { season: SEASON, scoring },
  );
}

describe("useFantasyTradeCalculator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  it("adds and removes players on either side and persists each change", () => {
    const { result } = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "ppr"),
    );

    act(() => {
      result.current.addPlayer("give", "alpha");
      result.current.addPlayer("get", "bravo");
    });

    expect(result.current.givePlayerIds).toEqual(["alpha"]);
    expect(result.current.getPlayerIds).toEqual(["bravo"]);
    expect(readPersisted("ppr")).toMatchObject({
      givePlayerIds: ["alpha"],
      getPlayerIds: ["bravo"],
      modelVersion: FANTASY_TRADE_MODEL_VERSION,
    });

    act(() => {
      result.current.removePlayer("give", "alpha");
      result.current.removePlayer("get", "bravo");
    });

    expect(result.current.givePlayerIds).toEqual([]);
    expect(result.current.getPlayerIds).toEqual([]);
    expect(readPersisted("ppr")).toMatchObject({
      givePlayerIds: [],
      getPlayerIds: [],
    });
  });

  it("prevents duplicates within one side and across both sides", () => {
    const { result } = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "ppr"),
    );

    act(() => {
      result.current.addPlayer("give", "alpha");
      result.current.addPlayer("give", "alpha");
      result.current.addPlayer("get", "alpha");
      result.current.addPlayer("get", "bravo");
      result.current.addPlayer("give", "bravo");
    });

    expect(result.current.givePlayerIds).toEqual(["alpha"]);
    expect(result.current.getPlayerIds).toEqual(["bravo"]);
  });

  it("swaps the ordered packages without changing their players", () => {
    const { result } = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "ppr"),
    );

    act(() => {
      result.current.addPlayer("give", "alpha");
      result.current.addPlayer("give", "bravo");
      result.current.addPlayer("get", "charlie");
    });
    act(() => result.current.swapSides());

    expect(result.current.givePlayerIds).toEqual(["charlie"]);
    expect(result.current.getPlayerIds).toEqual(["alpha", "bravo"]);
    expect(readPersisted("ppr")).toMatchObject({
      givePlayerIds: ["charlie"],
      getPlayerIds: ["alpha", "bravo"],
    });
  });

  it("clears both sides in one persisted update", () => {
    const { result } = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "ppr"),
    );

    act(() => {
      result.current.addPlayer("give", "alpha");
      result.current.addPlayer("get", "bravo");
    });
    act(() => result.current.clear());

    expect(result.current.givePlayerIds).toEqual([]);
    expect(result.current.getPlayerIds).toEqual([]);
    expect(readPersisted("ppr")).toMatchObject({
      givePlayerIds: [],
      getPlayerIds: [],
    });
  });

  it("isolates state by scoring format and restores it when the scope returns", () => {
    const { result, rerender } = renderHook(
      ({ scoring }: { scoring: FantasyRouteScoring }) =>
        useFantasyTradeCalculator(SEASON, scoring),
      { initialProps: { scoring: "ppr" as FantasyRouteScoring } },
    );

    act(() => result.current.addPlayer("give", "ppr-player"));
    rerender({ scoring: "half_ppr" });

    expect(result.current.givePlayerIds).toEqual([]);
    expect(result.current.getPlayerIds).toEqual([]);

    act(() => result.current.addPlayer("get", "half-player"));
    expect(result.current.getPlayerIds).toEqual(["half-player"]);

    rerender({ scoring: "ppr" });
    expect(result.current.givePlayerIds).toEqual(["ppr-player"]);
    expect(result.current.getPlayerIds).toEqual([]);
    expect(readPersisted("half_ppr")?.getPlayerIds).toEqual(["half-player"]);
  });

  it("hydrates the saved packages after an unmount and fresh module-memory read", () => {
    const first = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "standard"),
    );

    act(() => {
      first.result.current.addPlayer("give", "alpha");
      first.result.current.addPlayer("get", "bravo");
    });
    first.unmount();
    resetBrowserStorageMemory();

    const second = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "standard"),
    );

    expect(second.result.current.givePlayerIds).toEqual(["alpha"]);
    expect(second.result.current.getPlayerIds).toEqual(["bravo"]);
    expect(second.result.current.persistenceStatus).toBe("persistent");
  });

  it("repairs oversized and cross-side duplicated persisted packages to six players", () => {
    const scope = { season: SEASON, scoring: "ppr" as const };
    const oversized = JSON.stringify({
      version: FANTASY_TRADE_PERSISTENCE_VERSION,
      ...scope,
      modelVersion: FANTASY_TRADE_MODEL_VERSION,
      givePlayerIds: [
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
      ],
      getPlayerIds: [
        "one",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
      ],
    });
    writeBrowserStorageString(getFantasyTradeStorageKey(scope), oversized);

    const { result } = renderHook(() =>
      useFantasyTradeCalculator(SEASON, "ppr"),
    );

    expect(result.current.givePlayerIds).toEqual([
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);
    expect(result.current.getPlayerIds).toEqual([
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
    ]);
    expect(result.current.givePlayerIds).toHaveLength(
      FANTASY_TRADE_MAX_PLAYERS_PER_SIDE,
    );
    expect(result.current.getPlayerIds).toHaveLength(
      FANTASY_TRADE_MAX_PLAYERS_PER_SIDE,
    );
  });
});
