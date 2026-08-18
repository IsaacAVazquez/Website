import {
  FANTASY_TRADE_MAX_PLAYERS_PER_SIDE,
  FANTASY_TRADE_PERSISTENCE_VERSION,
  createFantasyTradePersistenceState,
  getFantasyTradePersistenceSnapshot,
  getFantasyTradePersistenceStatus,
  getFantasyTradeStorageKey,
  parseFantasyTradePersistenceState,
  readFantasyTradePersistence,
  repairFantasyTradePersistenceState,
  repairFantasyTradePlayerIds,
  serializeFantasyTradePersistenceState,
  subscribeFantasyTradePersistence,
  writeFantasyTradePersistence,
} from "@/lib/fantasyTradePersistence";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

const context = {
  season: 2026,
  scoring: "half_ppr" as const,
  modelVersion: "trade-blend-2026.08",
};

describe("fantasy trade persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  it("builds the versioned season-and-scoring storage key", () => {
    expect(getFantasyTradeStorageKey(context)).toBe(
      "fantasy-trade-calculator-v1-2026-half_ppr",
    );
    expect(() =>
      getFantasyTradeStorageKey({ season: 2026, scoring: "other" as "ppr" }),
    ).toThrow(TypeError);
  });

  it("round-trips an ordered, validated state", () => {
    const state = createFantasyTradePersistenceState(context, {
      givePlayerIds: ["alpha", "bravo"],
      getPlayerIds: ["charlie", "delta"],
    });
    const raw = serializeFantasyTradePersistenceState(state);

    expect(parseFantasyTradePersistenceState(raw, context)).toEqual(state);
    expect(JSON.parse(raw)).toEqual({
      version: FANTASY_TRADE_PERSISTENCE_VERSION,
      season: 2026,
      scoring: "half_ppr",
      modelVersion: "trade-blend-2026.08",
      givePlayerIds: ["alpha", "bravo"],
      getPlayerIds: ["charlie", "delta"],
    });
  });

  it("rejects malformed JSON and wrong schema, season, or scoring", () => {
    const state = createFantasyTradePersistenceState(context);
    expect(parseFantasyTradePersistenceState("{")).toBeNull();
    expect(parseFantasyTradePersistenceState(null)).toBeNull();
    expect(
      parseFantasyTradePersistenceState(
        JSON.stringify({ ...state, version: 2 }),
        context,
      ),
    ).toBeNull();
    expect(
      parseFantasyTradePersistenceState(
        JSON.stringify(state),
        { season: 2025, scoring: "half_ppr" },
      ),
    ).toBeNull();
    expect(
      parseFantasyTradePersistenceState(
        JSON.stringify(state),
        { season: 2026, scoring: "ppr" },
      ),
    ).toBeNull();
  });

  it("repairs invalid IDs, duplicates, cross-side duplicates, and oversized sides", () => {
    const repaired = repairFantasyTradePersistenceState({
      version: 1,
      season: 2026,
      scoring: "half_ppr",
      modelVersion: " trade-blend-2026.08 ",
      givePlayerIds: [" alpha ", "bravo", "alpha", "", null, "charlie", "delta", "echo", "foxtrot", "golf"],
      getPlayerIds: ["bravo", "hotel", "hotel", "india", 7, "juliet", "kilo", "lima", "mike", "november"],
    });

    expect(repaired).toEqual({
      version: 1,
      season: 2026,
      scoring: "half_ppr",
      modelVersion: "trade-blend-2026.08",
      givePlayerIds: ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"],
      getPlayerIds: ["hotel", "india", "juliet", "kilo", "lima", "mike"],
    });
    expect(repaired?.givePlayerIds).toHaveLength(FANTASY_TRADE_MAX_PLAYERS_PER_SIDE);
    expect(repaired?.getPlayerIds).toHaveLength(FANTASY_TRADE_MAX_PLAYERS_PER_SIDE);
  });

  it("repairs a single ordered player list against exclusions", () => {
    expect(
      repairFantasyTradePlayerIds(
        ["two", "one", "two", "three", "four", "five", "six", "seven"],
        new Set(["three"]),
      ),
    ).toEqual(["two", "one", "four", "five", "six", "seven"]);
  });

  it("rejects missing or invalid model versions and invalid in-memory state", () => {
    expect(
      repairFantasyTradePersistenceState({
        version: 1,
        season: 2026,
        scoring: "half_ppr",
        modelVersion: "",
      }),
    ).toBeNull();
    expect(() => createFantasyTradePersistenceState({ ...context, modelVersion: " " }))
      .toThrow(TypeError);
    expect(() =>
      serializeFantasyTradePersistenceState({
        ...createFantasyTradePersistenceState(context),
        version: 2,
      } as never),
    ).toThrow(TypeError);
  });

  it("reads, writes, snapshots, and notifies same-tab subscribers", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeFantasyTradePersistence(context, listener);
    const state = createFantasyTradePersistenceState(context, {
      givePlayerIds: ["alpha"],
      getPlayerIds: ["bravo"],
    });

    expect(writeFantasyTradePersistence(state)).toBe("persistent");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(readFantasyTradePersistence(context)).toEqual({
      state,
      persistenceStatus: "persistent",
      source: "valid",
    });
    expect(parseFantasyTradePersistenceState(getFantasyTradePersistenceSnapshot(context)))
      .toEqual(state);
    expect(getFantasyTradePersistenceStatus(context)).toBe("persistent");

    unsubscribe();
  });

  it("returns a current-model empty fallback without overwriting invalid storage", () => {
    const key = getFantasyTradeStorageKey(context);
    const invalid = JSON.stringify({
      version: 1,
      season: 2025,
      scoring: "half_ppr",
      modelVersion: "old-model",
      givePlayerIds: ["alpha"],
      getPlayerIds: [],
    });
    window.localStorage.setItem(key, invalid);

    expect(readFantasyTradePersistence(context)).toEqual({
      state: createFantasyTradePersistenceState(context),
      persistenceStatus: "persistent",
      source: "invalid",
    });
    expect(window.localStorage.getItem(key)).toBe(invalid);
  });
});
