import type { MissionControlCadence, MissionControlCadencePoint } from "@/types/spacex";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

function monthKeyOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Buckets a list of launch date strings into trailing-N-month counts, oldest
 * first / newest last (the newest bar gets the accent treatment in the UI).
 * Pure and synchronous — the SpaceX builder calls this after a single wider
 * "previous launches" fetch, but it's unit-testable on its own without
 * mocking the network layer that supplies the raw dates.
 */
export function aggregateLaunchCadence(
  dateUtcs: Array<string | null | undefined>,
  referenceMs: number,
  monthsBack = 12
): MissionControlCadence {
  const reference = new Date(referenceMs);
  const buckets = new Map<string, MissionControlCadencePoint>();

  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const bucketDate = new Date(
      Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - offset, 1)
    );
    const key = monthKeyOf(bucketDate);
    buckets.set(key, {
      monthKey: key,
      label: MONTH_LABEL_FORMATTER.format(bucketDate),
      count: 0,
    });
  }

  for (const raw of dateUtcs) {
    if (!raw) {
      continue;
    }

    const parsed = Date.parse(raw);
    if (!Number.isFinite(parsed)) {
      continue;
    }

    const key = monthKeyOf(new Date(parsed));
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
    }
  }

  const points = Array.from(buckets.values());
  const rangeLabel =
    points.length > 0 ? `${points[0].label} – ${points[points.length - 1].label}` : "";

  return {
    points,
    rangeLabel,
    generatedAt: new Date(referenceMs).toISOString(),
  };
}
