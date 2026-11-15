import { isRecord } from "./utils";

export const isFollowingId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export function parseFollowedIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [...new Set(value.filter(isFollowingId))].slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

export function toggleFollowedId(latest: string[], id: string): string[] {
  if (!isFollowingId(id)) return latest;
  return latest.includes(id)
    ? latest.filter((item) => item !== id)
    : latest.length < 20
      ? [...latest, id]
      : latest;
}

export function isSourceUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1500) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function readRecordArray(raw: string): Record<string, unknown>[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isRecord) : [];
  } catch {
    return [];
  }
}

export const isSourceTime = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));

/** Keep two distinct source snapshots for each followed item, never replacing a newer reading. */
export function observeReadings<T extends { id: string; sourceAt: string }>(
  latest: T[],
  current: T[],
): T[] {
  const added = current.filter(
    (row) =>
      isSourceTime(row.sourceAt) &&
      !latest.some(
        (old) =>
          old.id === row.id &&
          Date.parse(old.sourceAt) >= Date.parse(row.sourceAt),
      ),
  );
  if (!added.length) return latest;
  const counts = new Map<string, number>();
  return [...added, ...latest]
    .sort((a, b) => Date.parse(b.sourceAt) - Date.parse(a.sourceAt))
    .filter((row) => {
      const count = counts.get(row.id) ?? 0;
      counts.set(row.id, count + 1);
      return count < 2;
    })
    .slice(0, 80);
}
