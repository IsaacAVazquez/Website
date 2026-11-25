"use client";

import { useState } from "react";
import {
  FollowPicker,
  ProjectWorkspace,
  StorageNotice,
} from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { useClientNow } from "@/hooks/useClientNow";
import { parseFollowedIds, toggleFollowedId } from "@/lib/personalFollowing";
import { downloadFile } from "@/lib/downloadFile";
import { formatDateTime } from "@/lib/date-formatters";
import type { Formula1Summary } from "@/types/formula1";
import {
  constructorFollowId,
  formula1SessionCalendar,
  raceReading,
  type Formula1RaceRow,
} from "./raceFollowing";

export function FollowedRacing({
  summary,
  races,
}: {
  summary: Formula1Summary;
  races: Formula1RaceRow[];
}) {
  const followed = useBrowserRecord(
    `f1-followed-${summary.season}-v1`,
    parseFollowedIds,
  );
  const [selected, setSelected] = useState<string[] | null>(null);
  // Null on the server and during hydration, so the cached page and the first
  // client render agree and the clock only filters sessions after that.
  const now = useClientNow();
  const options = [
    ...summary.driverStandings.map((driver) => ({
      id: `driver-${driver.driverNumber}`,
      name: driver.driverName,
    })),
    ...summary.constructorStandings.map((team) => ({
      id: constructorFollowId(team.teamName),
      name: team.teamName,
    })),
  ];
  const compared = (selected ?? followed.value.slice(0, 4)).filter((id) =>
    followed.value.includes(id),
  );
  const next =
    (now === null
      ? undefined
      : summary.meetings
          .filter((meeting) =>
            meeting.sessions.some(
              (session) => Date.parse(session.startAt) > now,
            ),
          )
          .toSorted(
            (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt),
          )[0]) ?? summary.nextMeeting;
  const nextSessions =
    next?.sessions.filter(
      (session) =>
        Number.isFinite(Date.parse(session.startAt)) &&
        Number.isFinite(Date.parse(session.endAt)) &&
        (now === null || Date.parse(session.startAt) > now) &&
        Date.parse(session.endAt) > Date.parse(session.startAt),
    ) ?? [];
  return (
    <ProjectWorkspace
      id="followed-racing"
      title="My racing weekend"
      description={`Follow drivers and constructors for ${summary.season}, then compare up to four across published Grand Prix results. Selections stay in this browser.`}
    >
      <FollowPicker
        label="Driver or constructor"
        options={options}
        ids={followed.value}
        onToggle={(id) =>
          followed.update((latest) => toggleFollowedId(latest, id))
        }
      />
      {followed.value.length > 0 && (
        <>
          <div className="pw-actions">
            {followed.value.map((id) => (
              <label className="pw-check" key={id}>
                <input
                  type="checkbox"
                  checked={compared.includes(id)}
                  disabled={!compared.includes(id) && compared.length >= 4}
                  onChange={() =>
                    setSelected(
                      compared.includes(id)
                        ? compared.filter((value) => value !== id)
                        : [...compared, id],
                    )
                  }
                />
                Compare{" "}
                {options.find((row) => row.id === id)?.name ??
                  `${id} (unavailable)`}
              </label>
            ))}
          </div>
          {compared.length > 0 && (
            <div
              className="pw-scroll"
              tabIndex={0}
              role="region"
              aria-label="Followed racing results"
            >
              <table className="pw-table">
                <caption>
                  Published Grand Prix classifications · snapshot{" "}
                  {formatDateTime(summary.generatedAt)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Race</th>
                    {compared.map((id) => (
                      <th scope="col" key={id}>
                        {options.find((row) => row.id === id)?.name ?? id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => (
                    <tr key={race.key}>
                      <th scope="row">{race.name}</th>
                      {compared.map((id) => (
                        <td key={id}>{raceReading(race, id)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!races.length && (
            <p className="pw-note">
              No published race classifications in this snapshot yet.
            </p>
          )}
          <p className="pw-note">
            Points are the published Grand Prix results. Sprint points are
            separate and these columns do not reconstruct championship totals. A
            missing result stays unreported.
          </p>
        </>
      )}
      {next && (
        <>
          <h3>{next.name} session calendar</h3>
          <p className="pw-note">
            Session times are shown in Pacific time. The download uses UTC and
            your calendar converts it to its own time zone.
          </p>
          <ul className="pw-list">
            {nextSessions.map((session) => (
              <li key={session.key}>
                {session.name} · {formatDateTime(session.startAt)}
              </li>
            ))}
          </ul>
          {nextSessions.length ? (
            <div className="pw-actions">
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    `f1-${summary.season}-${next.key}-sessions.ics`,
                    formula1SessionCalendar(summary.season, next, new Date()),
                    "text/calendar;charset=utf-8",
                  )
                }
              >
                Download race weekend sessions
              </button>
            </div>
          ) : (
            <p className="pw-note">
              No confirmed future sessions are available to download.
            </p>
          )}
          <p className="pw-note">
            This downloads the published schedule. Download again after schedule
            changes.
          </p>
        </>
      )}
      <StorageNotice status={followed.status} />
    </ProjectWorkspace>
  );
}
