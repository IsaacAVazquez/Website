"use client";

import { useEffect, useMemo, useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  parseFavoriteTeams,
  parseSportsHistory,
  observeSportsSnapshot,
  standingsChanges,
  sportsCalendar,
  type PersonalStanding,
  type PersonalFixture,
  type SportsObservation,
  type PersonalLeague,
  standingRankLabel,
} from "@/lib/sportsPersonal";
import {
  readBrowserStorageString,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import { downloadFile } from "@/lib/downloadFile";
import { formatDateTime } from "@/lib/date-formatters";
import "@/components/project-workflows.css";

function FavoriteSchedule({
  league,
  team,
  onOpen,
}: {
  league: PersonalLeague;
  team: PersonalStanding;
  onOpen: (id: string) => void;
}) {
  const [fixtures, setFixtures] = useState<PersonalFixture[]>([]);
  const [status, setStatus] = useState("Loading published schedule…");
  const [retry, setRetry] = useState(0);
  const hasDownload = sportsCalendar(league, team.name, fixtures).includes("BEGIN:VEVENT");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/${league}/teams/${encodeURIComponent(team.id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Schedule unavailable");
        const data = await response.json();
        const upcoming = league === "mlb" ? data.upcomingGames : data.upcomingFixtures;
        if (!Array.isArray(upcoming))
          throw new Error("Schedule unavailable");
        const rows: PersonalFixture[] = upcoming.map(
          (fixture: {
            id: string;
            utcDate: string;
            status: string;
            homeTeam: { shortName: string };
            awayTeam: { shortName: string };
            startTimeTbd?: boolean;
            ifNecessary?: boolean;
          }) => ({
            id: fixture.id,
            utcDate: fixture.utcDate,
            status: fixture.status,
            home: fixture.homeTeam.shortName,
            away: fixture.awayTeam.shortName,
            startTimeTbd: fixture.startTimeTbd,
            ifNecessary: fixture.ifNecessary,
          }),
        );
        if (!controller.signal.aborted) {
          setFixtures(rows);
          setStatus(
            rows.length ? "" : "No upcoming games are listed in this snapshot.",
          );
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFixtures([]);
          setStatus("Schedule unavailable. Try again.");
        }
      });
    return () => controller.abort();
  }, [league, team.id, retry]);
  return (
    <li>
      <div className="project-workflow-actions">
        <button
          className="c97-btn-ghost"
          type="button"
          onClick={() => onOpen(team.id)}
        >
          {team.name}
        </button>
        <span>
          {team.wins}-{team.losses}
          {team.ties ? `-${team.ties}` : ""} {league === "premier-league" || league === "la-liga" ? "(wins-losses-draws)" : ""} · {standingRankLabel(league)}{" "}
          {team.rank || "unavailable"}
        </span>
      </div>
      {status && <p>{status}</p>}
      {status.startsWith("Schedule unavailable") && (
        <button
          className="c97-btn-ghost"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Retry {team.name} schedule
        </button>
      )}
      {fixtures.slice(0, 3).map((fixture) => (
        <p key={fixture.id}>
          {fixture.away} at {fixture.home} ·{" "}
          {!fixture.startTimeTbd && Number.isFinite(Date.parse(fixture.utcDate))
            ? formatDateTime(fixture.utcDate)
            : "Time unconfirmed"}
        </p>
      ))}
      {fixtures.length > 0 && !hasDownload && <p>No confirmed future games are available to download.</p>}
      {hasDownload && (
        <button
          className="c97-btn-ghost"
          type="button"
          onClick={() =>
            downloadFile(
              `${league}-${team.id}-schedule.ics`,
              sportsCalendar(league, team.name, fixtures),
              "text/calendar;charset=utf-8",
            )
          }
        >
          Download {team.name} schedule
        </button>
      )}
    </li>
  );
}

