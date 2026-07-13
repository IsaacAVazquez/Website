import type { GenericFixture } from "./FixtureCard";

export interface FixtureLedgerGroup {
  key: string;
  label: string;
  fixtures: GenericFixture[];
}

/**
 * Groups fixtures by literal matchday number. Fixtures without a matchday
 * collect into a trailing fallback group rather than being dropped.
 */
export function groupFixturesByMatchday(
  fixtures: GenericFixture[],
  options?: { fallbackLabel?: string; suffix?: string }
): FixtureLedgerGroup[] {
  const groups = new Map<string, GenericFixture[]>();

  for (const fixture of fixtures) {
    const key = fixture.matchday != null ? String(fixture.matchday) : "unscheduled";
    const existing = groups.get(key);
    if (existing) {
      existing.push(fixture);
    } else {
      groups.set(key, [fixture]);
    }
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => {
      if (left === "unscheduled") return 1;
      if (right === "unscheduled") return -1;
      return Number(left) - Number(right);
    })
    .map(([key, groupFixtures]) => ({
      key,
      label:
        key === "unscheduled"
          ? options?.fallbackLabel ?? "Fixtures"
          : `Matchday ${key}${options?.suffix ? ` · ${options.suffix}` : ""}`,
      fixtures: groupFixtures,
    }));
}
