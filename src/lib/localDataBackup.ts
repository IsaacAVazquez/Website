const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_KEYS = 100;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const MANAGED_EXACT_KEYS = new Set([
  "fantasy-player-queue-v1",
  "fantasy-player-notes-v1",
  "fantasy-compare-v1",
  "fantasy-board-density",
  "mba_applications_v1",
  "mba_seen_job_ids_v1",
  "mba_watched_companies_v2",
  "budget_planner_months_v1",
  "travel_planner_trips_v1",
  "wine_cellar_entries_v1",
  "museum_log_user_state_v1",
  "portfolio_holdings",
  "portfolio_quotes_cache",
  "retirement_plan",
  "recipe-finder:pantry:v1",
  "travel-deals:v1",
  "score_pools_store_v1",
]);

const MANAGED_KEY_PREFIXES = [
  "fantasy-draft-tracker-v2-",
  "fantasy-formula-1-lineup-v1-",
];

export interface LocalDataBackup {
  schemaVersion: 1;
  exportedAt: string;
  entries: Record<string, string>;
}

export function isManagedLocalDataKey(key: string): boolean {
  return (
    MANAGED_EXACT_KEYS.has(key) ||
    MANAGED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

export function createLocalDataBackup(storage: Storage): LocalDataBackup {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isManagedLocalDataKey(key)) continue;
    const value = storage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function restoreLocalDataBackup(
  storage: Storage,
  input: unknown
): { restoredKeys: string[] } {
  const backup = input as Partial<LocalDataBackup> | null;
  if (
    !backup ||
    backup.schemaVersion !== BACKUP_SCHEMA_VERSION ||
    !backup.entries ||
    typeof backup.entries !== "object" ||
    Array.isArray(backup.entries)
  ) {
    throw new Error("This is not a supported site data backup.");
  }

  const serialized = JSON.stringify(backup);
  if (serialized.length > MAX_BACKUP_BYTES) {
    throw new Error("The backup is larger than the 5 MB restore limit.");
  }

  const entries = Object.entries(backup.entries);
  if (entries.length > MAX_BACKUP_KEYS) {
    throw new Error("The backup contains too many storage entries.");
  }

  const restoredKeys: string[] = [];
  for (const [key, value] of entries) {
    if (!isManagedLocalDataKey(key) || typeof value !== "string") continue;
    storage.setItem(key, value);
    restoredKeys.push(key);
  }
  return { restoredKeys };
}
