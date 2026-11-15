"use client";

import { useEffect, useMemo } from "react";
import {
  FollowPicker,
  ProjectWorkspace,
  StorageNotice,
} from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  observeReadings,
  parseFollowedIds,
  toggleFollowedId,
} from "@/lib/personalFollowing";
import { formatUpdatedAt } from "@/lib/date-formatters";
import type { PollingSnapshot } from "@/types/polling";
import {
  compareRaceReading,
  FOLLOWED_RACES_KEY,
  parseRaceReadings,
  raceReading,
  RACE_READINGS_KEY,
} from "./raceFollowing";

export function FollowedRaces({
  snapshot,
  onSelect,
}: {
  snapshot: PollingSnapshot;
  onSelect: (id: string, office: "Senate" | "Governor") => void;
}) {
  const followed = useBrowserRecord(FOLLOWED_RACES_KEY, parseFollowedIds);
  const history = useBrowserRecord(RACE_READINGS_KEY, parseRaceReadings);
  const updateHistory = history.update;
  const races = useMemo(
    () => [...snapshot.senateRaces, ...snapshot.governorRaces],
    [snapshot.senateRaces, snapshot.governorRaces],
  );
  const selected = useMemo(
    () => races.filter((race) => followed.value.includes(race.id)),
    [races, followed.value],
  );
  const readings = useMemo(
    () => selected.map((race) => raceReading(race, snapshot.generatedAt)),
    [selected, snapshot.generatedAt],
  );
  useEffect(() => {
    if (readings.length)
      updateHistory((latest) => observeReadings(latest, readings));
  }, [updateHistory, readings]);
  return (
    <ProjectWorkspace
      id="followed-races"
      title="Races you follow"
      description="Keep up to 20 races in this browser and compare the polling averages shown here with the last copy this browser saw."
    >
      <FollowPicker
        label="Follow a race"
        options={races.map((race) => ({
          id: race.id,
          name: `${race.state} ${race.office} ${race.year}`,
        }))}
        ids={followed.value}
        onToggle={(id) =>
          followed.update((latest) => toggleFollowedId(latest, id))
        }
      />
      <ul className="pw-list">
        {selected.map((race) => {
          const current = readings.find((row) => row.id === race.id)!;
          const before = history.value.find(
            (row) =>
              row.id === race.id &&
              Date.parse(row.sourceAt) < Date.parse(current.sourceAt),
          );
          const change = before ? compareRaceReading(current, before) : null;
          return (
            <li key={race.id}>
              <button
                type="button"
                onClick={() => onSelect(race.id, race.office)}
              >
                {race.state} {race.office} {race.year}
              </button>
              <p>
                {race.candidates
                  .map(
                    (candidate) =>
                      `${candidate.name} ${candidate.support.toFixed(1)}%`,
                  )
                  .join(" · ")}
              </p>
              <p className="pw-note">
                {race.pollCount} polls · newest field end {race.lastPolled} ·
                snapshot {formatUpdatedAt(snapshot.generatedAt)}
              </p>
              {before && change ? (
                <p className="pw-note">
                  {change.candidate}&apos;s margin changed{" "}
                  {change.marginChange > 0 ? "+" : ""}
                  {change.marginChange.toFixed(1)} percentage points since
                  snapshot {formatUpdatedAt(before.sourceAt)} (newest field end{" "}
                  {before.lastPolled}). {change.newPolls}{" "}
                  {change.newPolls === 1 ? "poll ID is" : "poll IDs are"} new to
                  this comparison.
                </p>
              ) : (
                <p className="pw-note">
                  {before
                    ? "The candidates or election year changed, so these readings cannot be compared."
                    : "This browser is seeing this data for the first time, so changes show up after the next refresh."}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="pw-note">
        A changed reading can include a source correction or a changed set of
        polls. These are polling averages, with no win probability or party
        inferred from a candidate&apos;s name.
      </p>
      <StorageNotice
        status={
          followed.status === "memory-only" ? followed.status : history.status
        }
      />
    </ProjectWorkspace>
  );
}
