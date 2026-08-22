import {
  createLocalDataBackup,
  restoreLocalDataBackup,
} from "@/lib/localDataBackup";
import { getFantasyDraftStorageKey } from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import {
  getBestBallDraftBackupKey,
  getBestBallDraftStorageKey,
} from "@/app/fantasy-football/best-ball/draft-tracker/best-ball-draft-state";
import { getMockDraftStorageKey } from "@/app/fantasy-football/mock-draft/hooks/useMockDraftState";
import { getFantasyTradeStorageKey } from "@/lib/fantasyTradePersistence";

describe("localDataBackup", () => {
  beforeEach(() => localStorage.clear());

  // Regression net for the managed-key list drifting behind the live key
  // builders: the v2 tracker prefix silently dropped every draft room from
  // backups after the v3 migration, and mock draft rooms were never added.
  it("covers every live fantasy draft storage key builder", () => {
    localStorage.setItem(getFantasyDraftStorageKey(2026), '{"version":3}');
    localStorage.setItem(
      getBestBallDraftStorageKey(2026, "bbm-vii"),
      '{"schemaVersion":1}'
    );
    localStorage.setItem(
      getBestBallDraftBackupKey(2026, "bbm-vii"),
      '{"schemaVersion":1,"previous":true}'
    );
    localStorage.setItem(getMockDraftStorageKey(2026), '{"version":1}');
    localStorage.setItem(
      getFantasyTradeStorageKey({ season: 2026, scoring: "ppr" }),
      '{"version":1}'
    );

    const backup = createLocalDataBackup(localStorage);

    expect(Object.keys(backup.entries)).toEqual(
      expect.arrayContaining([
        getFantasyDraftStorageKey(2026),
        getBestBallDraftStorageKey(2026, "bbm-vii"),
        getBestBallDraftBackupKey(2026, "bbm-vii"),
        getMockDraftStorageKey(2026),
        getFantasyTradeStorageKey({ season: 2026, scoring: "ppr" }),
      ])
    );
  });

  it("exports app data without unrelated browser keys", () => {
    localStorage.setItem("fantasy-player-notes-v1", '{"1":"target"}');
    localStorage.setItem(
      "fantasy-trade-calculator-v1-2026-ppr",
      '{"version":1,"season":2026,"scoring":"ppr"}'
    );
    localStorage.setItem("score_pools_store_v1", '{"version":1,"pools":[]}');
    localStorage.setItem("next-auth.session-token", "secret");

    const backup = createLocalDataBackup(localStorage);

    expect(backup.entries["fantasy-player-notes-v1"]).toContain("target");
    expect(backup.entries["fantasy-trade-calculator-v1-2026-ppr"]).toContain(
      '"season":2026'
    );
    expect(backup.entries["score_pools_store_v1"]).toContain('"version":1');
    expect(backup.entries["next-auth.session-token"]).toBeUndefined();
  });

  it("restores only allowlisted keys", () => {
    const result = restoreLocalDataBackup(localStorage, {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      entries: {
        "wine_cellar_entries_v1": "[]",
        "fantasy-trade-calculator-v1-2026-half_ppr":
          '{"version":1,"season":2026,"scoring":"half_ppr"}',
        "unknown-key": "nope",
      },
    });

    expect(result.restoredKeys).toEqual([
      "wine_cellar_entries_v1",
      "fantasy-trade-calculator-v1-2026-half_ppr",
    ]);
    expect(localStorage.getItem("unknown-key")).toBeNull();
  });
});
