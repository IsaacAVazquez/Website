/**
 * @jest-environment node
 */
import { buildFormula1SnapshotData } from "../formula1Data";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createOpenF1Fetch(resolver: (url: URL) => unknown): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url =
      input instanceof Request
        ? new URL(input.url)
        : new URL(typeof input === "string" ? input : input.toString());

    return jsonResponse(resolver(url));
  }) as typeof fetch;
}

describe("buildFormula1SnapshotData", () => {
  it("builds a current-season snapshot with standings, classifications, and the next meeting", async () => {
    const fetchImpl = createOpenF1Fetch((url) => {
      if (url.pathname === "/v1/meetings") {
        return [
          {
            meeting_key: 1304,
            meeting_name: "Pre-Season Testing",
            meeting_official_name: "FORMULA 1 PRE-SEASON TESTING 2026",
            location: "Sakhir",
            country_name: "Bahrain",
            date_start: "2026-02-11T07:00:00+00:00",
            date_end: "2026-02-13T16:00:00+00:00",
            year: 2026,
          },
          {
            meeting_key: 1281,
            meeting_name: "Japanese Grand Prix",
            meeting_official_name: "FORMULA 1 JAPANESE GRAND PRIX 2026",
            location: "Suzuka",
            country_name: "Japan",
            country_code: "JPN",
            circuit_key: 46,
            circuit_short_name: "Suzuka",
            circuit_type: "Permanent",
            gmt_offset: "09:00:00",
            date_start: "2026-03-27T02:30:00+00:00",
            date_end: "2026-03-29T07:00:00+00:00",
            year: 2026,
          },
          {
            meeting_key: 1282,
            meeting_name: "Bahrain Grand Prix",
            meeting_official_name: "FORMULA 1 BAHRAIN GRAND PRIX 2026",
            location: "Sakhir",
            country_name: "Bahrain",
            country_code: "BRN",
            circuit_key: 63,
            circuit_short_name: "Sakhir",
            circuit_type: "Permanent",
            gmt_offset: "03:00:00",
            date_start: "2026-04-10T11:30:00+00:00",
            date_end: "2026-04-12T17:00:00+00:00",
            year: 2026,
          },
          {
            meeting_key: 1283,
            meeting_name: "Saudi Arabian Grand Prix",
            meeting_official_name: "FORMULA 1 SAUDI ARABIAN GRAND PRIX 2026",
            location: "Jeddah",
            country_name: "Saudi Arabia",
            country_code: "KSA",
            circuit_key: 149,
            circuit_short_name: "Jeddah",
            circuit_type: "Street",
            gmt_offset: "03:00:00",
            date_start: "2026-04-17T15:00:00+00:00",
            date_end: "2026-04-19T19:00:00+00:00",
            year: 2026,
          },
        ];
      }

      if (url.pathname === "/v1/sessions") {
        return [
          {
            session_key: 11250,
            session_name: "Practice 1",
            session_type: "Practice 1",
            date_start: "2026-03-27T02:30:00+00:00",
            date_end: "2026-03-27T03:30:00+00:00",
            meeting_key: 1281,
          },
          {
            session_key: 11253,
            session_name: "Race",
            session_type: "Race",
            date_start: "2026-03-29T05:00:00+00:00",
            date_end: "2026-03-29T07:00:00+00:00",
            meeting_key: 1281,
          },
          {
            session_key: 11258,
            session_name: "Sprint",
            session_type: "Race",
            date_start: "2026-04-11T15:00:00+00:00",
            date_end: "2026-04-11T16:00:00+00:00",
            meeting_key: 1282,
          },
          {
            session_key: 11261,
            session_name: "Race",
            session_type: "Race",
            date_start: "2026-04-12T15:00:00+00:00",
            date_end: "2026-04-12T17:00:00+00:00",
            meeting_key: 1282,
          },
          {
            session_key: 11269,
            session_name: "Race",
            session_type: "Race",
            date_start: "2026-04-19T17:00:00+00:00",
            date_end: "2026-04-19T19:00:00+00:00",
            meeting_key: 1283,
          },
        ];
      }

      if (url.pathname === "/v1/session_result") {
        const sessionKey = url.searchParams.get("session_key");
        if (sessionKey === "11261") {
          return [
            {
              position: 1,
              driver_number: 4,
              number_of_laps: 57,
              points: 25,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5500.123,
              gap_to_leader: 0,
            },
            {
              position: 2,
              driver_number: 81,
              number_of_laps: 57,
              points: 18,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5512.003,
              gap_to_leader: 11.88,
            },
            {
              position: 3,
              driver_number: 63,
              number_of_laps: 57,
              points: 15,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5518.321,
              gap_to_leader: 18.198,
            },
          ];
        }

        if (sessionKey === "11253") {
          return [
            {
              position: 1,
              driver_number: 63,
              number_of_laps: 53,
              points: 25,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5283.403,
              gap_to_leader: 0,
            },
            {
              position: 2,
              driver_number: 4,
              number_of_laps: 53,
              points: 18,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5297.125,
              gap_to_leader: 13.722,
            },
          ];
        }
      }

      if (url.pathname === "/v1/drivers") {
        return [
          {
            driver_number: 4,
            broadcast_name: "L NORRIS",
            full_name: "Lando NORRIS",
            name_acronym: "NOR",
            team_name: "McLaren",
            team_colour: "F47600",
            headshot_url: "https://images.example.com/norris.png",
          },
          {
            driver_number: 81,
            broadcast_name: "O PIASTRI",
            full_name: "Oscar PIASTRI",
            name_acronym: "PIA",
            team_name: "McLaren",
            team_colour: "F47600",
            headshot_url: "https://images.example.com/piastri.png",
          },
          {
            driver_number: 63,
            broadcast_name: "G RUSSELL",
            full_name: "George RUSSELL",
            name_acronym: "RUS",
            team_name: "Mercedes",
            team_colour: "00D7B6",
            headshot_url: "https://images.example.com/russell.png",
          },
        ];
      }

      if (url.pathname === "/v1/championship_drivers") {
        return [
          {
            driver_number: 4,
            position_start: 2,
            position_current: 1,
            points_start: 51,
            points_current: 76,
          },
          {
            driver_number: 63,
            position_start: 1,
            position_current: 2,
            points_start: 59,
            points_current: 74,
          },
          {
            driver_number: 81,
            position_start: 4,
            position_current: 3,
            points_start: 38,
            points_current: 56,
          },
        ];
      }

      if (url.pathname === "/v1/championship_teams") {
        return [
          {
            team_name: "McLaren",
            position_start: 2,
            position_current: 1,
            points_start: 89,
            points_current: 132,
          },
          {
            team_name: "Mercedes",
            position_start: 1,
            position_current: 2,
            points_start: 98,
            points_current: 113,
          },
        ];
      }

      throw new Error(`Unhandled OpenF1 URL in test: ${url.toString()}`);
    });

    const snapshot = await buildFormula1SnapshotData({
      fetchImpl,
      now: new Date("2026-04-15T12:00:00.000Z"),
      minIntervalMs: 0,
    });

    expect(snapshot.season).toBe(2026);
    expect(snapshot.defaultMeetingKey).toBe("1283");
    expect(snapshot.nextMeeting?.name).toBe("Saudi Arabian Grand Prix");
    expect(snapshot.meetings).toHaveLength(3);
    expect(snapshot.seasonMetrics.sprintWeekends).toBe(1);
    expect(snapshot.driverStandings[0]).toMatchObject({
      driverName: "Lando NORRIS",
      points: 76,
      pointsDelta: 25,
      teamName: "McLaren",
      teamColor: "#F47600",
    });
    expect(snapshot.constructorStandings[0]).toMatchObject({
      teamName: "McLaren",
      points: 132,
      pointsDelta: 43,
      teamColor: "#F47600",
    });
    expect(snapshot.meetings[1]).toMatchObject({
      key: "1282",
      hasSprint: true,
      resultPublished: true,
    });
    expect(snapshot.meetings[1].podium).toHaveLength(3);
    expect(snapshot.meetings[1].classification[0]).toMatchObject({
      driverName: "Lando NORRIS",
      statusLabel: "Finished",
      points: 25,
      gapToLeaderLabel: "Leader",
    });
  });

  it("falls back to the latest completed meeting when no future race exists", async () => {
    const fetchImpl = createOpenF1Fetch((url) => {
      if (url.pathname === "/v1/meetings") {
        return [
          {
            meeting_key: 1281,
            meeting_name: "Japanese Grand Prix",
            meeting_official_name: "FORMULA 1 JAPANESE GRAND PRIX 2026",
            location: "Suzuka",
            country_name: "Japan",
            country_code: "JPN",
            circuit_short_name: "Suzuka",
            date_start: "2026-03-27T02:30:00+00:00",
            date_end: "2026-03-29T07:00:00+00:00",
            year: 2026,
          },
          {
            meeting_key: 1282,
            meeting_name: "Bahrain Grand Prix",
            meeting_official_name: "FORMULA 1 BAHRAIN GRAND PRIX 2026",
            location: "Sakhir",
            country_name: "Bahrain",
            country_code: "BRN",
            circuit_short_name: "Sakhir",
            date_start: "2026-04-10T11:30:00+00:00",
            date_end: "2026-04-12T17:00:00+00:00",
            year: 2026,
          },
        ];
      }

      if (url.pathname === "/v1/sessions") {
        return [
          {
            session_key: 11253,
            session_name: "Race",
            session_type: "Race",
            date_start: "2026-03-29T05:00:00+00:00",
            date_end: "2026-03-29T07:00:00+00:00",
            meeting_key: 1281,
          },
          {
            session_key: 11261,
            session_name: "Race",
            session_type: "Race",
            date_start: "2026-04-12T15:00:00+00:00",
            date_end: "2026-04-12T17:00:00+00:00",
            meeting_key: 1282,
          },
        ];
      }

      if (url.pathname === "/v1/session_result") {
        const sessionKey = url.searchParams.get("session_key");
        if (sessionKey === "11261") {
          return [
            {
              position: 1,
              driver_number: 4,
              number_of_laps: 57,
              points: 25,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5500.123,
              gap_to_leader: 0,
            },
          ];
        }

        if (sessionKey === "11253") {
          return [
            {
              position: 1,
              driver_number: 63,
              number_of_laps: 53,
              points: 25,
              dnf: false,
              dns: false,
              dsq: false,
              duration: 5283.403,
              gap_to_leader: 0,
            },
          ];
        }
      }

      if (url.pathname === "/v1/drivers") {
        return [
          {
            driver_number: 4,
            broadcast_name: "L NORRIS",
            full_name: "Lando NORRIS",
            name_acronym: "NOR",
            team_name: "McLaren",
            team_colour: "F47600",
            headshot_url: "https://images.example.com/norris.png",
          },
        ];
      }

      if (url.pathname === "/v1/championship_drivers") {
        return [
          {
            driver_number: 4,
            position_start: 2,
            position_current: 1,
            points_start: 51,
            points_current: 76,
          },
        ];
      }

      if (url.pathname === "/v1/championship_teams") {
        return [
          {
            team_name: "McLaren",
            position_start: 2,
            position_current: 1,
            points_start: 89,
            points_current: 132,
          },
        ];
      }

      throw new Error(`Unhandled OpenF1 URL in test: ${url.toString()}`);
    });

    const snapshot = await buildFormula1SnapshotData({
      fetchImpl,
      now: new Date("2026-04-21T12:00:00.000Z"),
      minIntervalMs: 0,
    });

    expect(snapshot.nextMeeting).toBeNull();
    expect(snapshot.lastCompletedMeeting?.key).toBe("1282");
    expect(snapshot.defaultMeetingKey).toBe("1282");
    expect(snapshot.seasonMetrics.upcomingRaces).toBe(0);
  });
});
