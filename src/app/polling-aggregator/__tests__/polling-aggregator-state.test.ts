import type { Race } from "@/types/polling";
import {
  buildPollingHref,
  DEFAULT_POLLING_STATE,
  normalizePollingState,
  sortRacesByMargin,
} from "../polling-aggregator-state";

function makeRace(id: string, state: string, margin: number): Race {
  return {
    id,
    state,
    stateAbbr: state.slice(0, 2).toUpperCase(),
    office: "Senate",
    year: 2026,
    candidates: [
      { name: "Leader", support: 48 + margin },
      { name: "Runner-up", support: 48 },
    ],
    margin,
    pollCount: 1,
    lastPolled: "2026-01-01",
    polls: [],
  };
}

describe("polling-aggregator-state", () => {
  it("normalizes valid URLSearchParams and record inputs", () => {
    expect(normalizePollingState(new URLSearchParams("view=senate&race=senate-pa"))).toEqual({
      view: "senate",
      race: "senate-pa",
    });

    expect(
      normalizePollingState({
        view: ["governors"],
        race: ["governor-ga"],
      })
    ).toEqual({
      view: "governors",
      race: "governor-ga",
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
          race: "governor-ga",
        },
        new URLSearchParams("ref=home&view=approval&race=old")
      )
    ).toBe("/polling-aggregator?ref=home&view=governors&race=governor-ga");

    expect(
      buildPollingHref(
        DEFAULT_POLLING_STATE,
        new URLSearchParams("ref=home&view=senate&race=senate-pa")
      )
    ).toBe("/polling-aggregator?ref=home");
  });

  it("sorts races closest first and breaks a tie on the state name", () => {
    const races = [
      makeRace("ohio", "Ohio", 7.3),
      makeRace("maine", "Maine", 0.5),
      makeRace("georgia", "Georgia", 3),
      makeRace("alaska", "Alaska", 3),
    ];

    expect(sortRacesByMargin(races).map((race) => race.id)).toEqual([
      "maine",
      "alaska",
      "georgia",
      "ohio",
    ]);
    // The input order is left alone.
    expect(races[0].id).toBe("ohio");
  });
});
