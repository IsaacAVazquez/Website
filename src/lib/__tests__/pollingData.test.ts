/**
 * @jest-environment node
 */
import { newestPollDate } from "@/app/polling-aggregator/polling-aggregator-helpers";
import { buildPollingSnapshotData } from "@/lib/pollingData";
import {
  votehubApprovalPolls,
  votehubGenericBallotPolls,
} from "./fixtures/votehubPolls.fixture";
import {
  votehubGovernorRacePolls,
  votehubSenateRacePolls,
} from "./fixtures/votehubRacePolls.fixture";

function mockVoteHub(withRaces: boolean, moreSenateRows: unknown[] = []) {
  jest.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("poll_type=approval")) return Response.json(votehubApprovalPolls);
    if (url.includes("poll_type=generic-ballot")) return Response.json(votehubGenericBallotPolls);
    if (!withRaces) return Response.json([]);
    return Response.json(
      url.includes("poll_type=us-senator")
        ? [...votehubSenateRacePolls, ...moreSenateRows]
        : votehubGovernorRacePolls
    );
  });
}

// Constructed in the fixture's shape: one pollster published RV and LV rows
// for the same fielding, and the LV row carries no sample size. The dedupe
// prefers the LV row, which the builder then rejects, so the race's newest
// pair has no usable poll behind it.
const ohioFielding = {
  poll_type: "us-senator",
  start_date: "2026-10-02",
  end_date: "2026-10-04",
  pollster: "Example Research",
  sponsors: [],
  answers: [
    { choice: "Alice Adams", pct: 47 },
    { choice: "Bob Baker", pct: 45 },
  ],
  subject: "2026 Ohio",
};
const votehubShadowedOhioRows = [
  { ...ohioFielding, id: "us-202exa-rv", sample_size: 700, population: "rv" },
  { ...ohioFielding, id: "us-202exa-lv", sample_size: null, population: "lv" },
];

describe("buildPollingSnapshotData against VoteHub rows saved on 2026-09-27", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-27T19:02:00.000Z"));
    mockVoteHub(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("stamps generatedAt at build time, however old the newest poll is", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.generatedAt).toBe("2026-09-27T19:02:00.000Z");
    expect(snapshot.sourceAsOf).toBe("2026-09-08");
  });

  it("keeps each series' newest poll date readable from its own rows", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(newestPollDate(snapshot.approvalPolls)).toBe("2026-08-28");
    expect(newestPollDate(snapshot.genericBallotPolls)).toBe("2026-09-08");
  });

  it("writes empty race lists when VoteHub has no race polls", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.senateRaces).toEqual([]);
    expect(snapshot.governorRaces).toEqual([]);
  });
});

describe("buildPollingSnapshotData against the Michigan race rows saved on 2026-10-09", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-09T20:00:00.000Z"));
    mockVoteHub(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("asks VoteHub for both race offices over the last four months at the same sample floor", async () => {
    await buildPollingSnapshotData();

    const urls = (global.fetch as jest.Mock).mock.calls.map((call) => String(call[0]));
    expect(urls).toContain(
      "https://api.votehub.com/polls?poll_type=us-senator&from_date=2026-06-11&min_sample_size=300"
    );
    expect(urls).toContain(
      "https://api.votehub.com/polls?poll_type=governor&from_date=2026-06-11&min_sample_size=300"
    );
  });

  it("averages the newest poll's two leading names over the polls that asked about both", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.senateRaces).toHaveLength(1);
    const [race] = snapshot.senateRaces;
    expect(race).toMatchObject({
      id: "senate-mi",
      state: "Michigan",
      stateAbbr: "MI",
      office: "Senate",
      year: 2026,
      candidates: [
        { name: "Abdul El-Sayed", support: 48 },
        { name: "Mike Rogers", support: 44.3 },
      ],
      margin: 3.7,
      pollCount: 4,
      lastPolled: "2026-10-01",
    });
    // The four polls from the 30 days before the newest one; the July and
    // June primary hypotheticals against Stevens and McMorrow stay out.
    expect(race.polls.map((poll) => poll.pollster)).toEqual([
      "Mitchell Research & Communications",
      "Z to A Research",
      "Trafalgar Group",
      "Beacon Research/Shaw & Co. Research",
    ]);
    expect(race.polls[0].candidates).toHaveLength(6);
    expect(race.polls[1].sponsor).toBe("Rust Belt Rising");
    expect(race.polls[1].sampleType).toBe("LV");
    expect(snapshot.sourceAsOf).toBe("2026-10-01");
  });

  it("drops a poll the source dated after the fetch and a matchup the newest poll did not ask", async () => {
    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.governorRaces).toHaveLength(1);
    const [race] = snapshot.governorRaces;
    expect(race).toMatchObject({
      id: "governor-mi",
      office: "Governor",
      candidates: [
        { name: "Jocelyn Benson", support: 50.3 },
        { name: "John James", support: 43 },
      ],
      margin: 7.3,
      pollCount: 3,
      lastPolled: "2026-10-01",
    });
    const names = race.polls.flatMap((poll) => poll.candidates.map((candidate) => candidate.name));
    expect(names).not.toContain("Perry Johnson");
    expect(race.polls.map((poll) => poll.endDate)).not.toContain("2026-10-27");
  });

  it("leaves out a race with no usable poll behind its newest pair and builds the rest", async () => {
    mockVoteHub(true, votehubShadowedOhioRows);

    const snapshot = await buildPollingSnapshotData();

    expect(snapshot.senateRaces.map((race) => race.id)).toEqual(["senate-mi"]);
    expect(snapshot.governorRaces).toHaveLength(1);
  });
});