export function PersonalTeams({
  league,
  season,
  sourceAt,
  teams,
  onOpen,
}: {
  league: PersonalLeague;
  season: string;
  sourceAt: string;
  teams: PersonalStanding[];
  onOpen: (id: string) => void;
}) {
  const favorites = useBrowserRecord(
    `${league}-favorite-teams-v1`,
    parseFavoriteTeams,
  );
  const historyKey = `${league}-observed-standings-v1`;
  const history = useBrowserRecord(historyKey, parseSportsHistory);
  const [chosen, setChosen] = useState("");
  const [message, setMessage] = useState("");
  const serialized = JSON.stringify(teams);
  const current = useMemo<SportsObservation>(
    () => ({ season, sourceAt, teams: JSON.parse(serialized) }),
    [season, sourceAt, serialized],
  );
  useEffect(() => {
    const latest = parseSportsHistory(
      readBrowserStorageString(historyKey).value ?? "",
    );
    const clean = parseSportsHistory(JSON.stringify([current]))[0];
    if (!clean) return;
    const next = observeSportsSnapshot(latest, clean);
    if (next !== latest) writeBrowserStorageJson(historyKey, next);
  }, [historyKey, current]);
  const prior = history.value.find(
    (item) =>
      item.season === season &&
      Date.parse(item.sourceAt) < Date.parse(sourceAt),
  );
  const changes = prior ? standingsChanges(current, prior) : [];
  const savedTeams = teams.filter((team) => favorites.value.includes(team.id));
  return (
    <section
      className="project-workflow"
      aria-label={`${league.toUpperCase()} personal teams`}
    >
      <details open={savedTeams.length > 0 ? true : undefined}>
        <summary className="c97-btn-ghost">
          My teams and standings changes
        </summary>
        <div className="project-workflow-actions">
          <label>
            Favorite team
            <select
              className="c97-field"
              value={chosen}
              onChange={(event) => setChosen(event.target.value)}
            >
              <option value="">Choose a team</option>
              {teams
                .filter((team) => !favorites.value.includes(team.id))
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="c97-btn"
            type="button"
            disabled={!chosen || favorites.value.length >= 10}
            onClick={() => {
              if (!teams.some((team) => team.id === chosen)) return;
              favorites.update((latest) =>
                [...new Set([...latest, chosen])].slice(0, 10),
              );
              setMessage("Favorite team saved.");
              setChosen("");
            }}
          >
            Save favorite team
          </button>
        </div>
        {favorites.value.length >= 10 && (
          <p>Ten teams are saved. Remove a team before adding another.</p>
        )}
        <ul className="project-workflow-list">
          {savedTeams.map((team) => (
            <li key={team.id}>
              <ul className="project-workflow-list">
                <FavoriteSchedule league={league} team={team} onOpen={onOpen} />
              </ul>
              <button
                className="c97-btn-ghost"
                type="button"
                onClick={() =>
                  favorites.update((latest) =>
                    latest.filter((id) => id !== team.id),
                  )
                }
              >
                Remove favorite {team.name}
              </button>
            </li>
          ))}
        </ul>
        {!savedTeams.length && (
          <p>
            Save a team to put its next games here, ahead of the league
            standings.
          </p>
        )}
        <small>
          Downloads contain the upcoming games published in the snapshot with
          confirmed times. Reimport a new download after schedule changes.
        </small>
        {favorites.value.filter((id) => !teams.some((team) => team.id === id)).map((id) => <p key={id}>{id} (unavailable in this snapshot) <button className="c97-btn-ghost" type="button" onClick={() => favorites.update((latest) => latest.filter((item) => item !== id))}>Remove favorite {id}</button></p>)}
        <h2>Standings changes between your visits</h2>
        {prior ? (
          <>
            <p>
              Comparing {prior.sourceAt} with {sourceAt}. These are snapshots
              seen in this browser. Rank changes use {standingRankLabel(league).toLowerCase()} and may
              include source corrections.
            </p>
            <div
              className="project-workflow-scroll"
              tabIndex={0}
              role="region"
              aria-label="Standings changes"
            >
              <table>
                <caption>{standingRankLabel(league)} and record changes</caption>
                <thead>
                  <tr>
                    <th scope="col">Team</th>
                    <th scope="col">Rank movement</th>
                    <th scope="col">Wins added</th>
                    <th scope="col">Losses added</th>
                    {league !== "nba" && league !== "mlb" && <th scope="col">{league === "nfl" ? "Ties" : "Draws"} added</th>}
                  </tr>
                </thead>
                <tbody>
                  {changes
                    .filter(
                      (team) =>
                        !savedTeams.length || favorites.value.includes(team.id),
                    )
                    .map((team) => (
                      <tr key={team.id}>
                        <th scope="row">{team.name}</th>
                        <td>
                          {team.rankChange > 0
                            ? `Up ${team.rankChange}`
                            : team.rankChange < 0
                              ? `Down ${Math.abs(team.rankChange)}`
                              : "Unchanged"}
                        </td>
                        <td>{team.winsChange}</td>
                        <td>{team.lossesChange}</td>
                        {league !== "nba" && league !== "mlb" && <td>{team.tiesChange}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>
            This browser is seeing this season&apos;s standings for the first time, so
            changes show up after the next refresh.
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {(favorites.status === "memory-only" ||
          history.status === "memory-only") && (
          <p role="status">
            Browser storage is unavailable. Favorites and observations last only
            while this tab is open.
          </p>
        )}
      </details>
    </section>
  );
}
