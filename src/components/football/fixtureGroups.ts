import type { GenericFixture } from "./FixtureCard";
import type { FixtureLedgerGroup } from "./fixtureLedgerUtils";

/**
 * Groups fixtures under a label of the caller's choosing (a postseason round,
 * an NFL week), in the order each label first appears, for
 * `FixtureLedgerSection`. `groupFixturesByMatchday` labels every group
 * "Matchday N", which is football's word and wrong for the other sports.
 */
export function groupFixtures<T extends GenericFixture>(
  fixtures: readonly T[],
  labelFor: (fixture: T) => string
): FixtureLedgerGroup[] {
  const groups = new Map<string, GenericFixture[]>();
  for (const fixture of fixtures) {
    const label = labelFor(fixture);
    const existing = groups.get(label);
    if (existing) existing.push(fixture);
    else groups.set(label, [fixture]);
  }
  return Array.from(groups, ([label, grouped]) => ({ key: label, label, fixtures: grouped }));
}
