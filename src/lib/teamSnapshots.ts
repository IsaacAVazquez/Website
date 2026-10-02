import { HttpStatusError } from "@/lib/utils";

interface FixtureWindows {
  recentFixtures: unknown[];
  upcomingFixtures: unknown[];
}

/** Caps each named list on a snapshot to `limit` items, keeping every other field. */
export function capLists<T extends Record<K, unknown[]>, K extends keyof T>(
  snapshot: T,
  limit: number,
  keys: readonly K[]
): T {
  const capped = { ...snapshot };
  for (const key of keys) capped[key] = snapshot[key].slice(0, limit) as T[K];
  return capped;
}

/** Caps a snapshot's recent and upcoming fixture lists, keeping every other field. */
export function capFixtures<T extends FixtureWindows>(snapshot: T, limit: number): T {
  return capLists(snapshot, limit, ["recentFixtures", "upcomingFixtures"]);
}

/**
 * Looks a team up in a committed snapshot dictionary, or throws a 404. `hasOwn`
 * keeps prototype keys like "constructor" from resolving to a built-in, and the
 * value check keeps a null entry from reaching the caller as a team.
 */
export function findTeamSnapshot<T>(
  snapshots: Record<string, T>,
  teamId: string,
  label: string
): NonNullable<T> {
  const snapshot = Object.hasOwn(snapshots, teamId) ? snapshots[teamId] : undefined;
  if (snapshot == null) {
    throw new HttpStatusError(`${label} team snapshot was not found.`, 404);
  }
  return snapshot;
}
