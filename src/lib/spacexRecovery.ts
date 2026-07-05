import type { MissionCore, MissionLaunchDetail } from "@/types/spacex";

export interface RecoverySplitBucket {
  label: "Droneship" | "Return to pad" | "Expended";
  count: number;
  tone: "signal" | "ink" | "stone";
}

export interface MissionFleetLeader {
  serial: string;
  flights: number;
  lastMissionName: string;
}

export interface MissionRecoverySummary {
  split: RecoverySplitBucket[];
  total: number;
  fleetLeaders: MissionFleetLeader[];
}

const TONE_BY_BUCKET: Record<RecoverySplitBucket["label"], RecoverySplitBucket["tone"]> = {
  Droneship: "signal",
  "Return to pad": "ink",
  Expended: "stone",
};

function bucketLandingType(core: MissionCore): RecoverySplitBucket["label"] | null {
  if (core.landingAttempt === false) {
    return "Expended";
  }

  const type = (core.landingType ?? "").toLowerCase();
  if (!type) {
    return null;
  }

  if (
    type.includes("ocean") ||
    type.includes("ship") ||
    type.includes("drone") ||
    type.includes("barge")
  ) {
    return "Droneship";
  }

  if (type.includes("ground") || type.includes("pad") || type.includes("rtls") || type.includes("land")) {
    return "Return to pad";
  }

  if (type.includes("none") || type.includes("expend")) {
    return "Expended";
  }

  return null;
}

/**
 * Aggregates recovery-method split and fleet-leader rankings from whatever
 * MissionCore records are actually populated across the hydrated launch
 * details. Returns null when there's nothing usable — as of this writing,
 * Launch Library's launcher_stage/landing payload is empty for every SpaceX
 * launch this snapshot hydrates — so the UI can render an honest empty state
 * instead of a chart full of zeros. The normalizer (`normalizeCores` in
 * spacexData.ts) already maps this field whenever upstream populates it; this
 * function just needs real data to show up in a future refresh, no further
 * builder work.
 */
export function aggregateMissionRecovery(
  launchDetails: Record<string, MissionLaunchDetail>
): MissionRecoverySummary | null {
  const bucketCounts = new Map<RecoverySplitBucket["label"], number>();
  const bySerial = new Map<
    string,
    { flights: Set<number>; lastMissionName: string; lastFlight: number }
  >();
  let attemptsWithData = 0;

  for (const detail of Object.values(launchDetails)) {
    for (const core of detail.cores) {
      const bucket = bucketLandingType(core);
      if (bucket) {
        bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
        attemptsWithData += 1;
      }

      if (core.serial) {
        const entry = bySerial.get(core.serial) ?? {
          flights: new Set<number>(),
          lastMissionName: detail.name,
          lastFlight: -Infinity,
        };

        if (core.flight) {
          entry.flights.add(core.flight);
        }

        if ((core.flight ?? 0) >= entry.lastFlight) {
          entry.lastFlight = core.flight ?? entry.lastFlight;
          entry.lastMissionName = detail.name;
        }

        bySerial.set(core.serial, entry);
      }
    }
  }

  if (attemptsWithData === 0) {
    return null;
  }

  const split = (Object.keys(TONE_BY_BUCKET) as Array<RecoverySplitBucket["label"]>)
    .filter((label) => bucketCounts.has(label))
    .map((label) => ({
      label,
      count: bucketCounts.get(label) ?? 0,
      tone: TONE_BY_BUCKET[label],
    }));

  const fleetLeaders = Array.from(bySerial.entries())
    .map(([serial, entry]) => ({
      serial,
      flights: entry.flights.size,
      lastMissionName: entry.lastMissionName,
    }))
    .filter((leader) => leader.flights > 0)
    .sort((a, b) => b.flights - a.flights)
    .slice(0, 5);

  return {
    split,
    total: split.reduce((sum, bucket) => sum + bucket.count, 0),
    fleetLeaders,
  };
}
