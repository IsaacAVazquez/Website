import type { Race, RaceRating } from "@/types/polling";
import {
  buildPollingHref,
  countSeatsByParty,
  DEFAULT_POLLING_STATE,
  getRacesByRating,
  normalizePollingState,
  ratingScore,
  sortRacesByCompetitiveness,
} from "../polling-aggregator-state";

function makeRace(id: string, state: string, rating: RaceRating): Race {
  return {
    id,
    state,
    stateAbbr: state.slice(0, 2).toUpperCase(),
    office: "Senate",
    year: 2026,
    rating,
    incumbentParty: null,
    openSeat: true,
    demAvg: 48,
    repAvg: 48,
    marginLabel: "Even",
    pollCount: 0,
    lastPolled: "2026-01-01",
    polls: [],
  };
}

describe("polling-aggregator-state", () => {
  it("normalizes valid URLSearchParams and record inputs", () => {
    expect(normalizePollingState(new URLSearchParams("view=senate&race=pa-senate"))).toEqual({
      view: "senate",
      race: "pa-senate",
    });

    expect(
      normalizePollingState({
        view: ["governors"],
        race: ["ga-governor"],
      })
    ).toEqual({
      view: "governors",
      race: "ga-governor",
    });
  });

  it("drops invalid views and race slugs", () => {
    expect(
      normalizePollingState({
        view: "not-real",
        race: "PA Senate",
      })
    ).toEqual(DEFAULT_POLLING_STATE);
  });

  it("builds hrefs while preserving unrelated params and omitting defaults", () => {
    expect(
      buildPollingHref(
        {
          view: "governors",
          race: "ga-governor",
        },
        new URLSearchParams("ref=home&view=approval&race=old")
      )
    ).toBe("/polling-aggregator?ref=home&view=governors&race=ga-governor");

    expect(
      buildPollingHref(
        DEFAULT_POLLING_STATE,
        new URLSearchParams("ref=home&view=senate&race=pa-senate")
      )
    ).toBe("/polling-aggregator?ref=home");
  });

  it("scores, groups, and sorts race ratings by competitiveness", () => {
    const races = [
      makeRace("safe-d", "Alaska", "Safe D"),
      makeRace("lean-r", "Arizona", "Lean R"),
      makeRace("toss-up", "Georgia", "Toss-up"),
      makeRace("likely-r", "Ohio", "Likely R"),
      makeRace("lean-d", "Nevada", "Lean D"),
    ];

    expect(ratingScore("Toss-up")).toBe(3);
    expect(getRacesByRating(races, "Lean D").map((race) => race.id)).toEqual(["lean-d"]);
    expect(countSeatsByParty(races)).toEqual({
      demLeading: 2,
      repLeading: 2,
      tossup: 1,
    });
    expect(sortRacesByCompetitiveness(races).map((race) => race.id)).toEqual([
      "toss-up",
      "lean-r",
      "lean-d",
      "likely-r",
      "safe-d",
    ]);
  });
});
