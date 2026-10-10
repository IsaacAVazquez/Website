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

// The rows below are cut down from OpenF1 responses saved on 2026-09-27, with
// every field left as the API sent it.
const REAL_MEETINGS: Record<string, unknown[]> = {
  "2026": [
    { meeting_key: 1304, meeting_name: "Pre-Season Testing", meeting_official_name: "FORMULA 1 ARAMCO PRE-SEASON TESTING 1 2026", location: "Bahrain", country_key: 36, country_code: "BRN", country_name: "Bahrain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/bahrain-flag.png", circuit_key: 63, circuit_short_name: "Sakhir", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/63/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png", gmt_offset: "03:00:00", date_start: "2026-02-11T07:00:00+00:00", date_end: "2026-02-13T16:00:00+00:00", year: 2026, is_cancelled: false },
    { meeting_key: 1282, meeting_name: "Bahrain Grand Prix", meeting_official_name: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2026", location: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/bahrain-flag.png", circuit_key: 63, circuit_short_name: "Sakhir", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/63/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png", gmt_offset: "03:00:00", date_start: "2026-04-10T11:30:00+00:00", date_end: "2026-04-12T17:00:00+00:00", year: 2026, is_cancelled: true },
    { meeting_key: 1283, meeting_name: "Saudi Arabian Grand Prix", meeting_official_name: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2026", location: "Jeddah", country_key: 153, country_code: "KSA", country_name: "Saudi Arabia", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/saudi-arabia-flag.png", circuit_key: 149, circuit_short_name: "Jeddah", circuit_type: "Temporary - Street", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/149/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi Arabia%20carbon.png", gmt_offset: "03:00:00", date_start: "2026-04-17T13:30:00+00:00", date_end: "2026-04-19T19:00:00+00:00", year: 2026, is_cancelled: true },
    { meeting_key: 1291, meeting_name: "Hungarian Grand Prix", meeting_official_name: "FORMULA 1 AWS HUNGARIAN GRAND PRIX 2026", location: "Budapest", country_key: 14, country_code: "HUN", country_name: "Hungary", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/hungary-flag.png", circuit_key: 4, circuit_short_name: "Hungaroring", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/4/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Hungary%20carbon.png", gmt_offset: "02:00:00", date_start: "2026-07-24T11:30:00+00:00", date_end: "2026-07-26T15:00:00+00:00", year: 2026, is_cancelled: false },
    { meeting_key: 1292, meeting_name: "Dutch Grand Prix", meeting_official_name: "FORMULA 1 HEINEKEN DUTCH GRAND PRIX 2026", location: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/netherlands-flag.png", circuit_key: 55, circuit_short_name: "Zandvoort", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/55/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Netherlands%20carbon.png", gmt_offset: "02:00:00", date_start: "2026-08-21T10:30:00+00:00", date_end: "2026-08-23T15:00:00+00:00", year: 2026, is_cancelled: false },
    { meeting_key: 1294, meeting_name: "Spanish Grand Prix", meeting_official_name: "FORMULA 1 TAG HEUER GRAN PREMIO DE ESPAÑA 2026", location: "Madrid", country_key: 1, country_code: "ESP", country_name: "Spain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/spain-flag.png", circuit_key: 153, circuit_short_name: "Madring", circuit_type: "Temporary - Street", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/153/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Spain%20carbon.png", gmt_offset: "02:00:00", date_start: "2026-09-11T11:30:00+00:00", date_end: "2026-09-13T15:00:00+00:00", year: 2026, is_cancelled: false },
    { meeting_key: 1295, meeting_name: "Azerbaijan Grand Prix", meeting_official_name: "FORMULA 1 QATAR AIRWAYS AZERBAIJAN GRAND PRIX 2026", location: "Baku", country_key: 30, country_code: "AZE", country_name: "Azerbaijan", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/azerbaijan-flag.png", circuit_key: 144, circuit_short_name: "Baku", circuit_type: "Temporary - Street", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/144/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Azerbaijan%20carbon.png", gmt_offset: "04:00:00", date_start: "2026-09-24T08:30:00+00:00", date_end: "2026-09-26T13:00:00+00:00", year: 2026, is_cancelled: false },
    { meeting_key: 1308, meeting_name: "Bahrain Grand Prix", meeting_official_name: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX IN MALAYSIA 2026", location: "Kuala Lumpur", country_key: 36, country_code: "BRN", country_name: "Bahrain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/bahrain-flag.png", circuit_key: 12, circuit_short_name: "Kuala Lumpur", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/12/2026", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png", gmt_offset: "08:00:00", date_start: "2026-10-02T04:30:00+00:00", date_end: "2026-10-04T09:00:00+00:00", year: 2026, is_cancelled: false },
  ],
  "2027": [
    { meeting_key: 1309, meeting_name: "Pre-Season Testing", meeting_official_name: "FORMULA 1 ARAMCO PRE-SEASON TESTING 2027", location: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/bahrain-flag.png", circuit_key: 63, circuit_short_name: "Sakhir", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/63/2027", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png", gmt_offset: "04:00:00", date_start: "2027-02-24T04:00:00+00:00", date_end: "2027-02-27T12:00:00+00:00", year: 2027, is_cancelled: false },
    { meeting_key: 1310, meeting_name: "Bahrain Grand Prix", meeting_official_name: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2027", location: "Bahrain", country_key: 36, country_code: "BRN", country_name: "Bahrain", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/bahrain-flag.png", circuit_key: 63, circuit_short_name: "Sakhir", circuit_type: "Permanent", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/63/2027", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Bahrain%20carbon.png", gmt_offset: "04:00:00", date_start: "2027-03-12T08:00:00+00:00", date_end: "2027-03-14T13:00:00+00:00", year: 2027, is_cancelled: false },
    { meeting_key: 1311, meeting_name: "Saudi Arabian Grand Prix", meeting_official_name: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2027", location: "Jeddah", country_key: 153, country_code: "KSA", country_name: "Saudi Arabia", country_flag: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Flags%2016x9/saudi-arabia-flag.png", circuit_key: 149, circuit_short_name: "Jeddah", circuit_type: "Temporary - Street", circuit_info_url: "https://api.multiviewer.app/api/v1/circuits/149/2027", circuit_image: "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Track%20icons%204x3/Saudi Arabia%20carbon.png", gmt_offset: "04:00:00", date_start: "2027-03-19T08:00:00+00:00", date_end: "2027-03-21T13:00:00+00:00", year: 2027, is_cancelled: false },
  ],
};

const REAL_SESSIONS: Record<string, unknown[]> = {
  "2026": [
    { session_key: 11465, session_type: "Practice", session_name: "Day 1", date_start: "2026-02-11T07:00:00+00:00", date_end: "2026-02-11T16:00:00+00:00", meeting_key: 1304, circuit_key: 63, circuit_short_name: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", location: "Bahrain", gmt_offset: "03:00:00", year: 2026, is_cancelled: false },
    { session_key: 11261, session_type: "Race", session_name: "Race", date_start: "2026-04-12T15:00:00+00:00", date_end: "2026-04-12T17:00:00+00:00", meeting_key: 1282, circuit_key: 63, circuit_short_name: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", location: "Sakhir", gmt_offset: "03:00:00", year: 2026, is_cancelled: true },
    { session_key: 11269, session_type: "Race", session_name: "Race", date_start: "2026-04-19T17:00:00+00:00", date_end: "2026-04-19T19:00:00+00:00", meeting_key: 1283, circuit_key: 149, circuit_short_name: "Jeddah", country_key: 153, country_code: "KSA", country_name: "Saudi Arabia", location: "Jeddah", gmt_offset: "03:00:00", year: 2026, is_cancelled: true },
    { session_key: 11342, session_type: "Race", session_name: "Race", date_start: "2026-07-26T13:00:00+00:00", date_end: "2026-07-26T15:00:00+00:00", meeting_key: 1291, circuit_key: 4, circuit_short_name: "Hungaroring", country_key: 14, country_code: "HUN", country_name: "Hungary", location: "Budapest", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11343, session_type: "Practice", session_name: "Practice 1", date_start: "2026-08-21T10:30:00+00:00", date_end: "2026-08-21T11:30:00+00:00", meeting_key: 1292, circuit_key: 55, circuit_short_name: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", location: "Zandvoort", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11344, session_type: "Qualifying", session_name: "Sprint Qualifying", date_start: "2026-08-21T14:30:00+00:00", date_end: "2026-08-21T15:14:00+00:00", meeting_key: 1292, circuit_key: 55, circuit_short_name: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", location: "Zandvoort", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11348, session_type: "Race", session_name: "Sprint", date_start: "2026-08-22T10:00:00+00:00", date_end: "2026-08-22T11:00:00+00:00", meeting_key: 1292, circuit_key: 55, circuit_short_name: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", location: "Zandvoort", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11349, session_type: "Qualifying", session_name: "Qualifying", date_start: "2026-08-22T14:00:00+00:00", date_end: "2026-08-22T15:00:00+00:00", meeting_key: 1292, circuit_key: 55, circuit_short_name: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", location: "Zandvoort", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11353, session_type: "Race", session_name: "Race", date_start: "2026-08-23T13:00:00+00:00", date_end: "2026-08-23T15:00:00+00:00", meeting_key: 1292, circuit_key: 55, circuit_short_name: "Zandvoort", country_key: 133, country_code: "NED", country_name: "Netherlands", location: "Zandvoort", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11365, session_type: "Qualifying", session_name: "Qualifying", date_start: "2026-09-12T14:00:00+00:00", date_end: "2026-09-12T15:00:00+00:00", meeting_key: 1294, circuit_key: 153, circuit_short_name: "Madring", country_key: 1, country_code: "ESP", country_name: "Spain", location: "Madrid", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11369, session_type: "Race", session_name: "Race", date_start: "2026-09-13T13:00:00+00:00", date_end: "2026-09-13T15:00:00+00:00", meeting_key: 1294, circuit_key: 153, circuit_short_name: "Madring", country_key: 1, country_code: "ESP", country_name: "Spain", location: "Madrid", gmt_offset: "02:00:00", year: 2026, is_cancelled: false },
    { session_key: 11373, session_type: "Qualifying", session_name: "Qualifying", date_start: "2026-09-25T12:00:00+00:00", date_end: "2026-09-25T13:00:00+00:00", meeting_key: 1295, circuit_key: 144, circuit_short_name: "Baku", country_key: 30, country_code: "AZE", country_name: "Azerbaijan", location: "Baku", gmt_offset: "04:00:00", year: 2026, is_cancelled: false },
    { session_key: 11377, session_type: "Race", session_name: "Race", date_start: "2026-09-26T11:00:00+00:00", date_end: "2026-09-26T13:00:00+00:00", meeting_key: 1295, circuit_key: 144, circuit_short_name: "Baku", country_key: 30, country_code: "AZE", country_name: "Azerbaijan", location: "Baku", gmt_offset: "04:00:00", year: 2026, is_cancelled: false },
    { session_key: 11731, session_type: "Race", session_name: "Race", date_start: "2026-10-04T07:00:00+00:00", date_end: "2026-10-04T09:00:00+00:00", meeting_key: 1308, circuit_key: 12, circuit_short_name: "Kuala Lumpur", country_key: 36, country_code: "BRN", country_name: "Bahrain", location: "Kuala Lumpur", gmt_offset: "08:00:00", year: 2026, is_cancelled: false },
  ],
  "2027": [
    { session_key: 92713101, session_type: "Practice", session_name: "Practice 1", date_start: "2027-03-12T08:00:00+00:00", date_end: "2027-03-12T09:00:00+00:00", meeting_key: 1310, circuit_key: 63, circuit_short_name: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", location: "Bahrain", gmt_offset: "04:00:00", year: 2027, is_cancelled: false },
    { session_key: 92713105, session_type: "Race", session_name: "Race", date_start: "2027-03-14T11:00:00+00:00", date_end: "2027-03-14T13:00:00+00:00", meeting_key: 1310, circuit_key: 63, circuit_short_name: "Sakhir", country_key: 36, country_code: "BRN", country_name: "Bahrain", location: "Bahrain", gmt_offset: "04:00:00", year: 2027, is_cancelled: false },
  ],
};

const REAL_SESSION_RESULTS: Record<string, unknown[]> = {
  "11348": [
    { position: 1, driver_number: 63, number_of_laps: 24, points: 8, dnf: false, dns: false, dsq: false, duration: 1825.318, gap_to_leader: 0, meeting_key: 1292, session_key: 11348 },
    { position: 2, driver_number: 16, number_of_laps: 24, points: 7, dnf: false, dns: false, dsq: false, gap_to_leader: 1.36, duration: 1826.678, meeting_key: 1292, session_key: 11348 },
    { position: 3, driver_number: 1, number_of_laps: 24, points: 6, dnf: false, dns: false, dsq: false, gap_to_leader: 5.196, duration: 1830.514, meeting_key: 1292, session_key: 11348 },
  ],
  "11353": [
    { position: 1, driver_number: 1, number_of_laps: 72, points: 25, dnf: false, dns: false, dsq: false, duration: 7484.859, gap_to_leader: 0, meeting_key: 1292, session_key: 11353 },
    { position: 2, driver_number: 12, number_of_laps: 72, points: 18, dnf: false, dns: false, dsq: false, gap_to_leader: 11.536, duration: 7496.395, meeting_key: 1292, session_key: 11353 },
    { position: 3, driver_number: 63, number_of_laps: 72, points: 15, dnf: false, dns: false, dsq: false, gap_to_leader: 15.906, duration: 7500.765, meeting_key: 1292, session_key: 11353 },
    { position: 11, driver_number: 22, number_of_laps: 71, points: 0, dnf: false, dns: false, dsq: false, gap_to_leader: "+1 LAP", duration: null, meeting_key: 1292, session_key: 11353 },
  ],
  "11369": [
    { position: 1, driver_number: 12, number_of_laps: 57, points: 25, dnf: false, dns: false, dsq: false, duration: 5663.754, gap_to_leader: 0, meeting_key: 1294, session_key: 11369 },
    { position: 2, driver_number: 3, number_of_laps: 57, points: 18, dnf: false, dns: false, dsq: false, gap_to_leader: 4.351, duration: 5668.105, meeting_key: 1294, session_key: 11369 },
    { position: 3, driver_number: 1, number_of_laps: 57, points: 15, dnf: false, dns: false, dsq: false, gap_to_leader: 5.089, duration: 5668.843, meeting_key: 1294, session_key: 11369 },
    { position: 14, driver_number: 22, number_of_laps: 56, points: 0, dnf: false, dns: false, dsq: false, gap_to_leader: "+1 LAP", duration: null, meeting_key: 1294, session_key: 11369 },
  ],
  "11377": [
    { position: 1, driver_number: 63, number_of_laps: 51, points: 25, dnf: false, dns: false, dsq: false, duration: 5882.143, gap_to_leader: 0, meeting_key: 1295, session_key: 11377 },
    { position: 2, driver_number: 3, number_of_laps: 51, points: 18, dnf: false, dns: false, dsq: false, gap_to_leader: 0.196, duration: 5882.339, meeting_key: 1295, session_key: 11377 },
    { position: 3, driver_number: 6, number_of_laps: 51, points: 15, dnf: false, dns: false, dsq: false, gap_to_leader: 10.704, duration: 5892.847, meeting_key: 1295, session_key: 11377 },
  ],
};

const REAL_DRIVER_STANDINGS: Record<string, unknown[]> = {
  "11348": [
    { meeting_key: 1292, session_key: 11348, driver_number: 12, position_start: 1, position_current: 1, points_start: 219, points_current: 224 },
    { meeting_key: 1292, session_key: 11348, driver_number: 44, position_start: 2, position_current: 2, points_start: 169, points_current: 171 },
    { meeting_key: 1292, session_key: 11348, driver_number: 63, position_start: 3, position_current: 3, points_start: 160, points_current: 168 },
  ],
  "11377": [
    { meeting_key: 1295, session_key: 11377, driver_number: 12, position_start: 1, position_current: 1, points_start: 292, points_current: 302 },
    { meeting_key: 1295, session_key: 11377, driver_number: 63, position_start: 2, position_current: 2, points_start: 211, points_current: 236 },
    { meeting_key: 1295, session_key: 11377, driver_number: 44, position_start: 3, position_current: 3, points_start: 191, points_current: 199 },
    { meeting_key: 1295, session_key: 11377, driver_number: 22, position_start: 20, position_current: 20, points_start: 1, points_current: 1 },
  ],
};

const REAL_TEAM_STANDINGS: Record<string, unknown[]> = {
  "11348": [
    { meeting_key: 1292, session_key: 11348, team_name: "Mercedes", position_start: 1, position_current: 1, points_start: 379, points_current: 392 },
    { meeting_key: 1292, session_key: 11348, team_name: "Ferrari", position_start: 2, position_current: 2, points_start: 307, points_current: 316 },
    { meeting_key: 1292, session_key: 11348, team_name: "McLaren", position_start: 3, position_current: 3, points_start: 220, points_current: 230 },
  ],
  "11377": [
    { meeting_key: 1295, session_key: 11377, team_name: "Mercedes", position_start: 1, position_current: 1, points_start: 503, points_current: 538 },
    { meeting_key: 1295, session_key: 11377, team_name: "Ferrari", position_start: 2, position_current: 2, points_start: 358, points_current: 378 },
    { meeting_key: 1295, session_key: 11377, team_name: "McLaren", position_start: 3, position_current: 3, points_start: 306, points_current: 306 },
    { meeting_key: 1295, session_key: 11377, team_name: "Racing Bulls", position_start: 5, position_current: 5, points_start: 77, points_current: 83 },
  ],
};

const REAL_ENTRY_LISTS: Record<string, unknown[]> = {
  "11348": [
    { meeting_key: 1292, session_key: 11348, driver_number: 1, broadcast_name: "L NORRIS", full_name: "Lando NORRIS", name_acronym: "NOR", team_name: "McLaren", team_colour: "F47600", first_name: "Lando", last_name: "Norris", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11348, driver_number: 12, broadcast_name: "K ANTONELLI", full_name: "Kimi ANTONELLI", name_acronym: "ANT", team_name: "Mercedes", team_colour: "00D7B6", first_name: "Kimi", last_name: "Antonelli", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11348, driver_number: 16, broadcast_name: "C LECLERC", full_name: "Charles LECLERC", name_acronym: "LEC", team_name: "Ferrari", team_colour: "ED1131", first_name: "Charles", last_name: "Leclerc", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11348, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11348, driver_number: 44, broadcast_name: "L HAMILTON", full_name: "Lewis HAMILTON", name_acronym: "HAM", team_name: "Ferrari", team_colour: "ED1131", first_name: "Lewis", last_name: "Hamilton", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11348, driver_number: 63, broadcast_name: "G RUSSELL", full_name: "George RUSSELL", name_acronym: "RUS", team_name: "Mercedes", team_colour: "00D7B6", first_name: "George", last_name: "Russell", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png", country_code: null },
  ],
  "11353": [
    { meeting_key: 1292, session_key: 11353, driver_number: 1, broadcast_name: "L NORRIS", full_name: "Lando NORRIS", name_acronym: "NOR", team_name: "McLaren", team_colour: "F47600", first_name: "Lando", last_name: "Norris", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11353, driver_number: 12, broadcast_name: "K ANTONELLI", full_name: "Kimi ANTONELLI", name_acronym: "ANT", team_name: "Mercedes", team_colour: "00D7B6", first_name: "Kimi", last_name: "Antonelli", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11353, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1292, session_key: 11353, driver_number: 63, broadcast_name: "G RUSSELL", full_name: "George RUSSELL", name_acronym: "RUS", team_name: "Mercedes", team_colour: "00D7B6", first_name: "George", last_name: "Russell", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png", country_code: null },
  ],
  "11377": [
    { meeting_key: 1295, session_key: 11377, driver_number: 1, broadcast_name: "L NORRIS", full_name: "Lando NORRIS", name_acronym: "NOR", team_name: "McLaren", team_colour: "F47600", first_name: "Lando", last_name: "Norris", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 3, broadcast_name: "M VERSTAPPEN", full_name: "Max VERSTAPPEN", name_acronym: "VER", team_name: "Red Bull Racing", team_colour: "4781D7", first_name: "Max", last_name: "Verstappen", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 6, broadcast_name: "I HADJAR", full_name: "Isack HADJAR", name_acronym: "HAD", team_name: "Red Bull Racing", team_colour: "4781D7", first_name: "Isack", last_name: "Hadjar", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 12, broadcast_name: "K ANTONELLI", full_name: "Kimi ANTONELLI", name_acronym: "ANT", team_name: "Mercedes", team_colour: "00D7B6", first_name: "Kimi", last_name: "Antonelli", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/K/ANDANT01_Kimi_Antonelli/andant01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 16, broadcast_name: "C LECLERC", full_name: "Charles LECLERC", name_acronym: "LEC", team_name: "Ferrari", team_colour: "ED1131", first_name: "Charles", last_name: "Leclerc", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 44, broadcast_name: "L HAMILTON", full_name: "Lewis HAMILTON", name_acronym: "HAM", team_name: "Ferrari", team_colour: "ED1131", first_name: "Lewis", last_name: "Hamilton", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1295, session_key: 11377, driver_number: 63, broadcast_name: "G RUSSELL", full_name: "George RUSSELL", name_acronym: "RUS", team_name: "Mercedes", team_colour: "00D7B6", first_name: "George", last_name: "Russell", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png", country_code: null },
  ],
};

const REAL_DRIVER_LOOKUPS: Record<string, unknown[]> = {
  "22": [
    { meeting_key: 1292, session_key: 11353, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1293, session_key: 11361, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/Y/YUKTSU01_Yuki_Tsunoda/yuktsu01.png.transform/1col/image.png", country_code: null },
    { meeting_key: 1293, session_key: 11361, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: null, country_code: null },
    { meeting_key: 1294, session_key: 11369, driver_number: 22, broadcast_name: "Y TSUNODA", full_name: "Yuki TSUNODA", name_acronym: "TSU", team_name: "Racing Bulls", team_colour: "6C98FF", first_name: "Yuki", last_name: "Tsunoda", headshot_url: null, country_code: null },
  ],
};

// OpenF1 answers a query that matches nothing with a 404 and this body, and
// never with an empty array.
const NO_RESULTS_BODY = { detail: "No results found." };

function createRealOpenF1Fetch(overrides: { entryLists?: Record<string, unknown[]> } = {}): {
  fetchImpl: typeof fetch;
  requests: string[];
} {
  const requests: string[] = [];
  const entryLists = overrides.entryLists ?? REAL_ENTRY_LISTS;

  const resolve = (url: URL): unknown[] | undefined => {
    const param = (name: string) => url.searchParams.get(name) ?? "";

    switch (url.pathname) {
      case "/v1/meetings":
        return REAL_MEETINGS[param("year")];
      case "/v1/sessions":
        return REAL_SESSIONS[param("year")];
      case "/v1/session_result":
        return REAL_SESSION_RESULTS[param("session_key")];
      case "/v1/championship_drivers":
        return REAL_DRIVER_STANDINGS[param("session_key")];
      case "/v1/championship_teams":
        return REAL_TEAM_STANDINGS[param("session_key")];
      case "/v1/drivers":
        return url.searchParams.has("driver_number")
          ? REAL_DRIVER_LOOKUPS[param("driver_number")]?.filter(
              (row) =>
                (row as { session_key: number }).session_key >= Number(param("session_key>"))
            )
          : entryLists[param("session_key")];
      default:
        return undefined;
    }
  };

  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    requests.push(`${url.pathname.replace("/v1", "")}${url.search}`);
    const rows = resolve(url);

    return rows?.length
      ? jsonResponse(rows)
      : new Response(JSON.stringify(NO_RESULTS_BODY), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
  }) as typeof fetch;

  return { fetchImpl, requests };
}

function isUnresolved(row: { driverName: string; teamName: string | null }): boolean {
  return (
    /^Driver \d+$/.test(row.driverName) ||
    row.teamName === null ||
    row.teamName === "Unknown team"
  );
}

describe("buildFormula1SnapshotData with responses shaped like OpenF1's", () => {
  const afterAzerbaijan = new Date("2026-09-27T19:00:00.000Z");

  async function buildAt(now: Date, overrides?: Parameters<typeof createRealOpenF1Fetch>[0]) {
    const { fetchImpl, requests } = createRealOpenF1Fetch(overrides);
    const snapshot = await buildFormula1SnapshotData({ fetchImpl, now, minIntervalMs: 0 });
    return { snapshot, requests };
  }

  it("leaves cancelled rounds out of the calendar and the round counts", async () => {
    const { snapshot, requests } = await buildAt(afterAzerbaijan);

    expect(snapshot.meetings.map((meeting) => meeting.key)).toEqual([
      "1291",
      "1292",
      "1294",
      "1295",
      "1308",
    ]);
    expect(snapshot.seasonMetrics).toEqual({
      season: 2026,
      totalRaces: 5,
      completedRaces: 4,
      upcomingRaces: 1,
      sprintWeekends: 1,
    });
    expect(requests).not.toContain("/session_result?session_key=11261");
    expect(requests).not.toContain("/session_result?session_key=11269");
  });

  it("names a driver who is in the standings but missed the latest race", async () => {
    const { snapshot, requests } = await buildAt(afterAzerbaijan);
    const classified = snapshot.meetings.flatMap((meeting) => meeting.classification);

    expect(snapshot.driverStandings.find((standing) => standing.driverNumber === 22)).toMatchObject({
      driverName: "Yuki TSUNODA",
      acronym: "TSU",
      teamName: "Racing Bulls",
      teamColor: "#6C98FF",
      headshotUrl: expect.stringContaining("yuktsu01.png"),
    });
    expect(
      classified.filter((entry) => entry.driverNumber === 22).map((entry) => entry.driverName)
    ).toEqual(["Yuki TSUNODA", "Yuki TSUNODA"]);
    expect([...snapshot.driverStandings, ...classified].filter(isUnresolved)).toEqual([]);
    expect(requests.filter((request) => request.includes("driver_number="))).toEqual([
      "/drivers?driver_number=22&session_key%3E=11342",
    ]);
  });

  it("stops at six driver lookups when the entry list comes back short", async () => {
    const { requests } = await buildAt(afterAzerbaijan, {
      entryLists: {
        "11377": REAL_ENTRY_LISTS["11377"].filter(
          (row) => (row as { driver_number: number }).driver_number === 16
        ),
      },
    });

    expect(
      requests
        .filter((request) => request.includes("driver_number="))
        .map((request) => new URLSearchParams(request.split("?")[1]).get("driver_number"))
    ).toEqual(["12", "63", "44", "22", "3", "6"]);
  });

  it("stays on the finished season until the new one has completed a round", async () => {
    const { snapshot, requests } = await buildAt(new Date("2027-01-02T12:00:00.000Z"));

    expect(requests.slice(0, 2)).toEqual(["/meetings?year=2027", "/meetings?year=2026"]);
    expect(snapshot.season).toBe(2026);
    expect(snapshot.seasonMetrics).toMatchObject({
      totalRaces: 5,
      completedRaces: 5,
      upcomingRaces: 0,
    });
    expect(snapshot.driverStandings[0]).toMatchObject({
      driverName: "Kimi ANTONELLI",
      points: 302,
    });
    expect(snapshot.nextMeeting).toBeNull();
  });

  it("takes standings from a Sprint before the Grand Prix has run", async () => {
    const { snapshot } = await buildAt(new Date("2026-08-22T12:00:00.000Z"));

    expect(snapshot.standingsMeetingKey).toBe("1292");
    expect(snapshot.sourceUrls.driverStandings).toBe(
      "https://api.openf1.org/v1/championship_drivers?session_key=11348"
    );
    expect(snapshot.driverStandings[0]).toMatchObject({
      driverName: "Kimi ANTONELLI",
      points: 224,
      pointsBeforeRace: 219,
      pointsDelta: 5,
    });
    expect(snapshot.constructorStandings[0]).toMatchObject({
      teamName: "Mercedes",
      points: 392,
    });
    expect(snapshot.meetings[1]).toMatchObject({
      key: "1292",
      status: "live",
      raceSessionKey: "11353",
      classification: [],
      resultPublished: false,
    });
    // The weekend in progress is the next one, not the round after it.
    expect(snapshot.nextMeeting?.key).toBe("1292");
    expect(snapshot.defaultMeetingKey).toBe("1292");
  });

  it("falls back to the Sprint standings while the Grand Prix standings are unpublished", async () => {
    const { snapshot, requests } = await buildAt(new Date("2026-08-23T15:40:00.000Z"));

    expect(requests).toContain("/championship_drivers?session_key=11353");
    expect(snapshot.sourceUrls.driverStandings).toBe(
      "https://api.openf1.org/v1/championship_drivers?session_key=11348"
    );
    expect(snapshot.driverStandings[0]).toMatchObject({ driverName: "Kimi ANTONELLI", points: 224 });
    expect(snapshot.meetings[1]).toMatchObject({
      key: "1292",
      status: "completed",
      resultPublished: true,
    });
    expect(snapshot.meetings[1].classification[0]).toMatchObject({
      driverName: "Lando NORRIS",
      points: 25,
    });
  });

  // The audit could not watch a live session, so the body is the one a third
  // party report quotes. The builder reads only the status.
  it("rejects with the response status and does not retry when OpenF1 refuses the request", async () => {
    let requestCount = 0;
    const fetchImpl = (async () => {
      requestCount += 1;
      return new Response(
        JSON.stringify({
          detail:
            "Live F1 session in progress. Global API access (including past sessions) is restricted to authenticated users",
        }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch;

    await expect(
      buildFormula1SnapshotData({ fetchImpl, now: afterAzerbaijan, minIntervalMs: 0 })
    ).rejects.toMatchObject({ status: 401 });
    expect(requestCount).toBe(1);
  });
});
