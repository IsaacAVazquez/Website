"use client";

import { useEffect, useMemo } from "react";
import {
  FollowPicker,
  ProjectWorkspace,
  StorageNotice,
} from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { useClientNow } from "@/hooks/useClientNow";
import {
  observeReadings,
  parseFollowedIds,
  toggleFollowedId,
} from "@/lib/personalFollowing";
import { downloadFile } from "@/lib/downloadFile";
import { formatUpdatedAt } from "@/lib/date-formatters";
import type { MissionLaunchCard } from "@/types/spacex";
import {
  calendarLaunches,
  FOLLOWED_LAUNCHES_KEY,
  launchCalendar,
  launchReading,
  LAUNCH_READINGS_KEY,
  parseLaunchReadings,
  scheduleChange,
} from "./launchFollowing";

export function FollowedLaunches({
  launches,
  sourceAt,
  onSelect,
}: {
  launches: MissionLaunchCard[];
  sourceAt: string | null;
  onSelect: (id: string) => void;
}) {
  const followed = useBrowserRecord(FOLLOWED_LAUNCHES_KEY, parseFollowedIds);
  const history = useBrowserRecord(LAUNCH_READINGS_KEY, parseLaunchReadings);
  const updateHistory = history.update;
  const now = useClientNow();
  const selected = useMemo(
    () => launches.filter((launch) => followed.value.includes(launch.id)),
    [launches, followed.value],
  );
  const readings = useMemo(
    () =>
      sourceAt ? selected.map((launch) => launchReading(launch, sourceAt)) : [],
    [selected, sourceAt],
  );
  useEffect(() => {
    if (readings.length)
      updateHistory((latest) => observeReadings(latest, readings));
  }, [updateHistory, readings]);
  const calendar =
    now === null ? [] : calendarLaunches(selected, new Date(now));
  return (
    <ProjectWorkspace
      id="followed-launches"
      title="Your launch tracker"
      description="Follow up to 20 launches in this browser. The tracker compares the launch data loaded with this page against the last copy this browser saw, so reload the page to pick up newer data."
    >
      <FollowPicker
        label="Follow a launch"
        options={launches}
        ids={followed.value}
        onToggle={(id) =>
          followed.update((latest) => toggleFollowedId(latest, id))
        }
      />
      <ul className="pw-list">
        {selected.map((launch) => {
          const current = readings.find((row) => row.id === launch.id);
          const before = current
            ? history.value.find(
                (row) =>
                  row.id === launch.id &&
                  Date.parse(row.sourceAt) < Date.parse(current.sourceAt),
              )
            : undefined;
          return (
            <li key={launch.id}>
              <button type="button" onClick={() => onSelect(launch.id)}>
                {launch.name}
              </button>
              <p>
                {launch.upcoming
                  ? "Upcoming"
                  : launch.success === true
                    ? "Successful"
                    : launch.success === false
                      ? "Unsuccessful"
                      : "Outcome not reported"}{" "}
                · {formatUpdatedAt(launch.dateUtc)}
                {current?.precise ? "" : " · time uncertain"}
              </p>
              {before && current ? (
                <p className="pw-note">
                  {scheduleChange(current, before)
                    ? `Schedule or status changed since the ${formatUpdatedAt(before.sourceAt)} snapshot. Earlier time ${formatUpdatedAt(before.dateUtc)} (${before.precise ? "precise" : "uncertain"}); status ${before.upcoming ? "upcoming" : before.success === true ? "successful" : before.success === false ? "unsuccessful" : "outcome unknown"}.`
                    : `No schedule or status change since the ${formatUpdatedAt(before.sourceAt)} snapshot.`}
                </p>
              ) : (
                <p className="pw-note">
                  This browser is seeing this data for the first time, so changes show up after the next refresh.
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="pw-actions">
        <button
          type="button"
          disabled={!calendar.length}
          onClick={() =>
            downloadFile(
              "followed-launches.ics",
              launchCalendar(selected),
              "text/calendar;charset=utf-8",
            )
          }
        >
          Download launch calendar ({calendar.length})
        </button>
      </div>
      <p className="pw-note">
        Only launches with a precise future time go into the calendar, and uncertain dates stay out.
        Downloads do not update automatically, so download again after a
        schedule change.
        {sourceAt ? ` Source snapshot ${formatUpdatedAt(sourceAt)}.` : ""}
      </p>
      <StorageNotice
        status={
          followed.status === "memory-only" ? followed.status : history.status
        }
      />
    </ProjectWorkspace>
  );
}
