import { HttpStatusError } from "@/lib/utils";

interface FixtureWindows {
  recentFixtures: unknown[];
  upcomingFixtures: unknown[];
}

/** Caps a snapshot's recent and upcoming fixture lists, keeping every other field. */
export function capFixtures<T extends FixtureWindows>(snapshot: T, limit: number): T {
  return {
    ...snapshot,
    recentFixtures: snapshot.recentFixtures.slice(0, limit),
    upcomingFixtures: snapshot.upcomingFixtures.slice(0, limit),
  };
}

/**
 * Looks a team up in a committed snapshot dictionary, or throws a 404. `hasOwn`
 * keeps prototype keys like "constructor" from resolving to a built-in.
 */
export function findTeamSnapshot<T>(
  snapshots: Record<string, T>,
  teamId: string,
  label: string
): T {
  if (!Object.hasOwn(snapshots, teamId)) {
    throw new HttpStatusError(`${label} team snapshot was not found.`, 404);
  }
  return snapshots[teamId];
}
