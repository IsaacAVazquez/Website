import type { Race, RaceCandidate } from "@/types/polling";
import {
  isFollowingId,
  isSourceTime,
  readRecordArray,
} from "@/lib/personalFollowing";
import { isLocalDateKey } from "@/lib/date-formatters";

export const FOLLOWED_RACES_KEY = "polling-followed-races-v1";
export const RACE_READINGS_KEY = "polling-race-readings-v1";
export interface RaceReading {
  id: string;
  year: number;
  sourceAt: string;
  lastPolled: string;
  candidates: [RaceCandidate, RaceCandidate];
  pollIds: string[];
}
export function raceReading(race: Race, sourceAt: string): RaceReading {
  return {
    id: race.id,
    year: race.year,
    sourceAt,
    lastPolled: race.lastPolled,
    candidates: race.candidates.map((c) => ({
      ...c,
    })) as RaceReading["candidates"],
    pollIds: race.polls.map((poll) => poll.id),
  };
}
export function parseRaceReadings(raw: string): RaceReading[] {
  return readRecordArray(raw)
    .flatMap((row): RaceReading[] => {
      if (
        !isFollowingId(row.id) ||
        !isSourceTime(row.sourceAt) ||
        !isLocalDateKey(row.lastPolled) ||
        !Number.isInteger(row.year) ||
        (row.year as number) < 2000 ||
        (row.year as number) > 2200 ||
        !Array.isArray(row.candidates) ||
        row.candidates.length !== 2 ||
        !Array.isArray(row.pollIds) ||
        row.pollIds.length > 500
      )
        return [];
      const candidates = row.candidates;
      if (
        !candidates.every(
          (c) =>
            c &&
            typeof c.name === "string" &&
            c.name.trim() &&
            c.name.length <= 150 &&
            typeof c.support === "number" &&
            Number.isFinite(c.support) &&
            c.support >= 0 &&
            c.support <= 100,
        ) ||
        candidates[0].name === candidates[1].name ||
        !row.pollIds.every(isFollowingId)
      )
        return [];
      return [
        {
          id: row.id,
          sourceAt: row.sourceAt,
          lastPolled: row.lastPolled,
          year: row.year as number,
          candidates: candidates.map(({ name, support }) => ({
            name,
            support,
          })) as RaceReading["candidates"],
          pollIds: [...new Set(row.pollIds as string[])],
        },
      ];
    })
    .slice(0, 80);
}
export function compareRaceReading(
  current: RaceReading,
  previous: RaceReading,
) {
  if (
    current.id !== previous.id ||
    current.year !== previous.year ||
    !current.candidates.every((c) =>
      previous.candidates.some((old) => old.name === c.name),
    )
  )
    return null;
  const [lead, other] = current.candidates;
  const oldLead = previous.candidates.find((c) => c.name === lead.name)!;
  const oldOther = previous.candidates.find((c) => c.name === other.name)!;
  return {
    candidate: lead.name,
    marginChange:
      Math.round(
        (lead.support - other.support - (oldLead.support - oldOther.support)) *
          10,
      ) / 10,
    newPolls: current.pollIds.filter((id) => !previous.pollIds.includes(id))
      .length,
  };
}
