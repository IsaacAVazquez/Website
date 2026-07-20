import {
  createLocalDataBackup,
  restoreLocalDataBackup,
} from "@/lib/localDataBackup";

describe("localDataBackup", () => {
  beforeEach(() => localStorage.clear());

  it("exports app data without unrelated browser keys", () => {
    localStorage.setItem("fantasy-player-notes-v1", '{"1":"target"}');
    localStorage.setItem("score_pools_store_v1", '{"version":1,"pools":[]}');
    localStorage.setItem("next-auth.session-token", "secret");

    const backup = createLocalDataBackup(localStorage);

    expect(backup.entries["fantasy-player-notes-v1"]).toContain("target");
    expect(backup.entries["score_pools_store_v1"]).toContain('"version":1');
    expect(backup.entries["next-auth.session-token"]).toBeUndefined();
  });

  it("restores only allowlisted keys", () => {
    const result = restoreLocalDataBackup(localStorage, {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      entries: {
        "wine_cellar_entries_v1": "[]",
        "unknown-key": "nope",
      },
    });

    expect(result.restoredKeys).toEqual(["wine_cellar_entries_v1"]);
    expect(localStorage.getItem("unknown-key")).toBeNull();
  });
});
