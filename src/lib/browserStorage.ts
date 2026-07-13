/**
 * Guarded browser persistence shared by client-side tools.
 *
 * localStorage can throw while being read (privacy settings) or written
 * (quota/private browsing). Writes are mirrored in memory first so the current
 * tab keeps the newest value even when durable storage is unavailable.
 */

export type PersistenceStatus = "persistent" | "memory-only";

export interface BrowserStorageRead {
  value: string | null;
  persistenceStatus: PersistenceStatus;
}

export interface ValidatedBrowserStorageRead<T> {
  value: T;
  persistenceStatus: PersistenceStatus;
  source: "empty" | "valid" | "invalid";
}

type Listener = () => void;

const memoryValues = new Map<string, string>();
const cachedValues = new Map<string, string | null>();
const statuses = new Map<string, PersistenceStatus>();
const memoryOnlyKeys = new Set<string>();
const listenersByKey = new Map<string, Set<Listener>>();

let storageListenerBound = false;

function notify(key: string): void {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function updatePersistentSnapshot(key: string, value: string | null): void {
  cachedValues.set(key, value);
  statuses.set(key, "persistent");
  memoryOnlyKeys.delete(key);
  if (value === null) {
    memoryValues.delete(key);
  } else {
    memoryValues.set(key, value);
  }
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === null) {
    const subscribedKeys = Array.from(listenersByKey.keys());
    for (const key of subscribedKeys) {
      // Do not discard a newer value that only exists in this tab because a
      // prior durable write failed.
      if (!memoryOnlyKeys.has(key)) updatePersistentSnapshot(key, null);
      notify(key);
    }
    return;
  }

  if (!memoryOnlyKeys.has(event.key)) {
    updatePersistentSnapshot(event.key, event.newValue);
  }
  notify(event.key);
}

function ensureStorageListener(): void {
  if (storageListenerBound || typeof window === "undefined") return;
  storageListenerBound = true;
  window.addEventListener("storage", handleStorageEvent);
}

function readPersistentValue(key: string): BrowserStorageRead {
  if (typeof window === "undefined") {
    return { value: null, persistenceStatus: "memory-only" };
  }

  if (memoryOnlyKeys.has(key)) {
    const value = memoryValues.get(key) ?? null;
    cachedValues.set(key, value);
    statuses.set(key, "memory-only");
    return { value, persistenceStatus: "memory-only" };
  }

  try {
    const value = window.localStorage.getItem(key);
    updatePersistentSnapshot(key, value);
    return { value, persistenceStatus: "persistent" };
  } catch {
    const value = memoryValues.get(key) ?? null;
    cachedValues.set(key, value);
    statuses.set(key, "memory-only");
    memoryOnlyKeys.add(key);
    return { value, persistenceStatus: "memory-only" };
  }
}

/** Read a raw string, falling back to the latest in-memory value on failure. */
export function readBrowserStorageString(key: string): BrowserStorageRead {
  return readPersistentValue(key);
}

/**
 * Parse and validate JSON at the storage boundary. The decoder may repair a
 * partial payload; returning undefined rejects it and selects the fallback.
 */
export function readValidatedBrowserStorage<T>(
  key: string,
  decode: (value: unknown) => T | undefined,
  fallback: () => T,
): ValidatedBrowserStorageRead<T> {
  const stored = readBrowserStorageString(key);
  if (stored.value === null) {
    return { ...stored, value: fallback(), source: "empty" };
  }

  try {
    const decoded = decode(JSON.parse(stored.value));
    if (decoded !== undefined) {
      return { ...stored, value: decoded, source: "valid" };
    }
  } catch {
    // The invalid payload is intentionally left untouched for recovery or
    // debugging; callers receive a safe in-memory default.
  }

  return { ...stored, value: fallback(), source: "invalid" };
}

/** Mirror a write in memory before attempting durable localStorage. */
export function writeBrowserStorageString(
  key: string,
  value: string,
): PersistenceStatus {
  if (typeof window === "undefined") return "memory-only";

  memoryValues.set(key, value);
  cachedValues.set(key, value);

  let persistenceStatus: PersistenceStatus;
  try {
    window.localStorage.setItem(key, value);
    memoryOnlyKeys.delete(key);
    persistenceStatus = "persistent";
  } catch {
    memoryOnlyKeys.add(key);
    persistenceStatus = "memory-only";
  }

  statuses.set(key, persistenceStatus);
  notify(key);
  return persistenceStatus;
}

/** Serialize JSON safely; state remains usable in the caller if serialization fails. */
export function writeBrowserStorageJson(key: string, value: unknown): PersistenceStatus {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return "memory-only";
    return writeBrowserStorageString(key, serialized);
  } catch {
    statuses.set(key, "memory-only");
    memoryOnlyKeys.add(key);
    notify(key);
    return "memory-only";
  }
}

/** Subscribe to same-tab helper writes and cross-tab `storage` events. */
export function subscribeBrowserStorage(key: string, listener: Listener): () => void {
  ensureStorageListener();
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners!.delete(listener);
    if (listeners!.size === 0) listenersByKey.delete(key);
  };
}

/**
 * Refresh after a legacy same-tab write that did not use this helper, then
 * notify subscribers. Kept for the existing fantasy stores.
 */
export function emitBrowserStorageChange(key: string): void {
  if (!memoryOnlyKeys.has(key)) readPersistentValue(key);
  notify(key);
}

/** Cached snapshot getter for useSyncExternalStore. */
export function getBrowserStorageSnapshot(key: string, fallback: string): string {
  if (!cachedValues.has(key) || !listenersByKey.has(key)) {
    readPersistentValue(key);
  }
  return cachedValues.get(key) ?? fallback;
}

export function getBrowserStorageStatusSnapshot(key: string): PersistenceStatus {
  if (!statuses.has(key) || !listenersByKey.has(key)) {
    readPersistentValue(key);
  }
  return statuses.get(key) ?? "memory-only";
}

/** Clear module state, primarily for explicit app resets and isolated tests. */
export function resetBrowserStorageMemory(): void {
  memoryValues.clear();
  cachedValues.clear();
  statuses.clear();
  memoryOnlyKeys.clear();
  listenersByKey.clear();
  if (storageListenerBound && typeof window !== "undefined") {
    window.removeEventListener("storage", handleStorageEvent);
  }
  storageListenerBound = false;
}
