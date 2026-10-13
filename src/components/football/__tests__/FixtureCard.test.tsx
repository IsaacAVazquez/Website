import { render, screen } from "@testing-library/react";
import { FixtureCard, type GenericFixture } from "../FixtureCard";
import {
  formatFixtureDateTime,
  formatFixtureDay,
  formatFixtureTime,
  getResultForTeam,
} from "../fixtureFormat";

function makeFixture(overrides: Partial<GenericFixture> = {}): GenericFixture {
  return {
    id: "game-1",
    utcDate: "2026-09-27T17:25:00Z",
    status: "FINISHED",
    matchday: 3,
    homeTeam: { id: "lv", shortName: "Raiders", crest: null },
    awayTeam: { id: "no", shortName: "Saints", crest: null },
    score: { winner: "HOME_TEAM", home: 24, away: 17 },
    ...overrides,
  };
}

describe("getResultForTeam", () => {
  it("gives no result to a game that has not been played", () => {
    // Production printed an L on every upcoming game, seen 2026-09-27.
    const upcoming = makeFixture({
      status: "SCHEDULED",
      score: { winner: null, home: null, away: null },
    });
    expect(getResultForTeam(upcoming, "lv")).toBeNull();
    expect(getResultForTeam(upcoming, "no")).toBeNull();
  });

  it("gives no result to a finished row that carries no winner", () => {
    // MLB marks a postponed game Final with null scores.
    const postponed = makeFixture({ score: { winner: null, home: null, away: null } });
    expect(getResultForTeam(postponed, "lv")).toBeNull();
  });

  it("reads a win, a loss, and both spellings of a draw", () => {
    expect(getResultForTeam(makeFixture(), "lv")).toBe("W");
    expect(getResultForTeam(makeFixture(), "no")).toBe("L");
    const draw = makeFixture({ score: { winner: "DRAW", home: 1, away: 1 } });
    const tie = makeFixture({ score: { winner: "TIE", home: 20, away: 20 } });
    expect(getResultForTeam(draw, "lv")).toBe("D");
    expect(getResultForTeam(tie, "no")).toBe("D");
  });

  it("gives no result to a team that is not in the game", () => {
    expect(getResultForTeam(makeFixture(), "kc")).toBeNull();
  });
});

describe("formatFixtureDateTime", () => {
  it("prints the kickoff in Eastern time and names the zone", () => {
    expect(formatFixtureDateTime(makeFixture())).toBe("Sep 27, 1:25 PM EDT");
  });

  const unplayed = { status: "SCHEDULED", score: { winner: null, home: null, away: null } };

  it("prints the day alone when the league has not set a time", () => {
    // MLB's placeholder is 3:33 AM at the venue, which is 07:33Z.
    const tbd = makeFixture({ ...unplayed, utcDate: "2026-10-03T07:33:00Z", startTimeTbd: true });
    expect(formatFixtureDateTime(tbd)).toBe("Oct 3 · time TBD");
  });

  it("keeps a midnight UTC placeholder on its own day", () => {
    const tbd = makeFixture({ ...unplayed, utcDate: "2026-10-18T00:00:00Z", startTimeTbd: true });
    expect(formatFixtureDateTime(tbd)).toBe("Oct 18 · time TBD");
  });

  it("marks a game that is played only if the series needs it", () => {
    const maybe = makeFixture({
      ...unplayed,
      utcDate: "2026-10-08T07:33:00Z",
      startTimeTbd: true,
      ifNecessary: true,
    });
    expect(formatFixtureDateTime(maybe)).toBe("Oct 8 · time TBD · if necessary");
  });

  it("prints only the day for a finished game whose flag was never cleared", () => {
    // Seen on MLB game 823489, the second game of a doubleheader.
    const played = makeFixture({ utcDate: "2026-09-20T07:33:00Z", startTimeTbd: true });
    expect(formatFixtureDateTime(played)).toBe("Sep 20");
  });

  it("keeps the if necessary mark once the game has a start time", () => {
    // Seen on MLB game 849808, an NLCS Game 5 with a time and the flag both set.
    const maybe = makeFixture({ ...unplayed, utcDate: "2026-10-17T01:00:00Z", ifNecessary: true });
    expect(formatFixtureDateTime(maybe)).toBe("Oct 16, 9:00 PM EDT · if necessary");
  });

  it("drops the if necessary mark from a game that was played", () => {
    const played = makeFixture({ utcDate: "2026-10-17T01:00:00Z", ifNecessary: true });
    expect(formatFixtureDateTime(played)).toBe("Oct 16, 9:00 PM EDT");
  });
});

describe("formatFixtureDay and formatFixtureTime", () => {
  it("split the kickoff into its Eastern day and its time", () => {
    // 01:00 UTC is still the evening before in New York.
    const late = makeFixture({ utcDate: "2026-10-17T01:00:00Z" });
    expect(formatFixtureDay(late)).toBe("Oct 16");
    expect(formatFixtureTime(late)).toBe("9:00 PM EDT");
  });

  it("keep a placeholder on its own calendar day with no clock", () => {
    const tbd = makeFixture({ utcDate: "2026-10-18T00:00:00Z", startTimeTbd: true });
    expect(formatFixtureDay(tbd)).toBe("Oct 18");
    expect(formatFixtureTime(tbd)).toBe("time TBD");
  });

  it("print no day for a date that cannot be read", () => {
    const broken = makeFixture({ utcDate: "not a date" });
    expect(formatFixtureDay(broken)).toBeNull();
    expect(formatFixtureTime(broken)).toBe("time TBD");
  });
});

describe("FixtureCard", () => {
  it("shows no result pill on an upcoming game", () => {
    const upcoming = makeFixture({
      status: "SCHEDULED",
      score: { winner: null, home: null, away: null },
    });
    render(<FixtureCard fixture={upcoming} contextTeamId="lv" />);
    expect(screen.queryByText("L")).not.toBeInTheDocument();
    expect(screen.getByText("Sep 27, 1:25 PM EDT")).toBeInTheDocument();
  });
});
